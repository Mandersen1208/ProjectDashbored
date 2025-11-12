package JobSearch.Controllers;

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
    public  String searchJobs(@RequestParam String query,
                              @RequestParam String location) {

        return jobSearchImpl.searchJobs(query,location);
    }
}
