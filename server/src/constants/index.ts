// Database constants
export const DB_CONSTANTS = {
  MAX_STRING_LENGTH: 255,
  MAX_TEXT_LENGTH: 65535,
  MAX_JSON_LENGTH: 16777215,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1
} as const;

// API constants
export const API_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_SORT_ORDER: 'DESC',
  VALID_SORT_ORDERS: ['ASC', 'DESC'] as const,
  MAX_SEARCH_LENGTH: 100
} as const;

// Auth constants
export const AUTH_CONSTANTS = {
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  RESET_TOKEN_EXPIRY: '1h',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutes
} as const;

// User constants
export const USER_CONSTANTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 20,
  ADDRESS_MAX_LENGTH: 500
} as const;

// Tenant constants
export const TENANT_CONSTANTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DOMAIN_MAX_LENGTH: 255,
  CONTACT_EMAIL_MAX_LENGTH: 255,
  CONTACT_PHONE_MAX_LENGTH: 20,
  ADDRESS_MAX_LENGTH: 1000,
  MAX_DEVICES: 10,
  MIN_DEVICES: 1,
  MAX_SESSION_TIMEOUT: 24 * 60 * 60, // 24 hours in seconds
  MIN_SESSION_TIMEOUT: 300 // 5 minutes in seconds
} as const;

// Role constants
export const ROLE_CONSTANTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500
} as const;

// Module constants
export const MODULE_CONSTANTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
  ICON_MAX_LENGTH: 50,
  ROUTE_PATH_MAX_LENGTH: 255
} as const;

// Support constants
export const SUPPORT_CONSTANTS = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  REPLY_MAX_LENGTH: 2000,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
} as const;

// Audit log constants
export const AUDIT_CONSTANTS = {
  ACTION_MAX_LENGTH: 50,
  MODULE_MAX_LENGTH: 50,
  IP_ADDRESS_MAX_LENGTH: 45
} as const;

// Status enums
export const STATUS_ENUMS = {
  TICKET_STATUS: ['open', 'in_progress', 'closed'] as const,
  TICKET_PRIORITY: ['low', 'medium', 'high'] as const,
  USER_STATUS: ['active', 'inactive'] as const,
  TENANT_STATUS: ['active', 'inactive'] as const,
  MODULE_STATUS: ['active', 'inactive'] as const
} as const;

// Permission constants
export const PERMISSION_CONSTANTS = {
  ACTIONS: ['create', 'read', 'update', 'delete'] as const,
  ALL_PERMISSIONS: ['can_create', 'can_read', 'can_update', 'can_delete'] as const
} as const;

// File upload constants
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx'],
  UPLOAD_PATH: './uploads',
  MAX_FILES_PER_REQUEST: 5
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_TOKEN: 'Invalid token',
  USER_NOT_FOUND: 'User not found',
  TENANT_NOT_FOUND: 'Tenant not found',
  ROLE_NOT_FOUND: 'Role not found',
  MODULE_NOT_FOUND: 'Module not found',
  PERMISSION_DENIED: 'Permission denied',
  DUPLICATE_EMAIL: 'Email already exists',
  DUPLICATE_DOMAIN: 'Domain already exists',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File too large',
  TOO_MANY_FILES: 'Too many files'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  TENANT_CREATED: 'Tenant created successfully',
  TENANT_UPDATED: 'Tenant updated successfully',
  TENANT_DELETED: 'Tenant deleted successfully',
  ROLE_CREATED: 'Role created successfully',
  ROLE_UPDATED: 'Role updated successfully',
  ROLE_DELETED: 'Role deleted successfully',
  MODULE_CREATED: 'Module created successfully',
  MODULE_UPDATED: 'Module updated successfully',
  MODULE_DELETED: 'Module deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  DEVICE_REVOKED: 'Device access revoked successfully'
} as const;
