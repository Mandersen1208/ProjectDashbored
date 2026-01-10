import axios, { type AxiosInstance, AxiosError } from 'axios';
import type {
  JobSearchParams,
  JobSearchResponse,
  LoginRequest,
  SignupRequest,
  LoginResponse,
  UserDto,
  SavedQuery,
  CreateSavedQueryRequest,
  UpdateSavedQueryRequest,
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationStats,
} from '../types';

// API Base URL - can be overridden by environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies for CORS
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - trigger forced logout
      api.forceLogout('Session expired');
    }
    return Promise.reject(error);
  }
);

// API Service
export const api = {
  // Job Search - fetches fresh data from API and queries database with caching
  searchJobs: async (params: JobSearchParams): Promise<JobSearchResponse> => {
    const requestParams: Record<string, any> = {
      query: params.query,
      location: params.location,
      distance: params.distance,
    };

    // Add optional exclude terms if provided
    if (params.excludedTerms) {
      requestParams.excludedTerms = params.excludedTerms;
    }

    // Add optional date parameters if provided
    if (params.dateFrom) {
      requestParams.dateFrom = params.dateFrom;
    }
    if (params.dateTo) {
      requestParams.dateTo = params.dateTo;
    }

    const response = await apiClient.get<JobSearchResponse>('/api/jobs/search', {
      params: requestParams,
    });
    return response.data;
  },

  // Authentication
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);

    // Store token and user info
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  signup: async (data: SignupRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/signup', data);

    // Store token and user info
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentPage');
    // Dispatch custom event for logout
    window.dispatchEvent(new CustomEvent('forceLogout', { detail: 'User logged out' }));
  },

  forceLogout: (reason: string) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentPage');
    // Dispatch custom event with reason
    window.dispatchEvent(new CustomEvent('forceLogout', { detail: reason }));
  },

  // Get currently logged in user from localStorage
  getCurrentUser: (): UserDto | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  // ============================================
  // Saved Queries
  // ============================================

  // Get all saved queries
  getSavedQueries: async (): Promise<SavedQuery[]> => {
    const response = await apiClient.get<SavedQuery[]>('/api/jobs/saved-queries');
    return response.data;
  },

  // Get only active saved queries
  getActiveSavedQueries: async (): Promise<SavedQuery[]> => {
    const response = await apiClient.get<SavedQuery[]>('/api/jobs/saved-queries/active');
    return response.data;
  },

  // Get a specific saved query by ID
  getSavedQueryById: async (id: number): Promise<SavedQuery> => {
    const response = await apiClient.get<SavedQuery>(`/api/jobs/saved-queries/${id}`);
    return response.data;
  },

  // Create a new saved query
  createSavedQuery: async (data: CreateSavedQueryRequest): Promise<string> => {
    const response = await apiClient.post<string>('/api/jobs/saved-queries', data);
    return response.data;
  },

  // Update an existing saved query
  updateSavedQuery: async (id: number, data: UpdateSavedQueryRequest): Promise<SavedQuery> => {
    const response = await apiClient.put<SavedQuery>(`/api/jobs/saved-queries/${id}`, data);
    return response.data;
  },

  // Toggle active status of a saved query
  toggleSavedQuery: async (id: number): Promise<SavedQuery> => {
    const response = await apiClient.patch<SavedQuery>(`/api/jobs/saved-queries/${id}/toggle`);
    return response.data;
  },

  // Delete a saved query
  deleteSavedQuery: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/jobs/saved-queries/${id}`);
  },

  // ============================================
  // Applications
  // ============================================

  // Get all applications
  getApplications: async (): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>('/api/applications');
    return response.data;
  },

  // Get application by ID
  getApplicationById: async (id: number): Promise<Application> => {
    const response = await apiClient.get<Application>(`/api/applications/${id}`);
    return response.data;
  },

  // Create new application
  createApplication: async (data: CreateApplicationRequest): Promise<Application> => {
    const response = await apiClient.post<Application>('/api/applications', data);
    return response.data;
  },

  // Update application
  updateApplication: async (id: number, data: UpdateApplicationRequest): Promise<Application> => {
    const response = await apiClient.put<Application>(`/api/applications/${id}`, data);
    return response.data;
  },

  // Update application status only
  updateApplicationStatus: async (id: number, status: string): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/api/applications/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  // Delete application
  deleteApplication: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/applications/${id}`);
  },

  // Get applications by status
  getApplicationsByStatus: async (status: string): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>(`/api/applications/status/${status}`);
    return response.data;
  },

  // Get application statistics
  getApplicationStats: async (): Promise<ApplicationStats> => {
    const response = await apiClient.get<ApplicationStats>('/api/applications/stats');
    return response.data;
  },
};

export default api;
