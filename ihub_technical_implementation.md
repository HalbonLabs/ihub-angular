# iHub Angular 17 - Technical Implementation Guide
*Detailed development instructions and code examples*

## 🚀 Project Setup & Bootstrap

### Setup Commands (Mature Stack)
```bash
# Create standard Angular app
ng new ihub-angular --routing --style=scss --package-manager=npm

cd ihub-angular

# Add Angular Material & animations
ng add @angular/material --theme=custom --typography=true --animations=true

# Add mature dependencies
npm install @ngrx/store @ngrx/effects @ngrx/entity @ngrx/router-store
npm install @angular/common/http
npm install date-fns lodash-es uuid
npm install socket.io-client
npm install -D @types/lodash-es @types/uuid

# Optional: Add Bootstrap instead of/with Tailwind
npm install bootstrap
# OR Tailwind for more modern styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Generate feature modules
ng generate module features/auth --routing
ng generate module features/dashboard --routing
ng generate module features/inspections --routing
ng generate module features/admin --routing
ng generate module core
ng generate module shared
```

### Backend Setup (NestJS API)
```bash
# Create NestJS backend (separate repository)
npm i -g @nestjs/cli
nest new ihub-api

cd ihub-api

# Add essential NestJS packages
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/swagger swagger-ui-express
npm install @prisma/client prisma
npm install bcrypt class-validator class-transformer
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install -D @types/bcrypt @types/passport-jwt

# Add AWS SDK for R2 (S3-compatible)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# File upload support
npm install multer @nestjs/platform-express
npm install -D @types/multer

# Initialize Prisma
npx prisma init
```

### Cloudflare R2 Setup
```bash
# 1. In Cloudflare Dashboard:
#    - Go to R2 Object Storage
#    - Create a bucket (e.g., "ihub-files")
#    - Get your Account ID from dashboard

# 2. Create API Token:
#    - Go to My Profile → API Tokens
#    - Create token with "Custom token"
#    - Permissions: Account - Cloudflare R2:Edit
#    - Account Resources: Include - Your Account
#    - Zone Resources: Include - All zones (or specific zone)

# 3. Optional - Setup Custom Domain:
#    - R2 bucket settings → Custom Domains
#    - Add custom domain (e.g., files.yourdomain.com)
#    - Update DNS in Cloudflare
```

### Project Configuration Files

**nx.json**
```json
{
  "npmScope": "ihub",
  "affected": {
    "defaultBase": "main"
  },
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "libs"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    }
  }
}
```

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1976d2',
          700: '#1565c0',
        },
        accent: {
          500: '#ff9800',
          600: '#f57c00',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

---

## 🔧 Core Infrastructure Setup

### API Service (Traditional HTTP Client)

**src/app/core/services/api.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  
  constructor(private http: HttpClient) {}

  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.tokenSubject.next(token);
  }

  clearToken(): void {
    localStorage.removeItem('access_token');
    this.tokenSubject.next(null);
  }

  get token$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  get isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = this.tokenSubject.value;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  get<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params
    });
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    });
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
  }

  // File upload method
  uploadFile(endpoint: string, file: File, additionalData?: any): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers = new HttpHeaders();
    const token = this.tokenSubject.value;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${endpoint}`, formData, {
      headers
    });
  }
}
```

### File Upload Service (Cloudflare R2)

