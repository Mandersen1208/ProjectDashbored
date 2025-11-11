package JobSearch.Clients;

import org.springframework.http.ResponseEntity;

import java.net.URI;

public abstract class Client {

    /**
     * used to build out the uri
     * @return URI
     */
    public abstract URI client();

    /**
     *
     * sends request using the client
     * @return Response Entity from the client
     */
    public abstract ResponseEntity<String> getResponseEntity();

    public void logRequest(String apiName, String query) {
        System.out.print("calling: "+ apiName + "Api for the query: " + query);
    }



}
