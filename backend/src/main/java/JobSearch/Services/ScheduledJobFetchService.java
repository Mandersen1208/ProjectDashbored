package JobSearch.Services;

import DbConnections.DTO.Entities.SavedQuery;
import DbConnections.DTO.SearchParamsDto;
import DbConnections.Repositories.SavedQueryRepository;
import JobSearch.Services.Implementations.JobSearchImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled service that fetches jobs every morning and caches job URLs in Redis
 */
@Service
public class ScheduledJobFetchService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledJobFetchService.class);

    private final JobSearchImpl jobSearchService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SavedQueryRepository savedQueryRepository;

    public ScheduledJobFetchService(JobSearchImpl jobSearchService, RedisTemplate<String, Object> redisTemplate, SavedQueryRepository savedQueryRepository) {
        this.jobSearchService = jobSearchService;
        this.redisTemplate = redisTemplate;
        this.savedQueryRepository = savedQueryRepository;
    }

    /**
     * Scheduled task that runs every 15 seconds
     * Fixed rate: 15000ms = 15 seconds
     */
    @Scheduled(fixedRate = 15000)
    public void fetchAndCacheJobs() {
        logger.info("Starting scheduled job fetch at {}", LocalDateTime.now());

        try {
            // Fetch all active saved queries from database
            List<SavedQuery> activeQueries = savedQueryRepository.findByIsActiveTrue();

            if (activeQueries.isEmpty()) {
                logger.warn("No active saved queries found. Please add queries via the API.");
                return;
            }

            logger.info("Found {} active saved queries to process", activeQueries.size());

            // Process each saved query
            for (SavedQuery savedQuery : activeQueries) {
                fetchJobsForQuery(savedQuery);
            }

            logger.info("Completed scheduled job fetch at {}", LocalDateTime.now());
        } catch (Exception e) {
            logger.error("Error during scheduled job fetch: {}", e.getMessage(), e);
        }
    }

    /**
     * Fetch jobs for a saved query and cache job IDs and URLs
     */
    private void fetchJobsForQuery(SavedQuery savedQuery) {
        try {
            logger.info("Fetching jobs for query: '{}', location: '{}'", savedQuery.getQuery(), savedQuery.getLocation());

            // This will fetch multiple pages and save to database
            String response = jobSearchService.searchJobs(savedQuery.getQuery(), savedQuery.getLocation(), savedQuery.getDistance());

            // Parse response and cache individual job IDs with their URLs
            cacheJobUrls(response, savedQuery);

            // Update last run timestamp
            savedQuery.setLastRunAt(LocalDateTime.now());
            savedQueryRepository.save(savedQuery);

            logger.info("Completed caching jobs for query: '{}', location: '{}'", savedQuery.getQuery(), savedQuery.getLocation());
        } catch (Exception e) {
            logger.error("Error fetching jobs for query: '{}', location: '{}' - {}", savedQuery.getQuery(), savedQuery.getLocation(), e.getMessage(), e);
        }
    }

    /**
     * Parse job response and cache individual job IDs with URLs
     */
    private void cacheJobUrls(String jsonResponse, SavedQuery savedQuery) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonResponse);
            com.fasterxml.jackson.databind.JsonNode results = root.path("results");

            int cachedCount = 0;
            if (results.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode job : results) {
                    String jobId = job.path("id").asText();
                    String jobUrl = job.path("redirect_url").asText();

                    if (jobId != null && !jobId.isEmpty() && jobUrl != null && !jobUrl.isEmpty()) {
                        // Cache with key: job:{jobId} -> URL
                        String cacheKey = "job:" + jobId;
                        redisTemplate.opsForValue().set(cacheKey, jobUrl);
                        cachedCount++;
                    }
                }
            }

            logger.info("Cached {} job URLs in Redis", cachedCount);
        } catch (Exception e) {
            logger.error("Error caching job URLs: {}", e.getMessage(), e);
        }
    }

    /**
     * Get cached job URL from Redis by job ID
     */
    public String getCachedJobUrl(String jobId) {
        String cacheKey = "job:" + jobId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        return cached != null ? cached.toString() : null;
    }

    /**
     * Manual trigger for testing (can be called from a controller)
     */
    public void triggerManualFetch() {
        logger.info("Manual job fetch triggered");
        fetchAndCacheJobs();
    }
}
