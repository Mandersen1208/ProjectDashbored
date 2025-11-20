package main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Main application entry point.
 * - Database is ENABLED with PostgreSQL
 * - Retry mechanism enabled for handling transient failures
 * - Transaction management enabled for database operations
 * - Scheduling enabled for automated job fetching
 */
@SpringBootApplication
@ComponentScan(basePackages = {"JobSearch", "DbConnections", "DashBoardBackend", "JobSearch.Config"})
@EnableJpaRepositories(basePackages = "DbConnections.Repositories")
@EntityScan(basePackages = "DbConnections.DTO.Entities")
@EnableScheduling
@EnableTransactionManagement
public class JobSearchApplication {

    public static void main(String[] args) {
        SpringApplication.run(JobSearchApplication.class, args);
    }
}