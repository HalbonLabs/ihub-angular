import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Global Error Interceptor
 * Handles HTTP errors and displays user-friendly messages
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);
  
  // Track request start time for timeout detection
  const startTime = Date.now();
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const elapsedTime = Date.now() - startTime;
      let errorMessage = 'An unexpected error occurred';
      let shouldShowToast = true;
      
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        console.error('Client Error:', error.error);
        
        if (elapsedTime > environment.apiTimeout) {
          errorMessage = 'Request timeout. Please check your connection and try again.';
        } else {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      } else {
        // Server-side error
        console.error(`Server Error ${error.status}:`, error);
        
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your connection.';
            break;
            
          case 400:
            errorMessage = error.error?.message || 'Invalid request. Please check your input.';
            break;
            
          case 401:
            errorMessage = 'Your session has expired. Please login again.';
            // Don't show toast for 401 in auth endpoints
            if (!req.url.includes('/auth/')) {
              setTimeout(() => {
                router.navigate(['/auth/login'], {
                  queryParams: { returnUrl: router.url }
                });
              }, 1000);
            } else {
              shouldShowToast = false;
            }
            break;
            
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
            
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found.';
            break;
            
          case 409:
            errorMessage = error.error?.message || 'This action conflicts with existing data.';
            break;
            
          case 422:
            // Validation errors
            if (error.error?.errors && Array.isArray(error.error.errors)) {
              errorMessage = error.error.errors.join('\n');
            } else {
              errorMessage = error.error?.message || 'Validation failed. Please check your input.';
            }
            break;
            
          case 429:
            errorMessage = 'Too many requests. Please slow down and try again.';
            break;
            
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
            
          case 502:
            errorMessage = 'Bad gateway. The server is temporarily unavailable.';
            break;
            
          case 503:
            errorMessage = 'Service unavailable. Please try again later.';
            break;
            
          case 504:
            errorMessage = 'Gateway timeout. The server took too long to respond.';
            break;
            
          default:
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            } else {
              errorMessage = `Server error: ${error.statusText || 'Unknown error'}`;
            }
        }
      }
      
      // Show error notification (except for silent errors)
      if (shouldShowToast && !req.headers.has('X-Skip-Error-Toast')) {
        showErrorNotification(snackBar, errorMessage, error.status);
      }
      
      // Log error details for debugging
      if (!environment.production) {
        console.group('🔴 HTTP Error Details');
        console.error('URL:', req.url);
        console.error('Method:', req.method);
        console.error('Status:', error.status);
        console.error('Message:', errorMessage);
        console.error('Full Error:', error);
        console.groupEnd();
      }
      
      // Return error with enhanced message
      const enhancedError = {
        ...error,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
      };
      
      return throwError(() => enhancedError);
    }),
    finalize(() => {
      // Any cleanup logic can go here
      if (!environment.production) {
        const duration = Date.now() - startTime;
        if (duration > 3000) {
          console.warn(`⚠️ Slow request detected: ${req.url} took ${duration}ms`);
        }
      }
    })
  );
};

/**
 * Show error notification using Material Snackbar
 */
function showErrorNotification(snackBar: MatSnackBar, message: string, status?: number): void {
  const duration = status === 401 ? 3000 : 5000;
  const panelClass = getErrorPanelClass(status);
  
  snackBar.open(message, 'Dismiss', {
    duration,
    panelClass,
    horizontalPosition: 'end',
    verticalPosition: 'bottom'
  });
}

/**
 * Get appropriate panel class based on error status
 */
function getErrorPanelClass(status?: number): string[] {
  if (!status) return ['error-snackbar'];
  
  if (status >= 400 && status < 500) {
    return ['warning-snackbar']; // Client errors
  } else if (status >= 500) {
    return ['error-snackbar']; // Server errors
  }
  
  return ['info-snackbar'];
}
