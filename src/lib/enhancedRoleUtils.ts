import { Role, Permission } from '@/hooks/useRolesAPI';

/**
 * Enhanced Role-Permission Relationship Utilities
 * 
 * This module implements the proposed design where:
 * - System Roles created by SuperAdmin → visible to all tenants (but each tenant can tweak the permissions)
 * - Tenant Custom Roles → available only to that tenant
 * - Tenants can enable/disable modules & permissions as per their needs
 * - Users are linked to roles, roles to permissions, permissions to modules
 */

export interface EnhancedRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  tenantId?: string;
  isAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
  permission: Permission;
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionId: string;
  tenantId?: string;
  isAllowed: boolean;
}

export interface TenantPermissionOverride {
  permissionId: string;
  isAllowed: boolean;
  reason?: string;
}

/**
 * Check if a user has permission considering tenant-specific overrides
 */
export function checkEnhancedUserPermission(
  userRole: Role | null,
  requiredPermission: string,
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): boolean {
  if (!userRole || !userRole.isActive) {
    return false;
  }

  // Find the specific permission assignment for this tenant
  const permissionAssignment = rolePermissions.find(rp => 
    rp.roleId === userRole.id && 
    rp.permissionId === requiredPermission &&
    (rp.tenantId === tenantId || rp.tenantId === null) // null for global assignments
  );

  if (!permissionAssignment) {
    return false;
  }

  return permissionAssignment.isAllowed;
}

/**
 * Get all permissions for a role with tenant-specific overrides
 */
export function getRolePermissionsWithOverrides(
  roleId: string,
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): EnhancedRolePermission[] {
  return rolePermissions.filter(rp => 
    rp.roleId === roleId && 
    (rp.tenantId === tenantId || rp.tenantId === null)
  );
}

/**
 * Check if a role is a system role (created by SuperAdmin)
 */
export function isSystemRole(role: Role): boolean {
  return role.isSystem || role.isTemplate || role.scope === 'GLOBAL';
}

/**
 * Check if a role is a tenant-specific role
 */
export function isTenantRole(role: Role): boolean {
  return !isSystemRole(role) && role.tenantId !== null;
}

/**
 * Get available roles for a tenant
 */
export function getAvailableRolesForTenant(
  allRoles: Role[],
  tenantId: string
): Role[] {
  return allRoles.filter(role => 
    // Include system roles (visible to all tenants)
    isSystemRole(role) ||
    // Include tenant-specific roles for this tenant
    (isTenantRole(role) && role.tenantId === tenantId)
  );
}

/**
 * Validate role-permission assignment
 */
