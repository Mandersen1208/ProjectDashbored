package JobSearch.Services;

import DbConnections.DTO.Entities.JobEntity;
import DbConnections.DTO.JobDto;
import DbConnections.DTO.JobResponseDto;
import DbConnections.DTO.JobSearchResponseDto;
import DbConnections.JobMapper;
import DbConnections.Repositories.CompanyRepository;
import DbConnections.Repositories.JobRepository;
import DbConnections.Repositories.LocationRepository;
import DbConnections.Repositories.CategoryRepository;
import DbConnections.DTO.SearchParamsDto;
import JobSearch.Services.Implementations.JobSearchImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import JobSearch.Clients.AdzunaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JobSearchService class implementing JobSearchImpl interface
 */
@Service
public class JobSearchService implements JobSearchImpl {

    private static final Logger logger = LoggerFactory.getLogger(JobSearchService.class);

    private final AdzunaClient adzunaClient;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final LocationRepository locationRepository;
    private final CategoryRepository categoryRepository;
    private final JobMapper jobMapper;
    private final ObjectMapper objectMapper;
    private final GeocodingService geocodingService;


    public JobSearchService(AdzunaClient adzunaClient,
                            JobRepository jobRepository,
                            CompanyRepository companyRepository,
                            LocationRepository locationRepository,
                            CategoryRepository categoryRepository,
                            JobMapper jobMapper,
                            ObjectMapper objectMapper,
                            GeocodingService geocodingService) {
        this.adzunaClient = adzunaClient;
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.locationRepository = locationRepository;
        this.categoryRepository = categoryRepository;
        this.jobMapper = jobMapper;
        this.objectMapper = objectMapper;
        this.geocodingService = geocodingService;
    }

    private static final int DEFAULT_PAGES_TO_FETCH = 5;
    private static final long API_RATE_LIMIT_DELAY_MS = 500;

    @Override
    @Transactional
    public void searchJobs(String query, String location, int distance) {
        int totalJobsSaved = 0;

        for (int page = 1; page <= DEFAULT_PAGES_TO_FETCH; page++) {
            SearchParamsDto params = buildSearchParams(query, location, distance, page);
            int savedCount = processSearchPage(params, page);
            
            if (savedCount == 0 && page > 1) {
                logger.info("No results found on page {}. Stopping pagination.", page);
                break;
            }
            
            totalJobsSaved += savedCount;
            delayForApiRateLimit();
        }

        logger.info("Total jobs saved from all pages: {}", totalJobsSaved);
    }

    /**
     * Build search parameters for API call
     */
    private SearchParamsDto buildSearchParams(String query, String location, int distance, int page) {
        return SearchParamsDto.builder()
                .query(query)
                .location(location)
                .distance(distance)
                .page(page)
                .build();
    }

