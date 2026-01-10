export interface JobSearchParams {
  query: string;
  location: string;
  distance: number;
  excludedTerms?: string; // Comma-separated terms to exclude
  dateFrom?: string; // ISO date string (YYYY-MM-DD)
  dateTo?: string; // ISO date string (YYYY-MM-DD)
}

export interface JobSearchResponse {
  count: number;
  results: JobResult[];
}

export interface JobResult {
  id: number;
  externalId: string;
  title: string;
  companyId: number;
  companyName: string;
  locationId: number;
  locationName: string;
  categoryId: number;
  categoryName: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  jobUrl: string;
  source: string;
  createdDate: string;
  dateFound: string;
  applyBy?: string;
  company?: {
    display_name: string;
  };
  location?: {
    display_name: string;
  };
}
