import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchParams } from '../models/search-params.model';
import { JobSearchResponse } from '../models/job-search-response.model';

@Injectable({
  providedIn: 'root'
})
export class JobSearchService {
  private apiUrl = '/api/jobs';

  constructor(private http: HttpClient) { }

  searchJobs(searchParams: SearchParams): Observable<JobSearchResponse> {
    let params = new HttpParams()
      .set('query', searchParams.query)
      .set('location', searchParams.location);

    if (searchParams.resultsPerPage) {
      params = params.set('resultsPerPage', searchParams.resultsPerPage.toString());
    }

    if (searchParams.fullTime !== undefined) {
      params = params.set('fullTime', searchParams.fullTime.toString());
    }

    if (searchParams.excludedTerms) {
      params = params.set('excludedTerms', searchParams.excludedTerms);
    }

    return this.http.get<JobSearchResponse>(`${this.apiUrl}/search`, { params });
  }
}