export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  jwtTokenKey: 'ihub_access_token',
  refreshTokenKey: 'ihub_refresh_token',
  appVersion: '1.0.0',
  appName: 'iHub Inspection Platform',
  
  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  // Cloudflare R2 Configuration (will be updated with actual values)
  r2: {
    endpoint: '',
    bucket: '',
    publicUrl: '',
    region: 'auto'
  },
  
  // Session configuration
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  sessionWarning: 5 * 60 * 1000, // 5 minutes warning before timeout
  
  // API request configuration
  apiTimeout: 30000, // 30 seconds
  apiRetryAttempts: 3,
  apiRetryDelay: 1000, // 1 second
  
  // Feature flags
  features: {
    darkMode: true,
    notifications: true,
    realtime: true,
    fileUpload: true,
    reporting: true,
    calendar: true,
    multiLanguage: false
  }
};