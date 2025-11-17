package DbConnections.DTO;

import lombok.*;

import java.util.List;

/**
 * Response DTO for job search operations
 * Contains the search URI and results for efficiency
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchResponseDto {

    /**
     * The built URI that can be used to call Adzuna API directly
     * Removes parameter redundancy between controllers
     */
    private String searchUri;

    /**
     * The list of job results from the API
     */
    private List<JobDto> results;

    /**
     * Total count of results available
     */
    private Integer totalCount;
}
