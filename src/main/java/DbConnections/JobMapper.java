package DbConnections;

import DbConnections.DTO.JobDto;
import org.springframework.stereotype.Component;

@Component
public class JobMapper {
    public jobEntity toEntity(JobDto dto) {
        // Mapping logic from DTO to Entity
        return new jobEntity();
    }
}
