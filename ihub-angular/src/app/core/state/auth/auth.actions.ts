import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../../models/user.model';
import { LoginCredentials } from '../../models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // Login actions
    'Login': props<{ credentials: LoginCredentials }>(),
    'Login Success': props<{ user: User; accessToken: string; refreshToken: string }>(),
    'Login Failure': props<{ error: string }>(),
    
    // Logout actions
    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Logout Failure': props<{ error: string }>(),
    
    // Register actions
    'Register': props<{ userData: any }>(),
    'Register Success': props<{ user: User; accessToken: string; refreshToken: string }>(),
    'Register Failure': props<{ error: string }>(),
    
    // Token refresh actions
    'Refresh Token': emptyProps(),
    'Refresh Token Success': props<{ accessToken: string; refreshToken: string }>(),
    'Refresh Token Failure': props<{ error: string }>(),
    
    // User profile actions
    'Load Current User': emptyProps(),
    'Load Current User Success': props<{ user: User }>(),
    'Load Current User Failure': props<{ error: string }>(),
    
    // Utility actions
    'Set Redirect Url': props<{ url: string }>(),
    'Clear Error': emptyProps(),
    'Initialize Auth State': emptyProps(),
  }
});

export const AuthApiActions = createActionGroup({
  source: 'Auth API',
  events: {
    'Unauthorized': emptyProps(),
    'Session Expired': emptyProps(),
  }
});