**src/app/core/services/file-upload.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private r2Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = process.env['R2_BUCKET'] || '';
    this.publicUrl = process.env['R2_PUBLIC_URL'] || '';
    
    // R2 uses S3-compatible API
    this.r2Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: process.env['R2_ENDPOINT'],
      credentials: {
        accessKeyId: process.env['R2_ACCESS_KEY_ID'] || '',
        secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'] || '',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File, 
    key: string, 
    isPublic: boolean = true
  ): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // R2 public access (optional)
      ACL: isPublic ? 'public-read' : 'private',
    });

    await this.r2Client.send(command);
    
    // Return public URL (R2 has built-in CDN)
    const url = isPublic 
      ? `${this.publicUrl}/${key}`
      : await this.getPrivateUrl(key);
    
    return { url, key };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[], 
    keyPrefix: string = ''
  ): Promise<Array<{ url: string; key: string; filename: string }>> {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const key = `${keyPrefix}${timestamp}-${index}-${file.originalname}`;
      const result = await this.uploadFile(file, key);
      return {
        ...result,
        filename: file.originalname
      };
    });

    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.r2Client.send(command);
  }

  async getPrivateUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // Generate presigned URL for private files
    return getSignedUrl(this.r2Client, command, { expiresIn });
  }

  generateUniqueKey(filename: string, folder: string = ''): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    const baseName = filename.split('.').slice(0, -1).join('.');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '-');
    
    return folder 
      ? `${folder}/${timestamp}-${randomString}-${sanitizedName}.${extension}`
      : `${timestamp}-${randomString}-${sanitizedName}.${extension}`;
  }
}
```
}
```

### Authentication Service (JWT-based)

**src/app/core/services/auth.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'inspector' | 'viewer';
  organization_id: string;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  organization_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Check if user is already logged in on app start
    if (this.apiService.isAuthenticated) {
      this.loadCurrentUser();
    }
  }

  login(credentials: LoginRequest): Observable<{ success: boolean; error?: string }> {
    this.loadingSubject.next(true);
    
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success) {
          this.apiService.setToken(response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          this.currentUserSubject.next(response.data.user);
          this.router.navigate(['/dashboard']);
        }
      }),
      map(response => ({ 
        success: response.success, 
        error: response.success ? undefined : response.message 
      })),
      catchError(error => of({ success: false, error: 'Login failed. Please try again.' })),
      tap(() => this.loadingSubject.next(false))
    );
  }

  register(userData: RegisterRequest): Observable<{ success: boolean; error?: string }> {
    this.loadingSubject.next(true);
    
    return this.apiService.post<LoginResponse>('/auth/register', userData).pipe(
      tap(response => {
        if (response.success) {
          this.apiService.setToken(response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          this.currentUserSubject.next(response.data.user);
          this.router.navigate(['/dashboard']);
        }
      }),
      map(response => ({ 
        success: response.success, 
        error: response.success ? undefined : response.message 
      })),
      catchError(error => of({ success: false, error: 'Registration failed. Please try again.' })),
      tap(() => this.loadingSubject.next(false))
    );
  }

  logout(): void {
    // Call logout endpoint to invalidate tokens
    this.apiService.post('/auth/logout', {}).subscribe();
    
    // Clear local storage
    this.apiService.clearToken();
    localStorage.removeItem('refresh_token');
    
    // Clear current user
    this.currentUserSubject.next(null);
    
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return of(false);
    }

    return this.apiService.post<{ access_token: string }>('/auth/refresh', { 
      refresh_token: refreshToken 
    }).pipe(
      tap(response => {
        if (response.success) {
          this.apiService.setToken(response.data.access_token);
        }
      }),
      map(response => response.success),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  private loadCurrentUser(): void {
    this.apiService.get<User>('/auth/profile').subscribe({
      next: response => {
        if (response.success) {
          this.currentUserSubject.next(response.data);
        } else {
          this.logout();
        }
      },
      error: () => this.logout()
    });
  }

  updateProfile(profileData: Partial<User>): Observable<{ success: boolean; error?: string }> {
    return this.apiService.put<User>('/auth/profile', profileData).pipe(
      tap(response => {
        if (response.success) {
          this.currentUserSubject.next(response.data);
        }
      }),
      map(response => ({ 
        success: response.success, 
        error: response.success ? undefined : response.message 
      })),
      catchError(error => of({ success: false, error: 'Profile update failed.' }))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; error?: string }> {
    return this.apiService.put('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }).pipe(
      map(response => ({ 
        success: response.success, 
        error: response.success ? undefined : response.message 
      })),
      catchError(error => of({ success: false, error: 'Password change failed.' }))
    );
  }

  // Helper method to check permissions
  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    
    // Simple role-based permissions (extend as needed)
    switch (user.role) {
      case 'admin':
        return true; // Admin has all permissions
      case 'inspector':
        return ['view_inspections', 'create_inspections', 'edit_inspections'].includes(permission);
      case 'viewer':
        return ['view_inspections'].includes(permission);
      default:
        return false;
    }
  }

  // Helper method to check if user has specific role
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }
}
```

### Authentication Guard & Service

**libs/core/src/lib/guards/auth.guard.ts**
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SupabaseService } from '@ihub/shared/data-access';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate() {
    return this.supabaseService.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/auth/signin']);
          return false;
        }
      })
    );
  }
}
```

