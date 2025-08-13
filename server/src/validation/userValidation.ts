import { z } from 'zod';

// Create user validation schema
export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.string().optional(),
  isSuperadmin: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// Update user validation schema
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  tenantId: z.string().optional(),
  isSuperadmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// User filters validation schema
export const userFiltersSchema = z.object({
  tenantId: z.string().optional(),
  isActive: z.boolean().optional(),
  isSuperadmin: z.boolean().optional(),
  search: z.string().optional(),
});

// User list parameters validation schema
export const userListParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  filters: userFiltersSchema.optional(),
  orderBy: z
    .enum(['name', 'email', 'createdAt', 'lastLoginAt'])
    .default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

// User ID validation schema
export const userIdSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

// Assign role validation schema
export const assignRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

// Remove role validation schema
export const removeRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().optional(),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type UserListParams = z.infer<typeof userListParamsSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
