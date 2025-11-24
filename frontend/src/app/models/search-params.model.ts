export interface SearchParams {
  query: string;
  location: string;
  resultsPerPage?: number;
  fullTime?: number;
  excludedTerms?: string;
  distance: number;
}