**libs/feature/auth/src/lib/auth.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from '@ihub/shared/data-access';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this._loading.next(true);
    
    try {
      const { error } = await this.supabase.signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      this.router.navigate(['/dashboard']);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      this._loading.next(false);
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/auth/signin']);
  }
}
```

---

## 📋 Feature Implementation Examples

### Inspection Service with NgRx

**libs/feature/inspections/src/lib/state/inspection.models.ts**
```typescript
export interface Inspection {
  id: string;
  reference_number: string;
  property_address: string;
  inspector_id: string;
  status: InspectionStatus;
  scheduled_date: string;
  completed_date?: string;
  measures: Record<string, any>;
  results?: Record<string, any>;
  organization_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations
  inspector?: Profile;
  defects?: Defect[];
  files?: InspectionFile[];
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface CreateInspectionDto {
  property_address: string;
  inspector_id: string;
  scheduled_date: string;
  measures: Record<string, any>;
}

export interface InspectionFilters {
  status?: InspectionStatus[];
  inspector_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}
```

**libs/feature/inspections/src/lib/state/inspection.actions.ts**
```typescript
import { createActionGroup, props } from '@ngrx/store';
import { Inspection, CreateInspectionDto, InspectionFilters } from './inspection.models';

export const InspectionActions = createActionGroup({
  source: 'Inspection',
  events: {
    'Load Inspections': props<{ filters?: InspectionFilters }>(),
    'Load Inspections Success': props<{ inspections: Inspection[] }>(),
    'Load Inspections Failure': props<{ error: string }>(),
    
    'Load Inspection': props<{ id: string }>(),
    'Load Inspection Success': props<{ inspection: Inspection }>(),
    'Load Inspection Failure': props<{ error: string }>(),
    
    'Create Inspection': props<{ inspection: CreateInspectionDto }>(),
    'Create Inspection Success': props<{ inspection: Inspection }>(),
    'Create Inspection Failure': props<{ error: string }>(),
    
    'Update Inspection Status': props<{ id: string; status: InspectionStatus }>(),
    'Update Inspection Status Success': props<{ inspection: Inspection }>(),
    'Update Inspection Status Failure': props<{ error: string }>(),
    
    'Set Filters': props<{ filters: InspectionFilters }>(),
    'Clear Filters': props<{}>(),
    
    'Select Inspection': props<{ id: string }>(),
    'Clear Selection': props<{}>(),
  }
});
```

### Inspection API Service (Traditional HTTP)

**src/app/features/inspections/services/inspection-api.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Inspection, CreateInspectionDto, InspectionFilters } from '../models/inspection.models';

@Injectable({
  providedIn: 'root'
})
export class InspectionApiService {
  private readonly baseEndpoint = '/inspections';

  constructor(private apiService: ApiService) {}

  getInspections(filters?: InspectionFilters): Observable<Inspection[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status?.length) {
        filters.status.forEach(status => {
          params = params.append('status[]', status);
        });
      }
      if (filters.inspector_id) {
        params = params.set('inspector_id', filters.inspector_id);
      }
      if (filters.date_from) {
        params = params.set('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params = params.set('date_to', filters.date_to);
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.apiService.get<Inspection[]>(this.baseEndpoint, params).pipe(
      map(response => response.data)
    );
  }

  getInspection(id: string): Observable<Inspection> {
    return this.apiService.get<Inspection>(`${this.baseEndpoint}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createInspection(inspection: CreateInspectionDto): Observable<Inspection> {
    return this.apiService.post<Inspection>(this.baseEndpoint, inspection).pipe(
      map(response => response.data)
    );
  }

