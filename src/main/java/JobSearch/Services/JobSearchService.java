package JobSearch.Services;

import DbConnections.DTO.Entities.JobEntity;
import DbConnections.DTO.JobDto;
import DbConnections.JobMapper;
import DbConnections.Repositories.JobRepository;
import JobSearch.Clients.AdzunaClient;
import DbConnections.DTO.SearchParamsDto;
import JobSearch.Services.Implementations.JobSearchImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * JobSearchService class implementing JobSearchImpl interface
 */
@Service
public class JobSearchService implements JobSearchImpl {

    private static final Logger logger = LoggerFactory.getLogger(JobSearchService.class);

    private final AdzunaClient adzunaClient;
    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final ObjectMapper objectMapper;


    public JobSearchService(AdzunaClient adzunaClient,
                            JobRepository jobRepository,
                            JobMapper jobMapper,
                            ObjectMapper objectMapper) {
        this.adzunaClient = adzunaClient;
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public String searchJobs(String query, String location) {
        // Number of pages to fetch from Adzuna API (default to 5 if not specified)
        int numberOfPages = 5;
        int totalJobsSaved = 0;
        String firstPageResponse = null;

        for (int page = 1; page <= numberOfPages; page++) {
            SearchParamsDto params = SearchParamsDto.builder()
                    .query(query)
                    .location(location)
                    .page(page)
                    .build();

            logger.info("Fetching page {} of {} from Adzuna...", page, numberOfPages);

            ResponseEntity<String> response = adzunaClient.getResponseEntity(params);
            String body = response.getBody();

            // Store first page response to return to client
            if (page == 1) {
                firstPageResponse = body;
            }

            if (body == null || body.isEmpty()) {
                logger.warn("Empty response from Adzuna API on page {}", page);
                continue;
            }

            try {
                JsonNode root = objectMapper.readTree(body);
                JsonNode resultsNode = root.path("results");
                List<JobDto> dtos = new ArrayList<>();

                if (resultsNode.isArray()) {
                    dtos = objectMapper.convertValue(resultsNode, new TypeReference<List<JobDto>>() {
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
        return firstPageResponse;
    }
}
