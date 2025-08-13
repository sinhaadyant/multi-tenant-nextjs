import { z } from 'zod';

// Create tenant schema
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name must be less than 100 characters'),
  slug: z
    .string()
    .min(1, 'Tenant slug is required')
    .max(50, 'Tenant slug must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Tenant slug can only contain lowercase letters, numbers, and hyphens'
    ),
  domain: z.string().url().optional(),
  isActive: z.boolean().default(true),
  settings: z
    .object({
      theme: z
        .object({
          primaryColor: z
            .string()
            .regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color')
            .default('#3B82F6'),
          secondaryColor: z
            .string()
            .regex(
              /^#[0-9A-F]{6}$/i,
              'Secondary color must be a valid hex color'
            )
            .default('#6B7280'),
          logo: z.string().url().optional(),
          favicon: z.string().url().optional(),
        })
        .optional(),
      features: z
        .object({
          twoFactorAuth: z.boolean().default(true),
          sso: z.boolean().default(false),
          auditLogs: z.boolean().default(true),
          apiAccess: z.boolean().default(true),
        })
        .optional(),
      limits: z
        .object({
          maxUsers: z.number().min(1).default(100),
          maxStorage: z.number().min(1).default(1024), // MB
          maxApiRequests: z.number().min(1).default(10000),
        })
        .optional(),
      branding: z
        .object({
          companyName: z.string().max(100).optional(),
          supportEmail: z.string().email().optional(),
          supportPhone: z.string().optional(),
          termsOfService: z.string().url().optional(),
          privacyPolicy: z.string().url().optional(),
        })
        .optional(),
    })
    .optional(),
  loginRestrictions: z
    .object({
      allowedDomains: z.array(z.string().email()).default([]),
      maxUsers: z.number().min(1).optional(),
      allowedIpRanges: z.array(z.string()).default([]),
      requireApproval: z.boolean().default(false),
    })
    .optional(),
  subscription: z
    .object({
      plan: z
        .enum(['free', 'basic', 'professional', 'enterprise'])
        .default('free'),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      autoRenew: z.boolean().default(true),
    })
    .optional(),
});

// Update tenant schema
export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name must be less than 100 characters')
    .optional(),
  slug: z
    .string()
    .min(1, 'Tenant slug is required')
    .max(50, 'Tenant slug must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Tenant slug can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  domain: z.string().url().optional(),
  isActive: z.boolean().optional(),
  settings: z
    .object({
      theme: z
        .object({
          primaryColor: z
            .string()
            .regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color')
            .optional(),
          secondaryColor: z
            .string()
            .regex(
              /^#[0-9A-F]{6}$/i,
              'Secondary color must be a valid hex color'
            )
            .optional(),
          logo: z.string().url().optional(),
          favicon: z.string().url().optional(),
        })
        .optional(),
      features: z
        .object({
          twoFactorAuth: z.boolean().optional(),
          sso: z.boolean().optional(),
          auditLogs: z.boolean().optional(),
          apiAccess: z.boolean().optional(),
        })
        .optional(),
      limits: z
        .object({
          maxUsers: z.number().min(1).optional(),
          maxStorage: z.number().min(1).optional(),
          maxApiRequests: z.number().min(1).optional(),
        })
        .optional(),
      branding: z
        .object({
          companyName: z.string().max(100).optional(),
          supportEmail: z.string().email().optional(),
          supportPhone: z.string().optional(),
          termsOfService: z.string().url().optional(),
          privacyPolicy: z.string().url().optional(),
        })
        .optional(),
    })
    .optional(),
  loginRestrictions: z
    .object({
      allowedDomains: z.array(z.string().email()).optional(),
      maxUsers: z.number().min(1).optional(),
      allowedIpRanges: z.array(z.string()).optional(),
      requireApproval: z.boolean().optional(),
    })
    .optional(),
  subscription: z
    .object({
      plan: z.enum(['free', 'basic', 'professional', 'enterprise']).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      autoRenew: z.boolean().optional(),
    })
    .optional(),
});

