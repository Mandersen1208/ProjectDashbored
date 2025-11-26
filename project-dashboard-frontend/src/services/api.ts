import axios, {type AxiosInstance, AxiosError } from 'axios';

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
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Don't auto-redirect, let components handle it
    }
    return Promise.reject(error);
  }
);

// Type definitions matching backend DTOs
export interface JobSearchParams {
  query: string;
  location: string;
  distance: number;
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  type: string;
  user: UserDto;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

// API Service
export const api = {
  // Job Search
  searchJobs: async (params: JobSearchParams): Promise<JobSearchResponse> => {
    const response = await apiClient.get<JobSearchResponse>('/api/jobs/search', {
      params: {
        query: params.query,
        location: params.location,
        distance: params.distance,
      },
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
};

export default api;
