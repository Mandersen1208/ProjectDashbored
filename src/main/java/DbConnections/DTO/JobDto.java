// java
package DbConnections.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for mapping Adzuna API job responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class JobDto implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    // Map the Adzuna "id" field to externalId (this is the Adzuna job ID, not our database ID)
    @JsonProperty("id")
    private String externalId;

    private String title;

    // Nested company object in Adzuna API
    @JsonProperty("company")
    private CompanyInfo company;

    // Nested location object in Adzuna API
    @JsonProperty("location")
    private LocationInfo location;

    // Nested category object in Adzuna API
    @JsonProperty("category")
    private CategoryInfo category;

    @JsonProperty("salary_min")
    private BigDecimal salaryMin;

    @JsonProperty("salary_max")
    private BigDecimal salaryMax;

    private String description;

    @JsonProperty("redirect_url")
    private String jobUrl;

    // Source will be set manually (e.g., "Adzuna")
    private String source;

    // Adzuna returns "created" as the job creation date
    @JsonProperty("created")
    private LocalDateTime createdDate;

    // Helper method to get company name
    public String getCompanyName() {
        return company != null ? company.displayName : null;
    }

    // Helper method to get location name
    public String getLocationName() {
        return location != null ? location.displayName : null;
    }

    // Helper method to get category tag
    public String getCategoryTag() {
        return category != null ? category.tag : null;
    }

    /**
     * Inner class for company info from Adzuna
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CompanyInfo {
        @JsonProperty("display_name")
        private String displayName;
    }

    /**
     * Inner class for location info from Adzuna
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LocationInfo {
        @JsonProperty("display_name")
        private String displayName;

        private Double latitude;
        private Double longitude;
    }

    /**
     * Inner class for category info from Adzuna
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CategoryInfo {
        private String tag;
        private String label;
    }
}