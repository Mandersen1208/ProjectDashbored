import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, User, AuthState } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Using Angular signals for reactive state management
  authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  constructor(private http: HttpClient) {
    // Check for existing session on service initialization
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuthState(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.authState.set({
          isAuthenticated: true,
          user,
          token
        });
      } catch (error) {
        console.error('Failed to parse stored user data', error);
        this.clearAuthState();
      }
    }
  }

  /**
   * Login with username and password
   * Expects Spring Security to return JWT token
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        // Store token and user data
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

        // Update auth state
        this.authState.set({
          isAuthenticated: true,
          user: response.user,
          token: response.token
        });
      }),
      catchError(error => {
        console.error('Login failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout and clear authentication state
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, {}).pipe(
      tap(() => {
        this.clearAuthState();
      }),
      catchError(error => {
        // Clear state even if logout API fails
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear authentication state from memory and storage
   */
  private clearAuthState(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({
      isAuthenticated: false,
      user: null,
      token: null
    });
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.authState().token;
  }

  /**
   * Get current authenticated user
   */
  getUser(): User | null {
    return this.authState().user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  /**
   * Get Authorization header for HTTP requests
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
}
