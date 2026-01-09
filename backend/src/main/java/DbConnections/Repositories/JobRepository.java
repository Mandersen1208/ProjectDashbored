package DbConnections.Repositories;

import DbConnections.DTO.Entities.JobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Job Search Domain Repositories
 * Both JobRepository and SavedQueryRepository are kept in the same file
 * to maintain cohesion of job search functionality
 */

// ============================================
// JOB REPOSITORY
// ============================================

@Repository
public interface JobRepository extends JpaRepository<JobEntity, Long> {
    Optional<JobEntity> findByExternalId(String externalId);

    /**
     * Search for jobs by query terms in title/description and location
     * Uses case-insensitive matching
     */
    @Query("SELECT j FROM JobEntity j " +
           "JOIN Location l ON j.locationId = l.id " +
           "WHERE (LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND LOWER(l.displayName) LIKE LOWER(CONCAT('%', :location, '%'))")
    List<JobEntity> findByQueryAndLocation(@Param("query") String query, @Param("location") String location);
}