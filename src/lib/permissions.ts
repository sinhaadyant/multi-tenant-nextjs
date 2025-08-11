import { prisma } from './prisma';

export interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  userRoles: {
    role: {
      id: string;
      name: string;
      isActive: boolean;
      permissions: {
        permission: {
          id: string;
          name: string;
          moduleKey: string;
          action: string;
          resource?: string;
          isActive: boolean;
        };
      }[];
    };
  }[];
}

/**
 * Check if a user has a specific permission within a tenant
 * @param user - User object with roles and permissions
 * @param tenantId - Tenant ID to check permissions for
 * @param permissionName - Permission name to check (e.g., 'modules.view')
 * @returns Promise<boolean> - True if user has permission
 */
export async function checkTenantPermission(
  user: UserWithRoles,
  tenantId: string,
  permissionName: string
): Promise<boolean> {
  // Superadmin bypass (if implemented)
  if (user.tenantId === null) {
    return true; // Superadmin has all permissions
  }

  // Check if user belongs to the tenant
  if (user.tenantId !== tenantId) {
    return false;
  }

  // Get user's active roles
  const activeRoles = user.userRoles.filter(ur => ur.role.isActive);
  
  if (activeRoles.length === 0) {
    return false;
  }

  // Check if any role has the required permission
  for (const userRole of activeRoles) {
    const role = userRole.role;
    
    // Check role permissions
    for (const rolePermission of role.permissions) {
      const permission = rolePermission.permission;
      
      if (permission.isActive && permission.name === permissionName) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a user has a specific permission within a tenant by user ID and tenant slug
 * @param userId - User ID to check permissions for
 * @param tenantSlug - Tenant slug to check permissions for
 * @param moduleKey - Module key (e.g., 'notifications')
 * @param action - Action to check (e.g., 'view', 'create')
 * @returns Promise<boolean> - True if user has permission
 */
export async function checkTenantPermissionById(
  userId: string,
  tenantSlug: string,
  moduleKey: string,
  action: string
): Promise<boolean> {
  try {
    // Get tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug, isActive: true }
    });

    if (!tenant) {
      return false;
    }

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId, tenantId: tenant.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return false;
    }

    // Check if any role has the required permission
    for (const userRole of user.userRoles) {
      const role = userRole.role;
      
      if (!role.isActive) continue;
      
      // Check role permissions
      for (const rolePermission of role.permissions) {
        const permission = rolePermission.permission;
        
        if (permission.isActive && 
            permission.moduleKey === moduleKey && 
            permission.action === action) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking tenant permission:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * @param user - User object with roles and permissions
 * @param tenantId - Tenant ID to check permissions for
 * @param permissionNames - Array of permission names to check
 * @returns Promise<boolean> - True if user has any of the permissions
 */
export async function checkAnyTenantPermission(
  user: UserWithRoles,
  tenantId: string,
  permissionNames: string[]
): Promise<boolean> {
  for (const permissionName of permissionNames) {
    if (await checkTenantPermission(user, tenantId, permissionName)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a user has all of the specified permissions
 * @param user - User object with roles and permissions
 * @param tenantId - Tenant ID to check permissions for
 * @param permissionNames - Array of permission names to check
 * @returns Promise<boolean> - True if user has all permissions
 */
export async function checkAllTenantPermissions(
  user: UserWithRoles,
  tenantId: string,
  permissionNames: string[]
): Promise<boolean> {
  for (const permissionName of permissionNames) {
    if (!(await checkTenantPermission(user, tenantId, permissionName))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for a user within a tenant
 * @param user - User object with roles and permissions
 * @param tenantId - Tenant ID to get permissions for
 * @returns Promise<string[]> - Array of permission names
 */
export async function getUserTenantPermissions(
  user: UserWithRoles,
  tenantId: string
): Promise<string[]> {
  if (user.tenantId !== tenantId) {
    return [];
  }

  const permissions = new Set<string>();
  
  const activeRoles = user.userRoles.filter(ur => ur.role.isActive);
  
  for (const userRole of activeRoles) {
    const role = userRole.role;
    
    for (const rolePermission of role.permissions) {
      const permission = rolePermission.permission;
      
      if (permission.isActive) {
        permissions.add(permission.name);
      }
    }
  }

  return Array.from(permissions);
}

/**
 * Get user with roles and permissions from database
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns Promise<UserWithRoles | null> - User object with roles and permissions
 */
export async function getUserWithRoles(
  userId: string,
  tenantId: string
): Promise<UserWithRoles | null> {
  return await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: tenantId
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });
}

/**
 * Get user with roles and permissions by email
 * @param email - User email
 * @param tenantId - Tenant ID
 * @returns Promise<UserWithRoles | null> - User object with roles and permissions
 */
export async function getUserWithRolesByEmail(
  email: string,
  tenantId: string
): Promise<UserWithRoles | null> {
  return await prisma.user.findFirst({
    where: {
      email: email,
      tenantId: tenantId
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });
}

// Module-specific permission constants
export const MODULE_PERMISSIONS = {
  VIEW_MODULES: 'modules.view',
  ENABLE_DISABLE_MODULES: 'modules.enable_disable',
  MANAGE_MODULE_VERSIONS: 'modules.manage_versions',
  VIEW_MODULE_ANALYTICS: 'modules.view_analytics'
} as const;

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  MODULE_MANAGEMENT: 'Module Management',
  USER_MANAGEMENT: 'User Management',
  ROLE_MANAGEMENT: 'Role Management',
  SETTINGS: 'Settings',
  ANALYTICS: 'Analytics',
  COMMUNICATION: 'Communication',
  FILES: 'Files',
  SUPPORT: 'Support',
  API: 'API'
} as const; 