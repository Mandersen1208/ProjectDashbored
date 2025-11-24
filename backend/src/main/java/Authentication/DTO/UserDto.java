package Authentication.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for user information
 * Matches the Angular frontend User interface exactly
 * IMPORTANT: roles field is an array of strings to match frontend expectations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private Long id;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    /**
     * Array of role names (e.g., ["ROLE_USER"])
     * Matches Angular frontend User.roles: string[]
     */
    private List<String> roles;
}
