import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * Custom validators for authentication forms
 */

/**
 * Email validator with proper format checking
 */
export function emailValidator(): ValidatorFn {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate empty values (use required validator for that)
    }
    
    const valid = emailRegex.test(control.value);
    return valid ? null : { email: { value: control.value } };
  };
}

/**
 * Password strength validator
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    
    const password = control.value;
    const errors: ValidationErrors = {};
    
    if (password.length < 8) {
      errors['minLength'] = { requiredLength: 8, actualLength: password.length };
    }
    
    if (!/[A-Z]/.test(password)) {
      errors['requireUppercase'] = true;
    }
    
    if (!/[a-z]/.test(password)) {
      errors['requireLowercase'] = true;
    }
    
    if (!/[0-9]/.test(password)) {
      errors['requireNumber'] = true;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors['requireSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}

/**
 * Password match validator for confirm password fields
 */
export function passwordMatchValidator(passwordField: string = 'password'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    
    const password = parent.get(passwordField);
    const confirmPassword = control;
    
    if (!password || !confirmPassword.value) {
      return null;
    }
    
    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  };
}

/**
 * Phone number validator
 */
export function phoneNumberValidator(): ValidatorFn {
  // Accepts formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    
    const valid = phoneRegex.test(control.value);
    return valid ? null : { phoneNumber: { value: control.value } };
  };
}

/**
 * No whitespace validator
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  };
}

/**
 * Get error message for form control
 */
export function getErrorMessage(control: AbstractControl | null, fieldName: string = 'Field'): string {
  if (!control || !control.errors) {
    return '';
  }
  
  const errors = control.errors;
  
  if (errors['required']) {
    return `${fieldName} is required`;
  }
  
  if (errors['email']) {
    return 'Please enter a valid email address';
  }
  
  if (errors['minlength']) {
    return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
  }
  
  if (errors['maxlength']) {
    return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
  }
  
  if (errors['passwordStrength']) {
    const strengthErrors = errors['passwordStrength'];
    if (strengthErrors['minLength']) {
      return 'Password must be at least 8 characters';
    }
    if (strengthErrors['requireUppercase']) {
      return 'Password must contain at least one uppercase letter';
    }
    if (strengthErrors['requireLowercase']) {
      return 'Password must contain at least one lowercase letter';
    }
    if (strengthErrors['requireNumber']) {
      return 'Password must contain at least one number';
    }
    if (strengthErrors['requireSpecialChar']) {
      return 'Password must contain at least one special character';
    }
  }
  
  if (errors['passwordMismatch']) {
    return 'Passwords do not match';
  }
  
  if (errors['phoneNumber']) {
    return 'Please enter a valid phone number';
  }
  
  if (errors['whitespace']) {
    return `${fieldName} cannot be only whitespace`;
  }
  
  return 'Invalid input';
}