package JobSearch.Services;

import Authentication.DTO.UserDto;
import Authentication.Entities.User;
import Authentication.Repositories.UserRepository;
import DbConnections.DTO.Entities.SavedQuery;
import DbConnections.Repositories.JobRepository;
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
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ScheduledJobFetchService(JobSearchImpl jobSearchService, 
                                   SavedQueryRepository savedQueryRepository,
                                   JobRepository jobRepository,
                                   UserRepository userRepository,
                                   EmailService emailService) {
        this.jobSearchService = jobSearchService;
        this.savedQueryRepository = savedQueryRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Scheduled task that runs once per day at midnight
     * Cron: 0 0 0 * * * = every day at midnight
     */
    @Scheduled(cron = "0 0 0 * * *")
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

            // Count jobs before fetch
            long jobCountBefore = jobRepository.count();

            // This will fetch multiple pages and save to database
            jobSearchService.searchJobs(savedQuery.getQuery(), savedQuery.getLocation(), savedQuery.getDistance());

            // Count jobs after fetch
            long jobCountAfter = jobRepository.count();
            int newJobCount = (int) (jobCountAfter - jobCountBefore);

            // Update saved query with new job count and last run time
            savedQuery.setNewJobsCount(newJobCount);
            savedQuery.setLastRunAt(LocalDateTime.now());
            savedQueryRepository.save(savedQuery);

            logger.info("Found {} new jobs for query: '{}', location: '{}'", newJobCount, savedQuery.getQuery(), savedQuery.getLocation());

            // Send email notification if new jobs were found
            if (newJobCount > 0) {
                sendEmailNotification(savedQuery, newJobCount);
            }

        } catch (Exception e) {
            logger.error("Error fetching jobs for query: '{}', location: '{}' - {}", savedQuery.getQuery(), savedQuery.getLocation(), e.getMessage(), e);
        }
    }

    /**
     * Send email notification to user about new jobs
     */
    private void sendEmailNotification(SavedQuery savedQuery, int newJobCount) {
        try {
            // Fetch user details
            User user = userRepository.findById(savedQuery.getUserId())
                .orElse(null);

            if (user == null) {
                logger.warn("User not found for saved query ID: {}", savedQuery.getId());
                return;
            }

            // Convert to DTO
            UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();

            // Send email
            emailService.sendJobNotification(userDto, savedQuery, newJobCount);

        } catch (Exception e) {
            logger.error("Error sending email notification for query ID: {} - {}", savedQuery.getId(), e.getMessage(), e);
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
