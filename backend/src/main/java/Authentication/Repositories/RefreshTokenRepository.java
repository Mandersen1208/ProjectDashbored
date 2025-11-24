package Authentication.Repositories;

import Authentication.Entities.RefreshToken;
import Authentication.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for RefreshToken entity
 * Provides database access methods for refresh tokens
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Find a refresh token by its token string
     * @param token The token string to search for
     * @return Optional containing the refresh token if found
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Find a refresh token for a specific user
     * @param user The user
     * @return Optional containing the refresh token if found
     */
    Optional<RefreshToken> findByUser(User user);

    /**
     * Delete all refresh tokens for a specific user
     * Used during logout
     * @param user The user
     */
    void deleteByUser(User user);

    /**
     * Delete all expired refresh tokens
     * Can be used for cleanup
     * @param now The current timestamp
     */
    void deleteByExpiryDateBefore(LocalDateTime now);

    /**
     * Delete a refresh token by its token string
     * @param token The token string
     */
    void deleteByToken(String token);
}
