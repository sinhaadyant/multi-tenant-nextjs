import fs from "fs";
import path from "path";

export interface UserCredentials {
  email: string;
  password: string;
  name: string;
  role: string;
  isSuperadmin: boolean;
  tenantId?: string;
  tenantName?: string;
  tenantDomain?: string;
  permissions: Record<
    string,
    Record<
      string,
      {
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
        canViewAll: boolean;
      }
    >
  >;
}

export interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  slug: string;
  loginRestrictions: {
    allowedDomains: string[];
    maxUsers: number;
  };
  status: string;
}

export interface TestCredentials {
  users: Record<string, UserCredentials>;
  tenants: Record<string, TenantInfo>;
  roles: Record<string, any>;
  modules: Record<string, any>;
  testData: {
    supportTickets: any[];
    invalidCredentials: Record<string, { email: string; password: string }>;
  };
}

export class CredentialsHelper {
  private credentials: TestCredentials;

  constructor() {
    // Load credentials from the root directory
    const credentialsPath = path.join(
      __dirname,
      "../../../tests/e2e/test-credentials.json"
    );
    const credentialsData = fs.readFileSync(credentialsPath, "utf8");
    this.credentials = JSON.parse(credentialsData);
  }

  getUser(userKey: string): UserCredentials {
    const user = this.credentials.users[userKey];
    if (!user) {
      throw new Error(`User with key '${userKey}' not found in credentials`);
    }
    return user;
  }

  getTenant(tenantKey: string): TenantInfo {
    const tenant = this.credentials.tenants[tenantKey];
    if (!tenant) {
      throw new Error(
        `Tenant with key '${tenantKey}' not found in credentials`
      );
    }
    return tenant;
  }

  getSuperadmin(): UserCredentials {
    return this.getUser("superadmin");
  }

  getTenantAdmin(tenantKey: string): UserCredentials {
    const tenant = this.getTenant(tenantKey);
    const adminKey = `tenant${tenantKey.charAt(0).toUpperCase() + tenantKey.slice(1)}Admin`;
    return this.getUser(adminKey);
  }

  getTenantUser(tenantKey: string, userIndex: number = 1): UserCredentials {
    const tenant = this.getTenant(tenantKey);
    const userKey = `tenant${tenantKey.charAt(0).toUpperCase() + tenantKey.slice(1)}User${userIndex > 1 ? userIndex : ""}`;
    return this.getUser(userKey);
  }

  getInvalidCredentials(type: string): { email: string; password: string } {
    const invalidCreds = this.credentials.testData.invalidCredentials[type];
    if (!invalidCreds) {
      throw new Error(`Invalid credentials type '${type}' not found`);
    }
    return invalidCreds;
  }

  getSupportTickets(): any[] {
    return this.credentials.testData.supportTickets;
  }

  getAllUsers(): UserCredentials[] {
    return Object.values(this.credentials.users);
  }

  getAllTenants(): TenantInfo[] {
    return Object.values(this.credentials.tenants);
  }

  getUserByEmail(email: string): UserCredentials | null {
    return this.getAllUsers().find(user => user.email === email) || null;
  }

  getUsersByRole(role: string): UserCredentials[] {
    return this.getAllUsers().filter(user => user.role === role);
  }

  getUsersByTenant(tenantId: string): UserCredentials[] {
    return this.getAllUsers().filter(user => user.tenantId === tenantId);
  }

  hasPermission(
    userKey: string,
    module: string,
    submodule: string,
    action: "canCreate" | "canRead" | "canUpdate" | "canDelete" | "canViewAll"
  ): boolean {
    const user = this.getUser(userKey);
    const modulePerms = user.permissions[module];
    if (!modulePerms) return false;

    const submodulePerms = modulePerms[submodule];
    if (!submodulePerms) return false;

    return submodulePerms[action] || false;
  }

