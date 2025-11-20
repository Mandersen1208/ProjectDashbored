export interface Job {
  id?: number;
  externalId: string;
  title: string;
  companyId?: number;
  companyName?: string;
  locationId?: number;
  locationName?: string;
  categoryId?: number;
  categoryName?: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  jobUrl: string;
  source: string;
  createdDate: string;
  dateFound?: string;
  applyBy?: string;

  // Nested objects for compatibility with Adzuna format
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
  };

  // Alternative field name from Adzuna
  redirect_url?: string;
}