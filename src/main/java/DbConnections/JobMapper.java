// java
package DbConnections;

import DbConnections.DTO.JobDto;
import DbConnections.DTO.Entities.JobEntity;
import org.springframework.stereotype.Component;

@Component
public class JobMapper {

    public JobEntity toEntity(JobDto dto) {
        if (dto == null) return null;

        // Don't set id - let database generate it to avoid optimistic locking conflicts
        // The dto.getId() comes from external API and causes Hibernate to treat this as an UPDATE
        return JobEntity.builder()
                .externalId(dto.getExternalId())
                .title(dto.getTitle())
                .companyId(dto.getCompanyId())
                .locationId(dto.getLocationId())
                .categoryId(dto.getCategoryId())
                .salaryMin(dto.getSalaryMin())
                .salaryMax(dto.getSalaryMax())
                .description(dto.getDescription())
                .jobUrl(dto.getJobUrl())
                .source(dto.getSource())
                .createdDate(dto.getCreatedDate())
                .dateFound(dto.getDateFound())
                .applyBy(dto.getApplyBy())
                .build();
    }

    public JobDto toDto(JobEntity entity) {
        if (entity == null) return null;

        return JobDto.builder()
                .id(entity.getId())
                .externalId(entity.getExternalId())
                .title(entity.getTitle())
                .companyId(entity.getCompanyId())
                .locationId(entity.getLocationId())
                .categoryId(entity.getCategoryId())
                .salaryMin(entity.getSalaryMin())
                .salaryMax(entity.getSalaryMax())
                .description(entity.getDescription())
                .jobUrl(entity.getJobUrl())
                .source(entity.getSource())
                .createdDate(entity.getCreatedDate())
                .dateFound(entity.getDateFound())
                .applyBy(entity.getApplyBy())
                .build();
    }
}