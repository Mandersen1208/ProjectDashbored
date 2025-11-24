package JobSearch.Clients;

import DbConnections.DTO.SearchParamsDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import java.net.URI;

public abstract class Client {

    protected final Logger logger = LoggerFactory.getLogger(this.getClass());


    /**
     * used to build out the uri
     *
     * @return URI
     */
    public abstract URI buildUri(SearchParamsDto searchParamsDto);

    /**
     *
     * sends request using the client
     *
     * @return Response Entity from the client
     */
    public abstract ResponseEntity<String> getResponseEntity(SearchParamsDto searchParamsDto);

    protected void logRequest(SearchParamsDto searchParams) {
        logger.info("Calling {} API - Query: {}, Location: {}",
                "AdzunaClient",
                searchParams.getQuery(),
                searchParams.getLocation());
    }
}
