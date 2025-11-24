import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard to protect routes that require authentication
 * Usage in routes:
 * {
 *   path: 'protected',
 *   component: ProtectedComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  localStorage.setItem('returnUrl', state.url);

  // Redirect to home page (you can customize this behavior)
  router.navigate(['/']);
  return false;
};