import { z } from 'zod';

// Create user schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  phoneNumber: z.string().optional(),
  roleId: z.string().min(1, 'Role ID is required'),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  profilePicture: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

// Update user schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  phoneNumber: z.string().optional(),
  roleId: z.string().min(1, 'Role ID is required').optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  profilePicture: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

// Update profile schema (for self-update)
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  phoneNumber: z.string().optional(),
  profilePicture: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

// User list query schema
export const userListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// User ID parameter schema
export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

// User email parameter schema
export const userEmailParamSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Bulk user operations schema
export const bulkUserOperationSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  operation: z.enum([
    'activate',
    'deactivate',
    'delete',
    'assignRole',
    'removeRole',
  ]),
  roleId: z.string().optional(),
});

// User import schema
export const userImportSchema = z.object({
  users: z.array(
    z.object({
      email: z.string().email('Invalid email format'),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      roleId: z.string().min(1, 'Role ID is required'),
      phoneNumber: z.string().optional(),
      isActive: z.boolean().default(true),
    })
  ),
  sendWelcomeEmail: z.boolean().default(false),
  generatePassword: z.boolean().default(true),
});

// User export schema
export const userExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  filters: z.record(z.string(), z.any()).optional(),
  fields: z.array(z.string()).optional(),
});

// User statistics schema
export const userStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// User activity schema
export const userActivityQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// User permissions schema
export const userPermissionsQuerySchema = z.object({
  includeInherited: z.boolean().default(true),
  includeModulePermissions: z.boolean().default(true),
});

// User roles schema
export const userRolesQuerySchema = z.object({
  includeGlobal: z.boolean().default(true),
  includeTenant: z.boolean().default(true),
});

// User search schema
export const userSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  fields: z
    .array(z.enum(['firstName', 'lastName', 'email', 'phoneNumber']))
    .default(['firstName', 'lastName', 'email']),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  notifications: z
    .object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    })
    .optional(),
  dashboard: z
    .object({
      layout: z.string().default('default'),
      widgets: z.array(z.string()).default([]),
    })
    .optional(),
});

// Export types
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserEmailParam = z.infer<typeof userEmailParamSchema>;
export type BulkUserOperation = z.infer<typeof bulkUserOperationSchema>;
export type UserImport = z.infer<typeof userImportSchema>;
export type UserExport = z.infer<typeof userExportSchema>;
export type UserStatsQuery = z.infer<typeof userStatsQuerySchema>;
export type UserActivityQuery = z.infer<typeof userActivityQuerySchema>;
export type UserPermissionsQuery = z.infer<typeof userPermissionsQuerySchema>;
export type UserRolesQuery = z.infer<typeof userRolesQuerySchema>;
export type UserSearch = z.infer<typeof userSearchSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
