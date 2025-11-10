package JobSearch.Clients;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

public class AdzunaClient extends Client {
    @Override
    public void client(RestTemplate restTemplate, String url, String apiKey) {
        logRequest("AdzunaClient", url);
    }

    @Override
    public ResponseEntity<String> getResponseEntity(String baseUrl) {
        return null;
    }
}
