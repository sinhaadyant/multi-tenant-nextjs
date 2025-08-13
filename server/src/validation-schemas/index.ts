import { z } from 'zod';
import { 
  USER_CONSTANTS, 
  TENANT_CONSTANTS, 
  ROLE_CONSTANTS, 
  MODULE_CONSTANTS,
  SUPPORT_CONSTANTS,
  API_CONSTANTS,
  STATUS_ENUMS,
  AUTH_CONSTANTS
} from '@/constants';

// Base schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(API_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce.number().min(API_CONSTANTS.MIN_LIMIT).max(API_CONSTANTS.MAX_LIMIT).default(API_CONSTANTS.DEFAULT_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(API_CONSTANTS.VALID_SORT_ORDERS).default(API_CONSTANTS.DEFAULT_SORT_ORDER),
  search: z.string().max(API_CONSTANTS.MAX_SEARCH_LENGTH).optional()
});

export const idParamSchema = z.object({
  id: z.coerce.number().positive()
});

// User schemas
export const createUserSchema = z.object({
  tenant_id: z.number().positive(),
  role_id: z.number().positive(),
  first_name: z.string()
    .min(USER_CONSTANTS.NAME_MIN_LENGTH)
    .max(USER_CONSTANTS.NAME_MAX_LENGTH),
  last_name: z.string()
    .min(USER_CONSTANTS.NAME_MIN_LENGTH)
    .max(USER_CONSTANTS.NAME_MAX_LENGTH),
  email: z.string()
    .email()
    .max(USER_CONSTANTS.EMAIL_MAX_LENGTH),
  password: z.string()
    .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
    .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH),
  is_superadmin: z.boolean().default(false),
  is_active: z.boolean().default(true)
});

