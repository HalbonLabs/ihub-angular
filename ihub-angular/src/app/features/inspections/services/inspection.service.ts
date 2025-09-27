import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import {
  Inspection,
  InspectionFilter,
  InspectionStats,
  InspectionStatus,
  InspectionType,
  PropertyType,
  Priority,
  Defect,
  FindingCategory,
  Severity,
  DefectCategory,
  DefectStatus
} from '../../../core/models/inspection.model';

@Injectable({
  providedIn: 'root'
})
export class InspectionService {
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  public inspections$ = this.inspectionsSubject.asObservable();

  private selectedInspectionSubject = new BehaviorSubject<Inspection | null>(null);
  public selectedInspection$ = this.selectedInspectionSubject.asObservable();

  private filterSubject = new BehaviorSubject<InspectionFilter>({});
  public filter$ = this.filterSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Initialize with mock data for development
    this.loadMockData();
  }

  /**
   * Get all inspections with optional filter
   */
  getInspections(filter?: InspectionFilter): Observable<Inspection[]> {
    if (filter) {
      this.filterSubject.next(filter);
    }

    // Mock implementation - replace with actual API call
    return of(this.getMockInspections()).pipe(
      delay(500),
      map(inspections => this.applyFilter(inspections, filter || {})),
      tap(inspections => this.inspectionsSubject.next(inspections))
    );

    // Actual API call would be:
    // return this.apiService.get<{ data: Inspection[] }>(
    //   API_ENDPOINTS.INSPECTIONS.LIST,
    //   { params: this.buildFilterParams(filter) }
    // ).pipe(
    //   map(response => response.data),
    //   tap(inspections => this.inspectionsSubject.next(inspections))
    // );
  }

  /**
   * Get inspection by ID
   */
  getInspectionById(id: string): Observable<Inspection> {
    // Mock implementation
    const inspection = this.getMockInspections().find(i => i.id === id);
    if (inspection) {
      this.selectedInspectionSubject.next(inspection);
      return of(inspection).pipe(delay(300));
    }
    throw new Error('Inspection not found');

    // Actual API call:
    // return this.apiService.get<{ data: Inspection }>(
    //   API_ENDPOINTS.INSPECTIONS.GET(id)
    // ).pipe(
    //   map(response => response.data),
    //   tap(inspection => this.selectedInspectionSubject.next(inspection))
    // );
  }

  /**
   * Create new inspection
   */
  createInspection(inspection: Partial<Inspection>): Observable<Inspection> {
    // Mock implementation
    const newInspection: Inspection = {
      ...inspection,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      findings: [],
      defects: [],
      images: []
    } as Inspection;

    const currentInspections = this.inspectionsSubject.value;
    this.inspectionsSubject.next([newInspection, ...currentInspections]);

    return of(newInspection).pipe(delay(500));

    // Actual API call:
    // return this.apiService.post<{ data: Inspection }>(
    //   API_ENDPOINTS.INSPECTIONS.CREATE,
    //   inspection
    // ).pipe(
    //   map(response => response.data),
    //   tap(newInspection => {
    //     const current = this.inspectionsSubject.value;
    //     this.inspectionsSubject.next([newInspection, ...current]);
    //   })
    // );
  }

  /**
   * Update existing inspection
   */
  updateInspection(id: string, updates: Partial<Inspection>): Observable<Inspection> {
    // Mock implementation
    const currentInspections = this.inspectionsSubject.value;
    const index = currentInspections.findIndex(i => i.id === id);

    if (index !== -1) {
      const updated = {
        ...currentInspections[index],
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'current-user'
      };

      currentInspections[index] = updated;
      this.inspectionsSubject.next([...currentInspections]);

      if (this.selectedInspectionSubject.value?.id === id) {
        this.selectedInspectionSubject.next(updated);
      }

      return of(updated).pipe(delay(500));
    }

    throw new Error('Inspection not found');

    // Actual API call:
    // return this.apiService.put<{ data: Inspection }>(
    //   API_ENDPOINTS.INSPECTIONS.UPDATE(id),
    //   updates
    // ).pipe(
    //   map(response => response.data),
    //   tap(updated => this.updateLocalInspection(updated))
    // );
  }

  /**
   * Delete inspection
   */
  deleteInspection(id: string): Observable<void> {
    // Mock implementation
    const currentInspections = this.inspectionsSubject.value;
    const filtered = currentInspections.filter(i => i.id !== id);
    this.inspectionsSubject.next(filtered);

    if (this.selectedInspectionSubject.value?.id === id) {
      this.selectedInspectionSubject.next(null);
    }

    return of(void 0).pipe(delay(500));

    // Actual API call:
    // return this.apiService.delete<void>(
    //   API_ENDPOINTS.INSPECTIONS.DELETE(id)
    // ).pipe(
    //   tap(() => {
    //     const current = this.inspectionsSubject.value;
    //     this.inspectionsSubject.next(current.filter(i => i.id !== id));
    //   })
    // );
  }

  /**
   * Update inspection status
   */
  updateStatus(id: string, status: InspectionStatus): Observable<Inspection> {
    return this.updateInspection(id, { status });

    // Actual API call:
    // return this.apiService.patch<{ data: Inspection }>(
    //   API_ENDPOINTS.INSPECTIONS.STATUS(id),
    //   { status }
    // ).pipe(
    //   map(response => response.data),
    //   tap(updated => this.updateLocalInspection(updated))
    // );
  }

  /**
   * Add defect to inspection
   */
  addDefect(inspectionId: string, defect: Partial<Defect>): Observable<Defect> {
    // Mock implementation
    const newDefect: Defect = {
      ...defect,
      id: this.generateId(),
      inspectionId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Defect;

    const inspection = this.inspectionsSubject.value.find(i => i.id === inspectionId);
    if (inspection) {
      inspection.defects.push(newDefect);
      this.updateLocalInspection(inspection);
    }

    return of(newDefect).pipe(delay(300));
  }

  /**
   * Get inspection statistics
   */
  getStatistics(): Observable<InspectionStats> {
    // Mock implementation
    const inspections = this.getMockInspections();
    const stats: InspectionStats = {
      totalInspections: inspections.length,
      completedInspections: inspections.filter(i => i.status === InspectionStatus.COMPLETED).length,
      pendingInspections: inspections.filter(i => i.status === InspectionStatus.SCHEDULED).length,
      overdueInspections: inspections.filter(i => i.status === InspectionStatus.OVERDUE).length,
      averageCompletionTime: 120,
      defectRate: 0.15,
      revenue: 125000,
      monthlyTrend: []
    };

    return of(stats).pipe(delay(500));
  }

  /**
   * Export inspections to Excel/PDF
   */
  exportInspections(format: 'excel' | 'pdf', filter?: InspectionFilter): Observable<Blob> {
    // Mock implementation
    const blob = new Blob(['Mock export data'], {
      type: format === 'excel' ? 'application/vnd.ms-excel' : 'application/pdf'
    });
    return of(blob).pipe(delay(1000));
  }

  // Helper methods
  private applyFilter(inspections: Inspection[], filter: InspectionFilter): Inspection[] {
    let filtered = [...inspections];

    if (filter.status?.length) {
      filtered = filtered.filter(i => filter.status!.includes(i.status));
    }

    if (filter.type?.length) {
      filtered = filtered.filter(i => filter.type!.includes(i.type));
    }

    if (filter.priority?.length) {
      filtered = filtered.filter(i => filter.priority!.includes(i.priority));
    }

    if (filter.inspectorId) {
      filtered = filtered.filter(i => i.inspectorId === filter.inspectorId);
    }

    if (filter.clientName) {
      filtered = filtered.filter(i =>
        i.clientName.toLowerCase().includes(filter.clientName!.toLowerCase())
      );
    }

    if (filter.propertyAddress) {
      filtered = filtered.filter(i =>
        i.propertyAddress.toLowerCase().includes(filter.propertyAddress!.toLowerCase())
      );
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(i => i.scheduledDate >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter(i => i.scheduledDate <= filter.dateTo!);
    }

    if (filter.hasDefects !== undefined) {
      filtered = filtered.filter(i =>
        filter.hasDefects ? i.defects.length > 0 : i.defects.length === 0
      );
    }

    if (filter.isPaid !== undefined) {
      filtered = filtered.filter(i => i.isPaid === filter.isPaid);
    }

    return filtered;
  }

  private updateLocalInspection(inspection: Inspection): void {
    const current = this.inspectionsSubject.value;
    const index = current.findIndex(i => i.id === inspection.id);

    if (index !== -1) {
      current[index] = inspection;
      this.inspectionsSubject.next([...current]);
    }

    if (this.selectedInspectionSubject.value?.id === inspection.id) {
      this.selectedInspectionSubject.next(inspection);
    }
  }

  private generateId(): string {
    return 'insp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private loadMockData(): void {
    this.inspectionsSubject.next(this.getMockInspections());
  }

  private getMockInspections(): Inspection[] {
    return [
      {
        id: '1',
        referenceNumber: 'REF-2025-001',
        propertyAddress: '123 Main Street, Springfield, IL 62701',
        propertyType: PropertyType.SINGLE_FAMILY,
        clientName: 'John Smith',
        clientEmail: 'john.smith@email.com',
        clientPhone: '555-0100',
        inspectorId: 'ins_001',
        inspectorName: 'Mike Johnson',
        organizationId: 'org_001',
        scheduledDate: new Date(Date.now() + 86400000),
        status: InspectionStatus.SCHEDULED,
        type: InspectionType.PRE_PURCHASE,
        priority: Priority.HIGH,
        notes: 'Client requested focus on foundation and roof',
        findings: [],
        measures: [],
        defects: [],
        files: [],
        images: [],
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 86400000),
        createdBy: 'admin',
        updatedBy: 'admin',
        tags: ['urgent', 'first-time-buyer'],
        estimatedDuration: 180,
        fee: 450,
        isPaid: false
      },
      {
        id: '2',
        referenceNumber: 'REF-2025-002',
        propertyAddress: '456 Oak Avenue, Riverside, CA 92501',
        propertyType: PropertyType.CONDO,
        clientName: 'Sarah Williams',
        clientEmail: 'sarah.w@email.com',
        clientPhone: '555-0101',
        inspectorId: 'ins_002',
        inspectorName: 'Jane Doe',
        organizationId: 'org_001',
        scheduledDate: new Date(Date.now() - 86400000),
        completedDate: new Date(Date.now() - 43200000),
        status: InspectionStatus.COMPLETED,
        type: InspectionType.ANNUAL,
        priority: Priority.MEDIUM,
        notes: 'Annual inspection for insurance',
        findings: [
          {
            id: 'f1',
            category: FindingCategory.ELECTRICAL,
            severity: Severity.MINOR,
            title: 'Outdated electrical panel',
            description: 'Electrical panel is functional but outdated',
            location: 'Basement',
            recommendations: 'Consider upgrading in next 2-3 years',
            estimatedCost: 2500,
            createdAt: new Date()
          }
        ],
        measures: [],
        defects: [
          {
            id: 'd1',
            inspectionId: '2',
            category: DefectCategory.PLUMBING,
            severity: Severity.MODERATE,
            status: DefectStatus.OPEN,
            title: 'Leaking faucet',
            description: 'Kitchen faucet has minor leak',
            location: 'Kitchen',
            recommendations: 'Replace faucet cartridge',
            estimatedRepairCost: 150,
            priority: Priority.MEDIUM,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        files: [],
        images: [],
        reportUrl: '/reports/inspection-2.pdf',
        reportGeneratedAt: new Date(Date.now() - 43200000),
        createdAt: new Date(Date.now() - 604800000),
        updatedAt: new Date(Date.now() - 43200000),
        createdBy: 'admin',
        updatedBy: 'ins_002',
        tags: ['annual', 'insurance'],
        estimatedDuration: 120,
        actualDuration: 135,
        fee: 350,
        isPaid: true
      },
      {
        id: '3',
        referenceNumber: 'REF-2025-003',
        propertyAddress: '789 Pine Road, Austin, TX 78701',
        propertyType: PropertyType.COMMERCIAL,
        clientName: 'ABC Corporation',
        clientEmail: 'facilities@abc.com',
        clientPhone: '555-0102',
        inspectorId: 'ins_001',
        inspectorName: 'Mike Johnson',
        organizationId: 'org_001',
        scheduledDate: new Date(),
        status: InspectionStatus.IN_PROGRESS,
        type: InspectionType.COMMERCIAL,
        priority: Priority.HIGH,
        notes: 'Quarterly commercial property inspection',
        findings: [],
        measures: [],
        defects: [],
        files: [],
        images: [],
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
        tags: ['commercial', 'quarterly'],
        estimatedDuration: 240,
        fee: 850,
        isPaid: false
      },
      {
        id: '4',
        referenceNumber: 'REF-2025-004',
        propertyAddress: '321 Elm Street, Denver, CO 80202',
        propertyType: PropertyType.MULTI_FAMILY,
        clientName: 'Property Management Inc',
        clientEmail: 'pm@property.com',
        clientPhone: '555-0103',
        inspectorId: 'ins_003',
        inspectorName: 'Tom Brown',
        organizationId: 'org_001',
        scheduledDate: new Date(Date.now() + 172800000),
        status: InspectionStatus.SCHEDULED,
        type: InspectionType.PRE_LISTING,
        priority: Priority.MEDIUM,
        notes: 'Pre-listing inspection for duplex',
        findings: [],
        measures: [],
        defects: [],
        files: [],
        images: [],
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        createdBy: 'admin',
        updatedBy: 'admin',
        tags: ['pre-listing', 'duplex'],
        estimatedDuration: 180,
        fee: 550,
        isPaid: false
      },
      {
        id: '5',
        referenceNumber: 'REF-2025-005',
        propertyAddress: '654 Maple Drive, Seattle, WA 98101',
        propertyType: PropertyType.TOWNHOUSE,
        clientName: 'Emily Chen',
        clientEmail: 'emily.c@email.com',
        clientPhone: '555-0104',
        inspectorId: 'ins_002',
        inspectorName: 'Jane Doe',
        organizationId: 'org_001',
        scheduledDate: new Date(Date.now() - 259200000),
        status: InspectionStatus.CANCELLED,
        type: InspectionType.NEW_CONSTRUCTION,
        priority: Priority.LOW,
        notes: 'New construction final inspection - Client postponed',
        findings: [],
        measures: [],
        defects: [],
        files: [],
        images: [],
        createdAt: new Date(Date.now() - 432000000),
        updatedAt: new Date(Date.now() - 259200000),
        createdBy: 'admin',
        updatedBy: 'admin',
        tags: ['new-construction', 'postponed'],
        estimatedDuration: 150,
        fee: 400,
        isPaid: false
      }
    ];
  }
}
