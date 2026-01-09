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


    public JobSearchService(AdzunaClient adzunaClient,
                            JobRepository jobRepository,
                            CompanyRepository companyRepository,
                            LocationRepository locationRepository,
                            CategoryRepository categoryRepository,
                            JobMapper jobMapper,
                            ObjectMapper objectMapper) {
        this.adzunaClient = adzunaClient;
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.locationRepository = locationRepository;
        this.categoryRepository = categoryRepository;
        this.jobMapper = jobMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void searchJobs(String query, String location, int distance) {
        // Number of pages to fetch from Adzuna API (default to 5 if not specified)
        int numberOfPages = 5;
        int totalJobsSaved = 0;
       /* String firstPageResponse = null;*/

        for (int page = 1; page <= numberOfPages; page++) {
            SearchParamsDto params = SearchParamsDto.builder()
                    .query(query)
                    .location(location)
                    .distance(distance)
                    .page(page)
                    .build();

            logger.info("Fetching page {} of {} from Adzuna...", page, numberOfPages);

            ResponseEntity<String> response = adzunaClient.getResponseEntity(params);
            String body = response.getBody();

            if (body == null || body.isEmpty()) {
                logger.warn("Empty response from Adzuna API on page {}", page);
                continue;
            }

            try {
                JsonNode root = objectMapper.readTree(body);
                JsonNode resultsNode = root.path("results");
                List<JobDto> dtos = new ArrayList<>();

                if (resultsNode.isArray()) {
                    dtos = objectMapper.convertValue(resultsNode, new TypeReference<>() {
                    });
                }

                // If no results on this page, stop fetching more pages
                if (dtos.isEmpty()) {
                    logger.info("No more results found on page {}. Stopping pagination.", page);
                    break;
                }

                List<JobEntity> toSave = new ArrayList<>();
                for (JobDto dto : dtos) {
                    if (dto.getExternalId() == null) {
                        continue; // Skip jobs without external ID
                    }

                    // Skip if job already exists
                    if (jobRepository.findByExternalId(dto.getExternalId()).isPresent()) {
                        continue;
                    }

                    // Set source to Adzuna before mapping
                    dto.setSource("Adzuna");

                    JobEntity entity = jobMapper.toEntity(dto);
                    if (entity == null) continue;

                    toSave.add(entity);
                }

                if (!toSave.isEmpty()) {
                    jobRepository.saveAll(toSave);
                    totalJobsSaved += toSave.size();
                    logger.info("Saved {} new jobs from page {}", toSave.size(), page);
                }

                // Small delay to avoid hitting API rate limits
                Thread.sleep(500);

            } catch (Exception e) {
                logger.error("Error processing page {}: {}", page, e.getMessage(), e);
            }
        }

        logger.info("Total jobs saved from all pages: {}", totalJobsSaved);
    }

    /**
     * Get jobs from database/cache based on search parameters
     * This method is cached in Redis for 1 hour
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location) {
        return getJobsFromDatabase(query, location, null, null, null);
    }

    /**
     * Get jobs from database with optional date range filtering (backward compatibility)
     * This method is cached in Redis for 1 hour
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location + '_' + #dateFrom + '_' + #dateTo")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location, LocalDate dateFrom, LocalDate dateTo) {
        return getJobsFromDatabase(query, location, null, dateFrom, dateTo);
    }

    /**
     * Get jobs from database with optional exclude terms and date range filtering
     * This method is cached in Redis for 1 hour
     */
    @Cacheable(value = "jobSearch", key = "#query + '_' + #location + '_' + #excludedTerms + '_' + #dateFrom + '_' + #dateTo")
    public JobSearchResponseDto getJobsFromDatabase(String query, String location, String excludedTerms, LocalDate dateFrom, LocalDate dateTo) {
        logger.info("Fetching jobs from database for query: {}, location: {}, excludedTerms: {}, dateFrom: {}, dateTo: {}",
                    query, location, excludedTerms, dateFrom, dateTo);

        // Search database for jobs matching query and location
        List<JobEntity> jobEntities = jobRepository.findByQueryAndLocation(query, location);
        logger.info("Found {} jobs in database matching query: {} and location: {}", jobEntities.size(), query, location);

        // Apply exclude terms filtering if provided
        if (excludedTerms != null && !excludedTerms.trim().isEmpty()) {
            String[] excludeTermsArray = excludedTerms.split(",");
            jobEntities = jobEntities.stream()
                    .filter(job -> {
                        String jobTitle = job.getTitle() != null ? job.getTitle().toLowerCase() : "";
                        String jobDescription = job.getDescription() != null ? job.getDescription().toLowerCase() : "";

                        // Check if any exclude term is present in title or description
                        for (String term : excludeTermsArray) {
                            String trimmedTerm = term.trim().toLowerCase();
                            if (!trimmedTerm.isEmpty()) {
                                if (jobTitle.contains(trimmedTerm) || jobDescription.contains(trimmedTerm)) {
                                    return false; // Exclude this job
                                }
                            }
                        }
                        return true; // Include this job
                    })
                    .collect(Collectors.toList());

            logger.info("After exclude filtering: {} jobs match", jobEntities.size());
        }

        // Apply date filtering if dates are provided
        if (dateFrom != null || dateTo != null) {
            jobEntities = jobEntities.stream()
                    .filter(job -> {
                        if (job.getCreatedDate() == null) {
                            return false;
                        }
                        LocalDateTime jobDateTime = job.getCreatedDate();
                        LocalDate jobDate = jobDateTime.toLocalDate();

                        boolean afterStart = dateFrom == null || !jobDate.isBefore(dateFrom);
                        boolean beforeEnd = dateTo == null || !jobDate.isAfter(dateTo);

                        return afterStart && beforeEnd;
                    })
                    .collect(Collectors.toList());

            logger.info("After date filtering: {} jobs match", jobEntities.size());
        }

        // Convert entities to response DTOs
        List<JobResponseDto> jobs = jobEntities.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());

        logger.info("Retrieved {} jobs from database", jobs.size());

        return JobSearchResponseDto.builder()
                .count(jobs.size())
                .results(jobs)
                .build();
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
                .createdDate(entity.getCreatedDate() != null ? entity.getCreatedDate().toString() : null)
                .dateFound(entity.getDateFound() != null ? entity.getDateFound().toString() : null)
                .applyBy(entity.getApplyBy() != null ? entity.getApplyBy().toString() : null)
                .build();

        // Populate company name
        if (entity.getCompanyId() != null) {
            companyRepository.findById(entity.getCompanyId())
                    .ifPresent(company -> dto.setCompanyName(company.getName()));
        }

        // Populate location name
        if (entity.getLocationId() != null) {
            locationRepository.findById(entity.getLocationId())
                    .ifPresent(location -> dto.setLocationName(location.getDisplayName()));
        }

        // Populate category name
        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId())
                    .ifPresent(category -> dto.setCategoryName(category.getName()));
        }

        // Populate nested objects for frontend compatibility
        dto.populateNestedObjects();

        return dto;
    }
}
