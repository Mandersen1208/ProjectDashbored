package JobSearch.Services;

import DbConnections.DTO.Entities.JobEntity;
import DbConnections.DTO.JobDto;
import DbConnections.JobMapper;
import DbConnections.Repositories.JobRepository;
import JobSearch.Clients.AdzunaClient;
import DbConnections.DTO.SearchParamsDto;
import JobSearch.Services.Implementations.JobSearchImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * JobSearchService class implementing JobSearchImpl interface
 */
@Service
public class JobSearchService implements JobSearchImpl {

    private final AdzunaClient adzunaClient;
    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final ObjectMapper objectMapper;


    public JobSearchService(AdzunaClient adzunaClient,
                            JobRepository jobRepository,
                            JobMapper jobMapper,
                            ObjectMapper objectMapper) {
        this.adzunaClient = adzunaClient;
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public String searchJobs(String query, String location) {
        SearchParamsDto params = SearchParamsDto.builder()
                .query(query)
                .location(location)
                .build();

        params.setResultsPerPage(20);
        params.setFullTime(1);

        ResponseEntity<String> response = adzunaClient.getResponseEntity(params);
        String body = response.getBody();
        if (body == null || body.isEmpty()) {
            throw new IllegalStateException("Empty response from Adzuna API");
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode resultsNode = root.path("results");
            List<JobDto> dtos = new ArrayList<>();

            if (resultsNode.isArray()) {
                dtos = objectMapper.convertValue(resultsNode, new TypeReference<List<JobDto>>() {
                });
            }

            List<JobEntity> toSave = new ArrayList<>();
            for (JobDto dto : dtos) {
                JobEntity entity = jobMapper.toEntity(dto);
                if (entity == null) continue;

                if (dto.getExternalId() != null) {
                    jobRepository.findByExternalId(dto.getExternalId())
                            .ifPresentOrElse(existing -> {
                                // keep existing id to perform update
                                entity.setId(existing.getId());
                            }, () -> {
                                // nothing: new entity (id stays null)
                            });
                }
                toSave.add(entity);
            }

            if (!toSave.isEmpty()) {
                jobRepository.saveAll(toSave);
            }

        } catch (Exception e) {
            // swallow or log as appropriate; keep response returned
            e.printStackTrace();
        }

        return response.getBody();
    }
}
