package DbConnections.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Wrapper DTO for job search results
 * Matches the expected frontend JobSearchResponse interface
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchResponseDto {
    private int count;
    private List<JobResponseDto> results;
    private boolean fromCache;
}