export const updateUserSchema = z.object({
  role_id: z.number().positive().optional(),
  first_name: z.string()
    .min(USER_CONSTANTS.NAME_MIN_LENGTH)
    .max(USER_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  last_name: z.string()
    .min(USER_CONSTANTS.NAME_MIN_LENGTH)
    .max(USER_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  email: z.string()
    .email()
    .max(USER_CONSTANTS.EMAIL_MAX_LENGTH)
    .optional(),
  password: z.string()
    .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
    .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH)
    .optional(),
  is_active: z.boolean().optional()
});

export const userFiltersSchema = z.object({
  tenant_id: z.coerce.number().positive().optional(),
  role_id: z.coerce.number().positive().optional(),
  is_active: z.coerce.boolean().optional(),
  is_superadmin: z.coerce.boolean().optional(),
  created_at_from: z.string().datetime().optional(),
  created_at_to: z.string().datetime().optional()
});

// Tenant schemas
export const createTenantSchema = z.object({
  name: z.string()
    .min(TENANT_CONSTANTS.NAME_MIN_LENGTH)
    .max(TENANT_CONSTANTS.NAME_MAX_LENGTH),
  domain: z.string()
    .max(TENANT_CONSTANTS.DOMAIN_MAX_LENGTH)
    .optional(),
  contact_email: z.string()
    .email()
    .max(TENANT_CONSTANTS.CONTACT_EMAIL_MAX_LENGTH),
  contact_phone: z.string()
    .max(TENANT_CONSTANTS.CONTACT_PHONE_MAX_LENGTH)
    .optional(),
  address: z.string()
    .max(TENANT_CONSTANTS.ADDRESS_MAX_LENGTH)
    .optional(),
  is_active: z.boolean().default(true),
  login_restrictions: z.object({
    max_devices: z.number()
      .min(TENANT_CONSTANTS.MIN_DEVICES)
      .max(TENANT_CONSTANTS.MAX_DEVICES),
    allow_multiple_sessions: z.boolean().default(false),
    password_expiry_days: z.number().positive().optional(),
    ip_whitelist: z.array(z.string().ip()).optional(),
    default_for_tenants: z.boolean().default(false)
  }).optional()
});

export const updateTenantSchema = z.object({
  name: z.string()
    .min(TENANT_CONSTANTS.NAME_MIN_LENGTH)
    .max(TENANT_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  domain: z.string()
    .max(TENANT_CONSTANTS.DOMAIN_MAX_LENGTH)
    .optional(),
  contact_email: z.string()
    .email()
    .max(TENANT_CONSTANTS.CONTACT_EMAIL_MAX_LENGTH)
    .optional(),
  contact_phone: z.string()
    .max(TENANT_CONSTANTS.CONTACT_PHONE_MAX_LENGTH)
    .optional(),
  address: z.string()
    .max(TENANT_CONSTANTS.ADDRESS_MAX_LENGTH)
    .optional(),
  is_active: z.boolean().optional(),
  login_restrictions: z.object({
    max_devices: z.number()
      .min(TENANT_CONSTANTS.MIN_DEVICES)
      .max(TENANT_CONSTANTS.MAX_DEVICES)
      .optional(),
    allow_multiple_sessions: z.boolean().optional(),
    password_expiry_days: z.number().positive().optional(),
    ip_whitelist: z.array(z.string().ip()).optional(),
    default_for_tenants: z.boolean().optional()
  }).optional()
});

export const tenantFiltersSchema = z.object({
  is_active: z.coerce.boolean().optional(),
  created_at_from: z.string().datetime().optional(),
  created_at_to: z.string().datetime().optional()
});

// Role schemas
export const createRoleSchema = z.object({
  tenant_id: z.number().positive().optional(),
  name: z.string()
    .min(ROLE_CONSTANTS.NAME_MIN_LENGTH)
    .max(ROLE_CONSTANTS.NAME_MAX_LENGTH),
  description: z.string()
    .max(ROLE_CONSTANTS.DESCRIPTION_MAX_LENGTH)
    .optional(),
  is_system: z.boolean().default(false)
});

export const updateRoleSchema = z.object({
  name: z.string()
    .min(ROLE_CONSTANTS.NAME_MIN_LENGTH)
    .max(ROLE_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  description: z.string()
    .max(ROLE_CONSTANTS.DESCRIPTION_MAX_LENGTH)
    .optional(),
  is_system: z.boolean().optional()
});

export const roleFiltersSchema = z.object({
  tenant_id: z.coerce.number().positive().optional(),
  is_system: z.coerce.boolean().optional(),
  created_at_from: z.string().datetime().optional(),
  created_at_to: z.string().datetime().optional()
});

// Module schemas
export const createModuleSchema = z.object({
  name: z.string()
    .min(MODULE_CONSTANTS.NAME_MIN_LENGTH)
    .max(MODULE_CONSTANTS.NAME_MAX_LENGTH),
  description: z.string()
    .max(MODULE_CONSTANTS.DESCRIPTION_MAX_LENGTH)
    .optional(),
  is_active: z.boolean().default(true),
  order_index: z.number().default(0)
});

export const updateModuleSchema = z.object({
  name: z.string()
    .min(MODULE_CONSTANTS.NAME_MIN_LENGTH)
    .max(MODULE_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  description: z.string()
    .max(MODULE_CONSTANTS.DESCRIPTION_MAX_LENGTH)
    .optional(),
  is_active: z.boolean().optional(),
  order_index: z.number().optional()
});

export const moduleFiltersSchema = z.object({
  is_active: z.coerce.boolean().optional(),
  created_at_from: z.string().datetime().optional(),
  created_at_to: z.string().datetime().optional()
});

// Menu schemas
export const createMenuSchema = z.object({
  module_id: z.number().positive(),
  parent_id: z.number().positive().optional(),
  title: z.string()
    .min(1)
    .max(MODULE_CONSTANTS.NAME_MAX_LENGTH),
  icon: z.string()
    .max(MODULE_CONSTANTS.ICON_MAX_LENGTH)
    .optional(),
  route_path: z.string()
    .max(MODULE_CONSTANTS.ROUTE_PATH_MAX_LENGTH),
  order_index: z.number().default(0),
  is_active: z.boolean().default(true)
});

export const updateMenuSchema = z.object({
  module_id: z.number().positive().optional(),
  parent_id: z.number().positive().optional(),
  title: z.string()
    .min(1)
    .max(MODULE_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  icon: z.string()
    .max(MODULE_CONSTANTS.ICON_MAX_LENGTH)
    .optional(),
  route_path: z.string()
    .max(MODULE_CONSTANTS.ROUTE_PATH_MAX_LENGTH)
    .optional(),
  order_index: z.number().optional(),
  is_active: z.boolean().optional()
});

// Permission schemas
export const createPermissionSchema = z.object({
  role_id: z.number().positive(),
  module_id: z.number().positive(),
  can_create: z.boolean().default(false),
  can_read: z.boolean().default(false),
  can_update: z.boolean().default(false),
  can_delete: z.boolean().default(false)
});

export const updatePermissionSchema = z.object({
  can_create: z.boolean().optional(),
  can_read: z.boolean().optional(),
  can_update: z.boolean().optional(),
  can_delete: z.boolean().optional()
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_info: z.object({
    os: z.string().optional(),
    browser: z.string().optional(),
    device_name: z.string().optional()
  }).optional()
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1)
});

export const resetPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1),
  new_password: z.string()
    .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
    .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH)
});

