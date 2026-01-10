package DbConnections.Repositories;

import DbConnections.DTO.Entities.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /**
     * Find all applications ordered by date applied (most recent first)
     */
    List<Application> findAllByOrderByDateAppliedDesc();

    /**
     * Find all applications for a specific user ordered by date applied (most recent first)
     */
    List<Application> findAllByUserIdOrderByDateAppliedDesc(Long userId);

    /**
     * Find applications by status
     */
    List<Application> findByStatus(String status);

    /**
     * Find applications by status for a specific user
     */
    List<Application> findByStatusAndUserId(String status, Long userId);

    /**
     * Count applications by status
     */
    long countByStatus(String status);

    /**
     * Count applications by status for a specific user
     */
    long countByStatusAndUserId(String status, Long userId);

    /**
     * Find a single application by id scoped to a specific user
     */
    java.util.Optional<Application> findByIdAndUserId(Long id, Long userId);

    /**
     * Get applications with job details
     */
    @Query("""
        SELECT a FROM Application a 
        ORDER BY a.dateApplied DESC
        """)
    List<Application> findAllWithDetails();
}
