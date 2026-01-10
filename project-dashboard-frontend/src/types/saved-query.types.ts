export interface SavedQuery {
  id?: number;
  userId: number;
  query: string;
  location: string;
  isActive: boolean;
  distance: number;
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string;
  newJobsCount?: number;
}

export interface CreateSavedQueryRequest {
  userId: number;
  query: string;
  location: string;
  distance: number;
  isActive?: boolean;
}

export interface UpdateSavedQueryRequest {
  query: string;
  location: string;
  distance: number;
  isActive: boolean;
}
