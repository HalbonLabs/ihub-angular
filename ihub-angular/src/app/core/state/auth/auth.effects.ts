import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap, switchMap, withLatestFrom } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { AuthActions } from './auth.actions';
import { selectLoginRedirectUrl } from './auth.selectors';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router,
    private store: Store
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map(response => {
            // Store tokens
            this.storageService.setAccessToken(response.access_token);
            this.storageService.setRefreshToken(response.refresh_token);
            
            return AuthActions.loginSuccess({
              user: response.user,
              accessToken: response.access_token,
              refreshToken: response.refresh_token
            });
          }),
          catchError(error => 
            of(AuthActions.loginFailure({ 
              error: error.error?.message || 'Login failed. Please try again.' 
            }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      withLatestFrom(this.store.select(selectLoginRedirectUrl)),
      tap(([action, redirectUrl]) => {
        const url = redirectUrl || '/dashboard';
        this.router.navigate([url]);
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => {
            // Clear stored tokens
            this.storageService.clearTokens();
            return AuthActions.logoutSuccess();
          }),
          catchError(error => {
            // Clear tokens even if logout API fails
            this.storageService.clearTokens();
            return of(AuthActions.logoutSuccess());
          })
        )
      )
    )
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => {
        this.router.navigate(['/auth/login']);
      })
    ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ userData }) =>
        this.authService.register(userData).pipe(
          map(response => {
            // Store tokens
            this.storageService.setAccessToken(response.access_token);
            this.storageService.setRefreshToken(response.refresh_token);
            
            return AuthActions.registerSuccess({
              user: response.user,
              accessToken: response.access_token,
              refreshToken: response.refresh_token
            });
          }),
          catchError(error => 
            of(AuthActions.registerFailure({ 
              error: error.error?.message || 'Registration failed. Please try again.' 
            }))
          )
        )
      )
    )
  );

  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(() => {
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() => {
        const refreshToken = this.storageService.getRefreshToken();
        if (!refreshToken) {
          return of(AuthActions.refreshTokenFailure({ error: 'No refresh token available' }));
        }
        
        return this.authService.refreshToken(refreshToken).pipe(
          map(response => {
            // Update stored tokens
            this.storageService.setAccessToken(response.access_token);
            this.storageService.setRefreshToken(response.refresh_token);
            
            return AuthActions.refreshTokenSuccess({
              accessToken: response.access_token,
              refreshToken: response.refresh_token
            });
          }),
          catchError(error => {
            // Clear tokens on refresh failure
            this.storageService.clearTokens();
            return of(AuthActions.refreshTokenFailure({ 
              error: 'Session expired. Please login again.' 
            }));
          })
        );
      })
    )
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      switchMap(() =>
        this.authService.getCurrentUser().pipe(
          map(user => AuthActions.loadCurrentUserSuccess({ user })),
          catchError(error => 
            of(AuthActions.loadCurrentUserFailure({ 
              error: error.error?.message || 'Failed to load user profile.' 
            }))
          )
        )
      )
    )
  );

  initializeAuthState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initializeAuthState),
      switchMap(() => {
        const accessToken = this.storageService.getAccessToken();
        
        if (!accessToken) {
          return of({ type: 'NO_OP' });
        }
        
        return of(AuthActions.loadCurrentUser());
      })
    )
  );
}