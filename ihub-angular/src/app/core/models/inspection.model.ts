/**
 * Inspection Models and Interfaces
 */

/**
 * Inspection status enum
 */
export enum InspectionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
  ON_HOLD = 'on-hold'
}

/**
 * Inspection type enum - comprehensive list for all inspection types
 */
export enum InspectionType {
  PRE_PURCHASE = 'pre-purchase',
  PRE_LISTING = 'pre-listing',
  NEW_CONSTRUCTION = 'new-construction',
  WARRANTY = 'warranty',
  ANNUAL = 'annual',
  FOUR_POINT = 'four-point',
  ROOF = 'roof',
  POOL = 'pool',
  WIND_MITIGATION = 'wind-mitigation',
  MOLD = 'mold',
  RADON = 'radon',
  TERMITE = 'termite',
  COMMERCIAL = 'commercial',
  OTHER = 'other'
}

/**
 * Property type enum
 */
export enum PropertyType {
  SINGLE_FAMILY = 'single-family',
  MULTI_FAMILY = 'multi-family',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  APARTMENT = 'apartment',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  VACANT_LAND = 'vacant-land',
  OTHER = 'other'
}

/**
 * Priority levels
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Severity levels for findings and defects
 */
export enum Severity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
  SAFETY = 'safety'
}

/**
 * Defect status enum
 */
export enum DefectStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  DEFERRED = 'deferred',
  WONT_FIX = 'wont-fix'
}

/**
 * Finding category enum
 */
export enum FindingCategory {
  STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  ROOFING = 'roofing',
  EXTERIOR = 'exterior',
  INTERIOR = 'interior',
  INSULATION = 'insulation',
  VENTILATION = 'ventilation',
  APPLIANCES = 'appliances',
  SAFETY = 'safety',
  OTHER = 'other'
}

/**
 * Defect category enum
 */
export enum DefectCategory {
  STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  ROOFING = 'roofing',
  FOUNDATION = 'foundation',
  DRAINAGE = 'drainage',
  SAFETY = 'safety',
  COSMETIC = 'cosmetic',
  OTHER = 'other'
}

/**
 * Inspection model interface
 */
export interface Inspection {
  id: string;
  referenceNumber: string;
  propertyAddress: string;
  propertyType: PropertyType;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  inspectorId?: string;
  inspectorName?: string;
  organizationId: string;
  type: InspectionType;
  status: InspectionStatus;
  priority: Priority;
  scheduledDate: Date;
  completedDate?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  measures: InspectionMeasure[];
  results?: InspectionResult;
  findings: InspectionFinding[];
  defects: Defect[];
  files: InspectionFile[];
  images: InspectionImage[];
  notes?: string;
  internalNotes?: string;
  reportUrl?: string;
  reportGeneratedAt?: Date;
  isPaid: boolean;
  paymentAmount?: number;
  paymentDate?: Date;
  fee?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * Inspection measure interface
 */
export interface InspectionMeasure {
  id: string;
  name: string;
  category: string;
  description: string;
  value?: number;
  unit?: string;
  standard?: string;
  condition?: 'good' | 'fair' | 'poor' | 'critical';
  notes?: string;
}

/**
 * Inspection file interface
 */
export interface InspectionFile {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
  category?: string;
}

/**
 * Inspection image interface
 */
export interface InspectionImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  category?: string;
  tags?: string[];
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

/**
 * Inspection finding interface
 */
export interface InspectionFinding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  location: string;
  recommendations?: string;
  estimatedCost?: number;
  images?: string[];
  createdAt: Date;
}

/**
 * Inspection result interface
 */
export interface InspectionResult {
  overallRating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  summary: string;
  recommendations: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  metadata: Record<string, any>;
}

/**
 * Defect model interface
 */
