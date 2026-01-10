package DbConnections.DTO;

import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {
    private Long id;
    private Long userId;
    private String jobTitle;
    private String companyName;
    private String location;
    private String jobUrl;
    private String status;
    private LocalDate dateApplied;
    private String resumeVersion;
    private String coverLetterVersion;
    private String notes;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}
