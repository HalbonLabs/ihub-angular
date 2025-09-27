import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, switchMap, tap, finalize } from 'rxjs/operators';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  VerifyEmailRequest,
  UserRole,
  hasPermission,
  hasRole,
  JwtPayload
} from '../models/auth.model';
import { ApiService, ApiResponse } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // State management
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadStoredUser());
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.checkInitialAuth());
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private sessionTimerSubscription: any;

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Getters for current values
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Initialize session monitoring if authenticated
    if (this.isAuthenticated) {
      this.startSessionMonitoring();
      this.validateToken();
    }
  }

  /**
   * Load stored user from localStorage
   */
  private loadStoredUser(): User | null {
    if (typeof window === 'undefined') return null;

    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('current_user');
      }
    }
    return null;
  }

  /**
   * Check initial authentication status
   */
  private checkInitialAuth(): boolean {
    return !!this.apiService.currentToken && !!this.loadStoredUser();
  }

  /**
   * User login
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.loadingSubject.next(true);

    // Mock login implementation for demo purposes
    return timer(1000).pipe( // Simulate network delay
      map(() => {
        // Mock user data based on credentials
        const mockUsers = {
          'admin@ihub.com': {
            id: '1',
            email: 'admin@ihub.com',
            fullName: 'Admin User',
            role: 'admin' as UserRole,
            organizationId: 'org-1',
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            permissions: ['*']
          },
          'inspector@ihub.com': {
            id: '2',
            email: 'inspector@ihub.com',
            fullName: 'Inspector User',
            role: 'inspector' as UserRole,
            organizationId: 'org-1',
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            permissions: ['inspections:read', 'inspections:write', 'defects:read', 'defects:write']
          },
          'viewer@ihub.com': {
            id: '3',
            email: 'viewer@ihub.com',
            fullName: 'Viewer User',
            role: 'viewer' as UserRole,
            organizationId: 'org-1',
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            permissions: ['inspections:read', 'defects:read']
          }
        };

        const user = mockUsers[credentials.email as keyof typeof mockUsers];

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check password (simple mock - in real app this would be hashed)
        const validPasswords = {
          'admin@ihub.com': 'Admin@123',
          'inspector@ihub.com': 'Inspector@123',
          'viewer@ihub.com': 'Viewer@123'
        };

        if (credentials.password !== validPasswords[credentials.email as keyof typeof validPasswords]) {
          throw new Error('Invalid email or password');
        }

        // Mock JWT tokens
        const mockAccessToken = `mock-jwt-token-${user.id}-${Date.now()}`;
        const mockRefreshToken = `mock-refresh-token-${user.id}-${Date.now()}`;

        const loginResponse: LoginResponse = {
          user,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          tokenType: 'Bearer',
          expiresIn: 3600 // 1 hour
        };

        return loginResponse;
      }),
      tap(loginResponse => {
        // Store tokens
        this.apiService.setToken(loginResponse.accessToken);
        localStorage.setItem(environment.refreshTokenKey, loginResponse.refreshToken);

        // Store user
        this.storeUser(loginResponse.user);

        // Update state
        this.currentUserSubject.next(loginResponse.user);
        this.isAuthenticatedSubject.next(true);

        // Start session monitoring
        this.startSessionMonitoring();

        // Handle remember me
        if (credentials.rememberMe) {
          localStorage.setItem('remember_me', 'true');
        }
      }),
      catchError(error => {
        this.handleAuthError(error);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * User registration
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    this.loadingSubject.next(true);

    return this.apiService.post<ApiResponse<RegisterResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    ).pipe(
      map(response => response.data),
      tap(registerResponse => {
        // If tokens are provided, auto-login
        if (registerResponse.accessToken && registerResponse.refreshToken) {
          this.apiService.setToken(registerResponse.accessToken);
          localStorage.setItem(environment.refreshTokenKey, registerResponse.refreshToken);

          this.storeUser(registerResponse.user);
          this.currentUserSubject.next(registerResponse.user);
          this.isAuthenticatedSubject.next(true);
          this.startSessionMonitoring();
        }
      }),
      catchError(error => {
        this.handleAuthError(error);
        return throwError(() => error);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * User logout
   */
  logout(redirectToLogin: boolean = true): Observable<any> {
    this.loadingSubject.next(true);

    // Call logout endpoint (optional, to invalidate token on server)
    const logoutRequest = this.apiService.currentToken
      ? this.apiService.post(API_ENDPOINTS.AUTH.LOGOUT, {})
      : of(null);

    return logoutRequest.pipe(
      tap(() => {
        this.clearAuthData();

        if (redirectToLogin) {
          this.router.navigate(['/auth/login']);
        }
      }),
      catchError(() => {
        // Clear data even if logout request fails
        this.clearAuthData();
        if (redirectToLogin) {
          this.router.navigate(['/auth/login']);
        }
        return of(null);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.post<ApiResponse<RefreshTokenResponse>>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken } as RefreshTokenRequest
    ).pipe(
      map(response => response.data),
      tap(tokenResponse => {
        this.apiService.setToken(tokenResponse.accessToken);
        localStorage.setItem(environment.refreshTokenKey, tokenResponse.refreshToken);
      }),
      catchError(error => {
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Forgot password
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Reset password
   */
  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Change password
   */
  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Verify email
   */
  verifyEmail(request: VerifyEmailRequest): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<User> {
    return this.apiService.get<ApiResponse<User>>(
      API_ENDPOINTS.AUTH.PROFILE
    ).pipe(
      map(response => response.data),
      tap(user => {
        this.storeUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.apiService.put<ApiResponse<User>>(
      API_ENDPOINTS.AUTH.PROFILE,
      userData
    ).pipe(
      map(response => response.data),
      tap(user => {
        this.storeUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Validate current token
   */
  validateToken(): Observable<boolean> {
    if (!this.apiService.currentToken) {
      return of(false);
    }

    // Mock token validation - just check if we have a stored user
    return of(!!this.currentUser);
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    return hasPermission(this.currentUser, permission);
  }

  /**
   * Check if user has role
   */
  hasRole(roles: UserRole | UserRole[]): boolean {
    return hasRole(this.currentUser, roles);
  }

  /**
   * Decode JWT token
   */
  decodeToken(token?: string): JwtPayload | null {
    const tokenToDecode = token || this.apiService.currentToken;
    if (!tokenToDecode) return null;

    try {
      const base64Url = tokenToDecode.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token?: string): boolean {
    // Treat mock tokens as non-expiring for local development
    const tokenToCheck = token ?? this.apiService.currentToken ?? '';
    if (tokenToCheck.startsWith('mock-')) {
      return false;
    }

    const payload = this.decodeToken(tokenToCheck);
    if (!payload || !payload.exp) return false;

    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate <= new Date();
  }

  /**
   * Get token expiration time in milliseconds
   */
  getTokenExpirationTime(): number | null {
    const current = this.apiService.currentToken ?? '';
    // Provide a default of 1 hour for mock tokens
    if (current.startsWith('mock-')) {
      return 60 * 60 * 1000;
    }

    const payload = this.decodeToken(current);
    if (!payload || !payload.exp) return null;

    return payload.exp * 1000 - Date.now();
  }

  /**
   * Store user in localStorage
   */
  private storeUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  /**
   * Clear all auth data
   */
  private clearAuthData(): void {
    // Clear tokens
    this.apiService.clearToken();

    // Clear user data
    localStorage.removeItem('current_user');
    localStorage.removeItem('remember_me');

    // Update state
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Stop session monitoring
    this.stopSessionMonitoring();
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): void {
    console.error('Authentication error:', error);

    if (error.status === 401) {
      this.clearAuthData();
    }
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    this.stopSessionMonitoring();

    // Check token expiration periodically
    this.sessionTimerSubscription = timer(0, 60000) // Check every minute
      .pipe(
        switchMap(() => {
          const expirationTime = this.getTokenExpirationTime();

          if (!expirationTime) {
            return of(false);
          }

          // Warn user 5 minutes before expiration
          if (expirationTime <= environment.sessionWarning) {
            console.warn('Session expiring soon');
            // TODO: Show warning notification to user
          }

          // Auto-refresh token 2 minutes before expiration
          if (expirationTime <= 120000) {
            return this.refreshToken().pipe(
              map(() => true),
              catchError(() => of(false))
            );
          }

          return of(true);
        })
      )
      .subscribe(valid => {
        if (!valid) {
          this.logout();
        }
      });
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionTimerSubscription) {
      this.sessionTimerSubscription.unsubscribe();
      this.sessionTimerSubscription = null;
    }
  }

  /**
   * Clean up on service destruction
   */
  ngOnDestroy(): void {
    this.stopSessionMonitoring();
  }
}