    /**
     * Process a single page of search results
     */
    private int processSearchPage(SearchParamsDto params, int page) {
        logger.info("Fetching page {} from Adzuna...", page);

        ResponseEntity<String> response = adzunaClient.getResponseEntity(params);
        String body = response.getBody();

        if (body == null || body.isEmpty()) {
            logger.warn("Empty response from Adzuna API on page {}", page);
            return 0;
        }

        try {
            List<JobDto> dtos = parseJobsFromResponse(body);
            
            if (dtos.isEmpty()) {
                return 0;
            }

            logger.info("Page {} returned {} jobs from Adzuna", page, dtos.size());
            return saveFilteredJobs(dtos, page);

        } catch (Exception e) {
            logger.error("Error processing page {}: {}", page, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Parse jobs from API response JSON
     */
    private List<JobDto> parseJobsFromResponse(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        JsonNode resultsNode = root.path("results");
        
        if (!resultsNode.isArray()) {
            return new ArrayList<>();
        }

        return objectMapper.convertValue(resultsNode, new TypeReference<List<JobDto>>() {});
    }

    /**
     * Filter and save jobs, skipping duplicates and invalid entries
     */
    private int saveFilteredJobs(List<JobDto> dtos, int page) {
        List<JobEntity> toSave = new ArrayList<>();
        int skippedNoId = 0;
        int skippedDuplicate = 0;

        for (JobDto dto : dtos) {
            if (shouldSkipJob(dto, skippedNoId)) {
                skippedNoId++;
                continue;
            }

            if (isDuplicate(dto)) {
                skippedDuplicate++;
                continue;
            }

            JobEntity entity = mapJobDtoToEntity(dto);
            if (entity != null) {
                toSave.add(entity);
            }
        }

        logJobProcessingStats(page, dtos.size(), toSave.size(), skippedDuplicate, skippedNoId);

        if (!toSave.isEmpty()) {
            jobRepository.saveAll(toSave);
            logger.info("Saved {} new jobs from page {}", toSave.size(), page);
            return toSave.size();
        }

        return 0;
    }

    /**
     * Check if job should be skipped due to missing ID
     */
    private boolean shouldSkipJob(JobDto dto, int count) {
        return dto.getExternalId() == null;
    }

    /**
     * Check if job already exists in database
     */
    private boolean isDuplicate(JobDto dto) {
        return jobRepository.findByExternalId(dto.getExternalId()).isPresent();
    }

    /**
     * Map JobDto to JobEntity with source information
     */
    private JobEntity mapJobDtoToEntity(JobDto dto) {
        dto.setSource("Adzuna");
        return jobMapper.toEntity(dto);
    }

    /**
     * Log statistics about job processing
     */
    private void logJobProcessingStats(int page, int total, int newCount, int duplicates, int noId) {
        logger.info("Page {}: {} total jobs, {} new, {} duplicates, {} missing ID",
                page, total, newCount, duplicates, noId);
    }

    /**
     * Delay to respect API rate limits
     */
    private void delayForApiRateLimit() {
        try {
            Thread.sleep(API_RATE_LIMIT_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("Rate limit delay interrupted", e);
        }
    }

    /**
     * Get jobs from database/cache based on search parameters
     * This method is cached in Redis for 1 hour
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location) {
        return getJobsFromDatabase(query, location, 25, null, null, null);
    }

    /**
     * Get jobs from database with optional date range filtering (backward compatibility)
     * This method is cached in Redis for 1 hour
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location + '_' + #dateFrom + '_' + #dateTo")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location, LocalDate dateFrom, LocalDate dateTo) {
        return getJobsFromDatabase(query, location, 25, null, dateFrom, dateTo);
    }

    /**
     * Get jobs from database with optional exclude terms and date range filtering
     * This method is cached in Redis for 1 hour
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location + '_' + #excludedTerms + '_' + #dateFrom + '_' + #dateTo")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location, String excludedTerms, LocalDate dateFrom, LocalDate dateTo) {
        return getJobsFromDatabase(query, location, 25, excludedTerms, dateFrom, dateTo);
    }

    /**
     * Get jobs from database with optional distance, exclude terms and date range filtering
     * This method is cached in Redis for 1 hour
     * Uses geocoding + distance-based filtering if location can be geocoded
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location + '_' + #distance + '_' + #excludedTerms + '_' + #dateFrom + '_' + #dateTo")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location, int distance, String excludedTerms, LocalDate dateFrom, LocalDate dateTo) {
        logger.info("Fetching jobs from database for query: {}, location: {}, distance: {}, excludedTerms: {}, dateFrom: {}, dateTo: {}",
                    query, location, distance, excludedTerms, dateFrom, dateTo);

        List<JobEntity> jobEntities = fetchJobsByLocationAndQuery(query, location, distance);
        jobEntities = applyExcludedTermsFilter(jobEntities, excludedTerms);
        jobEntities = applyDateFilter(jobEntities, dateFrom, dateTo);

        List<JobResponseDto> jobs = jobEntities.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());

        logger.info("Retrieved {} jobs from database", jobs.size());

        return JobSearchResponseDto.builder()
                .count(jobs.size())
                .results(jobs)
                .fromCache(false)
                .build();
    }

    /**
     * Fetch jobs by location and query using geocoding or string matching
     */
    private List<JobEntity> fetchJobsByLocationAndQuery(String query, String location, int distance) {
        GeocodingService.Coordinates coords = geocodingService.geocode(location);

        if (coords != null) {
            return fetchJobsByDistance(query, coords, distance);
        } else {
            return fetchJobsByLocationString(query, location);
        }
    }

    /**
     * Fetch jobs using distance-based geographic search
     */
    private List<JobEntity> fetchJobsByDistance(String query, GeocodingService.Coordinates coords, int distance) {
        logger.info("Using geographic distance search with center: {} (lat: {}, lon: {}), radius: {} miles",
                coords.getDisplayName(), coords.getLatitude(), coords.getLongitude(), distance);
        
        List<JobEntity> jobs = jobRepository.findByQueryAndDistance(query, coords.getLatitude(), coords.getLongitude(), distance);
        logger.info("Distance-based query returned {} jobs", jobs.size());
        return jobs;
    }

    /**
     * Fetch jobs using string matching fallback
     */
    private List<JobEntity> fetchJobsByLocationString(String query, String location) {
        logger.warn("Geocoding failed for location: {}, falling back to string matching", location);
        logger.info("Querying database with LIKE '%{}%' in title/description AND LIKE '%{}%' in location", query, location);
        
        long totalJobs = jobRepository.count();
        logger.debug("Total jobs in database: {}", totalJobs);
        
        List<JobEntity> jobs = jobRepository.findByQueryAndLocation(query, location);
        logger.info("String-based query returned {} jobs", jobs.size());
        return jobs;
    }

    /**
     * Apply excluded terms filter to job list
     */
    private List<JobEntity> applyExcludedTermsFilter(List<JobEntity> jobs, String excludedTerms) {
        if (excludedTerms == null || excludedTerms.trim().isEmpty()) {
            return jobs;
        }

        String[] excludeTermsArray = excludedTerms.split(",");
        List<JobEntity> filtered = jobs.stream()
                .filter(job -> !containsExcludedTerm(job, excludeTermsArray))
                .collect(Collectors.toList());

        logger.info("After exclude filtering: {} jobs match", filtered.size());
        return filtered;
    }

    /**
     * Check if job contains any excluded terms
     */
    private boolean containsExcludedTerm(JobEntity job, String[] excludeTermsArray) {
        String jobTitle = job.getTitle() != null ? job.getTitle().toLowerCase() : "";
        String jobDescription = job.getDescription() != null ? job.getDescription().toLowerCase() : "";

        for (String term : excludeTermsArray) {
            String trimmedTerm = term.trim().toLowerCase();
            if (!trimmedTerm.isEmpty() && (jobTitle.contains(trimmedTerm) || jobDescription.contains(trimmedTerm))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Apply date range filter to job list
     */
    private List<JobEntity> applyDateFilter(List<JobEntity> jobs, LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) {
            return jobs;
        }

        List<JobEntity> filtered = jobs.stream()
                .filter(job -> isWithinDateRange(job, dateFrom, dateTo))
                .collect(Collectors.toList());

        logger.info("After date filtering: {} jobs match", filtered.size());
        return filtered;
    }

    /**
     * Check if job created date is within the specified range
     */
    private boolean isWithinDateRange(JobEntity job, LocalDate dateFrom, LocalDate dateTo) {
        if (job.getCreatedDate() == null) {
            return false;
        }

        LocalDate jobDate = job.getCreatedDate().toLocalDate();
        boolean afterStart = dateFrom == null || !jobDate.isBefore(dateFrom);
        boolean beforeEnd = dateTo == null || !jobDate.isAfter(dateTo);
        
        return afterStart && beforeEnd;
    }

    /**
     * Convert JobEntity to JobResponseDto
     */
    private JobResponseDto convertToResponseDto(JobEntity entity) {
        JobResponseDto dto = JobResponseDto.builder()
                .id(entity.getId())
                .externalId(entity.getExternalId())
                .title(entity.getTitle())
                .companyId(entity.getCompanyId())
                .locationId(entity.getLocationId())
                .categoryId(entity.getCategoryId())
                .salaryMin(entity.getSalaryMin())
                .salaryMax(entity.getSalaryMax())
                .description(entity.getDescription())
                .jobUrl(entity.getJobUrl())
                .source(entity.getSource())
                .createdDate(formatDate(entity.getCreatedDate()))
                .dateFound(formatDate(entity.getDateFound()))
                .applyBy(formatDate(entity.getApplyBy()))
                .build();

        populateCompanyName(dto, entity);
        populateLocationName(dto, entity);
        populateCategoryName(dto, entity);
        dto.populateNestedObjects();

        return dto;
    }

    /**
     * Format LocalDateTime to string
     */
    private String formatDate(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.toString() : null;
    }

    /**
     * Format LocalDate to string
     */
    private String formatDate(LocalDate date) {
        return date != null ? date.toString() : null;
    }

    /**
     * Populate company name in DTO
     */
    private void populateCompanyName(JobResponseDto dto, JobEntity entity) {
        if (entity.getCompanyId() != null) {
            companyRepository.findById(entity.getCompanyId())
                    .ifPresent(company -> dto.setCompanyName(company.getName()));
        }
    }

    /**
     * Populate location name in DTO
     */
    private void populateLocationName(JobResponseDto dto, JobEntity entity) {
        if (entity.getLocationId() != null) {
            locationRepository.findById(entity.getLocationId())
                    .ifPresent(location -> dto.setLocationName(location.getDisplayName()));
        }
    }

    /**
     * Populate category name in DTO
     */
    private void populateCategoryName(JobResponseDto dto, JobEntity entity) {
        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId())
                    .ifPresent(category -> dto.setCategoryName(category.getName()));
        }
    }
}