export interface Defect {
  id: string;
  inspectionId: string;
  category: DefectCategory;
  severity: Severity;
  status: DefectStatus;
  title: string;
  description: string;
  location?: string;
  recommendations?: string;
  estimatedRepairCost?: number;
  images?: string[];
  assignedTo?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  priority: Priority;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inspection file interface
 */
export interface InspectionFile {
  id: string;
  inspectionId: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  category?: string;
  description?: string;
}

/**
 * Inspection filter interface
 */
export interface InspectionFilter {
  search?: string;
  status?: InspectionStatus[];
  type?: InspectionType[];
  priority?: Priority[];
  inspectorId?: string;
  clientName?: string;
  propertyAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasDefects?: boolean;
  isPaid?: boolean;
  organizationId?: string;
}

/**
 * Create inspection request
 */
export interface CreateInspectionRequest {
  propertyAddress: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  inspectorId?: string;
  type: InspectionType;
  priority: Priority;
  scheduledDate: string;
  estimatedDuration?: number;
  measures: InspectionMeasure[];
  notes?: string;
  organizationId: string;
}

/**
 * Update inspection request
 */
export interface UpdateInspectionRequest {
  propertyAddress?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  inspectorId?: string;
  type?: InspectionType;
  priority?: Priority;
  scheduledDate?: string;
  estimatedDuration?: number;
  measures?: InspectionMeasure[];
  results?: InspectionResult;
  notes?: string;
  status?: InspectionStatus;
  isPaid?: boolean;
  paymentAmount?: number;
  paymentDate?: string;
}

/**
 * Inspection statistics interface
 */
export interface InspectionStats {
  totalInspections: number;
  completedInspections: number;
  pendingInspections: number;
  overdueInspections: number;
  averageCompletionTime: number;
  defectRate: number;
  revenue: number;
  monthlyTrend: MonthlyStats[];
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
  month: string;
  year: number;
  inspections: number;
  completed: number;
  defects: number;
  revenue: number;
}

/**
 * Helper functions for status and priority colors
 */
export function getStatusColor(status: InspectionStatus): string {
  switch (status) {
    case InspectionStatus.COMPLETED:
      return 'success';
    case InspectionStatus.IN_PROGRESS:
      return 'accent';
    case InspectionStatus.SCHEDULED:
      return 'primary';
    case InspectionStatus.OVERDUE:
    case InspectionStatus.CANCELLED:
      return 'warn';
    case InspectionStatus.ON_HOLD:
      return 'gray';
    case InspectionStatus.DRAFT:
      return 'secondary';
    default:
      return 'primary';
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case Priority.URGENT:
      return 'error';
    case Priority.HIGH:
      return 'warn';
    case Priority.MEDIUM:
      return 'accent';
    case Priority.LOW:
      return 'primary';
    default:
      return 'primary';
  }
}

export function getStatusIcon(status: InspectionStatus): string {
  switch (status) {
    case InspectionStatus.COMPLETED:
      return 'check_circle';
    case InspectionStatus.IN_PROGRESS:
      return 'pending';
    case InspectionStatus.SCHEDULED:
      return 'schedule';
    case InspectionStatus.CANCELLED:
      return 'cancel';
    case InspectionStatus.OVERDUE:
      return 'error';
    case InspectionStatus.ON_HOLD:
      return 'pause_circle';
    case InspectionStatus.DRAFT:
      return 'edit';
    default:
      return 'help';
  }
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case Severity.MINOR: return 'primary';
    case Severity.MODERATE: return 'accent';
    case Severity.MAJOR: return 'warn';
    case Severity.CRITICAL: return 'warn';
    case Severity.SAFETY: return 'warn';
    default: return '';
  }
}

/**
 * Format inspection status for display
 */
export function formatInspectionStatus(status: InspectionStatus): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format inspection type for display
 */
export function formatInspectionType(type: InspectionType): string {
  return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Calculate inspection duration
 */
export function calculateInspectionDuration(startTime: string, endTime?: string): number {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
}

/**
 * Check if inspection is overdue
 */
export function isInspectionOverdue(inspection: Inspection): boolean {
  if (inspection.status === InspectionStatus.COMPLETED || inspection.status === InspectionStatus.CANCELLED) {
    return false;
  }

  const scheduledDate = new Date(inspection.scheduledDate);
  const now = new Date();
  return scheduledDate < now;
}

/**
 * Get inspection progress percentage
 */
export function getInspectionProgress(inspection: Inspection): number {
  switch (inspection.status) {
    case InspectionStatus.DRAFT:
      return 0;
    case InspectionStatus.SCHEDULED:
      return 25;
    case InspectionStatus.IN_PROGRESS:
      return 50;
    case InspectionStatus.COMPLETED:
      return 100;
    case InspectionStatus.CANCELLED:
    case InspectionStatus.OVERDUE:
    case InspectionStatus.ON_HOLD:
      return 0;
    default:
      return 0;
  }
}
