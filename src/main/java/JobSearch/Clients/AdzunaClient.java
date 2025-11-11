package JobSearch.Clients;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * Adzuna job search client
 */
public class AdzunaClient extends Client {
    private final RestTemplate restTemplate;
    private URI uri;
    @Value("${adzuna.base-url}")
    private final String baseUrl;
    @Value("${adzuna.api-key}")
    private final String apiKey;
    @Value("${adzuna.api-id}")
    private final String apiId;


    public AdzunaClient(RestTemplate restTemplate, URI uri, String baseUrl, String apiKey, String apiId) {
        this.restTemplate = restTemplate;
        this.uri = uri;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiId = apiId;
    }

    @Override
    public URI client() {
        uri = UriComponentsBuilder.fromUri(URI.create(baseUrl))
                .queryParam("app_id", apiId)
                .queryParam("app_key", apiKey)
                .queryParam("results_per_page", 20)
                .queryParam("what", "barista")
                .queryParam("where", "Raleigh")
                .queryParam("full-time", 1)
                .queryParam("what-excluded", "")
                .queryParam("content-type", "application/json")
                .build()
                .toUri();
        logRequest("AdzunaClient", baseUrl);
        return uri;
    }

    @Override
    public ResponseEntity<String> getResponseEntity() {
        return restTemplate.getForEntity(client(), String.class);
    }
}
