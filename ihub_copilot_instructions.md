# iHub Angular 17 Rebuild - AI/Copilot Instructions
*Comprehensive guidance for AI-assisted development of the iHub inspection platform*

## 🎯 Project Overview

**Project Name**: iHub Inspection Management Platform  
**Goal**: Rebuild existing Next.js inspection platform using Angular 17 with mature, stable technologies  
**Architecture**: Traditional client-server with separate Angular frontend and NestJS backend  
**Domain**: Property inspection management with defect tracking, file storage, and reporting

---

## 🏗️ Tech Stack & Architecture

### Frontend Stack
```typescript
// Core Technologies
Angular: 17.x (standalone components preferred)
TypeScript: 5.x (strict mode enabled)
UI Framework: Angular Material + Tailwind CSS
State Management: NgRx (for complex state) + Angular Signals (for reactive state)
HTTP Client: Angular HttpClient (traditional REST API calls)
Routing: Angular Router with guards
Forms: Angular Reactive Forms
Testing: Jest + Cypress + Angular Testing Library
Build: Angular CLI with production optimizations
```

### Backend Stack
```typescript
// Backend Technologies (separate repository)
Runtime: Node.js 18+
Framework: NestJS with TypeScript
Database: PostgreSQL with Prisma ORM
Authentication: JWT + Passport.js + bcrypt
File Storage: Cloudflare R2 (S3-compatible API)
Caching: Redis for sessions and performance
Real-time: Socket.IO for WebSocket connections
API Documentation: OpenAPI/Swagger
Testing: Jest for unit tests
```

### Infrastructure & Deployment
```yaml
Database: Neon PostgreSQL (managed)
Backend Hosting: Railway (NestJS + Redis)
Frontend Hosting: Vercel (Angular SPA)
File Storage: Cloudflare R2 + CDN
Monitoring: Native platform monitoring
CI/CD: GitHub Actions or Railway auto-deploy
```

---

## 📁 Project Structure

### Angular Frontend Structure
```
src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── guards/             # AuthGuard, RoleGuard
│   ├── interceptors/       # AuthInterceptor, ErrorInterceptor
│   ├── services/           # ApiService, AuthService, WebSocketService
│   └── models/             # Core interfaces and types
├── shared/                 # Shared utilities and models
│   ├── components/         # Reusable components (status-badge, data-table)
│   ├── directives/         # Custom directives
│   ├── pipes/              # Custom pipes
│   └── utils/              # Helper functions and constants
├── features/               # Feature modules
│   ├── auth/              # Authentication module
│   ├── dashboard/         # Dashboard with tiles and stats
│   ├── inspections/       # Inspection CRUD and management
│   │   ├── components/    # Inspection-specific components
│   │   ├── services/      # InspectionApiService
│   │   ├── models/        # Inspection interfaces
│   │   └── state/         # NgRx state (actions, reducers, effects, selectors)
│   ├── defects/           # Defect tracking and management
│   ├── files/             # File upload and management
│   ├── admin/             # Admin features (user management, settings)
│   ├── reports/           # Reporting and analytics
│   └── calendar/          # Schedule and appointment management
├── components/            # App-level shared components
│   ├── layout/           # Header, sidebar, footer
│   └── ui/               # App-specific UI components
└── environments/         # Environment configurations
```

### NestJS Backend Structure
```
src/
├── app.module.ts          # Root module
├── main.ts               # Application bootstrap
├── auth/                 # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── dto/              # Data transfer objects
├── users/                # User management
├── inspections/          # Inspection CRUD operations
├── defects/              # Defect management
├── files/                # File upload to R2
├── reports/              # Report generation
├── websocket/            # Real-time features
├── database/             # Prisma client and migrations
├── common/               # Shared decorators, guards, filters
└── config/               # Configuration management
```

---

## 🔧 Code Patterns & Conventions

### Angular Component Patterns

