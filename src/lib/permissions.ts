import { prisma } from '@/lib/prisma';

export interface EffectivePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

export interface UserPermissions {
  userId: string;
  tenantId?: string;
  roles: {
    id: string;
    name: string;
    tenantId?: string;
    isGlobal: boolean;
    permissions: {
      moduleKey: string;
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canViewAll: boolean;
    }[];
  }[];
}

/**
 * Check if user has a specific permission for a tenant
 * This function checks if the user has the specific permission for the given module and action
 */
export async function checkTenantPermission(
  user: any,
  tenantId: string,
  permissionKey: string
): Promise<boolean> {
  try {
    // For modules endpoint, allow access if user has any permissions at all
    if (permissionKey === 'modules.view') {
      // Check if user has any permissions
      for (const userRole of user.userRoles) {
        const role = userRole.role;
        
        if (role.permissions && role.permissions.length > 0) {
          return true;
        }
      }
      return false;
    }
    
    // For other permissions, check specific module and action
    const [moduleKey, action] = permissionKey.split('.');
    
    // Map module keys to handle different naming conventions
    const moduleKeyMapping: { [key: string]: string[] } = {
      'users': ['users', 'user-management'],
      'roles': ['roles', 'roles-permissions'],
      'audit': ['audit', 'audit-logs'],
      'reports': ['reports', 'reports-analytics'],
      'analytics': ['analytics', 'reports-analytics'],
      'notifications': ['notifications'],
      'content': ['content', 'content-management'],
      'support': ['support'],
      'profile': ['profile'],
      'dashboard': ['dashboard']
    };
    
    // Get the possible module keys for this permission
    const possibleModuleKeys = moduleKeyMapping[moduleKey] || [moduleKey];
    
    // Check if user has the specific permission for any of the possible module keys
    for (const userRole of user.userRoles) {
      const role = userRole.role;
      
      for (const rolePermission of role.permissions) {
        if (possibleModuleKeys.includes(rolePermission.moduleKey)) {
          // Check the specific action
          switch (action) {
            case 'view':
            case 'read':
              if (rolePermission.canRead) return true;
              break;
            case 'create':
              if (rolePermission.canCreate) return true;
              break;
            case 'update':
            case 'edit':
              if (rolePermission.canUpdate) return true;
              break;
            case 'delete':
              if (rolePermission.canDelete) return true;
              break;
            case 'viewAll':
              if (rolePermission.canViewAll) return true;
              break;
            default:
              // If no specific action or unknown action, check if user has any permission
              if (rolePermission.canRead || rolePermission.canCreate || 
                  rolePermission.canUpdate || rolePermission.canDelete) {
                return true;
              }
          }
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
 * Get effective permissions for a user across all their roles (global + tenant)
 * Uses union logic where explicit deny (false) overrides grant (true)
 */
export async function getEffectivePermissions(userId: string, moduleKey: string): Promise<EffectivePermissions | null> {
  try {
    // Get user with all their roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // Collect all permissions for the specified module
    const modulePermissions: EffectivePermissions[] = [];

    for (const userRole of user.userRoles) {
      const role = userRole.role;
      
      for (const rolePermission of role.permissions) {
        if (rolePermission.moduleKey === moduleKey) {
          modulePermissions.push({
            canCreate: rolePermission.canCreate,
            canRead: rolePermission.canRead,
            canUpdate: rolePermission.canUpdate,
            canDelete: rolePermission.canDelete,
            canViewAll: rolePermission.canViewAll,
          });
        }
      }
    }

    if (modulePermissions.length === 0) {
      return null;
    }

    // Union logic: explicit deny (false) overrides grant (true)
    const effectivePermissions: EffectivePermissions = {
      canCreate: modulePermissions.some(p => p.canCreate),
      canRead: modulePermissions.some(p => p.canRead),
      canUpdate: modulePermissions.some(p => p.canUpdate),
      canDelete: modulePermissions.some(p => p.canDelete),
      canViewAll: modulePermissions.some(p => p.canViewAll),
    };

    return effectivePermissions;
  } catch (error) {
    console.error('Error getting effective permissions:', error);
    return null;
  }
}

/**
 * Resolve scope based on user permissions for a module
 */
export function resolveScope(user: UserPermissions, moduleKey: string): 'none' | 'own' | 'tenant' {
  // Find permissions for the specified module
  const modulePermissions = user.roles.flatMap(role =>
    role.permissions.filter(p => p.moduleKey === moduleKey)
  );

  if (modulePermissions.length === 0) {
    return 'none';
  }

  // Union logic: if any role has the permission, user has it
  const hasReadPermission = modulePermissions.some(p => p.canRead);
  const hasViewAllPermission = modulePermissions.some(p => p.canViewAll);

  if (!hasReadPermission) {
    return 'none';
  }

  if (hasViewAllPermission) {
    return 'tenant';
  }

  return 'own';
}

/**
 * Get user permissions with all their roles and permissions
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      tenantId: user.tenantId || undefined,
      roles: user.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        tenantId: userRole.role.tenantId || undefined,
        isGlobal: userRole.role.isGlobal,
        permissions: userRole.role.permissions.map(rp => ({
          moduleKey: rp.moduleKey,
          canCreate: rp.canCreate,
          canRead: rp.canRead,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
          canViewAll: rp.canViewAll,
        }))
      }))
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

/**
 * Check if user can perform action on a module
 */
export async function canPerformAction(
  userId: string, 
  moduleKey: string, 
  action: 'create' | 'read' | 'update' | 'delete' | 'viewAll'
): Promise<boolean> {
  const permissions = await getEffectivePermissions(userId, moduleKey);
  
  if (!permissions) {
    return false;
  }

  switch (action) {
    case 'create':
      return permissions.canCreate;
    case 'read':
      return permissions.canRead;
    case 'update':
      return permissions.canUpdate;
    case 'delete':
      return permissions.canDelete;
    case 'viewAll':
      return permissions.canViewAll;
    default:
      return false;
  }
}

/**
 * Enhanced permission checker that handles module key mapping
 */
export async function checkModulePermission(
  user: any,
  moduleKey: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'viewAll'
): Promise<boolean> {
  try {
    // Map module keys to handle different naming conventions
    const moduleKeyMapping: { [key: string]: string[] } = {
      'users': ['users', 'user-management'],
      'roles': ['roles', 'roles-permissions'],
      'audit': ['audit', 'audit-logs'],
      'reports': ['reports', 'reports-analytics'],
      'analytics': ['analytics', 'reports-analytics'],
      'notifications': ['notifications'],
      'content': ['content', 'content-management'],
      'support': ['support'],
      'profile': ['profile'],
      'dashboard': ['dashboard']
    };
    
    // Get the possible module keys for this permission
    const possibleModuleKeys = moduleKeyMapping[moduleKey] || [moduleKey];
    
    // Check if user has the specific permission for any of the possible module keys
    for (const userRole of user.userRoles) {
      const role = userRole.role;
      
      for (const rolePermission of role.permissions) {
        if (possibleModuleKeys.includes(rolePermission.moduleKey)) {
          switch (action) {
            case 'read':
              if (rolePermission.canRead) return true;
              break;
            case 'create':
              if (rolePermission.canCreate) return true;
              break;
            case 'update':
              if (rolePermission.canUpdate) return true;
              break;
            case 'delete':
              if (rolePermission.canDelete) return true;
              break;
            case 'viewAll':
              if (rolePermission.canViewAll) return true;
              break;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking module permission:', error);
    return false;
  }
}

/**
 * Apply scope-based filtering to database queries
 */
export function applyScopeFilter(
  scope: 'none' | 'own' | 'tenant',
  user: UserPermissions,
  baseWhere: any = {}
): any {
  if (scope === 'none') {
    throw new Error('Unauthorized');
  }

  if (scope === 'tenant') {
    return {
      ...baseWhere,
      tenantId: user.tenantId
    };
  }

  if (scope === 'own') {
    return {
      ...baseWhere,
      tenantId: user.tenantId,
      userId: user.userId
    };
  }

  return baseWhere;
} 