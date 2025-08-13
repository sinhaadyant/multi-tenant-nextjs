import { z } from 'zod';

// Create role schema
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isGlobal: z.boolean().default(false),
  permissions: z
    .array(
      z.object({
        moduleId: z.string().min(1, 'Module ID is required'),
        submoduleId: z.string().optional(),
        canCreate: z.boolean().default(false),
        canRead: z.boolean().default(false),
        canUpdate: z.boolean().default(false),
        canDelete: z.boolean().default(false),
        canViewAll: z.boolean().default(false),
      })
    )
    .default([]),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  icon: z.string().optional(),
  isSystem: z.boolean().default(false),
  priority: z.number().min(0).default(0),
});

// Update role schema
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isGlobal: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  icon: z.string().optional(),
  priority: z.number().min(0).optional(),
});

// Role list query schema
export const roleListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isGlobal: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  sortBy: z
    .enum(['name', 'createdAt', 'priority', 'userCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includePermissions: z.boolean().default(false),
  includeUsers: z.boolean().default(false),
});

// Role ID parameter schema
export const roleIdParamSchema = z.object({
  id: z.string().min(1, 'Role ID is required'),
});

// Role name parameter schema
export const roleNameParamSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
});

// Update role permissions schema
export const updateRolePermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      moduleId: z.string().min(1, 'Module ID is required'),
      submoduleId: z.string().optional(),
      canCreate: z.boolean().default(false),
      canRead: z.boolean().default(false),
      canUpdate: z.boolean().default(false),
      canDelete: z.boolean().default(false),
      canViewAll: z.boolean().default(false),
    })
  ),
  replace: z.boolean().default(false), // If true, replace all permissions; if false, merge
});

// Assign users to role schema
export const assignUsersToRoleSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  replace: z.boolean().default(false), // If true, replace all users; if false, add to existing
});

// Remove users from role schema
export const removeUsersFromRoleSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

// Role permissions query schema
export const rolePermissionsQuerySchema = z.object({
  includeModuleInfo: z.boolean().default(true),
  includeSubmoduleInfo: z.boolean().default(true),
  format: z.enum(['detailed', 'summary']).default('detailed'),
});

// User effective permissions schema
export const userEffectivePermissionsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  includeInherited: z.boolean().default(true),
  includeModulePermissions: z.boolean().default(true),
  format: z.enum(['detailed', 'summary', 'matrix']).default('detailed'),
});

// Role statistics query schema
export const roleStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Role export schema
export const roleExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  includePermissions: z.boolean().default(true),
  includeUsers: z.boolean().default(false),
  includeStats: z.boolean().default(false),
});

// Role import schema
export const roleImportSchema = z.object({
  roles: z.array(
    z.object({
      name: z.string().min(1, 'Role name is required'),
      description: z.string().optional(),
      isGlobal: z.boolean().default(false),
      permissions: z
        .array(
          z.object({
            moduleId: z.string().min(1, 'Module ID is required'),
            submoduleId: z.string().optional(),
            canCreate: z.boolean().default(false),
            canRead: z.boolean().default(false),
            canUpdate: z.boolean().default(false),
            canDelete: z.boolean().default(false),
            canViewAll: z.boolean().default(false),
          })
        )
        .optional(),
    })
  ),
  overwrite: z.boolean().default(false),
  createMissingModules: z.boolean().default(false),
});

// Permission matrix schema
export const permissionMatrixSchema = z.object({
  roleIds: z.array(z.string()).min(1, 'At least one role ID is required'),
  moduleIds: z.array(z.string()).optional(),
  format: z.enum(['table', 'json', 'csv']).default('table'),
});

// Role hierarchy schema
export const roleHierarchySchema = z.object({
  parentRoleId: z.string().min(1, 'Parent role ID is required'),
  childRoleIds: z
    .array(z.string())
    .min(1, 'At least one child role ID is required'),
});

// Role template schema
export const roleTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  permissions: z.array(
    z.object({
      moduleId: z.string().min(1, 'Module ID is required'),
      submoduleId: z.string().optional(),
      canCreate: z.boolean().default(false),
      canRead: z.boolean().default(false),
      canUpdate: z.boolean().default(false),
      canDelete: z.boolean().default(false),
      canViewAll: z.boolean().default(false),
    })
  ),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// Create role from template schema
export const createRoleFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  customizations: z
    .object({
      permissions: z
        .array(
          z.object({
            moduleId: z.string().min(1, 'Module ID is required'),
            submoduleId: z.string().optional(),
            canCreate: z.boolean().default(false),
            canRead: z.boolean().default(false),
            canUpdate: z.boolean().default(false),
            canDelete: z.boolean().default(false),
            canViewAll: z.boolean().default(false),
          })
        )
        .optional(),
    })
    .optional(),
});

// Role audit query schema
export const roleAuditQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  action: z
    .enum([
      'created',
      'updated',
      'deleted',
      'permissions_changed',
      'users_assigned',
      'users_removed',
    ])
    .optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Export types
export type CreateRoleRequest = z.infer<typeof createRoleSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;
export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
export type RoleIdParam = z.infer<typeof roleIdParamSchema>;
export type RoleNameParam = z.infer<typeof roleNameParamSchema>;
export type UpdateRolePermissionsRequest = z.infer<
  typeof updateRolePermissionsSchema
>;
export type AssignUsersToRoleRequest = z.infer<typeof assignUsersToRoleSchema>;
export type RemoveUsersFromRoleRequest = z.infer<
  typeof removeUsersFromRoleSchema
>;
export type RolePermissionsQuery = z.infer<typeof rolePermissionsQuerySchema>;
export type UserEffectivePermissionsRequest = z.infer<
  typeof userEffectivePermissionsSchema
>;
export type RoleStatsQuery = z.infer<typeof roleStatsQuerySchema>;
export type RoleExport = z.infer<typeof roleExportSchema>;
export type RoleImport = z.infer<typeof roleImportSchema>;
export type PermissionMatrixRequest = z.infer<typeof permissionMatrixSchema>;
export type RoleHierarchyRequest = z.infer<typeof roleHierarchySchema>;
export type RoleTemplate = z.infer<typeof roleTemplateSchema>;
export type CreateRoleFromTemplateRequest = z.infer<
  typeof createRoleFromTemplateSchema
>;
export type RoleAuditQuery = z.infer<typeof roleAuditQuerySchema>;
