import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Inspection } from '../../models/inspection.model';

export const InspectionsActions = createActionGroup({
  source: 'Inspections',
  events: {
    // Load inspections list
    'Load Inspections': emptyProps(),
    'Load Inspections Success': props<{ 
      inspections: Inspection[]; 
      totalItems: number; 
      totalPages: number 
    }>(),
    'Load Inspections Failure': props<{ error: string }>(),
    
    // Load single inspection
    'Load Inspection': props<{ id: string }>(),
    'Load Inspection Success': props<{ inspection: Inspection }>(),
    'Load Inspection Failure': props<{ error: string }>(),
    
    // Create inspection
    'Create Inspection': props<{ inspection: Partial<Inspection> }>(),
    'Create Inspection Success': props<{ inspection: Inspection }>(),
    'Create Inspection Failure': props<{ error: string }>(),
    
    // Update inspection
    'Update Inspection': props<{ id: string; updates: Partial<Inspection> }>(),
    'Update Inspection Success': props<{ inspection: Inspection }>(),
    'Update Inspection Failure': props<{ error: string }>(),
    
    // Delete inspection
    'Delete Inspection': props<{ id: string }>(),
    'Delete Inspection Success': props<{ id: string }>(),
    'Delete Inspection Failure': props<{ error: string }>(),
    
    // Update inspection status
    'Update Inspection Status': props<{ id: string; status: string }>(),
    'Update Inspection Status Success': props<{ inspection: Inspection }>(),
    'Update Inspection Status Failure': props<{ error: string }>(),
    
    // Pagination
    'Set Page': props<{ page: number }>(),
    'Set Page Size': props<{ pageSize: number }>(),
    
    // Filtering
    'Set Filters': props<{ filters: any }>(),
    'Clear Filters': emptyProps(),
    
    // Sorting
    'Set Sort': props<{ field: string; direction: 'asc' | 'desc' }>(),
    
    // Selection
    'Select Inspection': props<{ inspection: Inspection }>(),
    'Clear Selected Inspection': emptyProps(),
    
    // Utility
    'Clear Error': emptyProps(),
  }
});

export const InspectionsApiActions = createActionGroup({
  source: 'Inspections API',
  events: {
    'Operation Success': props<{ message: string }>(),
    'Operation Failure': props<{ error: string }>(),
  }
});