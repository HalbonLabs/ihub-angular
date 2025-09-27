import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Authentication Guard
 * Protects routes that require authentication
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        // Check if token is expired (mock tokens are treated as valid in dev)
        if (authService.isTokenExpired()) {
          console.warn('Token expired, redirecting to login');
          // Store the attempted URL for redirecting after login
          const returnUrl = state.url !== '/login' ? state.url : '/';
          return router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl }
          });
        }

        // Check role-based access if specified in route data
        const requiredRoles = route.data['roles'];
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRole = authService.hasRole(requiredRoles);
          if (!hasRole) {
            console.warn('User does not have required role:', requiredRoles);
            return router.createUrlTree(['/access-denied']);
          }
        }

        // Check permission-based access if specified in route data
        const requiredPermission = route.data['permission'];
        if (requiredPermission) {
          const hasPermission = authService.hasPermission(requiredPermission);
          if (!hasPermission) {
            console.warn('User does not have required permission:', requiredPermission);
            return router.createUrlTree(['/access-denied']);
          }
        }

        return true;
      } else {
        // Not authenticated, redirect to login
        const returnUrl = state.url && state.url !== '/' ? state.url : '/dashboard';
        console.log('Not authenticated, redirecting to login with return URL:', returnUrl);

        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl }
        });
      }
    })
  );
};