// Tenant list query schema
export const tenantListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']).optional(),
  sortBy: z
    .enum(['name', 'slug', 'domain', 'createdAt', 'userCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Tenant ID parameter schema
export const tenantIdParamSchema = z.object({
  id: z.string().min(1, 'Tenant ID is required'),
});

// Tenant slug parameter schema
export const tenantSlugParamSchema = z.object({
  slug: z.string().min(1, 'Tenant slug is required'),
});

// Tenant domain parameter schema
export const tenantDomainParamSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

// Tenant settings update schema
export const updateTenantSettingsSchema = z.object({
  settings: z.object({
    theme: z
      .object({
        primaryColor: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color')
          .optional(),
        secondaryColor: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i, 'Secondary color must be a valid hex color')
          .optional(),
        logo: z.string().url().optional(),
        favicon: z.string().url().optional(),
      })
      .optional(),
    features: z
      .object({
        twoFactorAuth: z.boolean().optional(),
        sso: z.boolean().optional(),
        auditLogs: z.boolean().optional(),
        apiAccess: z.boolean().optional(),
      })
      .optional(),
    limits: z
      .object({
        maxUsers: z.number().min(1).optional(),
        maxStorage: z.number().min(1).optional(),
        maxApiRequests: z.number().min(1).optional(),
      })
      .optional(),
    branding: z
      .object({
        companyName: z.string().max(100).optional(),
        supportEmail: z.string().email().optional(),
        supportPhone: z.string().optional(),
        termsOfService: z.string().url().optional(),
        privacyPolicy: z.string().url().optional(),
      })
      .optional(),
  }),
});

// Tenant subscription update schema
export const updateTenantSubscriptionSchema = z.object({
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().default(true),
});

// Tenant login restrictions schema
export const updateTenantLoginRestrictionsSchema = z.object({
  allowedDomains: z.array(z.string().email()).default([]),
  maxUsers: z.number().min(1).optional(),
  allowedIpRanges: z.array(z.string()).default([]),
  requireApproval: z.boolean().default(false),
});

// Tenant statistics query schema
export const tenantStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Tenant export schema
export const tenantExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  includeUsers: z.boolean().default(false),
  includeSettings: z.boolean().default(false),
  includeStats: z.boolean().default(false),
});

// Tenant import schema
export const tenantImportSchema = z.object({
  tenants: z.array(
    z.object({
      name: z.string().min(1, 'Tenant name is required'),
      slug: z.string().min(1, 'Tenant slug is required'),
      domain: z.string().url().optional(),
      isActive: z.boolean().default(true),
      settings: z.record(z.string(), z.any()).optional(),
    })
  ),
  createUsers: z.boolean().default(false),
  sendWelcomeEmail: z.boolean().default(false),
});

// Tenant backup schema
export const tenantBackupSchema = z.object({
  includeUsers: z.boolean().default(true),
  includeSettings: z.boolean().default(true),
  includeData: z.boolean().default(true),
  format: z.enum(['json', 'sql']).default('json'),
});

// Tenant restore schema
export const tenantRestoreSchema = z.object({
  backupData: z.string().min(1, 'Backup data is required'),
  overwrite: z.boolean().default(false),
  validateOnly: z.boolean().default(false),
});

// Export types
export type CreateTenantRequest = z.infer<typeof createTenantSchema>;
export type UpdateTenantRequest = z.infer<typeof updateTenantSchema>;
export type TenantListQuery = z.infer<typeof tenantListQuerySchema>;
export type TenantIdParam = z.infer<typeof tenantIdParamSchema>;
export type TenantSlugParam = z.infer<typeof tenantSlugParamSchema>;
export type TenantDomainParam = z.infer<typeof tenantDomainParamSchema>;
export type UpdateTenantSettingsRequest = z.infer<
  typeof updateTenantSettingsSchema
>;
export type UpdateTenantSubscriptionRequest = z.infer<
  typeof updateTenantSubscriptionSchema
>;
export type UpdateTenantLoginRestrictionsRequest = z.infer<
  typeof updateTenantLoginRestrictionsSchema
>;
export type TenantStatsQuery = z.infer<typeof tenantStatsQuerySchema>;
export type TenantExport = z.infer<typeof tenantExportSchema>;
export type TenantImport = z.infer<typeof tenantImportSchema>;
export type TenantBackup = z.infer<typeof tenantBackupSchema>;
export type TenantRestore = z.infer<typeof tenantRestoreSchema>;
