import { Role, Permission } from '@/hooks/useRolesAPI';

/**
 * Utility functions for role and permission management
 */

export interface PermissionCheck {
  hasPermission: boolean;
  missingPermissions: string[];
}

/**
 * Check if a user has specific permissions based on their role
 */
export function checkUserPermissions(
  userRole: Role | null,
  requiredPermissions: string[]
): PermissionCheck {
  if (!userRole || !userRole.isActive) {
    return {
      hasPermission: false,
      missingPermissions: requiredPermissions
    };
  }

  const userPermissionNames = userRole.permissions.map(p => p.name);
  const missingPermissions = requiredPermissions.filter(
    permission => !userPermissionNames.includes(permission)
  );

  return {
    hasPermission: missingPermissions.length === 0,
    missingPermissions
  };
}

/**
 * Check if a user has permission for a specific module and action
 */
export function checkModulePermission(
  userRole: Role | null,
  module: string,
  action: string
): boolean {
  if (!userRole || !userRole.isActive) {
    return false;
  }

  return userRole.permissions.some(
    permission => permission.module === module && permission.action === action
  );
}

/**
 * Get all permissions for a specific module
 */
export function getModulePermissions(
  permissions: Permission[],
  module: string
): Permission[] {
  return permissions.filter(permission => permission.module === module);
}

/**
 * Group permissions by module
 */
export function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((groups, permission) => {
    if (!groups[permission.module]) {
      groups[permission.module] = [];
    }
    groups[permission.module].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);
}

/**
 * Validate role name
 */
export function validateRoleName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Role name is required' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, error: 'Role name must be at least 3 characters' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'Role name must be less than 50 characters' };
  }

  // Check for reserved keywords
  const reservedKeywords = ['admin', 'superuser', 'root', 'system', 'default'];
  if (reservedKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
    return { isValid: false, error: 'Role name contains reserved keywords' };
  }

  return { isValid: true };
}

/**
 * Validate permission name
 */
export function validatePermissionName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Permission name is required' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, error: 'Permission name must be at least 3 characters' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Permission name must be less than 100 characters' };
  }

  // Check for valid format (snake_case)
  const validFormat = /^[a-z][a-z0-9_]*$/.test(name);
  if (!validFormat) {
    return { 
      isValid: false, 
      error: 'Permission name must be in snake_case format (e.g., can_view_users)' 
    };
  }

  return { isValid: true };
}

/**
 * Get permission display name from permission key
 */
export function getPermissionDisplayName(permissionName: string): string {
  return permissionName
    .replace(/^can_/, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get action display name
 */
export function getActionDisplayName(action: string): string {
  const actionMap: Record<string, string> = {
    'read': 'View',
    'create': 'Create',
    'update': 'Edit',
    'delete': 'Delete',
    'assign_role': 'Assign Role',
    'assign_permissions': 'Assign Permissions',
    'manage_settings': 'Manage Settings',
    'export': 'Export',
    'send': 'Send',
    'analytics': 'Analytics'
  };

  return actionMap[action] || action.charAt(0).toUpperCase() + action.slice(1);
}

/**
 * Get module display name
 */
export function getModuleDisplayName(module: string): string {
  const moduleMap: Record<string, string> = {
    'users': 'Users',
    'tenants': 'Tenants',
    'roles': 'Roles',
    'permissions': 'Permissions',
    'audit': 'Audit Logs',
    'notifications': 'Notifications',
    'dashboard': 'Dashboard',
    'settings': 'Settings'
  };

  return moduleMap[module] || module.charAt(0).toUpperCase() + module.slice(1);
}

/**
 * Check if a role can be deleted
 */
export function canDeleteRole(role: Role): { canDelete: boolean; reason?: string } {
  if (role.userCount > 0) {
    return { 
      canDelete: false, 
      reason: `Cannot delete role that is assigned to ${role.userCount} user(s)` 
    };
  }

  if (role.name.toLowerCase().includes('admin') || role.name.toLowerCase().includes('super')) {
    return { 
      canDelete: false, 
      reason: 'Cannot delete administrative roles' 
    };
  }

  return { canDelete: true };
}

/**
 * Check if a permission can be deleted
 */
export function canDeletePermission(
  permission: Permission, 
  rolePermissions: Array<{ roleId: string; permissionId: string }>
): { canDelete: boolean; reason?: string } {
  const assignedRoles = rolePermissions.filter(rp => rp.permissionId === permission.id);
  
  if (assignedRoles.length > 0) {
    return { 
      canDelete: false, 
      reason: `Cannot delete permission that is assigned to ${assignedRoles.length} role(s)` 
    };
  }

  return { canDelete: true };
}

/**
 * Get role statistics
 */
export function getRoleStatistics(roles: Role[]) {
  const totalRoles = roles.length;
  const activeRoles = roles.filter(role => role.isActive).length;
  const globalRoles = roles.filter(role => role.isGlobal).length;
  const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0);

  return {
    totalRoles,
    activeRoles,
    inactiveRoles: totalRoles - activeRoles,
    globalRoles,
    tenantSpecificRoles: totalRoles - globalRoles,
    totalUsers,
    averageUsersPerRole: totalRoles > 0 ? Math.round(totalUsers / totalRoles) : 0
  };
}

/**
 * Get permission statistics
 */
export function getPermissionStatistics(permissions: Permission[]) {
  const totalPermissions = permissions.length;
  const modules = [...new Set(permissions.map(p => p.module))];
  const actions = [...new Set(permissions.map(p => p.action))];

  const moduleStats = modules.map(module => ({
    module,
    count: permissions.filter(p => p.module === module).length
  }));

  const actionStats = actions.map(action => ({
    action,
    count: permissions.filter(p => p.action === action).length
  }));

  return {
    totalPermissions,
    totalModules: modules.length,
    totalActions: actions.length,
    moduleStats,
    actionStats
  };
}

/**
 * Sort roles by various criteria
 */
export function sortRoles(roles: Role[], sortBy: 'name' | 'createdAt' | 'userCount', sortOrder: 'asc' | 'desc'): Role[] {
  return [...roles].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'userCount':
        aValue = a.userCount;
        bValue = b.userCount;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

/**
 * Filter roles by various criteria
 */
export function filterRoles(
  roles: Role[], 
  searchTerm: string, 
  statusFilter: 'all' | 'active' | 'inactive',
  globalFilter: 'all' | 'global' | 'tenant'
): Role[] {
  return roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && role.isActive) ||
                         (statusFilter === 'inactive' && !role.isActive);
    
    const matchesGlobal = globalFilter === 'all' ||
                         (globalFilter === 'global' && role.isGlobal) ||
                         (globalFilter === 'tenant' && !role.isGlobal);

    return matchesSearch && matchesStatus && matchesGlobal;
  });
} 