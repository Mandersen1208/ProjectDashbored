package DbConnections.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import DbConnections.Entities.JobHunter;

@Repository
public interface JobHunterDao extends JpaRepository<JobHunter, Long> {
}
