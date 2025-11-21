import { Job } from './job.model';

export interface JobSearchResponse {
  count: number;
  results: Job[];
}