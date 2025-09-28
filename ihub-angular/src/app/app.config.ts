import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { provideStore } from '@ngrx/store';
// import { provideEffects } from '@ngrx/effects';
// import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
// import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router configuration with preloading strategy
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    ),
    
    // HTTP client with interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        jwtInterceptor,
        errorInterceptor
      ])
    ),
    
    // NgRx Store configuration (temporarily disabled)
    // provideStore(),
    // provideEffects(),
    // provideStoreDevtools({
    //   maxAge: 25,
    //   logOnly: environment.production,
    //   autoPause: true,
    //   trace: false,
    //   traceLimit: 75
    // }),
    
    // Platform providers
    provideClientHydration(),
    provideAnimationsAsync()
  ]
};
