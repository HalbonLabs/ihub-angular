# Copilot Instructions for iHub Angular Project

## Project Overview
Angular 17 frontend for inspection management. Modular with standalone components, NgRx state, NestJS backend integration. Key areas: auth, dashboard, inspections, admin. Separates core services, shared components, feature modules for reusability.

## Key Features
- Auth: JWT login/register/reset, roles (Admin, Inspector, Viewer).
- Inspections: CRUD, status workflow, scheduling, defects, R2 file uploads.
- Dashboard: Widgets, real-time stats, PDF/Excel reports.
- Admin: User/org management, settings, logs.
- Real-time: Socket.IO notifications.
- Extras: Search, calendar, responsive UI.

## Architecture and Data Flows
- Core: Services (`ApiService`, `AuthService`), guards (`AuthGuard`), interceptors (`JwtInterceptor`).
- State: NgRx (e.g., `auth.state.ts`, `inspections.state.ts`); actions → effects → reducers.
- Flows: HTTP with interceptors; Socket.IO for updates; R2 uploads via backend.
- Decisions: Standalone components, lazy modules, multi-tenancy isolation.
- Example: Guarded routes in `app.routes.ts`; state in `inspections.state.ts`.

## Developer Workflows
- Setup: `npm install` (Angular 17, NgRx, Material, Tailwind).
- Dev: `ng serve` (localhost:4200); SSR: `npm run serve:ssr:ihub-angular`.
- Build: `ng build`; watch: `ng build --watch --configuration development`.
- Test: `ng test`; headless: `ng test --browsers=ChromeHeadless --watch=false`.
- Debug: NgRx DevTools, browser tools.
- Generate: `ng generate component features/[feature]/components/[name]`.
- Non-obvious: Environments in `environments/` for APIs; `angular.json` configs.

## Project-Specific Conventions
- Components: Standalone, OnPush; signals for state, observables for async. Ex: `InspectionListComponent` uses signals, MatTable.
- Services: Observables, interceptor errors. Use `ApiService` for HTTP.
- Forms: Reactive with validators (e.g., `auth.validators.ts`).
- Naming: camelCase vars, PascalCase classes; models in `features/*/models/`.
- Unique: Strict TS; Material + Tailwind (e.g., MatTable with grids).
- Example: Dynamic HttpParams in services for filters.

## Integrations and Dependencies
- External: Prisma PostgreSQL, R2 files, Socket.IO real-time.
- Comm: Endpoints in `api-endpoints.ts`; WebSockets for org rooms.
- Deps: `@ngrx/store`, `@angular/material`, `socket.io-client`.
- Example: `uploadFile` generates keys, URLs for R2.

## Migration and Testing Notes
- Use Prisma schema for PostgreSQL; migrate data with scripts preserving integrity.
- Testing: Unit with Jest, E2E with Cypress; aim for >80% coverage on critical paths.

Refs: `package.json` deps; `ihub_technical_implementation.md` schema; `ihub_feature_checklist.md` features; `ihub_angular_rebuild_scope.md` scope.

