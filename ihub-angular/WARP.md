# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

### Development
```bash
# Start development server (http://localhost:4200)
npm start
# or
ng serve

# Start development server with specific configuration
ng serve --configuration development

# Start SSR development server
npm run serve:ssr:ihub-angular
```

### Build
```bash
# Production build (outputs to dist/ihub-angular)
npm run build
# or
ng build

# Development build with watch mode
npm run watch

# Production build with specific configuration
ng build --configuration production
```

### Testing
```bash
# Run unit tests with Karma
npm test
# or
ng test

# Run tests in headless mode
ng test --browsers=ChromeHeadless --watch=false

# Run specific test file
ng test --include='**/auth.service.spec.ts'
```

### Code Generation
```bash
# Generate new component
ng generate component features/[feature-name]/components/[component-name]

# Generate new service
ng generate service core/services/[service-name]

# Generate new guard
ng generate guard core/guards/[guard-name]

# Generate new module with routing
ng generate module features/[module-name] --routing
```

## Architecture Overview

### Project Structure
This is an Angular 17 application with SSR support, organized using a feature-based module structure:

```
src/
├── app/
│   ├── core/           # Singleton services, guards, interceptors
│   │   ├── constants/  # API endpoints definitions
│   │   ├── guards/     # Auth and role-based access guards
│   │   ├── interceptors/ # JWT and error interceptors
│   │   ├── models/     # Core data models
│   │   └── services/   # Auth, API services
│   ├── features/       # Feature modules (lazy-loaded)
│   │   ├── admin/      # Admin panel module
│   │   ├── auth/       # Authentication module
│   │   ├── dashboard/  # Dashboard module
│   │   └── inspections/ # Inspections management module
│   ├── shared/         # Shared components, directives, pipes
│   └── app.config.ts   # Application configuration with providers
├── environments/       # Environment-specific configurations
└── styles.scss        # Global styles with Tailwind imports
```

### Key Modules

**Core Module**: Contains application-wide singleton services and interceptors
- `AuthService`: JWT authentication with refresh token rotation
- `ApiService`: HTTP client wrapper with base URL configuration
- `jwtInterceptor`: Automatically attaches JWT tokens to requests
- `errorInterceptor`: Global error handling

**Feature Modules**: Lazy-loaded modules for major application areas
- All feature modules follow the pattern: `features/[feature-name]/[feature-name].module.ts`
- Each has its own routing module for route configuration
- Components within features are typically standalone or declared in the feature module

### Authentication Flow

The application uses JWT authentication with refresh token rotation:

1. **Login**: User credentials → `/auth/login` → Receive access & refresh tokens
2. **Token Storage**: 
   - Access token: `localStorage[environment.jwtTokenKey]`
   - Refresh token: `localStorage[environment.refreshTokenKey]`
3. **Request Authorization**: `jwtInterceptor` automatically adds `Bearer` token
4. **Token Refresh**: Automatic refresh 2 minutes before expiration
5. **Session Monitoring**: Checks token validity every minute, warns at 5 minutes before expiry

### State Management

Uses NgRx for state management (configured but stores not yet implemented):
- Store configuration in `app.config.ts`
- Redux DevTools enabled in development
- Entity adapter ready for normalized state

### API Integration

**Base Configuration**:
- Development: `http://localhost:3000/api`
- Production: `https://api.ihub-inspection.com/api`

**Endpoints Structure**: All API endpoints defined in `core/constants/api-endpoints.ts`
- Organized by feature (AUTH, USERS, INSPECTIONS, etc.)
- Helper functions for dynamic URLs: `API_ENDPOINTS.USERS.GET(id)`
- WebSocket events defined for real-time features

### UI Components Strategy

**Styling**: Tailwind CSS + Angular Material
- Custom color palette defined in `tailwind.config.js`
- Material Design components from `@angular/material`
- Custom animations: `fade-in`, `slide-in`

**Theme Colors**:
- Primary: Blue scale (#2196f3)
- Accent: Amber scale (#ffc107)
- Success/Warning/Error: Material Design colors

### File Storage Configuration

Prepared for Cloudflare R2 integration:
- Configuration in environment files under `r2` object
- Max file size: 10MB
- Supported formats: Images (JPEG, PNG, WebP), Documents (PDF, Word, Excel)

### Environment Configuration

Key environment variables:
- `apiUrl`: Backend API base URL
- `wsUrl`: WebSocket server URL
- `sessionTimeout`: 30 minutes
- `sessionWarning`: 5-minute warning before timeout
- Feature flags in `environment.features` object

### Running Tests

The project uses Karma for unit testing:
- Test files follow pattern: `*.spec.ts`
- Configuration in `tsconfig.spec.json`
- Tests run in Chrome by default

### Server-Side Rendering

SSR is configured and ready:
- Server configuration in `app.config.server.ts`
- Build with: `ng build`
- Run SSR server: `npm run serve:ssr:ihub-angular`
- Prerendering enabled for static routes