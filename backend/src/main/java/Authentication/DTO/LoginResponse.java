package Authentication.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for login responses
 * Matches the Angular frontend LoginResponse interface exactly
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    /**
     * JWT access token
     */
    private String token;

    /**
     * Token type (usually "Bearer")
     */
    private String type;

    /**
     * User information
     */
    private UserDto user;
}
