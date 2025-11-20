import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Ripple } from 'primeng/ripple';
import { JobSearchService } from '../../services/job-search.service';
import { SearchParams } from '../../models/search-params.model';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-job-search',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    TableModule,
    TagModule,
    Ripple
  ],
  templateUrl: './job-search.html',
  styleUrl: './job-search.scss',
})
export class JobSearch {
  searchParams: SearchParams = {
    query: '',
    location: ''
  };

  jobs: Job[] = [];
  loading = false;
  errorMessage = '';

  constructor(private jobSearchService: JobSearchService) {}

  onSearch(): void {
    if (!this.searchParams.query || !this.searchParams.location) {
      this.errorMessage = 'Please enter both job title and location';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.jobs = [];

    this.jobSearchService.searchJobs(this.searchParams).subscribe({
      next: (response) => {
        try {
          const data = JSON.parse(response);
          this.jobs = data.results || [];
          this.loading = false;
        } catch (error) {
          this.errorMessage = 'Error parsing job results';
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Error fetching jobs: ' + error.message;
        this.loading = false;
      }
    });
  }

  openJobUrl(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
