import { z } from 'zod';

// Create tenant validation schema
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  domain: z.string().optional(),
  isActive: z.boolean().default(true),
  loginRestrictions: z
    .object({
      allowedDomains: z.array(z.string()).optional(),
      maxUsers: z.number().min(1).optional(),
      allowedIpRanges: z.array(z.string()).optional(),
    })
    .optional(),
});

// Update tenant validation schema
export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  domain: z.string().optional(),
  isActive: z.boolean().optional(),
  loginRestrictions: z
    .object({
      allowedDomains: z.array(z.string()).optional(),
      maxUsers: z.number().min(1).optional(),
      allowedIpRanges: z.array(z.string()).optional(),
    })
    .optional(),
});

// Tenant filters validation schema
export const tenantFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// Tenant list parameters validation schema
export const tenantListParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  filters: tenantFiltersSchema.optional(),
  orderBy: z.enum(['name', 'domain', 'createdAt']).default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Tenant ID validation schema
export const tenantIdSchema = z.object({
  id: z.string().min(1, 'Tenant ID is required'),
});

// Tenant domain validation schema
export const tenantDomainSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

// Tenant settings validation schema
export const tenantSettingsSchema = z.object({
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      logo: z.string().optional(),
    })
    .optional(),
  features: z
    .object({
      enableNotifications: z.boolean().optional(),
      enableAuditLog: z.boolean().optional(),
      enableDeviceTracking: z.boolean().optional(),
    })
    .optional(),
  security: z
    .object({
      passwordPolicy: z
        .object({
          minLength: z.number().min(6).optional(),
          requireUppercase: z.boolean().optional(),
          requireLowercase: z.boolean().optional(),
          requireNumbers: z.boolean().optional(),
          requireSpecialChars: z.boolean().optional(),
        })
        .optional(),
      sessionTimeout: z.number().min(5).optional(),
      maxLoginAttempts: z.number().min(1).optional(),
    })
    .optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantFilters = z.infer<typeof tenantFiltersSchema>;
export type TenantListParams = z.infer<typeof tenantListParamsSchema>;
export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
