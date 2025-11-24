import { Component, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './job-search.html',
  styleUrl: './job-search.css',
})
export class JobSearch {
  searchParams: SearchParams = {
    query: '',
    location: '',
    distance: 25
  };

  distances: number[] = [5, 10, 15, 20, 25, 30, 40, 50];
  jobs: Job[] = [];
  loading = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];

  // Expose Math to template
  Math = Math;

  get paginatedJobs(): Job[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.jobs.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.jobs.length / this.pageSize);
  }

  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 7; // Show max 7 page buttons

    if (total <= maxVisible) {
      // Show all pages if total is small
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    // Show pages around current page
    const startPage = Math.max(2, current - 1);
    const endPage = Math.min(total - 1, current + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    // Always show last page
    if (total > 1) {
      pages.push(total);
    }

    return pages;
  }

  isEllipsis(page: number | string): boolean {
    return page === '...';
  }

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
    this.currentPage = 1; // Reset to first page on new search

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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  changePageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.currentPage = 1; // Reset to first page when changing page size
  }

  openJobUrl(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
