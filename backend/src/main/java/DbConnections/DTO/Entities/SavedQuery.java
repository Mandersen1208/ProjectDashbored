package DbConnections.DTO.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_queries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank(message = "Query cannot be blank")
    @Size(max = 255, message = "Query must not exceed 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.]+$", message = "Query contains invalid characters")
    @Column(nullable = false, length = 255)
    private String query;

    @NotBlank(message = "Location cannot be blank")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s,\\-\\.]+$", message = "Location contains invalid characters")
    @Column(nullable = false, length = 255)
    private String location;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "new_jobs_count")
    @Builder.Default
    private Integer newJobsCount = 0;

    @Column(name = "distance")
    private int distance;

    @Column(name = "excluded_terms", length = 500)
    private String excludedTerms;

    @Column(name = "date_from")
    private java.time.LocalDate dateFrom;

    @Column(name = "date_to")
    private java.time.LocalDate dateTo;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
