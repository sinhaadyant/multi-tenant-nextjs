import { z } from 'zod';
import { changePasswordSchema, ChangePasswordData } from './common';

// Base schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

// Tenant schemas
export const createTenantSchema = z.object({
  // Tenant Information
  tenantName: z.string()
    .min(3, 'Tenant name must be at least 3 characters')
    .max(100, 'Tenant name must be less than 100 characters'),
  companyName: z.string()
    .min(1, 'Company name is required'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and dashes')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'Subdomain cannot start or end with a dash'),
  tenantType: z.enum(['SaaS', 'Enterprise', 'Custom']).refine((val) => val !== undefined, {
    message: 'Please select a tenant type'
  }),
  industryType: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  address: z.string().optional(),
  status: z.boolean(),
  
  // Admin User Information
  adminFullName: z.string()
    .min(1, 'Full name is required'),
  adminEmail: z.string()
    .email('Please enter a valid email address'),
  adminMobile: z.string()
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  adminPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Simple tenant schema for API compatibility
export const simpleCreateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  admin_email: emailSchema,
  domain: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  plan: z.enum(['starter', 'professional', 'enterprise'], {
    required_error: 'Please select a plan'
  }),
  region: z.string().min(1, 'Region is required'),
  features: z.array(z.string()).optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  roleId: z.string().min(1, 'Role is required'),
  tenantId: z.string().min(1, 'Tenant is required'),
  department: z.string().optional(),
  location: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  isActive: z.boolean().default(true),
});

export const updateRoleSchema = createRoleSchema.partial();

// Notification schemas
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
  type: z.enum(['info', 'warning', 'alert', 'promotional', 'system_update'], {
    required_error: 'Please select a notification type'
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select a priority level'
  }),
  targetType: z.enum(['superadmin', 'specific_users', 'multiple_users', 'entire_tenant', 'multiple_tenants'], {
    required_error: 'Please select a target type'
  }),
  targetTenantId: z.string().optional(),
  targetUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string()
  })).optional(),
  metadata: z.record(z.any()).optional(),
}).refine((data) => {
  if (data.targetType === 'entire_tenant' && !data.targetTenantId) {
    return false;
  }
  if (data.targetType === 'specific_users' && (!data.targetUserIds || data.targetUserIds.length === 0)) {
    return false;
  }
  if (data.targetType === 'multiple_users' && (!data.targetUserIds || data.targetUserIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Please provide required target information',
  path: ['targetTenantId']
});

export const updateNotificationSchema = createNotificationSchema.partial();

export const sendNotificationSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export const notificationFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  targetType: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// API notification schema (for backward compatibility)
export const apiNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
  type: z.enum(['info', 'warning', 'alert', 'promotional', 'system_update']).default('info'),
  targetType: z.enum(['all', 'tenants', 'users', 'roles'], {
    required_error: 'Please select a target type'
  }),
  targetIds: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  scheduledAt: z.string().optional(),
});

// Support ticket schemas
export const createSupportTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().min(1, 'Category is required'),
  assignedTo: z.string().optional(),
  tenantId: z.string().optional(),
});

// Profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.any().optional(),
});



// Report schemas
export const generateReportSchema = z.object({
  reportType: z.enum(['user_activity', 'tenant_summary', 'login_history', 'audit_logs', 'system_health'], {
    required_error: 'Please select a report type'
  }),
  dateFrom: z.string().min(1, 'Start date is required'),
  dateTo: z.string().min(1, 'End date is required'),
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
  filters: z.record(z.any()).optional(),
}).refine((data) => new Date(data.dateFrom) <= new Date(data.dateTo), {
  message: "End date must be after start date",
  path: ["dateTo"],
});

// Filter schemas
export const tenantFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  plan: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  roleId: z.string().optional(),
  tenantId: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Type exports
export type CreateTenantData = z.infer<typeof createTenantSchema>;
export type SimpleCreateTenantData = z.infer<typeof simpleCreateTenantSchema>;
export type UpdateTenantData = z.infer<typeof simpleCreateTenantSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type CreateRoleData = z.infer<typeof createRoleSchema>;
export type UpdateRoleData = z.infer<typeof updateRoleSchema>;
export type CreateNotificationData = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationData = z.infer<typeof updateNotificationSchema>;
export type SendNotificationData = z.infer<typeof sendNotificationSchema>;
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;
export type ApiNotificationData = z.infer<typeof apiNotificationSchema>;
export type CreateSupportTicketData = z.infer<typeof createSupportTicketSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export type GenerateReportData = z.infer<typeof generateReportSchema>;
export type TenantFilters = z.infer<typeof tenantFiltersSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>; 