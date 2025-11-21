package DbConnections.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

/**
 * DTO for returning job data to the frontend
 * This matches the Job interface expected by the Angular frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponseDto {
    private Long id;              // Database ID
    private String externalId;    // Adzuna/external API ID
    private String title;

    // Company info
    private Long companyId;
    private String companyName;

    // Location info
    private Long locationId;
    private String locationName;

    // Category info
    private Long categoryId;
    private String categoryName;

    // Salary info
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    // Job details
    private String description;
    private String jobUrl;
    private String source;

    // Dates
    private String createdDate;
    private String dateFound;
    private String applyBy;

    // Nested company object for compatibility with Adzuna format
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyInfo {
        private String display_name;
    }

    // Nested location object for compatibility with Adzuna format
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private String display_name;
    }

    // Add nested objects for frontend compatibility
    private CompanyInfo company;
    private LocationInfo location;

    // Helper method to populate nested objects from flat data
    public void populateNestedObjects() {
        if (companyName != null) {
            this.company = CompanyInfo.builder()
                .display_name(companyName)
                .build();
        }
        if (locationName != null) {
            this.location = LocationInfo.builder()
                .display_name(locationName)
                .build();
        }
    }
}