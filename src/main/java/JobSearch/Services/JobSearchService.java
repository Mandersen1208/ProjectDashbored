package JobSearch.Services;

import DashBoardBackend.Services.Implementations.JoabBoardImpl;
import JobSearch.Clients.AdzunaClient;
import JobSearch.Data.SearchParamsDto;
import JobSearch.Services.Implementations.JobSearchImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

/**
 * JobSearchService class implementing JobSearchImpl interface
 */
@Service
public class JobSearchService implements JobSearchImpl {

    private final AdzunaClient adzunaClient;

    public JobSearchService(AdzunaClient adzunaClient) {
        this.adzunaClient = adzunaClient;
    }

    @Override
    public String searchJobs(String query, String location) {
        SearchParamsDto params = SearchParamsDto.builder()
                .query(query)
                .Location(location)
                .build();

        params.setResultsPerPage(20);
        params.setFullTime(true);

        ResponseEntity<String> response = adzunaClient.getResponseEntity(params);
        return response.getBody();
    }
}
