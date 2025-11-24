package Authentication.Services;

import Authentication.DTO.LoginRequest;
import Authentication.DTO.LoginResponse;
import Authentication.DTO.MessageResponse;
import Authentication.DTO.UserDto;
import Authentication.Entities.RefreshToken;
import Authentication.Entities.User;
import Authentication.Repositories.RefreshTokenRepository;
import Authentication.Repositories.UserRepository;
import Authentication.Security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Authentication service
 * Handles login, logout, and token management
 */
@Service
public class AuthenticationService {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Autowired
    public AuthenticationService(AuthenticationManager authenticationManager,
                                JwtUtils jwtUtils,
                                UserRepository userRepository,
                                RefreshTokenRepository refreshTokenRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Authenticate user and generate JWT token
     *
     * @param loginRequest Login credentials (username and password)
     * @return LoginResponse with JWT token and user info
     */
    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        logger.info("Login attempt for user: {}", loginRequest.getUsername());

        // Authenticate with Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        // Set authentication in security context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Get authenticated user
        User user = (User) authentication.getPrincipal();

        // Generate JWT token
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Generate refresh token
        String refreshToken = generateRefreshToken(user);

        // Update last login timestamp
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Build user DTO (matching Angular frontend interface)
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(List.of(user.getRole().getName())) // Convert to array
                .build();

        logger.info("Login successful for user: {}", user.getUsername());

        // Return login response (matching Angular frontend LoginResponse interface)
        return LoginResponse.builder()
                .token(jwt)
                .type("Bearer")
                .user(userDto)
                .build();
    }

    /**
     * Logout user and revoke refresh tokens
     *
     * @param username The username to logout
     * @return MessageResponse with logout confirmation
     */
    @Transactional
    public MessageResponse logout(String username) {
        logger.info("Logout request for user: {}", username);

        // Find user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Revoke all refresh tokens for this user
        refreshTokenRepository.findByUser(user).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });

        // Clear security context
        SecurityContextHolder.clearContext();

        logger.info("Logout successful for user: {}", username);

        return MessageResponse.success("Logged out successfully");
    }

    /**
     * Generate a refresh token for the user
     *
     * @param user The user to generate token for
     * @return Refresh token string
     */
    private String generateRefreshToken(User user) {
        // Generate random token
        String token = UUID.randomUUID().toString();

        // Create refresh token entity
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiryDate(LocalDateTime.now().plusDays(7)) // 7 days expiry
                .revoked(false)
                .build();

        // Save to database
        refreshTokenRepository.save(refreshToken);

        return token;
    }

    /**
     * Get current authenticated user
     *
     * @return User entity
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("No authenticated user found");
    }
}
