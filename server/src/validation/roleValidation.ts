import { z } from 'zod';

// Create role validation schema
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  tenantId: z.string().optional(),
  isGlobal: z.boolean().default(false),
});

// Update role validation schema
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isGlobal: z.boolean().optional(),
});

// Role filters validation schema
export const roleFiltersSchema = z.object({
  tenantId: z.string().optional(),
  isGlobal: z.boolean().optional(),
  search: z.string().optional(),
});

// Role list parameters validation schema
export const roleListParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  filters: roleFiltersSchema.optional(),
  orderBy: z.enum(['name', 'createdAt']).default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Role ID validation schema
export const roleIdSchema = z.object({
  id: z.string().min(1, 'Role ID is required'),
});

// Permission validation schema
export const permissionSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  submoduleId: z.string().optional(),
  canCreate: z.boolean().default(false),
  canRead: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canViewAll: z.boolean().default(false),
});

// Bulk permission update validation schema
export const bulkPermissionUpdateSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  permissions: z.array(permissionSchema),
});

// Assign user to role validation schema
export const assignUserToRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

// Remove user from role validation schema
export const removeUserFromRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

// Get effective permissions validation schema
export const getEffectivePermissionsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  moduleId: z.string().optional(),
  submoduleId: z.string().optional(),
});

// Permission matrix validation schema
export const permissionMatrixSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  moduleId: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleFilters = z.infer<typeof roleFiltersSchema>;
export type RoleListParams = z.infer<typeof roleListParamsSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type BulkPermissionUpdate = z.infer<typeof bulkPermissionUpdateSchema>;
export type AssignUserToRole = z.infer<typeof assignUserToRoleSchema>;
export type RemoveUserFromRole = z.infer<typeof removeUserFromRoleSchema>;
