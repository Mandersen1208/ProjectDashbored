package Authentication.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic DTO for simple message responses
 * Used for logout responses and error messages
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private String message;

    /**
     * Create a success message response
     */
    public static MessageResponse success(String message) {
        return new MessageResponse(message);
    }

    /**
     * Create an error message response
     */
    public static MessageResponse error(String message) {
        return new MessageResponse(message);
    }
}