  updateInspection(id: string, inspection: Partial<Inspection>): Observable<Inspection> {
    return this.apiService.put<Inspection>(`${this.baseEndpoint}/${id}`, inspection).pipe(
      map(response => response.data)
    );
  }

  updateInspectionStatus(id: string, status: string): Observable<Inspection> {
    return this.apiService.put<Inspection>(`${this.baseEndpoint}/${id}/status`, { status }).pipe(
      map(response => response.data)
    );
  }

  deleteInspection(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.baseEndpoint}/${id}`).pipe(
      map(() => void 0)
    );
  }

  // File upload for inspections
  uploadFile(inspectionId: string, file: File, description?: string): Observable<any> {
    return this.apiService.uploadFile(
      `${this.baseEndpoint}/${inspectionId}/files`, 
      file, 
      { description }
    ).pipe(
      map(response => response.data)
    );
  }

  // Upload multiple files
  uploadMultipleFiles(inspectionId: string, files: FileList): Observable<any[]> {
    const uploads = Array.from(files).map(file => 
      this.uploadFile(inspectionId, file)
    );
    return from(Promise.all(uploads));
  }

  // Get inspection statistics
  getInspectionStats(): Observable<any> {
    return this.apiService.get<any>(`${this.baseEndpoint}/stats`).pipe(
      map(response => response.data)
    );
  }

  // Export inspections
  exportInspections(format: 'excel' | 'pdf', filters?: InspectionFilters): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filters) {
      if (filters.status?.length) {
        filters.status.forEach(status => {
          params = params.append('status[]', status);
        });
      }
      if (filters.inspector_id) {
        params = params.set('inspector_id', filters.inspector_id);
      }
      if (filters.date_from) {
        params = params.set('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params = params.set('date_to', filters.date_to);
      }
    }

    // Note: Export files are served directly from R2 with presigned URLs
    return this.apiService.get<Blob>(`${this.baseEndpoint}/export`, params).pipe(
      map(response => response.data)
    );
  }
}
```

### WebSocket Service for Real-time Updates

**src/app/core/services/websocket.service.ts**
```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface SocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private eventSubjects = new Map<string, BehaviorSubject<any>>();

  public connected$ = this.connectionStatus.asObservable();

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.wsUrl, {
      auth: {
        token: localStorage.getItem('access_token')
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connectionStatus.next(false);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

    // Handle generic events
    this.socket.onAny((event: string, data: any) => {
      this.handleEvent(event, data);
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.next(false);
    }
  }

  private handleEvent(event: string, data: any): void {
    if (this.eventSubjects.has(event)) {
      this.eventSubjects.get(event)?.next(data);
    }
  }

  // Subscribe to specific events
  on<T>(event: string): Observable<T> {
    if (!this.eventSubjects.has(event)) {
      this.eventSubjects.set(event, new BehaviorSubject<T | null>(null));
    }
    return this.eventSubjects.get(event)!.asObservable();
  }

  // Emit events
  emit<T>(event: string, data?: T): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Join a specific room (for organization-based updates)
  joinRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', room);
    }
  }

  // Leave a room
  leaveRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', room);
    }
  }

  // Inspection-specific events
  subscribeToInspectionUpdates(): Observable<any> {
    return this.on('inspection_updated');
  }

  subscribeToNewInspections(): Observable<any> {
    return this.on('inspection_created');
  }

  subscribeToStatusChanges(): Observable<any> {
    return this.on('inspection_status_changed');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
```

### HTTP Interceptor for Error Handling

**src/app/core/interceptors/auth.interceptor.ts**
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          if (success) {
            this.refreshTokenSubject.next(success);
            return next.handle(request);
          } else {
            this.authService.logout();
            return throwError(() => new Error('Token refresh failed'));
          }
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      switchMap(token => {
        if (token) {
          return next.handle(request);
        }
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }
}
```

### Component Example - Inspection List (Standard Angular Structure)

**src/app/features/inspections/components/inspection-list/inspection-list.component.ts**
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { InspectionActions } from '../../state/inspection.actions';
import { selectAllInspections, selectInspectionLoading } from '../../state/inspection.selectors';
import { Inspection, InspectionFilters, InspectionStatus } from '../../models/inspection.models';

@Component({
  selector: 'app-inspection-list',
  template: `
    <div class="inspection-list-container">
      <!-- Header with Search and Filters -->
      <div class="header-section bg-white shadow-sm rounded-lg p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-semibold text-gray-900">Inspections</h1>
          <button 
            mat-raised-button 
            color="primary"
            routerLink="/inspections/new"
            class="create-inspection-btn">
            <mat-icon>add</mat-icon>
            New Inspection
          </button>
        </div>

