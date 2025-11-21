package DbConnections.Repositories;

import DbConnections.DTO.Entities.JobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}