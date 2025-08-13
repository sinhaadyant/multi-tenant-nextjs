import { TenantRepository } from '@/repositories/tenantRepository';
import { AuditRepository } from '@/repositories/auditRepository';
import {
  CreateTenantInput,
  UpdateTenantInput,
  TenantListParams,
  TenantSettings,
} from '@/validation/tenantValidation';

// Default system settings
const DEFAULT_SYSTEM_SETTINGS: TenantSettings = {
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    logo: '/images/default-logo.png',
  },
  features: {
    enableNotifications: true,
    enableAuditLog: true,
    enableDeviceTracking: true,
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
  },
};

export class TenantService {
  private tenantRepository: TenantRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create a new tenant
   */
  async createTenant(
    data: CreateTenantInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if tenant with domain already exists
    if (data.domain) {
      const existingTenant = await this.tenantRepository.findByDomain(
        data.domain
      );
      if (existingTenant) {
        throw new Error('Tenant with this domain already exists');
      }
    }

    // Create tenant
    const tenant = await this.tenantRepository.create(data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'TENANT_CREATED',
        '127.0.0.1',
        { tenantId: tenant.id, name: tenant.name, domain: tenant.domain }
      );
    }

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string): Promise<any> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return tenant;
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<any> {
    const tenant = await this.tenantRepository.findByDomain(domain);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return tenant;
  }

  /**
   * List tenants with filters, pagination, and search
   */
  async listTenants(
    params: TenantListParams
  ): Promise<{ tenants: any[]; total: number; meta: any }> {
    const { page, limit, filters, orderBy, orderDirection } = params;

    // Build orderBy object
    const orderByObj = { [orderBy]: orderDirection };

    // Get tenants and total count
    const [tenants, total] = await Promise.all([
      this.tenantRepository.findMany({
        page,
        limit,
        filters,
        orderBy: orderByObj,
      }),
      this.tenantRepository.count(filters),
    ]);

    return {
      tenants,
      total,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update tenant
   */
  async updateTenant(
    id: string,
    data: UpdateTenantInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if tenant exists
    const existingTenant = await this.tenantRepository.findById(id);
    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    // Check if domain is being updated and if it's already taken
    if (data.domain && data.domain !== existingTenant.domain) {
      const tenantWithDomain = await this.tenantRepository.findByDomain(
        data.domain
      );
      if (tenantWithDomain && tenantWithDomain.id !== id) {
        throw new Error('Domain is already taken');
      }
    }

    // Update tenant
    const tenant = await this.tenantRepository.update(id, data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        tenant.id,
        'TENANT_UPDATED',
        '127.0.0.1',
        { tenantId: tenant.id, updatedFields: Object.keys(data) }
      );
    }

    return tenant;
  }

  /**
   * Delete tenant
   */
  async deleteTenant(id: string, auditUserId?: string): Promise<any> {
    // Check if tenant exists
    const existingTenant = await this.tenantRepository.findById(id);
    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    // Check if tenant has users
    if (existingTenant.users && existingTenant.users.length > 0) {
      throw new Error('Cannot delete tenant with existing users');
    }

    // Delete tenant
    const tenant = await this.tenantRepository.delete(id);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        tenant.id,
        'TENANT_DELETED',
        '127.0.0.1',
        { tenantId: tenant.id, name: tenant.name }
      );
    }

    return tenant;
  }

  /**
   * Get tenant with users
   */
  async getTenantWithUsers(id: string): Promise<any> {
    const tenant = await this.tenantRepository.getTenantWithUsers(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return tenant;
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(id: string): Promise<any> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return this.tenantRepository.getTenantStats(id);
  }

  /**
   * Get tenant with merged settings
   */
  async getTenantWithSettings(id: string): Promise<any> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Merge tenant settings with system defaults
    const mergedSettings = this.mergeTenantSettings(tenant.loginRestrictions);

    return {
      ...tenant,
      settings: mergedSettings,
    };
  }

  /**
   * Update tenant settings
   */
  async updateTenantSettings(
    id: string,
    settings: TenantSettings,
    auditUserId?: string
  ): Promise<any> {
    // Check if tenant exists
    const existingTenant = await this.tenantRepository.findById(id);
    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    // Update tenant with new settings
    const tenant = await this.tenantRepository.update(id, {
      loginRestrictions: settings,
    });

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        tenant.id,
        'TENANT_SETTINGS_UPDATED',
        '127.0.0.1',
        { tenantId: tenant.id, settings }
      );
    }

    return tenant;
  }

  /**
   * Get system default settings
   */
  getSystemDefaultSettings(): TenantSettings {
    return DEFAULT_SYSTEM_SETTINGS;
  }

  /**
   * Merge tenant settings with system defaults
   */
  private mergeTenantSettings(tenantSettings: any): TenantSettings {
    if (!tenantSettings) {
      return DEFAULT_SYSTEM_SETTINGS;
    }

    // Deep merge tenant settings with system defaults
    const mergedSettings = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SETTINGS));

    // Merge theme settings
    if (tenantSettings.theme) {
      mergedSettings.theme = {
        ...mergedSettings.theme,
        ...tenantSettings.theme,
      };
    }

    // Merge feature settings
    if (tenantSettings.features) {
      mergedSettings.features = {
        ...mergedSettings.features,
        ...tenantSettings.features,
      };
    }

    // Merge security settings
    if (tenantSettings.security) {
      mergedSettings.security = {
        ...mergedSettings.security,
        ...tenantSettings.security,
      };

      // Merge password policy
      if (tenantSettings.security.passwordPolicy) {
        mergedSettings.security.passwordPolicy = {
          ...mergedSettings.security.passwordPolicy,
          ...tenantSettings.security.passwordPolicy,
        };
      }
    }

    return mergedSettings;
  }

  /**
   * Validate tenant access for user
   */
  async validateTenantAccess(
    tenantId: string,
    userId: string
  ): Promise<boolean> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant || !tenant.isActive) {
      return false;
    }

    // Check if user belongs to this tenant
    const user = await this.tenantRepository.getTenantWithUsers(tenantId);
    if (!user) {
      return false;
    }

    const userBelongsToTenant = user.users.some((u: any) => u.id === userId);
    return userBelongsToTenant;
  }

  /**
   * Get all active tenants
   */
  async getActiveTenants(): Promise<any[]> {
    return this.tenantRepository.findMany({
      filters: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get tenant by slug (domain or custom slug)
   */
  async getTenantBySlug(slug: string): Promise<any> {
    // Try to find by domain first
    let tenant = await this.tenantRepository.findByDomain(slug);

    if (!tenant) {
      // If not found by domain, try to find by name (case-insensitive)
      const tenants = await this.tenantRepository.findMany({
        filters: { search: slug },
      });

      tenant = tenants.find(
        (t: any) =>
          t.name.toLowerCase() === slug.toLowerCase() ||
          t.domain?.toLowerCase() === slug.toLowerCase()
      );
    }

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  /**
   * Get tenant statistics for all tenants
   */
  async getAllTenantStats(): Promise<any> {
    const tenants = await this.tenantRepository.findMany();
    const stats = await Promise.all(
      tenants.map(async (tenant: any) => {
        const tenantStats = await this.tenantRepository.getTenantStats(
          tenant.id
        );
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          ...tenantStats,
        };
      })
    );

    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t: any) => t.isActive).length,
      inactiveTenants: tenants.filter((t: any) => !t.isActive).length,
      tenantDetails: stats,
    };
  }
}
