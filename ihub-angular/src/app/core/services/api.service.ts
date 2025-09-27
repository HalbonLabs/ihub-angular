import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, timer } from 'rxjs';
import { catchError, map, retry, tap, retryWhen, delayWhen } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Generic API Response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

/**
 * HTTP request options interface
 */
export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  withCredentials?: boolean;
  responseType?: 'json';
  observe?: 'body';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public loading$ = this.loadingSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get stored access token from localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(environment.jwtTokenKey);
    }
    return null;
  }

  /**
   * Set JWT access token
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(environment.jwtTokenKey, token);
      this.tokenSubject.next(token);
    }
  }

  /**
   * Clear JWT access token
   */
  clearToken(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(environment.jwtTokenKey);
      localStorage.removeItem(environment.refreshTokenKey);
      this.tokenSubject.next(null);
    }
  }

  /**
   * Get current token value
   */
  get currentToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.currentToken;
  }

  /**
   * Build HTTP headers with authentication
   */
  private buildHeaders(customHeaders?: HttpHeaders | { [header: string]: string | string[] }): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Add authentication token if available
    const token = this.currentToken;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Merge with custom headers if provided
    if (customHeaders) {
      if (customHeaders instanceof HttpHeaders) {
        customHeaders.keys().forEach(key => {
          const values = customHeaders.getAll(key);
          if (values) {
            headers = headers.delete(key);
            values.forEach(value => {
              headers = headers.append(key, value);
            });
          }
        });
      } else {
        Object.keys(customHeaders).forEach(key => {
          const value = customHeaders[key];
          if (Array.isArray(value)) {
            headers = headers.delete(key);
            value.forEach(v => {
              headers = headers.append(key, v);
            });
          } else {
            headers = headers.set(key, value);
          }
        });
      }
    }

    return headers;
  }

  /**
   * Build request options
   */
  private buildOptions(options?: RequestOptions): any {
    const headers = this.buildHeaders(options?.headers);
    
    return {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials || false
    };
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
        // Clear token on 401
        this.clearToken();
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden. You do not have permission.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    this.loadingSubject.next(true);
    
    return this.http.get<T>(
      `${this.baseUrl}${endpoint}`,
      this.buildOptions(options)
    ).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    ) as Observable<T>;
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    this.loadingSubject.next(true);
    
    return this.http.post<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      this.buildOptions(options)
    ).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    ) as Observable<T>;
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    this.loadingSubject.next(true);
    
    return this.http.put<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      this.buildOptions(options)
    ).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    ) as Observable<T>;
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    this.loadingSubject.next(true);
    
    return this.http.patch<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      this.buildOptions(options)
    ).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    ) as Observable<T>;
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    this.loadingSubject.next(true);
    
    return this.http.delete<T>(
      `${this.baseUrl}${endpoint}`,
      this.buildOptions(options)
    ).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    ) as Observable<T>;
  }

  /**
   * File upload with progress tracking
   */
  uploadFile(endpoint: string, file: File, additionalData?: any): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    // Append additional data if provided
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (additionalData[key] !== null && additionalData[key] !== undefined) {
          formData.append(key, additionalData[key]);
        }
      });
    }

    // Build headers without Content-Type (let browser set it for multipart/form-data)
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    
    const token = this.currentToken;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<any>(
      `${this.baseUrl}${endpoint}`,
      formData,
      {
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Multiple file upload
   */
  uploadMultipleFiles(endpoint: string, files: File[], additionalData?: any): Observable<HttpEvent<any>> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file, file.name);
    });
    
    // Append additional data if provided
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (additionalData[key] !== null && additionalData[key] !== undefined) {
          formData.append(key, additionalData[key]);
        }
      });
    }

    // Build headers without Content-Type
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    
    const token = this.currentToken;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<any>(
      `${this.baseUrl}${endpoint}`,
      formData,
      {
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Download file from server
   */
  downloadFile(endpoint: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}${endpoint}`,
      {
        headers: this.buildHeaders(),
        responseType: 'blob'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get request with text response
   */
  getText(endpoint: string): Observable<string> {
    return this.http.get(
      `${this.baseUrl}${endpoint}`,
      {
        headers: this.buildHeaders(),
        responseType: 'text'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }
}
