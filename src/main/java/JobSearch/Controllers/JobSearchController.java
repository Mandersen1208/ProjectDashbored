package JobSearch.Controllers;

import DbConnections.DTO.JobSearchResponseDto;
import JobSearch.Services.Implementations.JobSearchImpl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/jobs")
public class JobSearchController {

    private final JobSearchImpl jobSearchImpl;


    public JobSearchController(JobSearchImpl jobSearchImpl) {
        this.jobSearchImpl = jobSearchImpl;
    }

    @GetMapping("/search")
    public JobSearchResponseDto searchJobs(@RequestParam String query,
                                           @RequestParam String location) {

        return jobSearchImpl.searchJobs(query, location);
    }
}
