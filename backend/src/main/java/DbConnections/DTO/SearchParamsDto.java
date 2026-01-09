package DbConnections.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.lang.Nullable;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class SearchParamsDto {
    @NotBlank(message = "Query cannot be blank")
    private String query;

    @NotBlank(message = "Location cannot be blank")
    private String location;

    @Min(value = 1, message = "Results per page must be at least 1")
    @Max(value = 100, message = "Results per page cannot exceed 100")
    @Builder.Default
    private int resultsPerPage = 100;

    @Builder.Default
    private int fullTime = 1;

    @Nullable
    private String excludedTerms;

    @Min(value = 1, message = "Page must be at least 1")
    @Builder.Default
    private int page = 1;

    @Min(value = 0, message = "Distance must be at least 0")
    @Max(value = 100, message = "Distance cannot exceed 100")
    @Builder.Default
    private int distance = 25;

    @Nullable
    private LocalDate dateFrom;

    @Nullable
    private LocalDate dateTo;

}
