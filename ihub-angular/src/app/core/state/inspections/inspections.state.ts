import { Inspection } from '../../models/inspection.model';

export interface InspectionsState {
  inspections: Inspection[];
  selectedInspection: Inspection | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: {
    status?: string;
    inspectorId?: string;
    clientName?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  };
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export const initialInspectionsState: InspectionsState = {
  inspections: [],
  selectedInspection: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  },
  filters: {},
  sort: {
    field: 'scheduledDate',
    direction: 'desc'
  }
};