export const revokeDeviceSchema = z.object({
  device_id: z.number().positive()
});

// Support ticket schemas
export const createSupportTicketSchema = z.object({
  tenant_id: z.number().positive(),
  user_id: z.number().positive(),
  subject: z.string()
    .min(SUPPORT_CONSTANTS.TITLE_MIN_LENGTH)
    .max(SUPPORT_CONSTANTS.TITLE_MAX_LENGTH),
  status: z.enum(STATUS_ENUMS.TICKET_STATUS).default('open'),
  priority: z.enum(STATUS_ENUMS.TICKET_PRIORITY).default('medium')
});

export const updateSupportTicketSchema = z.object({
  subject: z.string()
    .min(SUPPORT_CONSTANTS.TITLE_MIN_LENGTH)
    .max(SUPPORT_CONSTANTS.TITLE_MAX_LENGTH)
    .optional(),
  status: z.enum(STATUS_ENUMS.TICKET_STATUS).optional(),
  priority: z.enum(STATUS_ENUMS.TICKET_PRIORITY).optional()
});

export const supportTicketFiltersSchema = z.object({
  tenant_id: z.coerce.number().positive().optional(),
  user_id: z.coerce.number().positive().optional(),
  status: z.enum(STATUS_ENUMS.TICKET_STATUS).optional(),
  priority: z.enum(STATUS_ENUMS.TICKET_PRIORITY).optional(),
  created_at_from: z.string().datetime().optional(),
  created_at_to: z.string().datetime().optional()
});

// Support reply schemas
export const createSupportReplySchema = z.object({
  ticket_id: z.number().positive(),
  user_id: z.number().positive(),
  message: z.string()
    .min(1)
    .max(SUPPORT_CONSTANTS.REPLY_MAX_LENGTH)
});

// Audit log schemas
export const auditLogFiltersSchema = z.object({
  tenant_id: z.coerce.number().positive().optional(),
  user_id: z.coerce.number().positive().optional(),
  action: z.string().optional(),
  module: z.string().optional(),
  created_at_from: z.string().datetime().optional(),
  created_at_to: z.string().datetime().optional()
});

// File upload schemas
export const fileUploadSchema = z.object({
  reply_id: z.number().positive()
});

// Query parameter schemas
export const queryParamsSchema = paginationSchema.extend({
  filters: z.record(z.any()).optional()
});

// Export all schemas
export const schemas = {
  // Base
  pagination: paginationSchema,
  idParam: idParamSchema,
  queryParams: queryParamsSchema,
  
  // User
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  userFilters: userFiltersSchema,
  
  // Tenant
  createTenant: createTenantSchema,
  updateTenant: updateTenantSchema,
  tenantFilters: tenantFiltersSchema,
  
  // Role
  createRole: createRoleSchema,
  updateRole: updateRoleSchema,
  roleFilters: roleFiltersSchema,
  
  // Module
  createModule: createModuleSchema,
  updateModule: updateModuleSchema,
  moduleFilters: moduleFiltersSchema,
  
  // Menu
  createMenu: createMenuSchema,
  updateMenu: updateMenuSchema,
  
  // Permission
  createPermission: createPermissionSchema,
  updatePermission: updatePermissionSchema,
  
  // Auth
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  resetPassword: resetPasswordSchema,
  resetPasswordConfirm: resetPasswordConfirmSchema,
  revokeDevice: revokeDeviceSchema,
  
  // Support
  createSupportTicket: createSupportTicketSchema,
  updateSupportTicket: updateSupportTicketSchema,
  supportTicketFilters: supportTicketFiltersSchema,
  createSupportReply: createSupportReplySchema,
  
  // Audit
  auditLogFilters: auditLogFiltersSchema,
  
  // File
  fileUpload: fileUploadSchema
} as const;

export default schemas;
