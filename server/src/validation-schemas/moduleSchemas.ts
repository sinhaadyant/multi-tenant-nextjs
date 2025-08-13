import { z } from 'zod';

// Create module schema
export const createModuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Module name is required')
    .max(100, 'Module name must be less than 100 characters'),
  key: z
    .string()
    .min(1, 'Module key is required')
    .max(50, 'Module key must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Module key can only contain lowercase letters, numbers, and hyphens'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  icon: z.string().optional(),
  orderIndex: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  route: z.string().optional(),
  parentModuleId: z.string().optional(),
  permissions: z
    .array(
      z.object({
        action: z.enum(['create', 'read', 'update', 'delete', 'viewAll']),
        description: z.string().optional(),
      })
    )
    .default([]),
  settings: z
    .object({
      showInMenu: z.boolean().default(true),
      showInSidebar: z.boolean().default(true),
      requiresAuth: z.boolean().default(true),
      cacheable: z.boolean().default(false),
      cacheTTL: z.number().min(0).optional(),
    })
    .optional(),
});

// Update module schema
export const updateModuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Module name is required')
    .max(100, 'Module name must be less than 100 characters')
    .optional(),
  key: z
    .string()
    .min(1, 'Module key is required')
    .max(50, 'Module key must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Module key can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  icon: z.string().optional(),
  orderIndex: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  route: z.string().optional(),
  parentModuleId: z.string().optional(),
  settings: z
    .object({
      showInMenu: z.boolean().optional(),
      showInSidebar: z.boolean().optional(),
      requiresAuth: z.boolean().optional(),
      cacheable: z.boolean().optional(),
      cacheTTL: z.number().min(0).optional(),
    })
    .optional(),
});

// Create submodule schema
export const createSubmoduleSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  name: z
    .string()
    .min(1, 'Submodule name is required')
    .max(100, 'Submodule name must be less than 100 characters'),
  key: z
    .string()
    .min(1, 'Submodule key is required')
    .max(50, 'Submodule key must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Submodule key can only contain lowercase letters, numbers, and hyphens'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  icon: z.string().optional(),
  orderIndex: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  route: z.string().optional(),
  permissions: z
    .array(
      z.object({
        action: z.enum(['create', 'read', 'update', 'delete', 'viewAll']),
        description: z.string().optional(),
      })
    )
    .default([]),
  settings: z
    .object({
      showInMenu: z.boolean().default(true),
      showInSidebar: z.boolean().default(true),
      requiresAuth: z.boolean().default(true),
      cacheable: z.boolean().default(false),
      cacheTTL: z.number().min(0).optional(),
    })
    .optional(),
});

// Update submodule schema
export const updateSubmoduleSchema = z.object({
  name: z
    .string()
    .min(1, 'Submodule name is required')
    .max(100, 'Submodule name must be less than 100 characters')
    .optional(),
  key: z
    .string()
    .min(1, 'Submodule key is required')
    .max(50, 'Submodule key must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Submodule key can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  icon: z.string().optional(),
  orderIndex: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  route: z.string().optional(),
  settings: z
    .object({
      showInMenu: z.boolean().optional(),
      showInSidebar: z.boolean().optional(),
      requiresAuth: z.boolean().optional(),
      cacheable: z.boolean().optional(),
      cacheTTL: z.number().min(0).optional(),
    })
    .optional(),
});

// Module list query schema
export const moduleListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  parentModuleId: z.string().optional(),
  includeSubmodules: z.boolean().default(false),
  includePermissions: z.boolean().default(false),
  sortBy: z
    .enum(['name', 'key', 'orderIndex', 'createdAt'])
    .default('orderIndex'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Module ID parameter schema
export const moduleIdParamSchema = z.object({
  id: z.string().min(1, 'Module ID is required'),
});

// Submodule ID parameter schema
export const submoduleIdParamSchema = z.object({
  id: z.string().min(1, 'Submodule ID is required'),
});

// Reorder modules schema
export const reorderModulesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1, 'Module ID is required'),
      orderIndex: z.number().min(0, 'Order index must be non-negative'),
    })
  ),
});

// Reorder submodules schema
export const reorderSubmodulesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1, 'Submodule ID is required'),
      orderIndex: z.number().min(0, 'Order index must be non-negative'),
    })
  ),
});

