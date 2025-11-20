package DbConnections.Repositories;

import DbConnections.DTO.Entities.SavedQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedQueryRepository extends JpaRepository<SavedQuery, Long> {

    /**
     * Find all active saved queries for scheduled job fetching
     */
    List<SavedQuery> findByIsActiveTrue();

    /**
     * Find a saved query by query and location
     */
    Optional<SavedQuery> findByQueryAndLocation(String query, String location);

    /**
     * Find all saved queries ordered by last run date
     */
    List<SavedQuery> findAllByOrderByLastRunAtDesc();
}
