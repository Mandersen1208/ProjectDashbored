package JobSearch.Clients;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

public abstract class Client {

    public abstract void client(RestTemplate restTemplate,
                                final String url,
                                final String apiKey);

    public abstract ResponseEntity<String> getResponseEntity(String baseUrl);

    public void logRequest(String apiName, String query) {
        System.out.print("calling: "+ apiName + "Api for the query: " + query);
    }

}
