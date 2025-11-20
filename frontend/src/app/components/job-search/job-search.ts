import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
    TagModule
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

  constructor(
    private jobSearchService: JobSearchService,
    private cdr: ChangeDetectorRef
  ) {}

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
        console.log('Response received:', response);
        console.log('Results array:', response.results);
        console.log('Results length:', response.results?.length);

        this.jobs = response.results || [];
        this.loading = false;

        console.log('Jobs assigned:', this.jobs);
        console.log('Jobs length:', this.jobs.length);
        console.log('Loading state:', this.loading);

        // Force change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching jobs:', error);
        this.errorMessage = 'An error occurred while fetching jobs. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openJobUrl(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
