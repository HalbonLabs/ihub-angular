import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../services/api.service';

/**
 * JWT Interceptor - Attaches JWT token to outgoing requests
 * and handles token refresh on 401 responses
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  // Skip interceptor for auth endpoints to avoid circular dependencies
  const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];
  const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isAuthEndpoint) {
    return next(req);
  }

  // Get token from localStorage
  const token = getStoredToken();
  
  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = addTokenToRequest(req, token);
  }

  // Handle the request
  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Token might be expired, try to refresh
        return handleTokenRefresh(req, next);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Helper function to get stored token
 */
function getStoredToken(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(environment.jwtTokenKey);
  }
  return null;
}

/**
 * Helper function to get refresh token
 */
function getRefreshToken(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(environment.refreshTokenKey);
  }
  return null;
}

/**
 * Helper function to add token to request
 */
function addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Handle token refresh logic
 */
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

function handleTokenRefresh(
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const apiService = inject(ApiService);
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    // No refresh token, redirect to login
    apiService.clearToken();
    // In a real app, inject Router and navigate to login
    return throwError(() => new Error('Session expired. Please login again.'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return apiService.post<any>('/auth/refresh', { refresh_token: refreshToken }).pipe(
      switchMap((response) => {
        isRefreshing = false;
        
        if (response.success && response.data.access_token) {
          const newToken = response.data.access_token;
          
          // Store new tokens
          localStorage.setItem(environment.jwtTokenKey, newToken);
          if (response.data.refresh_token) {
            localStorage.setItem(environment.refreshTokenKey, response.data.refresh_token);
          }
          
          refreshTokenSubject.next(newToken);
          
          // Retry original request with new token
          return next(addTokenToRequest(req, newToken));
        }
        
        // Refresh failed
        apiService.clearToken();
        return throwError(() => new Error('Session expired. Please login again.'));
      }),
      catchError((error) => {
        isRefreshing = false;
        apiService.clearToken();
        return throwError(() => error);
      })
    );
  } else {
    // Wait for refresh to complete, then retry request
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(addTokenToRequest(req, token!));
      })
    );
  }
}
