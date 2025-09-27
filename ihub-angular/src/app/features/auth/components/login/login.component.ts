import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { emailValidator, getErrorMessage } from '../../validators/auth.validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;
  returnUrl: string = '/dashboard';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initialize form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, emailValidator()]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Check if user is already logged in
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate([this.returnUrl]);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Getters for form controls
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  // Get error message for form field
  getError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    return getErrorMessage(control, fieldName.charAt(0).toUpperCase() + fieldName.slice(1));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    // Disable the form group to avoid value/validity churn during submit
    this.loginForm.disable({ emitEvent: false });
    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password, rememberMe })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open(
            `Welcome back, ${response.user.fullName || response.user.email}!`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            }
          );

          // Navigate to return URL or dashboard
          this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        },
        error: (error) => {
          this.loading = false;
          this.loginForm.enable({ emitEvent: false });

          let errorMessage = 'Login failed. Please check your credentials.';
          if (error.message) {
            errorMessage = error.message;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
        },
        complete: () => {
          this.loading = false;
          // Re-enable the form after completion (success path already navigates away)
          if (this.loginForm.disabled) {
            this.loginForm.enable({ emitEvent: false });
          }
        }
      });
  }

  // Demo login for testing
  fillDemoCredentials(role: 'admin' | 'inspector' | 'viewer'): void {
    const credentials = {
      admin: { email: 'admin@ihub.com', password: 'Admin@123' },
      inspector: { email: 'inspector@ihub.com', password: 'Inspector@123' },
      viewer: { email: 'viewer@ihub.com', password: 'Viewer@123' }
    };

    this.loginForm.patchValue(credentials[role]);
  }
}