```typescript
// Prefer standalone components (Angular 17)
@Component({
  selector: 'app-inspection-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, RouterLink],
  template: `
    <!-- Always use OnPush for performance -->
    <div class="inspection-list-container">
      <!-- Use Angular Material + Tailwind classes -->
      <mat-table [dataSource]="dataSource" class="w-full">
        <!-- Implement proper loading/error states -->
        <div *ngIf="loading()" class="flex justify-center p-4">
          <mat-spinner></mat-spinner>
        </div>
      </mat-table>
    </div>
  `,
  styleUrls: ['./inspection-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InspectionListComponent implements OnInit, OnDestroy {
  // Use signals for reactive state (Angular 17)
  loading = signal<boolean>(false);
  inspections = signal<Inspection[]>([]);
  
  // Use traditional observables for complex state
  private destroy$ = new Subject<void>();
  
  // Inject services properly
  constructor(
    private inspectionService: InspectionApiService,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    // Subscribe to store state
    this.store.select(selectInspections)
      .pipe(takeUntil(this.destroy$))
      .subscribe(inspections => this.inspections.set(inspections));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Service Patterns

```typescript
// API Service Pattern
@Injectable({
  providedIn: 'root'
})
export class InspectionApiService {
  private readonly baseEndpoint = '/inspections';

  constructor(private apiService: ApiService) {}

