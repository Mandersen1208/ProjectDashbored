package JobSearch.Clients;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

public class AdzunaClient extends Client {
    private final RestTemplate restTemplate;
    private URI uri;
    private final String baseUrl;
    private final String apiKey;
    private final String apiId;


    public AdzunaClient(RestTemplate restTemplate, URI uri, String baseUrl, String apiKey, String apiId) {
        this.restTemplate = restTemplate;
        this.uri = uri;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiId = apiId;
    }

    @Override
    public URI client(RestTemplate restTemplate, String url, String apiKey) {
        uri = UriComponentsBuilder.fromUri(URI.create("http://api.adzuna.com"))
                .path("/v1/api/jobs/gb/search/1?")
                .queryParam("app_id", apiId)
                .queryParam("app_key", apiKey)
                .queryParam("results_per_page", 20)
                .queryParam("what","barista")
                .queryParam("where", "Raleigh").queryParam("full-time", 1)
                .queryParam("what-excluded","")
                .queryParam("content-type", "application/json")
                .build()
                .toUri();
        logRequest("AdzunaClient", url);
        return uri;
    }

    @Override
    public ResponseEntity<String> getResponseEntity(String baseUrl) {
        return null;
    }
}
