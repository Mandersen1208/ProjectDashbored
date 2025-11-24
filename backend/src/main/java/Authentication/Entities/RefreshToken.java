package Authentication.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * RefreshToken entity for managing JWT refresh tokens
 * Maps to the 'refresh_tokens' table in the database
 * Used to refresh access tokens without requiring re-authentication
 */
@Entity
@Table(name = "refresh_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user this refresh token belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * The actual refresh token string
     */
    @Column(nullable = false, unique = true, length = 512)
    private String token;

    /**
     * When this refresh token expires
     */
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    /**
     * When this token was created
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Whether this token has been revoked (logged out)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    /**
     * Sets the created timestamp before persisting
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Check if the refresh token has expired
     * @return true if expired, false otherwise
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
}