  // Always return observables, handle errors appropriately
  getInspections(filters?: InspectionFilters): Observable<Inspection[]> {
    let params = new HttpParams();
    
    if (filters) {
      // Build query parameters properly
      if (filters.status?.length) {
        filters.status.forEach(status => {
          params = params.append('status[]', status);
        });
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.apiService.get<Inspection[]>(this.baseEndpoint, params).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Failed to load inspections:', error);
        return throwError(() => error);
      })
    );
  }

  // File uploads go to R2 via backend
  uploadFile(inspectionId: string, file: File): Observable<FileUploadResponse> {
    return this.apiService.uploadFile(
      `${this.baseEndpoint}/${inspectionId}/files`,
      file
    ).pipe(
      map(response => response.data)
    );
  }
}
```

### NestJS Controller Patterns

```typescript
// NestJS Controller Pattern
@ApiTags('inspections')
@Controller('inspections')
@UseGuards(JwtAuthGuard)
export class InspectionsController {
  constructor(private inspectionsService: InspectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get inspections with filtering' })
  @ApiResponse({ status: 200, description: 'List of inspections', type: [InspectionDto] })
  async getInspections(
    @Query() filters: InspectionFiltersDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ApiResponse<Inspection[]>> {
    try {
      const inspections = await this.inspectionsService.findMany(
        filters,
        req.user.organizationId
      );
      
      return {
        success: true,
        data: inspections
      };
    } catch (error) {
      throw new BadRequestException('Failed to load inspections');
    }
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @Param('id') inspectionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ApiResponse<FileUploadResponse>> {
    const result = await this.inspectionsService.uploadFile(
      inspectionId,
      file,
      req.user.id
    );
    
    return {
      success: true,
      data: result
    };
  }
}
```

---

## 🗄️ Database Schema (Prisma)

### Core Models
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String?  @map("full_name")
  role         UserRole @default(INSPECTOR)
  organizationId String @map("organization_id")
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Relations
  inspections     Inspection[]
  uploadedFiles   InspectionFile[]
  auditLogs       AuditLog[]
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
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
  
  // Relations
  inspectorId    String?      @map("inspector_id")
  inspector      User?        @relation(fields: [inspectorId], references: [id])
  organizationId String       @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  defects Defect[]
  files   InspectionFile[]
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@index([organizationId])
  @@index([inspectorId])
  @@index([status])
  @@map("inspections")
}

model InspectionFile {
  id         String   @id @default(cuid())
  filename   String
  filePath   String   @map("file_path")   // R2 object key
  fileUrl    String   @map("file_url")    // R2 public URL with CDN
  fileSize   Int?     @map("file_size")
  mimeType   String?  @map("mime_type")
  
  inspectionId String     @map("inspection_id")
  inspection   Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  uploadedById String     @map("uploaded_by_id")
  uploadedBy   User       @relation(fields: [uploadedById], references: [id])
  
  uploadedAt DateTime @default(now()) @map("uploaded_at")
  
  @@map("inspection_files")
}
```

---

## 🔐 Authentication & Security

### JWT Implementation
```typescript
// Auth Service Pattern
@Injectable()
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService, private router: Router) {
    // Check existing token on app start
    if (this.getStoredToken()) {
      this.loadCurrentUser();
    }
  }

  async login(credentials: LoginRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiService.post<LoginResponse>('/auth/login', credentials).toPromise();
      
      if (response.success) {
        this.setTokens(response.data.access_token, response.data.refresh_token);
        this.currentUserSubject.next(response.data.user);
        this.router.navigate(['/dashboard']);
        return { success: true };
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}

// Auth Guard Pattern
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) return true;
        this.router.navigate(['/auth/login']);
        return false;
      })
    );
  }
}
```

---

## 📁 File Management (Cloudflare R2)

### File Upload Service
```typescript
@Injectable()
export class FileUploadService {
  private r2Client: S3Client;

  constructor() {
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: environment.r2Endpoint,
      credentials: {
        accessKeyId: environment.r2AccessKeyId,
        secretAccessKey: environment.r2SecretAccessKey,
      },
    });
  }

  async uploadToR2(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: environment.r2Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    });

    await this.r2Client.send(command);
    
    // Return CDN URL
    return `${environment.r2PublicUrl}/${key}`;
  }

  generateFileKey(filename: string, folder: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '-');
    return `${folder}/${timestamp}-${randomStr}-${sanitized}`;
  }
}
```

---

## 🔄 Real-time Features (WebSockets)

### WebSocket Service Pattern
```typescript
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  
  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.connect();
      else this.disconnect();
    });
  }

  private connect(): void {
    this.socket = io(environment.wsUrl, {
      auth: { token: localStorage.getItem('access_token') }
    });

    this.socket.on('connect', () => {
      this.connectionStatus.next(true);
      // Join organization room for filtered updates
      const user = this.authService.getCurrentUser();
      if (user?.organizationId) {
        this.socket?.emit('join_room', user.organizationId);
      }
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus.next(false);
    });
  }

  // Subscribe to inspection updates
  onInspectionUpdate(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('inspection_updated', data => observer.next(data));
    });
  }

  // Emit inspection status change
  emitStatusChange(inspectionId: string, status: string): void {
    this.socket?.emit('inspection_status_changed', { inspectionId, status });
  }
}
```

---

## 🧪 Testing Patterns

### Component Testing
```typescript
describe('InspectionListComponent', () => {
  let component: InspectionListComponent;
  let fixture: ComponentFixture<InspectionListComponent>;
  let mockInspectionService: jasmine.SpyObj<InspectionApiService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('InspectionApiService', ['getInspections']);

    await TestBed.configureTestingModule({
      imports: [InspectionListComponent, NoopAnimationsModule],
      providers: [
        { provide: InspectionApiService, useValue: spy },
        provideStore(),
        provideEffects()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InspectionListComponent);
    component = fixture.componentInstance;
    mockInspectionService = TestBed.inject(InspectionApiService) as jasmine.SpyObj<InspectionApiService>;
  });

  it('should load inspections on init', () => {
    const mockInspections: Inspection[] = [
      { id: '1', referenceNumber: 'INS-001', propertyAddress: '123 Main St', status: 'PENDING' }
    ];
    
    mockInspectionService.getInspections.and.returnValue(of(mockInspections));
    
    component.ngOnInit();
    
    expect(mockInspectionService.getInspections).toHaveBeenCalled();
    expect(component.inspections()).toEqual(mockInspections);
  });
});
```

### E2E Testing
```typescript
// Cypress E2E Test Pattern
describe('Inspection Management', () => {
  beforeEach(() => {
    cy.login('inspector@test.com', 'password');
    cy.visit('/inspections');
  });

  it('should create new inspection', () => {
    cy.get('[data-cy=create-inspection-btn]').click();
    cy.get('[data-cy=property-address]').type('123 Test Street');
    cy.get('[data-cy=scheduled-date]').type('2024-12-31');
    cy.get('[data-cy=submit-btn]').click();
    
    cy.url().should('include', '/inspections/');
    cy.get('[data-cy=inspection-status]').should('contain', 'Pending');
  });

  it('should upload files to inspection', () => {
    cy.get('[data-cy=inspection-row]').first().click();
    cy.get('[data-cy=upload-btn]').click();
    cy.get('input[type=file]').selectFile('cypress/fixtures/test-image.jpg');
    cy.get('[data-cy=upload-submit]').click();
    
    cy.get('[data-cy=file-list]').should('contain', 'test-image.jpg');
  });
});
```

---

## 🎨 UI/UX Guidelines

### Component Design Patterns
```typescript
// Always use Angular Material + Tailwind for consistent UI
@Component({
  template: `
    <!-- Use Angular Material components as base -->
    <mat-card class="max-w-4xl mx-auto">
      <mat-card-header class="pb-4">
        <mat-card-title class="text-xl font-semibold">
          {{ title }}
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">
          {{ subtitle }}
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Use Tailwind for layout and spacing -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Always implement proper loading states -->
          <div *ngIf="loading()" class="flex items-center justify-center p-8">
            <mat-spinner diameter="32"></mat-spinner>
            <span class="ml-3 text-gray-600">Loading...</span>
          </div>
          
          <!-- Always implement error states -->
          <div *ngIf="error()" class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <mat-icon class="text-red-600 mr-2">error</mat-icon>
            <span class="text-red-800">{{ error() }}</span>
          </div>
          
          <!-- Always implement empty states -->
          <div *ngIf="!loading() && !error() && items().length === 0" 
               class="text-center py-12 text-gray-500">
            <mat-icon class="text-6xl mb-4 text-gray-300">inbox</mat-icon>
            <h3 class="text-lg font-medium mb-2">No items found</h3>
            <p>Start by creating your first item.</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
```

### Form Patterns
```typescript
// Use reactive forms with proper validation
export class InspectionFormComponent implements OnInit {
  inspectionForm = this.fb.group({
    propertyAddress: ['', [Validators.required, Validators.minLength(5)]],
    scheduledDate: ['', Validators.required],
    inspectorId: ['', Validators.required],
    measures: this.fb.group({
      // Dynamic form fields based on inspection type
    })
  });

  constructor(private fb: FormBuilder) {}

  get propertyAddress() { return this.inspectionForm.get('propertyAddress'); }
  get scheduledDate() { return this.inspectionForm.get('scheduledDate'); }

  onSubmit(): void {
    if (this.inspectionForm.valid) {
      const formData = this.inspectionForm.value;
      // Process form submission
    } else {
      // Mark all fields as touched to show validation errors
      this.inspectionForm.markAllAsTouched();
    }
  }
}
```

---

## 🚀 Performance Guidelines

### Angular Performance
```typescript
// Always use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Use trackBy functions for *ngFor
@Component({
  template: `
    <div *ngFor="let item of items; trackBy: trackByFn">
      {{ item.name }}
    </div>
  `
})
export class ListComponent {
  trackByFn(index: number, item: any): any {
    return item.id; // Use unique identifier
  }
}

// Lazy load feature modules
const routes: Routes = [
  {
    path: 'inspections',
    loadChildren: () => import('./features/inspections/inspections.module').then(m => m.InspectionsModule)
  }
];

// Use virtual scrolling for large lists
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="h-96">
      <div *cdkVirtualFor="let item of items">{{ item.name }}</div>
    </cdk-virtual-scroll-viewport>
  `
})
```

---

## 📋 Implementation Priorities

### Phase 1 (Weeks 1-4): Foundation
1. **Setup projects** (Angular + NestJS)
2. **Authentication system** (JWT + guards)
3. **Basic CRUD** for inspections
4. **File upload** to R2
5. **Dashboard layout**

### Phase 2 (Weeks 5-8): Core Features
1. **Inspection workflow** (status management)
2. **Defect tracking**
3. **Search and filtering**
4. **User management**
5. **Real-time updates**

### Phase 3 (Weeks 9-12): Advanced Features
1. **Reporting system**
2. **Admin features**
3. **Calendar integration**
4. **Advanced file management**
5. **Notifications**

### Phase 4 (Weeks 13-16): Polish
1. **Testing coverage**
2. **Performance optimization**
3. **Mobile responsiveness**
4. **Documentation**
5. **Deployment**

---

## 🛡️ Security Considerations

### Always Implement
- **JWT token validation** on all protected routes
- **Input sanitization** on all user inputs
- **File type validation** for uploads
- **Rate limiting** on API endpoints  
- **HTTPS only** in production
- **Content Security Policy** headers
- **Organization-based data isolation**
- **Audit logging** for sensitive operations

### Never Do
- Store sensitive data in localStorage (only access tokens)
- Trust user input without validation
- Expose internal IDs in URLs (use UUIDs)
- Skip authentication checks on API endpoints
- Allow unlimited file uploads

---

## 📝 Code Quality Standards

### TypeScript
- **Strict mode enabled**
- **No any types** (use proper interfaces)
- **Consistent naming conventions** (camelCase, PascalCase)
- **Proper error handling** with try-catch and observables
- **Interface definitions** for all data structures

### Angular
- **Standalone components** preferred (Angular 17)
- **OnPush change detection** for performance
- **Reactive forms** over template-driven
- **Services for data access** (no direct HTTP in components)
- **Proper lifecycle management** (OnDestroy implementation)

### Testing
- **Unit tests** for all services and components
- **E2E tests** for critical user workflows  
- **Test coverage > 80%**
- **Mock external dependencies**
- **Test error conditions** not just happy paths

---

*Use this document as your primary reference when generating code for the iHub Angular 17 rebuild. Follow these patterns consistently to maintain code quality and architecture integrity.*