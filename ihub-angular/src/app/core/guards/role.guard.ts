import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Role-based Authorization Guard
 * Ensures user has the required role(s) to access a route
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  
  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    console.warn('No roles specified for role guard');
    return authService.isAuthenticated$.pipe(
      take(1),
      map(isAuth => isAuth || router.createUrlTree(['/auth/login']))
    );
  }
  
  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        // Not authenticated
        return router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      }
      
      // Check if user has any of the required roles
      const hasRole = authService.hasRole(requiredRoles);
      
      if (hasRole) {
        return true;
      } else {
        // User doesn't have required role
        console.warn(`User with role '${user.role}' attempted to access route requiring roles:`, requiredRoles);
        
        // Show notification
        snackBar.open(
          'You do not have permission to access this page',
          'Dismiss',
          {
            duration: 5000,
            panelClass: ['warning-snackbar'],
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          }
        );
        
        // Redirect to appropriate page based on user role
        switch (user.role) {
          case UserRole.ADMIN:
            return router.createUrlTree(['/admin/dashboard']);
          case UserRole.INSPECTOR:
            return router.createUrlTree(['/dashboard']);
          case UserRole.VIEWER:
            return router.createUrlTree(['/dashboard']);
          default:
            return router.createUrlTree(['/']);
        }
      }
    })
  );
};

/**
 * Admin-only Guard
 * Shortcut guard for admin-only routes
 */
export const adminGuard: CanActivateFn = (route, state) => {
  // Set admin role requirement and delegate to roleGuard
  route.data = { ...route.data, roles: [UserRole.ADMIN] };
  return roleGuard(route, state);
};

/**
 * Inspector Guard
 * Allows both inspectors and admins
 */
export const inspectorGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, roles: [UserRole.INSPECTOR, UserRole.ADMIN] };
  return roleGuard(route, state);
};

/**
 * Permission-based Guard Factory
 * Creates a guard that checks for specific permissions
 */
export function permissionGuard(permission: string): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);
    
    return authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          return router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
        
        if (authService.hasPermission(permission)) {
          return true;
        }
        
        snackBar.open(
          `You do not have permission to perform this action`,
          'Dismiss',
          {
            duration: 5000,
            panelClass: ['warning-snackbar']
          }
        );
        
        return router.createUrlTree(['/access-denied']);
      })
    );
  };
}
