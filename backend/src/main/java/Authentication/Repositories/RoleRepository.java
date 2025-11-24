package Authentication.Repositories;

import Authentication.Entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Role entity
 * Provides database access methods for roles
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Find a role by its name
     * @param name The role name (e.g., "ROLE_USER", "ROLE_ADMIN")
     * @return Optional containing the role if found
     */
    Optional<Role> findByName(String name);

    /**
     * Check if a role exists by name
     * @param name The role name
     * @return true if role exists, false otherwise
     */
    boolean existsByName(String name);
}
