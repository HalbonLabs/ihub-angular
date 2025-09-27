import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.scss'
})
export class ErrorMessageComponent {
  @Input() error: any;
  @Input() title: string = 'An error occurred';
  @Input() showDetails: boolean = false;
  @Input() showRetry: boolean = true;
  @Input() retryText: string = 'Try Again';
  @Output() retry = new EventEmitter<void>();

  get errorMessage(): string {
    if (!this.error) {
      return 'Unknown error';
    }

    if (typeof this.error === 'string') {
      return this.error;
    }

    if (this.error instanceof HttpErrorResponse) {
      if (this.error.error?.message) {
        return this.error.error.message;
      }
      if (this.error.message) {
        return this.error.message;
      }
      return `HTTP ${this.error.status}: ${this.error.statusText}`;
    }

    if (this.error.message) {
      return this.error.message;
    }

    return 'An unexpected error occurred';
  }

  get errorDetails(): string | null {
    if (!this.showDetails || !this.error) {
      return null;
    }

    if (this.error instanceof HttpErrorResponse && this.error.error?.details) {
      return this.error.error.details;
    }

    if (this.error.stack) {
      return this.error.stack;
    }

    return null;
  }

  get statusCode(): number | null {
    if (this.error instanceof HttpErrorResponse) {
      return this.error.status;
    }
    return null;
  }

  onRetry(): void {
    this.retry.emit();
  }
}
}