        <!-- Search and Filters Row -->
        <div class="flex gap-4 flex-wrap">
          <!-- Search Input -->
          <mat-form-field appearance="outline" class="flex-1 min-w-[300px]">
            <mat-label>Search inspections...</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Property address or reference">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <!-- Status Filter -->
          <mat-form-field appearance="outline" class="w-48">
            <mat-label>Status</mat-label>
            <mat-select [formControl]="statusControl" multiple>
              <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                {{ status.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Date Range Filter -->
          <mat-form-field appearance="outline" class="w-48">
            <mat-label>Date Range</mat-label>
            <mat-date-range-input [rangePicker]="picker">
              <input matStartDate [formControl]="startDateControl" placeholder="Start date">
              <input matEndDate [formControl]="endDateControl" placeholder="End date">
            </mat-date-range-input>
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-date-range-picker #picker></mat-date-range-picker>
          </mat-form-field>

          <!-- Clear Filters -->
          <button 
            mat-stroked-button 
            (click)="clearFilters()"
            class="h-14">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <mat-icon class="text-blue-600">assignment</mat-icon>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Total Inspections</p>
              <p class="text-2xl font-semibold text-gray-900">{{ totalCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <mat-icon class="text-yellow-600">schedule</mat-icon>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Pending</p>
              <p class="text-2xl font-semibold text-gray-900">{{ pendingCount }}</p>
            </div>
          </div>
        </div>
        
        <!-- Additional stats cards... -->
      </div>

      <!-- Data Table -->
      <div class="bg-white shadow-sm rounded-lg overflow-hidden">
        <mat-table [dataSource]="dataSource" class="w-full">
          <!-- Reference Number Column -->
          <ng-container matColumnDef="reference">
            <mat-header-cell *matHeaderCellDef>Reference</mat-header-cell>
            <mat-cell *matCellDef="let inspection">
              <a 
                [routerLink]="['/inspections', inspection.id]" 
                class="text-blue-600 hover:text-blue-800 font-medium">
                {{ inspection.reference_number }}
              </a>
            </mat-cell>
          </ng-container>

          <!-- Property Address Column -->
          <ng-container matColumnDef="address">
            <mat-header-cell *matHeaderCellDef>Property Address</mat-header-cell>
            <mat-cell *matCellDef="let inspection">
              <div class="max-w-xs truncate" [title]="inspection.property_address">
                {{ inspection.property_address }}
              </div>
            </mat-cell>
          </ng-container>

          <!-- Inspector Column -->
          <ng-container matColumnDef="inspector">
            <mat-header-cell *matHeaderCellDef>Inspector</mat-header-cell>
            <mat-cell *matCellDef="let inspection">
              {{ inspection.inspector?.full_name || 'Unassigned' }}
            </mat-cell>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
            <mat-cell *matCellDef="let inspection">
              <app-status-badge [status]="inspection.status"></app-status-badge>
            </mat-cell>
          </ng-container>

          <!-- Scheduled Date Column -->
          <ng-container matColumnDef="scheduled">
            <mat-header-cell *matHeaderCellDef>Scheduled Date</mat-header-cell>
            <mat-cell *matCellDef="let inspection">
              {{ inspection.scheduled_date | date:'mediumDate' }}
            </mat-cell>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef class="w-24">Actions</mat-header-cell>
            <mat-cell *matCellDef="let inspection" class="w-24">
              <button 
                mat-icon-button 
                [matMenuTriggerFor]="menu"
                class="text-gray-400 hover:text-gray-600">
                <mat-icon>more_vert</mat-icon>
              </button>
              
              <mat-menu #menu="matMenu">
                <button mat-menu-item [routerLink]="['/inspections', inspection.id]">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-menu-item [routerLink]="['/inspections', inspection.id, 'edit']">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <mat-divider></mat-divider>
                <button 
                  mat-menu-item 
                  (click)="updateStatus(inspection.id, 'in_progress')"
                  *ngIf="inspection.status === 'pending'">
                  <mat-icon>play_arrow</mat-icon>
                  Start Inspection
                </button>
                <button 
                  mat-menu-item 
                  (click)="updateStatus(inspection.id, 'completed')"
                  *ngIf="inspection.status === 'in_progress'">
                  <mat-icon>check_circle</mat-icon>
                  Complete
                </button>
              </mat-menu>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
        </mat-table>

        <!-- Loading State -->
        <div *ngIf="loading$ | async" class="flex justify-center p-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && dataSource.data.length === 0" 
             class="text-center py-12 text-gray-500">
          <mat-icon class="text-6xl mb-4 text-gray-300">assignment</mat-icon>
          <h3 class="text-lg font-medium mb-2">No inspections found</h3>
          <p>Create your first inspection to get started.</p>
          <button 
            mat-raised-button 
            color="primary" 
            routerLink="/inspections/new"
            class="mt-4">
            Create Inspection
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./inspection-list.component.scss']
})
export class InspectionListComponent implements OnInit, OnDestroy {
  // Component implementation remains the same...
  private destroy$ = new Subject<void>();
  
  // Data and loading state
  inspections$ = this.store.select(selectAllInspections);
  loading$ = this.store.select(selectInspectionLoading);
  
  // Form controls for filters
  searchControl = new FormControl('');
  statusControl = new FormControl([]);
  startDateControl = new FormControl();
  endDateControl = new FormControl();
  
  // Table configuration
  displayedColumns = ['reference', 'address', 'inspector', 'status', 'scheduled', 'actions'];
  dataSource = new MatTableDataSource<Inspection>([]);
  
  // Status options for filter
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  // Stats
  totalCount = 0;
  pendingCount = 0;
  get isLoading() {
    return false; // Will be connected to loading$ observable
  }

  constructor(
    private store: Store,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Load initial data
    this.store.dispatch(InspectionActions.loadInspections({}));
    
    // Subscribe to inspections data
    this.inspections$.pipe(takeUntil(this.destroy$)).subscribe(inspections => {
      this.dataSource.data = inspections;
      this.updateStats(inspections);
    });

    // Setup search debouncing
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    // Setup filter change listeners
    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
    
    this.startDateControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
    
    this.endDateControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyFilters() {
    const filters: InspectionFilters = {};
    
    if (this.searchControl.value) {
      filters.search = this.searchControl.value;
    }
    
    if (this.statusControl.value?.length) {
      filters.status = this.statusControl.value;
    }
    
    if (this.startDateControl.value) {
      filters.date_from = this.startDateControl.value.toISOString();
    }
    
    if (this.endDateControl.value) {
      filters.date_to = this.endDateControl.value.toISOString();
    }

    this.store.dispatch(InspectionActions.loadInspections({ filters }));
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.statusControl.setValue([]);
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    
    this.store.dispatch(InspectionActions.clearFilters());
    this.store.dispatch(InspectionActions.loadInspections({}));
  }

  updateStatus(id: string, status: InspectionStatus) {
    this.store.dispatch(InspectionActions.updateInspectionStatus({ id, status }));
  }

  private updateStats(inspections: Inspection[]) {
    this.totalCount = inspections.length;
    this.pendingCount = inspections.filter(i => i.status === 'pending').length;
  }
}
```

## 🎨 Shared Components (Standard Angular Structure)

### Status Badge Component

**src/app/components/ui/status-badge/status-badge.component.ts**
```typescript
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `
    <span [class]="getStatusClasses()" class="px-2 py-1 text-xs font-medium rounded-full">
      {{ getStatusLabel() }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status!: string;

  getStatusClasses(): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (this.status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getStatusLabel(): string {
    switch (this.status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return this.status;
    }
  }
}
```

### Data Access Service (Standard Angular Structure)

**src/app/core/services/supabase.service.ts**
```typescript
// Same implementation as before, just different path structure
```

---

## 🗄️ Database Setup (PostgreSQL + Prisma)

### Prisma Schema

**prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  INSPECTOR
  VIEWER
}

enum InspectionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum DefectSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  settings          Json     @default("{}")
  subscriptionTier  String   @default("basic") @map("subscription_tier")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  users       User[]
  inspections Inspection[]

  @@map("organizations")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String?  @map("full_name")
  avatarUrl    String?  @map("avatar_url")
  role         UserRole @default(INSPECTOR)
  isActive     Boolean  @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  organizationId String       @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Inspections as inspector
  inspections     Inspection[]
  uploadedFiles   InspectionFile[]
  auditLogs       AuditLog[]

  @@map("users")
}

model Inspection {
  id               String           @id @default(cuid())
  referenceNumber  String           @unique @map("reference_number")
  propertyAddress  String           @map("property_address")
  status           InspectionStatus @default(PENDING)
  scheduledDate    DateTime?        @map("scheduled_date")
  completedDate    DateTime?        @map("completed_date")
  measures         Json             @default("{}")
  results          Json             @default("{}")
  notes            String?
  metadata         Json             @default("{}")
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  // Relations
  inspectorId    String?      @map("inspector_id")
  inspector      User?        @relation(fields: [inspectorId], references: [id])
  organizationId String       @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  defects Defect[]
  files   InspectionFile[]

  @@index([organizationId])
  @@index([inspectorId])
  @@index([status])
  @@index([scheduledDate])
  @@map("inspections")
}

model Defect {
  id              String         @id @default(cuid())
  category        String
  severity        DefectSeverity @default(MEDIUM)
  description     String
  resolutionNotes String?        @map("resolution_notes")
  status          String         @default("open")
  images          String[]       @default([])
  metadata        Json           @default("{}")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  inspectionId String     @map("inspection_id")
  inspection   Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)

  @@index([inspectionId])
  @@map("defects")
}

model InspectionFile {
  id         String   @id @default(cuid())
  filename   String
  filePath   String   @map("file_path")
  fileSize   Int?     @map("file_size")
  mimeType   String?  @map("mime_type")
  uploadedAt DateTime @default(now()) @map("uploaded_at")

  // Relations
  inspectionId String     @map("inspection_id")
  inspection   Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  uploadedById String     @map("uploaded_by_id")
  uploadedBy   User       @relation(fields: [uploadedById], references: [id])

  @@index([inspectionId])
  @@map("inspection_files")
}

model AuditLog {
  id        String   @id @default(cuid())
  action    String
  entity    String
  entityId  String   @map("entity_id")
  changes   Json     @default("{}")
  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id])

  @@index([entity, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Database Migration Commands

```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

# View database in Prisma Studio
npx prisma studio
```

### Database Seed Script

**prisma/seed.ts**
```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: 'default-org' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default-org',
      settings: {},
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ihub.com' },
    update: {},
    create: {
      email: 'admin@ihub.com',
      passwordHash: hashedPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  // Create inspector user
  const inspectorPassword = await bcrypt.hash('inspector123', 10);
  
  const inspectorUser = await prisma.user.upsert({
    where: { email: 'inspector@ihub.com' },
    update: {},
    create: {
      email: 'inspector@ihub.com',
      passwordHash: inspectorPassword,
      fullName: 'Inspector User',
      role: UserRole.INSPECTOR,
      organizationId: org.id,
    },
  });

  console.log('Seeded:', { org, adminUser, inspectorUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Environment Configuration

**.env**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ihub_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRE_TIME="24h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRE_TIME="7d"

# File Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE="10MB"

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET="ihub-files"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://files.yourdomain.com" # or https://pub-xyz.r2.dev

# Redis (for caching)
REDIS_URL="redis://localhost:6379"

# API
PORT=3000
API_PREFIX="/api"
```

This technical implementation guide provides the detailed setup and code examples needed to build the Angular 17 version of iHub. The next phase would involve implementing the remaining features like file upload, reporting, and admin functionality following these same patterns.