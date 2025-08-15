import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

// TypeScript interfaces for permission objects and scope definitions
export interface Permission {
  moduleId: string;
  moduleName: string;
  submoduleId?: string;
  submoduleName?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

export interface UserPermissions {
  userId: string;
  isSuperadmin: boolean;
  tenantId?: string;
  permissions: Permission[];
  accessibleTenants?: string[];
}

export interface DataScope {
  scope: 'all' | 'tenant' | 'own';
  tenantId?: string;
  userId?: string;
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  isGlobal: boolean;
  tenantId?: string;
  permissions: Permission[];
}

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'view_all';

// In-memory cache for frequent permission lookups
const permissionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Get aggregated permissions from all user roles
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      const cacheKey = `user_permissions_${userId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as UserPermissions;
      }

      // Get user with roles
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      module: true,
                      submodule: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Superadmin bypass - return full permissions
      if (user.isSuperadmin) {
        const allModules = await prisma.module.findMany({
          include: {
            submodules: true,
          },
        });

        const superadminPermissions: Permission[] = allModules.flatMap(module =>
          module.submodules.map(submodule => ({
            moduleId: module.id,
            moduleName: module.name,
            submoduleId: submodule.id,
            submoduleName: submodule.name,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canViewAll: true,
          }))
        );

        // Add module-level permissions (without submodules)
        allModules.forEach(module => {
          superadminPermissions.push({
            moduleId: module.id,
            moduleName: module.name,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canViewAll: true,
          });
        });

        const result: UserPermissions = {
          userId: user.id,
          isSuperadmin: true,
          tenantId: user.tenantId || undefined,
          permissions: superadminPermissions,
          accessibleTenants: await this.getAccessibleTenants(userId),
        };

        this.setCache(cacheKey, result);
        return result;
      }

      // Get permissions from all user roles
      const rolePermissions = user.userRoles.flatMap(userRole =>
        userRole.role.rolePermissions.map(rp => ({
          roleId: userRole.role.id,
          roleName: userRole.role.name,
          isGlobal: userRole.role.isGlobal,
          tenantId: userRole.role.tenantId || undefined,
          permission: {
            moduleId: rp.module.id,
            moduleName: rp.module.name,
            submoduleId: rp.submodule?.id,
            submoduleName: rp.submodule?.name,
            canCreate: rp.canCreate,
            canRead: rp.canRead,
            canUpdate: rp.canUpdate,
            canDelete: rp.canDelete,
            canViewAll: rp.canViewAll,
          },
        }))
      );

      // Resolve effective permissions by merging permissions from multiple roles
      const effectivePermissions =
        this.resolveEffectivePermissions(rolePermissions);

      const result: UserPermissions = {
        userId: user.id,
        isSuperadmin: false,
        tenantId: user.tenantId || undefined,
        permissions: effectivePermissions,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error getting user permissions: ${errorMessage}`);
      throw new Error(`Failed to get user permissions: ${errorMessage}`);
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    moduleKey: string,
    action: PermissionAction,
    submoduleKey?: string
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      // Superadmin bypass
      if (userPermissions.isSuperadmin) {
        return true;
      }

      // Find module by key (name or id)
      const module = await prisma.module.findFirst({
        where: {
          OR: [{ id: moduleKey }, { name: moduleKey }],
        },
      });

      if (!module) {
        logger.warn(`Module not found: ${moduleKey}`);
        return false;
      }

      // Find matching permission
      const permission = userPermissions.permissions.find(p => {
        const moduleMatch =
          p.moduleId === module.id || p.moduleName === module.name;

        if (submoduleKey) {
          // Check submodule permission
          return (
            moduleMatch &&
            (p.submoduleId === submoduleKey || p.submoduleName === submoduleKey)
          );
        } else {
          // Check module-level permission (no submodule specified)
          return moduleMatch && !p.submoduleId;
        }
      });

      if (!permission) {
        return false;
      }

      // Check specific action
      switch (action) {
        case 'create':
          return permission.canCreate;
        case 'read':
          return permission.canRead;
        case 'update':
          return permission.canUpdate;
        case 'delete':
          return permission.canDelete;
        case 'view_all':
          return permission.canViewAll;
        default:
          return false;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error checking permission: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get data scope for user in specific module
   */
  async getDataScope(userId: string, moduleKey: string): Promise<DataScope> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      // Superadmin can view all data
      if (userPermissions.isSuperadmin) {
        return { scope: 'all' };
      }

      // Find module by key
      const module = await prisma.module.findFirst({
        where: {
          OR: [{ id: moduleKey }, { name: moduleKey }],
        },
      });

      if (!module) {
        throw new Error(`Module not found: ${moduleKey}`);
      }

      // Find module-level permission
      const permission = userPermissions.permissions.find(
        p =>
          (p.moduleId === module.id || p.moduleName === module.name) &&
          !p.submoduleId
      );

      if (!permission) {
        return { scope: 'own', userId };
      }

      // Determine scope based on canViewAll permission
      if (permission.canViewAll) {
        return { scope: 'tenant', tenantId: userPermissions.tenantId };
      } else {
        return { scope: 'own', userId };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error getting data scope: ${errorMessage}`);
      return { scope: 'own', userId };
    }
  }

  /**
   * Resolve effective permissions by merging permissions from multiple roles
   */
  resolveEffectivePermissions(
    rolePermissions: Array<{
      roleId: string;
      roleName: string;
      isGlobal: boolean;
      tenantId?: string;
      permission: Permission;
    }>
  ): Permission[] {
    const permissionMap = new Map<string, Permission>();

    for (const rolePermission of rolePermissions) {
      const key = `${rolePermission.permission.moduleId}_${rolePermission.permission.submoduleId || 'module'}`;

      const existing = permissionMap.get(key);
      if (existing) {
        // Merge permissions (union of permissions)
        permissionMap.set(key, {
          ...existing,
          canCreate: existing.canCreate || rolePermission.permission.canCreate,
          canRead: existing.canRead || rolePermission.permission.canRead,
          canUpdate: existing.canUpdate || rolePermission.permission.canUpdate,
          canDelete: existing.canDelete || rolePermission.permission.canDelete,
          canViewAll:
            existing.canViewAll || rolePermission.permission.canViewAll,
        });
      } else {
        permissionMap.set(key, rolePermission.permission);
      }
    }

    return Array.from(permissionMap.values());
  }

  /**
   * Get accessible tenants for superadmin
   */
  async getAccessibleTenants(userId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperadmin: true },
      });

      if (!user?.isSuperadmin) {
        return [];
      }

      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      return tenants.map(tenant => tenant.id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error getting accessible tenants: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Validate permissions with proper error handling
   */
  async validatePermissions(
    userId: string,
    requiredPermissions: Array<{
      moduleKey: string;
      action: PermissionAction;
      submoduleKey?: string;
    }>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const permission of requiredPermissions) {
      const hasPermission = await this.hasPermission(
        userId,
        permission.moduleKey,
        permission.action,
        permission.submoduleKey
      );

      if (!hasPermission) {
        const submoduleText = permission.submoduleKey
          ? ` (${permission.submoduleKey})`
          : '';
        errors.push(
          `Missing ${permission.action} permission for ${permission.moduleKey}${submoduleText}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get user's roles with their permissions
   */
  async getUserRoles(userId: string): Promise<RolePermission[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  module: true,
                  submodule: true,
                },
              },
            },
          },
        },
      });

      return userRoles.map(userRole => ({
        roleId: userRole.role.id,
        roleName: userRole.role.name,
        isGlobal: userRole.role.isGlobal,
        tenantId: userRole.role.tenantId || undefined,
        permissions: userRole.role.rolePermissions.map(rp => ({
          moduleId: rp.module.id,
          moduleName: rp.module.name,
          submoduleId: rp.submodule?.id,
          submoduleName: rp.submodule?.name,
          canCreate: rp.canCreate,
          canRead: rp.canRead,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
          canViewAll: rp.canViewAll,
        })),
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error getting user roles: ${errorMessage}`);
      throw new Error(`Failed to get user roles: ${errorMessage}`);
    }
  }

  /**
   * Check if user is superadmin
   */
  async isUserSuperadmin(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperadmin: true },
      });

      return user?.isSuperadmin || false;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error checking superadmin status: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get modules accessible to user
   */
  async getAccessibleModules(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      submodules: Array<{
        id: string;
        name: string;
        description?: string;
      }>;
    }>
  > {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      // Superadmin can access all modules
      if (userPermissions.isSuperadmin) {
        const allModules = await prisma.module.findMany({
          where: { isActive: true },
          include: {
            submodules: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        });

        return allModules.map(module => ({
          id: module.id,
          name: module.name,
          description: module.description || undefined,
          submodules: module.submodules.map(submodule => ({
            id: submodule.id,
            name: submodule.name,
            description: submodule.description || undefined,
          })),
        }));
      }

      // Get modules where user has at least read permission
      const accessibleModuleIds = new Set(
        userPermissions.permissions.filter(p => p.canRead).map(p => p.moduleId)
      );

      const modules = await prisma.module.findMany({
        where: {
          id: { in: Array.from(accessibleModuleIds) },
          isActive: true,
        },
        include: {
          submodules: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      return modules.map(module => ({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        submodules: module.submodules.map(submodule => ({
          id: submodule.id,
          name: submodule.name,
          description: submodule.description || undefined,
        })),
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error getting accessible modules: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Clear permission cache for user
   */
  clearUserCache(userId: string): void {
    const cacheKey = `user_permissions_${userId}`;
    permissionCache.delete(cacheKey);
  }

  /**
   * Clear permission cache for user (alias for clearUserCache)
   */
  clearUserPermissionCache(userId: string): void {
    this.clearUserCache(userId);
  }

  /**
   * Clear all permission cache
   */
  clearAllCache(): void {
    permissionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(permissionCache.entries()).map(
      ([key, value]) => ({
        key,
        age: now - value.timestamp,
      })
    );

    return {
      size: permissionCache.size,
      entries,
    };
  }

  // Private cache methods
  private getFromCache(key: string): any | null {
    const cached = permissionCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL) {
      permissionCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    permissionCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();
