import { z } from 'zod';

// Create module validation schema
export const createModuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isActive: z.boolean().default(true),
  orderIndex: z.number().min(0).default(0),
});

// Update module validation schema
export const updateModuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isActive: z.boolean().optional(),
  orderIndex: z.number().min(0).optional(),
});

// Create submodule validation schema
export const createSubmoduleSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isActive: z.boolean().default(true),
  orderIndex: z.number().min(0).default(0),
});

// Update submodule validation schema
export const updateSubmoduleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isActive: z.boolean().optional(),
  orderIndex: z.number().min(0).optional(),
});

// Module filters validation schema
export const moduleFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// Module list parameters validation schema
export const moduleListParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  filters: moduleFiltersSchema.optional(),
  orderBy: z.enum(['name', 'orderIndex', 'createdAt']).default('orderIndex'),
  orderDirection: z.enum(['asc', 'desc']).default('asc'),
});

// Module ID validation schema
export const moduleIdSchema = z.object({
  id: z.string().min(1, 'Module ID is required'),
});

// Submodule ID validation schema
export const submoduleIdSchema = z.object({
  id: z.string().min(1, 'Submodule ID is required'),
});

// Update order validation schema
export const updateOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1, 'ID is required'),
      orderIndex: z.number().min(0, 'Order index must be non-negative'),
    })
  ),
});

// User ID validation schema for menu generation
export const userIdSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateSubmoduleInput = z.infer<typeof createSubmoduleSchema>;
export type UpdateSubmoduleInput = z.infer<typeof updateSubmoduleSchema>;
export type ModuleFilters = z.infer<typeof moduleFiltersSchema>;
export type ModuleListParams = z.infer<typeof moduleListParamsSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
