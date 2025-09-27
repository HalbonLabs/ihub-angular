/**
 * Authentication Models and Interfaces
 */

/**
 * User roles enum
 */
export enum UserRole {
  ADMIN = 'admin',
  INSPECTOR = 'inspector',
  VIEWER = 'viewer'
}

/**
 * User model interface
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    defaultView: string;
    widgetLayout: string[];
  };
}

/**
 * Login request interface
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

/**
 * Register request interface
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  organizationName?: string;
  phoneNumber?: string;
  acceptTerms: boolean;
}

/**
 * Register response interface
 */
export interface RegisterResponse {
  message: string;
  user: User;
  requiresEmailVerification: boolean;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Email verification request
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Auth state interface for NgRx
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  returnUrl: string | null;
}

/**
 * JWT Token payload interface
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  organizationId: string;
  iat: number; // Issued at
  exp: number; // Expiration
  jti?: string; // JWT ID
}

/**
 * Permission model
 */
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

/**
 * Role permissions mapping
 */
export interface RolePermissions {
  [UserRole.ADMIN]: string[];
  [UserRole.INSPECTOR]: string[];
  [UserRole.VIEWER]: string[];
}

/**
 * Default role permissions
 */
export const DEFAULT_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    'users:*',
    'inspections:*',
    'reports:*',
    'settings:*',
    'organizations:*',
    'admin:*'
  ],
  [UserRole.INSPECTOR]: [
    'inspections:create',
    'inspections:read',
    'inspections:update',
    'inspections:delete:own',
    'defects:*',
    'files:upload',
    'files:read',
    'reports:read',
    'reports:generate:own',
    'profile:update:own'
  ],
  [UserRole.VIEWER]: [
    'inspections:read',
    'defects:read',
    'files:read',
    'reports:read',
    'profile:read:own'
  ]
};

/**
 * Check if user has permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  const userPermissions = DEFAULT_PERMISSIONS[user.role] || [];
  
  // Check for wildcard permission
  if (userPermissions.includes('*')) return true;
  
  // Check for exact permission
  if (userPermissions.includes(permission)) return true;
  
  // Check for wildcard in resource
  const [resource, action] = permission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;
  
  return false;
}

/**
 * Check if user has any of the required roles
 */
export function hasRole(user: User | null, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return requiredRoles.includes(user.role);
}

/**
 * Check if user can access resource
 */
export function canAccess(user: User | null, resource: string, action: string): boolean {
  return hasPermission(user, `${resource}:${action}`);
}