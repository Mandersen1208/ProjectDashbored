package JobSearch.Services;

import DbConnections.DTO.Entities.SavedQuery;
import DbConnections.Repositories.SavedQueryRepository;
import JobSearch.Services.Implementations.JobSearchImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled service that fetches jobs from Adzuna API and saves them to the database
 * Runs periodically to keep job listings up-to-date based on saved queries
 */
@Service
public class ScheduledJobFetchService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledJobFetchService.class);

    private final JobSearchImpl jobSearchService;
    private final SavedQueryRepository savedQueryRepository;

    public ScheduledJobFetchService(JobSearchImpl jobSearchService, SavedQueryRepository savedQueryRepository) {
        this.jobSearchService = jobSearchService;
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
     * Fetch jobs for a saved query and save to database
     */
    private void fetchJobsForQuery(SavedQuery savedQuery) {
        try {
            logger.info("Fetching jobs for query: '{}', location: '{}'", savedQuery.getQuery(), savedQuery.getLocation());

            // This will fetch multiple pages and save to database
            jobSearchService.searchJobs(savedQuery.getQuery(), savedQuery.getLocation(), savedQuery.getDistance());

            // Update last run timestamp
            savedQuery.setLastRunAt(LocalDateTime.now());
            savedQueryRepository.save(savedQuery);

            logger.info("Completed fetching jobs for query: '{}', location: '{}'", savedQuery.getQuery(), savedQuery.getLocation());
        } catch (Exception e) {
            logger.error("Error fetching jobs for query: '{}', location: '{}' - {}", savedQuery.getQuery(), savedQuery.getLocation(), e.getMessage(), e);
        }
    }


/*    *//**
     * Manual trigger for testing (can be called from a controller)
     *//*
    public void triggerManualFetch() {
        logger.info("Manual job fetch triggered");
        fetchAndCacheJobs();
    }*/
}
