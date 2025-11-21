package JobSearch.Controllers;

import DbConnections.DTO.Entities.SavedQuery;
import DbConnections.DTO.JobSearchResponseDto;
import DbConnections.Repositories.SavedQueryRepository;
import JobSearch.Services.Implementations.JobSearchImpl;
import jakarta.validation.Valid;
import JobSearch.Services.JobSearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/jobs")
@Validated
public class JobSearchController {

    private static final Logger logger = LoggerFactory.getLogger(JobSearchController.class);
    private final JobSearchImpl jobSearchImpl;
    private final JobSearchService jobSearchService;
    private final SavedQueryRepository savedQueryRepository;

    public JobSearchController(JobSearchImpl jobSearchImpl,
                              JobSearchService jobSearchService,
                              SavedQueryRepository savedQueryRepository) {
        this.jobSearchImpl = jobSearchImpl;
        this.jobSearchService = jobSearchService;
        this.savedQueryRepository = savedQueryRepository;
    }

    // ============================================
    // JOB SEARCH ENDPOINTS
    // ============================================

    /**
     * Search for jobs - fetches from Adzuna API and saves to database,
     * then returns jobs from database (with Redis caching)
     */
    @GetMapping("/search")
    public ResponseEntity<JobSearchResponseDto> searchJobs(@RequestParam String query,
                                                           @RequestParam String location,
                                                           @RequestParam int distance) {
        logger.info("Search request received: query={}, location={}", query, location);

        // First, fetch new jobs from Adzuna and save to database
        // This runs in the background and saves jobs
        jobSearchImpl.searchJobs(query, location, distance);

        // Then, return jobs from database (with Redis caching)
        JobSearchResponseDto response = jobSearchService.getJobsFromDatabase(query, location);

        return ResponseEntity.ok(response);
    }

    // ============================================
    // SAVED QUERIES ENDPOINTS
    // ============================================

    /**
     * Get all saved queries
     */
    @GetMapping("/saved-queries")
    public ResponseEntity<List<SavedQuery>> getAllSavedQueries() {
        List<SavedQuery> queries = savedQueryRepository.findAllByOrderByLastRunAtDesc();
        return ResponseEntity.ok(queries);
    }

    /**
     * Get only active saved queries
     */
    @GetMapping("/saved-queries/active")
    public ResponseEntity<List<SavedQuery>> getActiveSavedQueries() {
        List<SavedQuery> queries = savedQueryRepository.findByIsActiveTrue();
        return ResponseEntity.ok(queries);
    }

    /**
     * Get a specific saved query by ID
     */
    @GetMapping("/saved-queries/{id}")
    public ResponseEntity<SavedQuery> getSavedQueryById(@PathVariable Long id) {
        return savedQueryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new saved query
     */
    @PostMapping("/saved-queries")
    public ResponseEntity<String> createSavedQuery(@Valid @RequestBody SavedQuery savedQuery) {
        try {
            // Check if query already exists
            if (savedQueryRepository.findByQueryAndLocation(
                    savedQuery.getQuery(), savedQuery.getLocation()).isPresent()) {
                logger.warn("Saved query already exists: {} - location {}", savedQuery.getQuery(), savedQuery.getLocation());
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Query already exists");
            }

            savedQueryRepository.save(savedQuery);
            logger.info("Created saved query: {} - location {}", savedQuery.getQuery(), savedQuery.getLocation());
            return ResponseEntity.status(HttpStatus.CREATED).body("Saved query created successfully");
        } catch (Exception e) {
            logger.error("Error creating saved query: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create saved query");
        }
    }

    /**
     * Update an existing saved query
     */
    @PutMapping("/saved-queries/{id}")
    public ResponseEntity<SavedQuery> updateSavedQuery(
            @PathVariable Long id,
            @Valid @RequestBody SavedQuery updatedQuery) {
        return savedQueryRepository.findById(id)
                .map(existing -> {
                    existing.setQuery(updatedQuery.getQuery());
                    existing.setLocation(updatedQuery.getLocation());
                    existing.setIsActive(updatedQuery.getIsActive());
                    SavedQuery saved = savedQueryRepository.save(existing);
                    logger.info("Updated saved query ID {}: {} - location {}", id, saved.getQuery(), saved.getLocation());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Toggle active status of a saved query
     */
    @PatchMapping("/saved-queries/{id}/toggle")
    public ResponseEntity<SavedQuery> toggleSavedQuery(@PathVariable Long id) {
        return savedQueryRepository.findById(id)
                .map(query -> {
                    query.setIsActive(!query.getIsActive());
                    SavedQuery saved = savedQueryRepository.save(query);
                    logger.info("Toggled saved query ID {} to active={}", id, saved.getIsActive());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a saved query
     */
    @DeleteMapping("/saved-queries/{id}")
    public ResponseEntity<Void> deleteSavedQuery(@PathVariable Long id) {
        if (savedQueryRepository.existsById(id)) {
            savedQueryRepository.deleteById(id);
            logger.info("Deleted saved query ID {}", id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
