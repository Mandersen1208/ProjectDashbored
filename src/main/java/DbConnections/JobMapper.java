// java
package DbConnections;

import DbConnections.DTO.JobDto;
import DbConnections.DTO.Entities.*;
import DbConnections.Repositories.CategoryRepository;
import DbConnections.Repositories.CompanyRepository;
import DbConnections.Repositories.LocationRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class JobMapper {

    private final CompanyRepository companyRepository;
    private final LocationRepository locationRepository;
    private final CategoryRepository categoryRepository;

    public JobMapper(CompanyRepository companyRepository,
                     LocationRepository locationRepository,
                     CategoryRepository categoryRepository) {
        this.companyRepository = companyRepository;
        this.locationRepository = locationRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Convert JobDto to JobEntity, looking up or creating Company, Location, and Category entities.
     * IMPORTANT: This method must be called within a transaction.
     */
    @Transactional
    public JobEntity toEntity(JobDto dto) {
        if (dto == null) return null;

        // Look up or create Company
        Long companyId = null;
        if (dto.getCompanyName() != null && !dto.getCompanyName().isBlank()) {
            companyId = findOrCreateCompany(dto.getCompanyName());
        }

        // Look up or create Location
        Long locationId = null;
        if (dto.getLocationName() != null && !dto.getLocationName().isBlank()) {
            locationId = findOrCreateLocation(dto.getLocationName());
        }

        // Look up or create Category
        Long categoryId = null;
        if (dto.getCategoryTag() != null && !dto.getCategoryTag().isBlank()) {
            categoryId = findOrCreateCategory(dto.getCategoryTag());
        }

        // Don't set id - let database generate it to avoid optimistic locking conflicts
        // The Adzuna API "id" field is mapped to externalId, not the entity's database ID
        return JobEntity.builder()
                .externalId(dto.getExternalId())
                .title(dto.getTitle())
                .companyId(companyId)
                .locationId(locationId)
                .categoryId(categoryId)
                .salaryMin(dto.getSalaryMin())
                .salaryMax(dto.getSalaryMax())
                .description(dto.getDescription())
                .jobUrl(dto.getJobUrl())
                .source(dto.getSource())
                .createdDate(dto.getCreatedDate())
                .build();
    }

    /**
     * Find or create a Company by name
     */
    private Long findOrCreateCompany(String name) {
        return companyRepository.findByName(name)
                .map(Company::getId)
                .orElseGet(() -> {
                    Company company = Company.builder()
                            .name(name)
                            .build();
                    return companyRepository.save(company).getId();
                });
    }

    /**
     * Find or create a Location by display name
     */
    private Long findOrCreateLocation(String displayName) {
        return locationRepository.findByDisplayName(displayName)
                .map(Location::getId)
                .orElseGet(() -> {
                    // For Adzuna, we only have display_name, so we'll use "US" as default country
                    Location location = Location.builder()
                            .displayName(displayName)
                            .country("US")
                            .build();
                    return locationRepository.save(location).getId();
                });
    }

    /**
     * Find or create a Category by tag
     */
    private Long findOrCreateCategory(String tag) {
        return categoryRepository.findByTag(tag)
                .map(Category::getId)
                .orElseGet(() -> {
                    // Use tag as name if we don't have a separate name
                    Category category = Category.builder()
                            .tag(tag)
                            .name(tag.replace("-", " ").toUpperCase())
                            .build();
                    return categoryRepository.save(category).getId();
                });
    }

    /**
     * Convert JobEntity to JobDto (for reading from database)
     * Note: This doesn't populate the nested objects fully since we only have IDs
     */
    public JobDto toDto(JobEntity entity) {
        if (entity == null) return null;

        // For now, we can't fully populate the nested objects without joining
        // This method is primarily for reading from the database view
        return JobDto.builder()
                .externalId(entity.getExternalId())
                .title(entity.getTitle())
                .salaryMin(entity.getSalaryMin())
                .salaryMax(entity.getSalaryMax())
                .description(entity.getDescription())
                .jobUrl(entity.getJobUrl())
                .source(entity.getSource())
                .createdDate(entity.getCreatedDate())
                .build();
    }
}