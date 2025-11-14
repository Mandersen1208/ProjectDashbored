package main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

//ToDo: remove exclude when database is added

@SpringBootApplication(scanBasePackages = {"main", "JobSearch", "DbConnections"})
@EnableJpaRepositories(basePackages = "DbConnections.Repositories")
@EntityScan(basePackages = "DbConnections.DTO.Entities")
public class JobSearchApplication {

    public static void main(String[] args) {
        SpringApplication.run(JobSearchApplication.class, args);
    }
}