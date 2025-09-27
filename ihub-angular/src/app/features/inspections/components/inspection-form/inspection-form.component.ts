import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';

import { InspectionService } from '../../services/inspection.service';
import {
  Inspection,
  InspectionStatus,
  InspectionType,
  PropertyType,
  Priority
} from '../../../../core/models/inspection.model';

@Component({
  selector: 'app-inspection-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatChipsModule
  ],
  templateUrl: './inspection-form.component.html',
  styleUrl: './inspection-form.component.scss'
})
export class InspectionFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  inspectionForm!: FormGroup;
  propertyForm!: FormGroup;
  clientForm!: FormGroup;

  isEditMode = false;
  loading = false;
  saving = false;
  inspectionId: string | null = null;

  // Options for select fields
  inspectionTypes = Object.values(InspectionType);
  propertyTypes = Object.values(PropertyType);
  priorities = Object.values(Priority);
  statuses = Object.values(InspectionStatus);

  // Mock inspectors for assignment
  inspectors = [
    { id: 'ins_001', name: 'Mike Johnson' },
    { id: 'ins_002', name: 'Jane Doe' },
    { id: 'ins_003', name: 'Tom Brown' },
    { id: 'ins_004', name: 'Sarah Williams' }
  ];

  // Minimum date for scheduling (today)
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inspectionService: InspectionService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.inspectionId = this.route.snapshot.paramMap.get('id');
    if (this.inspectionId) {
      this.isEditMode = true;
      this.loadInspection(this.inspectionId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Property information form
    this.propertyForm = this.fb.group({
      propertyAddress: ['', [Validators.required, Validators.minLength(10)]],
      propertyType: [PropertyType.SINGLE_FAMILY, Validators.required]
    });

    // Client information form
    this.clientForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: ['', [Validators.required, Validators.pattern('^[0-9-+()\\s]*$')]]
    });

    // Inspection details form
    this.inspectionForm = this.fb.group({
      type: [InspectionType.PRE_PURCHASE, Validators.required],
      priority: [Priority.MEDIUM, Validators.required],
      scheduledDate: ['', Validators.required],
      inspectorId: ['', Validators.required],
      estimatedDuration: [120, [Validators.required, Validators.min(30), Validators.max(480)]],
      fee: [0, [Validators.min(0)]],
      notes: [''],
      internalNotes: [''],
      status: [InspectionStatus.DRAFT]
    });
  }

  private loadInspection(id: string): void {
    this.loading = true;
    this.inspectionService.getInspectionById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (inspection) => {
          this.populateForms(inspection);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load inspection', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/inspections']);
        }
      });
  }

  private populateForms(inspection: Inspection): void {
    // Populate property form
    this.propertyForm.patchValue({
      propertyAddress: inspection.propertyAddress,
      propertyType: inspection.propertyType
    });

    // Populate client form
    this.clientForm.patchValue({
      clientName: inspection.clientName,
      clientEmail: inspection.clientEmail,
      clientPhone: inspection.clientPhone
    });

    // Populate inspection form
    this.inspectionForm.patchValue({
      type: inspection.type,
      priority: inspection.priority,
      scheduledDate: inspection.scheduledDate,
      inspectorId: inspection.inspectorId,
      estimatedDuration: inspection.estimatedDuration || 120,
      fee: inspection.fee || 0,
      notes: inspection.notes || '',
      internalNotes: inspection.internalNotes || '',
      status: inspection.status
    });
  }

  onSubmit(): void {
    // Mark all forms as touched to show validation errors
    this.propertyForm.markAllAsTouched();
    this.clientForm.markAllAsTouched();
    this.inspectionForm.markAllAsTouched();

    // Check if all forms are valid
    if (this.propertyForm.invalid || this.clientForm.invalid || this.inspectionForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Combine all form data
    const inspectionData: Partial<Inspection> = {
      ...this.propertyForm.value,
      ...this.clientForm.value,
      ...this.inspectionForm.value
    };

    // Get inspector name from selected ID
    const selectedInspector = this.inspectors.find(i => i.id === inspectionData.inspectorId);
    if (selectedInspector) {
      inspectionData.inspectorName = selectedInspector.name;
    }

    // Convert scheduledDate to Date object if it's a string
    if (inspectionData.scheduledDate) {
      inspectionData.scheduledDate = new Date(inspectionData.scheduledDate);
    }

    this.saving = true;

    if (this.isEditMode && this.inspectionId) {
      // Update existing inspection
      this.inspectionService.updateInspection(this.inspectionId, inspectionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            this.saving = false;
            this.snackBar.open('Inspection updated successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/inspections', updated.id]);
          },
          error: () => {
            this.saving = false;
            this.snackBar.open('Failed to update inspection', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Create new inspection
      this.inspectionService.createInspection(inspectionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (created) => {
            this.saving = false;
            this.snackBar.open('Inspection created successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/inspections', created.id]);
          },
          error: () => {
            this.saving = false;
            this.snackBar.open('Failed to create inspection', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  onCancel(): void {
    if (this.hasChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.navigateBack();
      }
    } else {
      this.navigateBack();
    }
  }

  private navigateBack(): void {
    if (this.isEditMode && this.inspectionId) {
      this.router.navigate(['/inspections', this.inspectionId]);
    } else {
      this.router.navigate(['/inspections']);
    }
  }

  private hasChanges(): boolean {
    return this.propertyForm.dirty || this.clientForm.dirty || this.inspectionForm.dirty;
  }

  // Helper methods for form validation
  getErrorMessage(form: FormGroup, fieldName: string, label: string): string {
    const control = form.get(fieldName);
    if (control?.hasError('required')) {
      return `${label} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${label} must be at least ${minLength} characters`;
    }
    if (control?.hasError('min')) {
      const min = control.errors?.['min'].min;
      return `${label} must be at least ${min}`;
    }
    if (control?.hasError('max')) {
      const max = control.errors?.['max'].max;
      return `${label} must not exceed ${max}`;
    }
    if (control?.hasError('pattern')) {
      return `${label} format is invalid`;
    }
    return '';
  }

  formatType(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatPropertyType(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatStatus(status: string): string {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getInspectorName(): string {
    const inspectorId = this.inspectionForm.get('inspectorId')?.value;
    const inspector = this.inspectors.find(i => i.id === inspectorId);
    return inspector?.name || '';
  }
}