// Menu tree query schema
export const menuTreeQuerySchema = z.object({
  includeInactive: z.boolean().default(false),
  includePermissions: z.boolean().default(true),
  format: z.enum(['tree', 'flat', 'nested']).default('tree'),
  maxDepth: z.number().min(1).max(10).default(5),
});

// Module permissions schema
export const modulePermissionsSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  permissions: z.array(
    z.object({
      action: z.enum(['create', 'read', 'update', 'delete', 'viewAll']),
      description: z.string().optional(),
    })
  ),
});

// Submodule permissions schema
export const submodulePermissionsSchema = z.object({
  submoduleId: z.string().min(1, 'Submodule ID is required'),
  permissions: z.array(
    z.object({
      action: z.enum(['create', 'read', 'update', 'delete', 'viewAll']),
      description: z.string().optional(),
    })
  ),
});

// Module statistics query schema
export const moduleStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeSubmodules: z.boolean().default(true),
});

// Module export schema
export const moduleExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('json'),
  includeSubmodules: z.boolean().default(true),
  includePermissions: z.boolean().default(true),
  includeSettings: z.boolean().default(true),
});

// Module import schema
export const moduleImportSchema = z.object({
  modules: z.array(
    z.object({
      name: z.string().min(1, 'Module name is required'),
      key: z.string().min(1, 'Module key is required'),
      description: z.string().optional(),
      icon: z.string().optional(),
      orderIndex: z.number().min(0).default(0),
      isActive: z.boolean().default(true),
      route: z.string().optional(),
      submodules: z
        .array(
          z.object({
            name: z.string().min(1, 'Submodule name is required'),
            key: z.string().min(1, 'Submodule key is required'),
            description: z.string().optional(),
            icon: z.string().optional(),
            orderIndex: z.number().min(0).default(0),
            isActive: z.boolean().default(true),
            route: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  overwrite: z.boolean().default(false),
  createMissingPermissions: z.boolean().default(true),
});

// Module cache schema
export const moduleCacheSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  action: z.enum(['clear', 'refresh', 'status']),
  includeSubmodules: z.boolean().default(true),
});

// Module dependency schema
export const moduleDependencySchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  dependencies: z.array(z.string()).default([]),
  dependents: z.array(z.string()).default([]),
});

// Module health check schema
export const moduleHealthCheckSchema = z.object({
  moduleId: z.string().optional(), // If not provided, check all modules
  includeSubmodules: z.boolean().default(true),
  includePermissions: z.boolean().default(true),
  includeRoutes: z.boolean().default(true),
});

// Export types
export type CreateModuleRequest = z.infer<typeof createModuleSchema>;
export type UpdateModuleRequest = z.infer<typeof updateModuleSchema>;
export type CreateSubmoduleRequest = z.infer<typeof createSubmoduleSchema>;
export type UpdateSubmoduleRequest = z.infer<typeof updateSubmoduleSchema>;
export type ModuleListQuery = z.infer<typeof moduleListQuerySchema>;
export type ModuleIdParam = z.infer<typeof moduleIdParamSchema>;
export type SubmoduleIdParam = z.infer<typeof submoduleIdParamSchema>;
export type ReorderModulesRequest = z.infer<typeof reorderModulesSchema>;
export type ReorderSubmodulesRequest = z.infer<typeof reorderSubmodulesSchema>;
export type MenuTreeQuery = z.infer<typeof menuTreeQuerySchema>;
export type ModulePermissionsRequest = z.infer<typeof modulePermissionsSchema>;
export type SubmodulePermissionsRequest = z.infer<
  typeof submodulePermissionsSchema
>;
export type ModuleStatsQuery = z.infer<typeof moduleStatsQuerySchema>;
export type ModuleExport = z.infer<typeof moduleExportSchema>;
export type ModuleImport = z.infer<typeof moduleImportSchema>;
export type ModuleCacheRequest = z.infer<typeof moduleCacheSchema>;
export type ModuleDependencyRequest = z.infer<typeof moduleDependencySchema>;
export type ModuleHealthCheckRequest = z.infer<typeof moduleHealthCheckSchema>;