export function validateRolePermissionAssignment(
  assignment: RolePermissionAssignment
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!assignment.roleId) {
    errors.push('Role ID is required');
  }

  if (!assignment.permissionId) {
    errors.push('Permission ID is required');
  }

  if (assignment.tenantId && assignment.tenantId.trim() === '') {
    errors.push('Tenant ID cannot be empty if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create permission assignment for a role
 */
export function createPermissionAssignment(
  roleId: string,
  permissionId: string,
  tenantId?: string,
  isAllowed: boolean = true
): RolePermissionAssignment {
  return {
    roleId,
    permissionId,
    tenantId,
    isAllowed
  };
}

/**
 * Get permission overrides for a tenant
 */
export function getTenantPermissionOverrides(
  roleId: string,
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): TenantPermissionOverride[] {
  return rolePermissions
    .filter(rp => rp.roleId === roleId && rp.tenantId === tenantId)
    .map(rp => ({
      permissionId: rp.permissionId,
      isAllowed: rp.isAllowed
    }));
}

/**
 * Apply tenant overrides to system role permissions
 */
export function applyTenantOverrides(
  systemPermissions: EnhancedRolePermission[],
  tenantOverrides: TenantPermissionOverride[],
  tenantId: string
): EnhancedRolePermission[] {
  const overrideMap = new Map(
    tenantOverrides.map(override => [override.permissionId, override.isAllowed])
  );

  return systemPermissions.map(permission => {
    const hasOverride = overrideMap.has(permission.permissionId);
    
    if (hasOverride) {
      return {
        ...permission,
        tenantId,
        isAllowed: overrideMap.get(permission.permissionId)!
      };
    }

    return permission;
  });
}

/**
 * Check if a permission can be overridden by a tenant
 */
export function canOverridePermission(
  permission: Permission,
  role: Role,
  tenantId: string
): boolean {
  // System permissions cannot be overridden
  if (permission.isSystem) {
    return false;
  }

  // Only system roles can have overrides
  if (!isSystemRole(role)) {
    return false;
  }

  // Tenant must be valid
  if (!tenantId) {
    return false;
  }

  return true;
}

/**
 * Get permission status for a role in a specific tenant
 */
export function getPermissionStatus(
  roleId: string,
  permissionId: string,
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): 'allowed' | 'denied' | 'not-assigned' {
  const assignment = rolePermissions.find(rp => 
    rp.roleId === roleId && 
    rp.permissionId === permissionId &&
    (rp.tenantId === tenantId || rp.tenantId === null)
  );

  if (!assignment) {
    return 'not-assigned';
  }

  return assignment.isAllowed ? 'allowed' : 'denied';
}

/**
 * Calculate effective permissions for a user
 */
export function calculateEffectivePermissions(
  userRoles: Role[],
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): string[] {
  const effectivePermissions = new Set<string>();

  for (const role of userRoles) {
    if (!role.isActive) continue;

    const rolePerms = getRolePermissionsWithOverrides(role.id, tenantId, rolePermissions);
    
    for (const rp of rolePerms) {
      if (rp.isAllowed) {
        effectivePermissions.add(rp.permissionId);
      }
    }
  }

  return Array.from(effectivePermissions);
}

/**
 * Check if a user has any of the required permissions
 */
export function hasAnyPermission(
  userRoles: Role[],
  requiredPermissions: string[],
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): boolean {
  const effectivePermissions = calculateEffectivePermissions(userRoles, tenantId, rolePermissions);
  
  return requiredPermissions.some(permission => 
    effectivePermissions.includes(permission)
  );
}

/**
 * Check if a user has all of the required permissions
 */
export function hasAllPermissions(
  userRoles: Role[],
  requiredPermissions: string[],
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): boolean {
  const effectivePermissions = calculateEffectivePermissions(userRoles, tenantId, rolePermissions);
  
  return requiredPermissions.every(permission => 
    effectivePermissions.includes(permission)
  );
}

/**
 * Get permission summary for a role
 */
export function getRolePermissionSummary(
  roleId: string,
  tenantId: string,
  rolePermissions: EnhancedRolePermission[]
): {
  totalPermissions: number;
  allowedPermissions: number;
  deniedPermissions: number;
  overriddenPermissions: number;
} {
  const rolePerms = getRolePermissionsWithOverrides(roleId, tenantId, rolePermissions);
  
  const totalPermissions = rolePerms.length;
  const allowedPermissions = rolePerms.filter(rp => rp.isAllowed).length;
  const deniedPermissions = rolePerms.filter(rp => !rp.isAllowed).length;
  const overriddenPermissions = rolePerms.filter(rp => rp.tenantId === tenantId).length;

  return {
    totalPermissions,
    allowedPermissions,
    deniedPermissions,
    overriddenPermissions
  };
}

/**
 * Export role permissions for backup/import
 */
export function exportRolePermissions(
  roleId: string,
  rolePermissions: EnhancedRolePermission[]
): RolePermissionAssignment[] {
  return rolePermissions
    .filter(rp => rp.roleId === roleId)
    .map(rp => ({
      roleId: rp.roleId,
      permissionId: rp.permissionId,
      tenantId: rp.tenantId || undefined,
      isAllowed: rp.isAllowed
    }));
}

/**
 * Import role permissions from backup
 */
export function importRolePermissions(
  roleId: string,
  assignments: RolePermissionAssignment[]
): RolePermissionAssignment[] {
  return assignments.map(assignment => ({
    ...assignment,
    roleId // Ensure the roleId is set correctly
  }));
}
