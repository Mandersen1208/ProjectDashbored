package JobSearch.Clients;

import DbConnections.DTO.SearchParamsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * Adzuna job search client
 */
public class AdzunaClient extends Client {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;
    private final String apiId;


    public AdzunaClient(RestTemplate restTemplate, String baseUrl, String apiKey, String apiId) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiId = apiId;
    }

    @Override
    public URI buildUri(SearchParamsDto searchParamsDto) {
        URI uri = UriComponentsBuilder.fromUri(URI.create(baseUrl))
                .queryParam("app_id", apiId)
                .queryParam("app_key", apiKey)
                .queryParam("results_per_page", 100)
                .queryParam("what", searchParamsDto.getQuery())
                .queryParam("where", searchParamsDto.getLocation())
                .queryParam("content-type", "application/json")
                .build()
                .toUri();
        logRequest("AdzunaClient", searchParamsDto);
        return uri;
    }

    @Override
    public ResponseEntity<String> getResponseEntity(SearchParamsDto searchParamsDto) {
        URI uri = buildUri(searchParamsDto);
        try {
            return restTemplate.getForEntity(uri, String.class);
        } catch (HttpClientErrorException e) {
            logger.error("Error while calling Adzuna API: {}", e.getMessage());
            throw e;
        }
    }
}
