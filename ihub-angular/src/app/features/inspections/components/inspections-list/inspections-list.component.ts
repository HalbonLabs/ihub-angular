import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { InspectionService } from '../../services/inspection.service';
import {
  Inspection,
  InspectionFilter,
  InspectionStatus,
  InspectionType,
  Priority,
  getStatusColor,
  getPriorityColor
} from '../../../../core/models/inspection.model';

@Component({
  selector: 'app-inspections-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './inspections-list.component.html',
  styleUrl: './inspections-list.component.scss'
})
export class InspectionsListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  // Data
  inspections: Inspection[] = [];
  dataSource = new MatTableDataSource<Inspection>([]);

  // Table columns
  displayedColumns = [
    'property',
    'client',
    'inspector',
    'scheduledDate',
    'type',
    'priority',
    'status',
    'actions'
  ];

  // Filter form
  filterForm: FormGroup;
  showFilters = false;

  // Loading state
  loading = false;

  // View mode
  viewMode: 'table' | 'grid' = 'table';

  // Status options for filter
  statusOptions = Object.values(InspectionStatus);
  typeOptions = Object.values(InspectionType);
  priorityOptions = Object.values(Priority);

  constructor(
    private fb: FormBuilder,
    private inspectionService: InspectionService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      type: [[]],
      priority: [[]],
      dateFrom: [null],
      dateTo: [null],
      hasDefects: [null],
      isPaid: [null]
    });
  }

  ngOnInit(): void {
    this.loadInspections();
    this.setupSearch();

    // Subscribe to inspections from service
    this.inspectionService.inspections$
      .pipe(takeUntil(this.destroy$))
      .subscribe(inspections => {
        this.inspections = inspections;
        this.dataSource.data = inspections;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadInspections(): void {
    this.loading = true;
    const filter = this.buildFilter();

    this.inspectionService.getInspections(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Failed to load inspections', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private setupSearch(): void {
    this.filterForm.get('search')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        this.dataSource.filter = searchTerm?.trim().toLowerCase() || '';
      });

    // Custom filter predicate
    this.dataSource.filterPredicate = (data: Inspection, filter: string) => {
      const searchStr = [
        data.propertyAddress,
        data.clientName,
        data.inspectorName,
        data.type,
        data.status
      ].join(' ').toLowerCase();

      return searchStr.includes(filter);
    };
  }

  private buildFilter(): InspectionFilter {
    const formValue = this.filterForm.value;
    const filter: InspectionFilter = {};

    if (formValue.status?.length) filter.status = formValue.status;
    if (formValue.type?.length) filter.type = formValue.type;
    if (formValue.priority?.length) filter.priority = formValue.priority;
    if (formValue.dateFrom) filter.dateFrom = formValue.dateFrom;
    if (formValue.dateTo) filter.dateTo = formValue.dateTo;
    if (formValue.hasDefects !== null) filter.hasDefects = formValue.hasDefects;
    if (formValue.isPaid !== null) filter.isPaid = formValue.isPaid;

    return filter;
  }

  applyFilters(): void {
    this.loadInspections();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: [],
      type: [],
      priority: [],
      dateFrom: null,
      dateTo: null,
      hasDefects: null,
      isPaid: null
    });
    this.loadInspections();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'grid' : 'table';
  }

  createInspection(): void {
    this.router.navigate(['/inspections/new']);
  }

  viewInspection(inspection: Inspection): void {
    this.router.navigate(['/inspections', inspection.id]);
  }

  editInspection(inspection: Inspection): void {
    this.router.navigate(['/inspections', inspection.id, 'edit']);
  }

  deleteInspection(inspection: Inspection): void {
    if (confirm(`Are you sure you want to delete inspection for ${inspection.propertyAddress}?`)) {
      this.loading = true;
      this.inspectionService.deleteInspection(inspection.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.snackBar.open('Inspection deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
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

  exportInspections(format: 'excel' | 'pdf'): void {
    this.loading = true;
    this.inspectionService.exportInspections(format, this.buildFilter())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `inspections.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to export inspections', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Helper methods
  getStatusColor(status: InspectionStatus): string {
    return getStatusColor(status);
  }

  getPriorityColor(priority: Priority): string {
    return getPriorityColor(priority);
  }

  getStatusIcon(status: InspectionStatus): string {
    switch (status) {
      case InspectionStatus.COMPLETED: return 'check_circle';
      case InspectionStatus.IN_PROGRESS: return 'pending';
      case InspectionStatus.SCHEDULED: return 'schedule';
      case InspectionStatus.CANCELLED: return 'cancel';
      case InspectionStatus.OVERDUE: return 'error';
      case InspectionStatus.ON_HOLD: return 'pause_circle';
      case InspectionStatus.DRAFT: return 'edit';
      default: return 'help';
    }
  }

  formatStatus(status: string): string {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatType(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
