import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { InspectionService } from '../../services/inspection.service';
import {
  Inspection,
  InspectionStatus,
  getStatusColor,
  getPriorityColor,
  getSeverityColor,
  getStatusIcon
} from '../../../../core/models/inspection.model';

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './inspection-detail.component.html',
  styleUrl: './inspection-detail.component.scss'
})
export class InspectionDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  inspection: Inspection | null = null;
  loading = true;
  activeTab = 0;

  // Status update options
  statusOptions = Object.values(InspectionStatus);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inspectionService: InspectionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get inspection ID from route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInspection(id);
    } else {
      this.router.navigate(['/inspections']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInspection(id: string): void {
    this.loading = true;
    this.inspectionService.getInspectionById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (inspection) => {
          this.inspection = inspection;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Failed to load inspection', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/inspections']);
        }
      });
  }

  editInspection(): void {
    if (this.inspection) {
      this.router.navigate(['/inspections', this.inspection.id, 'edit']);
    }
  }

  updateStatus(status: InspectionStatus): void {
    if (!this.inspection) return;

    this.loading = true;
    this.inspectionService.updateStatus(this.inspection.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.inspection = updated;
          this.loading = false;
          this.snackBar.open('Status updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to update status', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  generateReport(): void {
    if (!this.inspection) return;

    this.snackBar.open('Generating report...', 'Close', {
      duration: 3000
    });

    // Simulate report generation
    setTimeout(() => {
      this.snackBar.open('Report generated successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }, 2000);
  }

  downloadReport(): void {
    if (!this.inspection || !this.inspection.reportUrl) return;

    // In real app, would download from reportUrl
    window.open(this.inspection.reportUrl, '_blank');
  }

  deleteInspection(): void {
    if (!this.inspection) return;

    if (confirm(`Are you sure you want to delete this inspection?`)) {
      this.loading = true;
      this.inspectionService.deleteInspection(this.inspection.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Inspection deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/inspections']);
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Failed to delete inspection', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  addDefect(): void {
    // In a real app, would open a dialog to add defect
    this.snackBar.open('Add defect functionality coming soon', 'Close', {
      duration: 3000
    });
  }

  uploadImages(): void {
    // In a real app, would open file upload dialog
    this.snackBar.open('Image upload functionality coming soon', 'Close', {
      duration: 3000
    });
  }

  scheduleFollowUp(): void {
    // In a real app, would open scheduling dialog
    this.snackBar.open('Follow-up scheduling coming soon', 'Close', {
      duration: 3000
    });
  }

  sendReport(): void {
    if (!this.inspection) return;

    // In a real app, would send email with report
    this.snackBar.open(`Report sent to ${this.inspection.clientEmail}`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  printInspection(): void {
    window.print();
  }

  // Helper methods
  getStatusColor(status: InspectionStatus): string {
    return getStatusColor(status);
  }

  getPriorityColor(priority: string): string {
    return getPriorityColor(priority as any);
  }

  formatStatus(status: InspectionStatus): string {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatType(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusActions(): { label: string; status: InspectionStatus; color: string }[] {
    if (!this.inspection) return [];

    const actions = [];
    const currentStatus = this.inspection.status;

    switch (currentStatus) {
      case InspectionStatus.DRAFT:
        actions.push(
          { label: 'Schedule', status: InspectionStatus.SCHEDULED, color: 'primary' },
          { label: 'Cancel', status: InspectionStatus.CANCELLED, color: 'warn' }
        );
        break;
      case InspectionStatus.SCHEDULED:
        actions.push(
          { label: 'Start Inspection', status: InspectionStatus.IN_PROGRESS, color: 'accent' },
          { label: 'Cancel', status: InspectionStatus.CANCELLED, color: 'warn' }
        );
        break;
      case InspectionStatus.IN_PROGRESS:
        actions.push(
          { label: 'Complete', status: InspectionStatus.COMPLETED, color: 'primary' },
          { label: 'Pause', status: InspectionStatus.ON_HOLD, color: 'warn' }
        );
        break;
      case InspectionStatus.ON_HOLD:
        actions.push(
          { label: 'Resume', status: InspectionStatus.IN_PROGRESS, color: 'accent' },
          { label: 'Cancel', status: InspectionStatus.CANCELLED, color: 'warn' }
        );
        break;
      case InspectionStatus.COMPLETED:
        // No actions for completed inspections
        break;
      case InspectionStatus.CANCELLED:
        actions.push(
          { label: 'Re-schedule', status: InspectionStatus.SCHEDULED, color: 'primary' }
        );
        break;
    }

    return actions;
  }

  trackByMeasureId(index: number, measure: any): string {
    return measure.id;
  }

  trackByDefectId(index: number, defect: any): string {
    return defect.id;
  }

  trackByFileId(index: number, file: any): string {
    return file.id;
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table_chart';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusIcon(status: InspectionStatus): string {
    return getStatusIcon(status);
  }

  goBack(): void {
    this.router.navigate(['/inspections']);
  }

  canUpdateStatus(): boolean {
    return this.inspection?.status !== InspectionStatus.COMPLETED &&
           this.inspection?.status !== InspectionStatus.CANCELLED;
  }

  canDelete(): boolean {
    return this.inspection?.status === InspectionStatus.DRAFT ||
           this.inspection?.status === InspectionStatus.SCHEDULED;
  }
}
