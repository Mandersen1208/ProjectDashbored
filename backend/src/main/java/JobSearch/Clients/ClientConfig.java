package JobSearch.Clients;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * job clients configuration
 */
@Configuration
public class ClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public AdzunaClient adzunaClient(RestTemplate restTemplate,
                                     @Value("${adzuna.base-url}") String baseUrl,
                                     @Value("${adzuna.api-key}") String apiKey,
                                     @Value("${adzuna.api-id}") String apiId) {
        return new AdzunaClient(restTemplate, baseUrl, apiKey, apiId);
    }
}
