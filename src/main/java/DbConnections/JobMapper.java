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
        // The Adzuna API "id" field is mapped to externalId, not the entity's database ID
        return JobEntity.builder()
                .externalId(dto.getExternalId())
                .title(dto.getTitle())
                .companyName(dto.getCompanyName())
                .location(dto.getLocationName())
                .category(dto.getCategoryTag())
                .salaryMin(dto.getSalaryMin())
                .salaryMax(dto.getSalaryMax())
                .description(dto.getDescription())
                .jobUrl(dto.getJobUrl())
                .source(dto.getSource())
                .createdDate(dto.getCreatedDate())
                .build();
    }

    public JobDto toDto(JobEntity entity) {
        if (entity == null) return null;

        // Create nested objects for Adzuna-compatible structure
        JobDto.CompanyInfo company = null;
        if (entity.getCompanyName() != null) {
            company = new JobDto.CompanyInfo();
            company.setDisplayName(entity.getCompanyName());
        }

        JobDto.LocationInfo location = null;
        if (entity.getLocation() != null) {
            location = new JobDto.LocationInfo();
            location.setDisplayName(entity.getLocation());
        }

        JobDto.CategoryInfo category = null;
        if (entity.getCategory() != null) {
            category = new JobDto.CategoryInfo();
            category.setTag(entity.getCategory());
        }

        return JobDto.builder()
                .externalId(entity.getExternalId())
                .title(entity.getTitle())
                .company(company)
                .location(location)
                .category(category)
                .salaryMin(entity.getSalaryMin())
                .salaryMax(entity.getSalaryMax())
                .description(entity.getDescription())
                .jobUrl(entity.getJobUrl())
                .source(entity.getSource())
                .createdDate(entity.getCreatedDate())
                .build();
    }
}