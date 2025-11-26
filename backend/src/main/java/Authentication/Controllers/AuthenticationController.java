package Authentication.Controllers;

import Authentication.DTO.LoginRequest;
import Authentication.DTO.LoginResponse;
import Authentication.DTO.MessageResponse;
import Authentication.DTO.SignupRequest;
import Authentication.Services.AuthenticationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints
 * Handles login, logout, and user authentication
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4200", "http://localhost:5173"}, maxAge = 3600, allowCredentials = "true")
public class AuthenticationController {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);

    private final AuthenticationService authenticationService;

    @Autowired
    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    /**
     * Login endpoint
     * POST /api/auth/login
     *
     * @param loginRequest Login credentials (username, password)
     * @return LoginResponse with JWT token and user info
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Login request received for user: {}", loginRequest.getUsername());

            LoginResponse response = authenticationService.login(loginRequest);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Login failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Invalid username or password"));
        }
    }

    /**
     * Signup endpoint
     * POST /api/auth/signup
     *
     * @param signupRequest Registration details (username, email, password, firstName, lastName)
     * @return LoginResponse with JWT token and user info
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            logger.info("Signup request received for username: {}", signupRequest.getUsername());

            LoginResponse response = authenticationService.signup(signupRequest);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            logger.error("Signup failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(MessageResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Signup failed with unexpected error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Signup failed. Please try again."));
        }
    }

    /**
     * Logout endpoint
     * POST /api/auth/logout
     *
     * @return MessageResponse confirming logout
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                logger.info("Logout request received for user: {}", username);

                MessageResponse response = authenticationService.logout(username);

                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(MessageResponse.success("Logged out successfully"));

        } catch (Exception e) {
            logger.error("Logout failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Logout failed"));
        }
    }

    /**
     * Get current user endpoint (for testing authentication)
     * GET /api/auth/me
     *
     * @return Current authenticated user information
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                return ResponseEntity.ok(authentication.getPrincipal());
            }

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Not authenticated"));

        } catch (Exception e) {
            logger.error("Get current user failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get user information"));
        }
    }

    /**
     * Health check endpoint for authentication service
     * GET /api/auth/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(MessageResponse.success("Authentication service is running"));
    }
}
