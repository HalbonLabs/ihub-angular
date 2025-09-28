import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    RouterLink
  ],
  template: `
    <div class="inspection-detail-container">
      <div class="header">
        <h1>Inspection Details</h1>
        <button type="button" class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back to List
        </button>
      </div>

      <div class="content" *ngIf="inspection; else loadingTemplate">
        <div class="basic-info">
          <h2>{{inspection.title}}</h2>
          <p>Status: {{inspection.status}}</p>
          <p>Date: {{inspection.scheduledDate | date}}</p>
          <p>Location: {{inspection.location}}</p>
          <p *ngIf="inspection.description">Description: {{inspection.description}}</p>
        </div>

        <div class="actions">
          <button type="button" class="btn primary" (click)="editInspection()">Edit</button>
          <button type="button" class="btn secondary" (click)="generateReport()">Generate Report</button>
          <button type="button" class="btn danger" (click)="deleteInspection()">Delete</button>
        </div>
      </div>

      <ng-template #loadingTemplate>
        <div class="loading">
          <p>Loading inspection details...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .inspection-detail-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .back-btn {
      padding: 8px 16px;
      background: #f0f0f0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .basic-info {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn.primary { background: #007bff; color: white; }
    .btn.secondary { background: #6c757d; color: white; }
    .btn.danger { background: #dc3545; color: white; }

    .loading {
      text-align: center;
      padding: 50px;
    }
  `]
})
export class InspectionDetailComponent implements OnInit, OnDestroy {
  inspection: Inspection | null = null;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inspectionService: InspectionService
  ) {}

  ngOnInit(): void {
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
    this.isLoading = true;
    this.inspectionService.getInspection(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (inspection) => {
          this.inspection = inspection;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load inspection:', error);
          this.isLoading = false;
          // Simple alert instead of Material snackbar
          alert('Failed to load inspection');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/inspections']);
  }

  editInspection(): void {
    if (this.inspection) {
      this.router.navigate(['/inspections', 'edit', this.inspection.id]);
    }
  }

  generateReport(): void {
    alert('Generate report functionality coming soon');
  }

  deleteInspection(): void {
    if (confirm('Are you sure you want to delete this inspection?')) {
      alert('Delete functionality coming soon');
    }
  }

  // Utility methods for template compatibility
  getStatusColor(status: InspectionStatus): string {
    return getStatusColor(status);
  }

  getPriorityColor(priority: string): string {
    return getPriorityColor(priority);
  }

  getSeverityColor(severity: string): string {
    return getSeverityColor(severity);
  }

  getStatusIcon(status: InspectionStatus): string {
    return getStatusIcon(status);
  }
}
