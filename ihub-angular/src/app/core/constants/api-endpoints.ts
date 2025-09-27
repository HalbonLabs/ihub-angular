/**
 * API Endpoints Constants
 * Central location for all API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // User management endpoints
  USERS: {
    BASE: '/users',
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    BULK_DELETE: '/users/bulk-delete',
    SEARCH: '/users/search',
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
    AVATAR: (id: string) => `/users/${id}/avatar`,
  },

  // Organization/Tenant endpoints
  ORGANIZATIONS: {
    BASE: '/organizations',
    LIST: '/organizations',
    GET: (id: string) => `/organizations/${id}`,
    CREATE: '/organizations',
    UPDATE: (id: string) => `/organizations/${id}`,
    DELETE: (id: string) => `/organizations/${id}`,
    USERS: (id: string) => `/organizations/${id}/users`,
    SETTINGS: (id: string) => `/organizations/${id}/settings`,
    SUBSCRIPTION: (id: string) => `/organizations/${id}/subscription`,
  },

  // Inspection endpoints
  INSPECTIONS: {
    BASE: '/inspections',
    LIST: '/inspections',
    GET: (id: string) => `/inspections/${id}`,
    CREATE: '/inspections',
    UPDATE: (id: string) => `/inspections/${id}`,
    DELETE: (id: string) => `/inspections/${id}`,
    STATUS: (id: string) => `/inspections/${id}/status`,
    ASSIGN: (id: string) => `/inspections/${id}/assign`,
    FILES: (id: string) => `/inspections/${id}/files`,
    UPLOAD_FILE: (id: string) => `/inspections/${id}/files/upload`,
    DELETE_FILE: (id: string, fileId: string) => `/inspections/${id}/files/${fileId}`,
    DEFECTS: (id: string) => `/inspections/${id}/defects`,
    EXPORT: (id: string) => `/inspections/${id}/export`,
    DUPLICATE: (id: string) => `/inspections/${id}/duplicate`,
    HISTORY: (id: string) => `/inspections/${id}/history`,
    COMMENTS: (id: string) => `/inspections/${id}/comments`,
    SCHEDULE: (id: string) => `/inspections/${id}/schedule`,
  },

  // Defects endpoints
  DEFECTS: {
    BASE: '/defects',
    LIST: '/defects',
    GET: (id: string) => `/defects/${id}`,
    CREATE: '/defects',
    UPDATE: (id: string) => `/defects/${id}`,
    DELETE: (id: string) => `/defects/${id}`,
    STATUS: (id: string) => `/defects/${id}/status`,
    IMAGES: (id: string) => `/defects/${id}/images`,
    CATEGORIES: '/defects/categories',
    SEVERITY_LEVELS: '/defects/severity-levels',
  },

  // Reports endpoints
  REPORTS: {
    BASE: '/reports',
    LIST: '/reports',
    GENERATE: '/reports/generate',
    TEMPLATES: '/reports/templates',
    SCHEDULE: '/reports/schedule',
    EXPORT: (id: string) => `/reports/${id}/export`,
    PDF: (id: string) => `/reports/${id}/pdf`,
    EXCEL: (id: string) => `/reports/${id}/excel`,
    EMAIL: (id: string) => `/reports/${id}/email`,
    ANALYTICS: '/reports/analytics',
  },

  // File management endpoints
  FILES: {
    BASE: '/files',
    UPLOAD: '/files/upload',
    UPLOAD_MULTIPLE: '/files/upload-multiple',
    GET: (id: string) => `/files/${id}`,
    DELETE: (id: string) => `/files/${id}`,
    PRESIGNED_URL: '/files/presigned-url',
    METADATA: (id: string) => `/files/${id}/metadata`,
    DOWNLOAD: (id: string) => `/files/${id}/download`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
    PENDING_INSPECTIONS: '/dashboard/pending-inspections',
    PERFORMANCE_METRICS: '/dashboard/performance-metrics',
    CHARTS_DATA: '/dashboard/charts-data',
    WIDGETS: '/dashboard/widgets',
    QUICK_STATS: '/dashboard/quick-stats',
  },

  // Calendar endpoints
  CALENDAR: {
    EVENTS: '/calendar/events',
    CREATE_EVENT: '/calendar/events',
    UPDATE_EVENT: (id: string) => `/calendar/events/${id}`,
    DELETE_EVENT: (id: string) => `/calendar/events/${id}`,
    AVAILABILITY: '/calendar/availability',
    SCHEDULE: '/calendar/schedule',
    CONFLICTS: '/calendar/conflicts',
  },

  // Notifications endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD: '/notifications/unread',
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_AS_READ: '/notifications/mark-all-read',
    DELETE: (id: string) => `/notifications/${id}`,
    PREFERENCES: '/notifications/preferences',
    SUBSCRIBE: '/notifications/subscribe',
    UNSUBSCRIBE: '/notifications/unsubscribe',
  },

  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
    SYSTEM_SETTINGS: '/admin/settings',
    AUDIT_LOGS: '/admin/audit-logs',
    FEATURE_FLAGS: '/admin/feature-flags',
    DATABASE_BACKUP: '/admin/backup',
    SYSTEM_HEALTH: '/admin/health',
    MAINTENANCE_MODE: '/admin/maintenance',
    CACHE_CLEAR: '/admin/cache/clear',
    EXPORT_DATA: '/admin/export',
    IMPORT_DATA: '/admin/import',
  },

  // Search endpoints
  SEARCH: {
    GLOBAL: '/search',
    INSPECTIONS: '/search/inspections',
    USERS: '/search/users',
    FILES: '/search/files',
    DEFECTS: '/search/defects',
    SUGGESTIONS: '/search/suggestions',
  },

  // Activity/Audit endpoints
  ACTIVITY: {
    LIST: '/activity',
    USER: (userId: string) => `/activity/user/${userId}`,
    INSPECTION: (inspectionId: string) => `/activity/inspection/${inspectionId}`,
    ORGANIZATION: (orgId: string) => `/activity/organization/${orgId}`,
    EXPORT: '/activity/export',
  },

  // Settings endpoints
  SETTINGS: {
    USER: '/settings/user',
    ORGANIZATION: '/settings/organization',
    SYSTEM: '/settings/system',
    EMAIL_TEMPLATES: '/settings/email-templates',
    NOTIFICATION_SETTINGS: '/settings/notifications',
    PREFERENCES: '/settings/preferences',
    THEMES: '/settings/themes',
  },

  // WebSocket events (for reference)
  WS_EVENTS: {
    // Incoming events
    INSPECTION_UPDATED: 'inspection:updated',
    INSPECTION_STATUS_CHANGED: 'inspection:status-changed',
    DEFECT_CREATED: 'defect:created',
    FILE_UPLOADED: 'file:uploaded',
    USER_JOINED: 'user:joined',
    USER_LEFT: 'user:left',
    NOTIFICATION: 'notification',
    
    // Outgoing events
    JOIN_ROOM: 'join:room',
    LEAVE_ROOM: 'leave:room',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
  }
};

// Helper function to construct full URL
export function getApiUrl(endpoint: string): string {
  // This will be replaced with environment.apiUrl in the service
  return endpoint;
}

// Export type for API endpoint keys
export type ApiEndpointKey = keyof typeof API_ENDPOINTS;