  canAccessModule(userKey: string, module: string): boolean {
    const user = this.getUser(userKey);
    return !!user.permissions[module];
  }

  canAccessSubmodule(
    userKey: string,
    module: string,
    submodule: string
  ): boolean {
    const user = this.getUser(userKey);
    const modulePerms = user.permissions[module];
    if (!modulePerms) return false;

    return !!modulePerms[submodule];
  }

  getModulePermissions(
    userKey: string,
    module: string
  ): Record<string, any> | null {
    const user = this.getUser(userKey);
    return user.permissions[module] || null;
  }

  isSuperadmin(userKey: string): boolean {
    const user = this.getUser(userKey);
    return user.isSuperadmin;
  }

  isTenantAdmin(userKey: string): boolean {
    const user = this.getUser(userKey);
    return user.role === "Tenant Admin";
  }

  isTenantUser(userKey: string): boolean {
    const user = this.getUser(userKey);
    return user.role === "Tenant User";
  }

  getTenantForUser(userKey: string): TenantInfo | null {
    const user = this.getUser(userKey);
    if (!user.tenantId) return null;

    return (
      this.getAllTenants().find(tenant => tenant.id === user.tenantId) || null
    );
  }

  // Helper methods for common test scenarios
  getAdminForTenant(tenantKey: string): UserCredentials {
    return this.getTenantAdmin(tenantKey);
  }

  getRegularUserForTenant(tenantKey: string): UserCredentials {
    return this.getTenantUser(tenantKey);
  }

  getUsersWithPermission(
    module: string,
    submodule: string,
    action: "canCreate" | "canRead" | "canUpdate" | "canDelete" | "canViewAll"
  ): UserCredentials[] {
    return this.getAllUsers().filter(user => {
      const modulePerms = user.permissions[module];
      if (!modulePerms) return false;

      const submodulePerms = modulePerms[submodule];
      if (!submodulePerms) return false;

      return submodulePerms[action] || false;
    });
  }

  getUsersWithoutPermission(
    module: string,
    submodule: string,
    action: "canCreate" | "canRead" | "canUpdate" | "canDelete" | "canViewAll"
  ): UserCredentials[] {
    return this.getAllUsers().filter(user => {
      const modulePerms = user.permissions[module];
      if (!modulePerms) return true;

      const submodulePerms = modulePerms[submodule];
      if (!submodulePerms) return true;

      return !submodulePerms[action];
    });
  }

  // Test data generation helpers
  generateTestUser(overrides: Partial<UserCredentials> = {}): UserCredentials {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    return {
      email: `test-${timestamp}-${randomId}@example.com`,
      password: "TestPassword123!",
      name: `Test User ${timestamp}`,
      role: "Tenant User",
      isSuperadmin: false,
      tenantId: "tenant-a",
      tenantName: "Tenant A",
      tenantDomain: "tenant-a.example.com",
      permissions: {
        Dashboard: {
          Overview: {
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
          Analytics: {
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
        },
        UserManagement: {
          UserList: {
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
          UserProfile: {
            canCreate: false,
            canRead: true,
            canUpdate: true,
            canDelete: false,
            canViewAll: false,
          },
        },
        Support: {
          Tickets: {
            canCreate: true,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
          KnowledgeBase: {
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
        },
      },
      ...overrides,
    };
  }

  generateTestTenant(overrides: Partial<TenantInfo> = {}): TenantInfo {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    return {
      id: `test-tenant-${timestamp}-${randomId}`,
      name: `Test Tenant ${timestamp}`,
      domain: `test-tenant-${timestamp}-${randomId}.example.com`,
      slug: `test-tenant-${timestamp}-${randomId}`,
      loginRestrictions: {
        allowedDomains: [`test-tenant-${timestamp}-${randomId}.com`],
        maxUsers: 50,
      },
      status: "active",
      ...overrides,
    };
  }
}

// Export singleton instance
export const credentialsHelper = new CredentialsHelper();
