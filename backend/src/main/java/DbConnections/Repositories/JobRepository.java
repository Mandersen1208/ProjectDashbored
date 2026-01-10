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
     * Note: Uses LEFT JOIN to include jobs even if location is missing
     */
    @Query("SELECT DISTINCT j FROM JobEntity j " +
           "LEFT JOIN Location l ON j.locationId = l.id " +
           "WHERE (LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (l.displayName IS NULL OR LOWER(l.displayName) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<JobEntity> findByQueryAndLocation(@Param("query") String query, @Param("location") String location);

    /**
     * Search for jobs by query and geographic distance from a center point
     * Uses Haversine formula to calculate distance in miles
     * Only returns jobs within the specified distance radius
     */
    @Query(value = "SELECT DISTINCT j.* FROM jobs j " +
           "LEFT JOIN locations l ON j.location_id = l.id " +
           "WHERE (LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (l.latitude IS NULL OR l.longitude IS NULL OR " +
           "     (3959 * acos(cos(radians(:centerLat)) * cos(radians(l.latitude)) * " +
           "      cos(radians(l.longitude) - radians(:centerLon)) + " +
           "      sin(radians(:centerLat)) * sin(radians(l.latitude)))) <= :distanceMiles)",
           nativeQuery = true)
    List<JobEntity> findByQueryAndDistance(@Param("query") String query,
                                           @Param("centerLat") double centerLat,
                                           @Param("centerLon") double centerLon,
                                           @Param("distanceMiles") int distanceMiles);
}