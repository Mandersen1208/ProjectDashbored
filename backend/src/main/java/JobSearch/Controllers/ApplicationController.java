package JobSearch.Controllers;

import DbConnections.DTO.ApplicationDto;
import DbConnections.DTO.Entities.Application;
import DbConnections.Repositories.ApplicationRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import Authentication.Entities.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/applications")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4200", "http://localhost:5173"}, maxAge = 3600, allowCredentials = "true")
public class ApplicationController {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationController.class);

    private final ApplicationRepository applicationRepository;

    public ApplicationController(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    private Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object principal = auth.getPrincipal();
            if (principal instanceof User) {
                return ((User) principal).getId();
            }
        } catch (Exception ignored) { }
        return null;
    }

    /**
     * Get all applications with job details
     */
    @GetMapping
    public ResponseEntity<List<ApplicationDto>> getAllApplications() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            List<Application> applications = applicationRepository.findAllByUserIdOrderByDateAppliedDesc(userId);
            
            List<ApplicationDto> applicationDtos = applications.stream()
                .map(app -> ApplicationDto.builder()
                    .id(app.getId())
                    .userId(app.getUserId())
                    .jobTitle(app.getJobTitle())
                    .companyName(app.getCompanyName())
                    .location(app.getLocation())
                    .jobUrl(app.getJobUrl())
                    .status(app.getStatus())
                    .dateApplied(app.getDateApplied())
                    .resumeVersion(app.getResumeVersion())
                    .coverLetterVersion(app.getCoverLetterVersion())
                    .notes(app.getNotes())
                    .build())
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(applicationDtos);
        } catch (Exception e) {
            logger.error("Error fetching applications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get application by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDto> getApplicationById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return applicationRepository.findByIdAndUserId(id, userId)
            .map(app -> ApplicationDto.builder()
                .id(app.getId())
                .userId(app.getUserId())
                .jobTitle(app.getJobTitle())
                .companyName(app.getCompanyName())
                .location(app.getLocation())
                .jobUrl(app.getJobUrl())
                .status(app.getStatus())
                .dateApplied(app.getDateApplied())
                .resumeVersion(app.getResumeVersion())
                .coverLetterVersion(app.getCoverLetterVersion())
                .notes(app.getNotes())
                .build())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new application
     */
    @PostMapping
    public ResponseEntity<Application> createApplication(@Valid @RequestBody Application application) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            if (application.getUserId() == null) {
                application.setUserId(userId);
            } else if (!application.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Application saved = applicationRepository.save(application);
            logger.info("Created application ID: {} for job: {}", saved.getId(), saved.getJobTitle());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            logger.error("Error creating application: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update application
     */
    @PutMapping("/{id}")
    public ResponseEntity<Application> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody Application updatedApplication) {
        Long userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return applicationRepository.findByIdAndUserId(id, userId)
            .map(existing -> {
                // Update all fields except ID and userId
                existing.setJobTitle(updatedApplication.getJobTitle());
                existing.setCompanyName(updatedApplication.getCompanyName());
                existing.setLocation(updatedApplication.getLocation());
                existing.setJobUrl(updatedApplication.getJobUrl());
                existing.setStatus(updatedApplication.getStatus());
                existing.setDateApplied(updatedApplication.getDateApplied());
                existing.setResumeVersion(updatedApplication.getResumeVersion());
                existing.setCoverLetterVersion(updatedApplication.getCoverLetterVersion());
                existing.setNotes(updatedApplication.getNotes());
                
                Application saved = applicationRepository.save(existing);
                logger.info("Updated application ID: {} - new status: {}", id, saved.getStatus());
                return ResponseEntity.ok(saved);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update application status only
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Application> updateApplicationStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Long userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return applicationRepository.findByIdAndUserId(id, userId)
            .map(app -> {
                app.setStatus(status);
                Application saved = applicationRepository.save(app);
                logger.info("Updated application ID: {} status to: {}", id, status);
                return ResponseEntity.ok(saved);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete application
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return applicationRepository.findByIdAndUserId(id, userId)
            .map(app -> {
                applicationRepository.deleteById(app.getId());
                logger.info("Deleted application ID: {}", id);
                return ResponseEntity.noContent().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get applications by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Application>> getApplicationsByStatus(@PathVariable String status) {
        Long userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Application> applications = applicationRepository.findByStatusAndUserId(status, userId);
        return ResponseEntity.ok(applications);
    }

    /**
     * Get application statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getApplicationStats() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            long totalApplications = applicationRepository.findAllByUserIdOrderByDateAppliedDesc(userId).size();
            long applied = applicationRepository.countByStatusAndUserId("applied", userId);
            long phoneScreen = applicationRepository.countByStatusAndUserId("phone_screen", userId);
            long interview = applicationRepository.countByStatusAndUserId("interview", userId);
            long offer = applicationRepository.countByStatusAndUserId("offer", userId);
            long rejected = applicationRepository.countByStatusAndUserId("rejected", userId);
            
            var stats = new java.util.HashMap<String, Long>();
            stats.put("total", totalApplications);
            stats.put("applied", applied);
            stats.put("phone_screen", phoneScreen);
            stats.put("interview", interview);
            stats.put("offer", offer);
            stats.put("rejected", rejected);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
