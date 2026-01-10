package JobSearch.Services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Geocoding service to convert location strings to lat/lon coordinates
 * Uses Nominatim (OpenStreetMap) API - free, no API key required
 */
@Service
public class GeocodingService {

    private static final Logger logger = LoggerFactory.getLogger(GeocodingService.class);
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeocodingService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Geocode a location string to coordinates
     * Results are cached to avoid repeated API calls
     */
    @Cacheable(value = "geocoding", key = "#location")
    public Coordinates geocode(String location) {
        if (location == null || location.trim().isEmpty()) {
            return null;
        }

        try {
            String url = NOMINATIM_URL + "?q=" + location + "&format=json&limit=1";

            // Add User-Agent header (required by Nominatim)
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "JobSearchApplication/1.0");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            String body = response.getBody();
            if (body == null || body.equals("[]")) {
                logger.warn("No geocoding results found for location: {}", location);
                return null;
            }

            JsonNode root = objectMapper.readTree(body);
            if (root.isArray() && root.size() > 0) {
                JsonNode firstResult = root.get(0);
                double lat = firstResult.get("lat").asDouble();
                double lon = firstResult.get("lon").asDouble();
                String displayName = firstResult.get("display_name").asText();

                logger.info("Geocoded '{}' to: {} (lat: {}, lon: {})", location, displayName, lat, lon);
                return new Coordinates(lat, lon, displayName);
            }

            return null;

        } catch (Exception e) {
            logger.error("Error geocoding location '{}': {}", location, e.getMessage());
            return null;
        }
    }

    /**
     * Coordinates container class
     * Must be serializable for Redis caching
     */
    public static class Coordinates implements java.io.Serializable {
        private static final long serialVersionUID = 1L;

        private double latitude;
        private double longitude;
        private String displayName;

        // Default constructor for Jackson/Redis deserialization
        public Coordinates() {
        }

        public Coordinates(double latitude, double longitude, String displayName) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.displayName = displayName;
        }

        public double getLatitude() {
            return latitude;
        }

        public void setLatitude(double latitude) {
            this.latitude = latitude;
        }

        public double getLongitude() {
            return longitude;
        }

        public void setLongitude(double longitude) {
            this.longitude = longitude;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }
    }
}
