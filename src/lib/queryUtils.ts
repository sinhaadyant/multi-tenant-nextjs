import { QueryClient } from '@tanstack/react-query';

// Query keys for consistent invalidation
export const QUERY_KEYS = {
  // Tenant related queries
  TENANTS: ['tenants'],
  TENANT: (id: string) => ['tenant', id],
  TENANT_USERS: (tenantId: string) => ['tenant-users', tenantId],
  TENANT_USER: (tenantId: string, userId: string) => ['tenant-user', tenantId, userId],
  TENANT_ROLES: (tenantId: string) => ['tenant-roles', tenantId],
  TENANT_ROLE: (tenantId: string, roleId: string) => ['tenant-role', tenantId, roleId],
  
  // Superadmin related queries
  SUPERADMIN_TENANTS: ['superadmin-tenants'],
  SUPERADMIN_TENANT: (id: string) => ['superadmin-tenant', id],
  SUPERADMIN_TENANT_USERS: (tenantId: string) => ['superadmin-tenant-users', tenantId],
  SUPERADMIN_TENANT_USER: (tenantId: string, userId: string) => ['superadmin-tenant-user', tenantId, userId],
  SUPERADMIN_TENANT_ROLES: (tenantId: string) => ['superadmin-tenant-roles', tenantId],
  
  // User related queries
  USERS: ['users'],
  USER: (id: string) => ['user', id],
  
  // Role related queries
  ROLES: ['roles'],
  ROLE: (id: string) => ['role', id],
  
  // Stats and counts
  TENANT_STATS: (tenantId: string) => ['tenant-stats', tenantId],
  USER_STATS: ['user-stats'],
} as const;

// Invalidation patterns for different operations
export const INVALIDATION_PATTERNS = {
  // When a tenant is created/updated
  TENANT_UPDATED: (tenantId: string) => [
    QUERY_KEYS.TENANTS,
    QUERY_KEYS.TENANT(tenantId),
    QUERY_KEYS.SUPERADMIN_TENANTS,
    QUERY_KEYS.SUPERADMIN_TENANT(tenantId),
  ],
  
  // When a user is created/updated/deleted
  USER_UPDATED: (tenantId: string, userId?: string) => [
    QUERY_KEYS.TENANT_USERS(tenantId),
    QUERY_KEYS.SUPERADMIN_TENANT_USERS(tenantId),
    QUERY_KEYS.TENANT_STATS(tenantId),
    ...(userId ? [QUERY_KEYS.TENANT_USER(tenantId, userId)] : []),
    ...(userId ? [QUERY_KEYS.SUPERADMIN_TENANT_USER(tenantId, userId)] : []),
  ],
  
  // When a role is created/updated/deleted
  ROLE_UPDATED: (tenantId: string, roleId?: string) => [
    QUERY_KEYS.TENANT_ROLES(tenantId),
    QUERY_KEYS.SUPERADMIN_TENANT_ROLES(tenantId),
    ...(roleId ? [QUERY_KEYS.TENANT_ROLE(tenantId, roleId)] : []),
  ],
  
  // When user status changes (activate/deactivate)
  USER_STATUS_CHANGED: (tenantId: string) => [
    QUERY_KEYS.TENANT_USERS(tenantId),
    QUERY_KEYS.SUPERADMIN_TENANT_USERS(tenantId),
    QUERY_KEYS.TENANT_STATS(tenantId),
  ],
  
  // When bulk operations are performed
  BULK_USERS_UPDATED: (tenantId: string) => [
    QUERY_KEYS.TENANT_USERS(tenantId),
    QUERY_KEYS.SUPERADMIN_TENANT_USERS(tenantId),
    QUERY_KEYS.TENANT_STATS(tenantId),
  ],
} as const;

// Utility functions for invalidation
export const invalidateQueries = {
  // Invalidate tenant-related queries
  tenant: (queryClient: QueryClient, tenantId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANT(tenantId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPERADMIN_TENANT(tenantId) });
  },
  
  // Invalidate user-related queries
  user: (queryClient: QueryClient, tenantId: string, userId?: string) => {
    const patterns = INVALIDATION_PATTERNS.USER_UPDATED(tenantId, userId);
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: pattern });
    });
  },
  
  // Invalidate role-related queries
  role: (queryClient: QueryClient, tenantId: string, roleId?: string) => {
    const patterns = INVALIDATION_PATTERNS.ROLE_UPDATED(tenantId, roleId);
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: pattern });
    });
  },
  
  // Invalidate all tenant lists
  tenantLists: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TENANTS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPERADMIN_TENANTS });
  },
  
  // Invalidate user status changes
  userStatus: (queryClient: QueryClient, tenantId: string) => {
    const patterns = INVALIDATION_PATTERNS.USER_STATUS_CHANGED(tenantId);
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: pattern });
    });
  },
  
  // Invalidate bulk operations
  bulkUsers: (queryClient: QueryClient, tenantId: string) => {
    const patterns = INVALIDATION_PATTERNS.BULK_USERS_UPDATED(tenantId);
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: pattern });
    });
  },
  
  // Comprehensive invalidation for tenant operations
  tenantComprehensive: (queryClient: QueryClient, tenantId: string) => {
    const patterns = INVALIDATION_PATTERNS.TENANT_UPDATED(tenantId);
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: pattern });
    });
  },
} as const;

// Hook for easy invalidation
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateTenant: (tenantId: string) => invalidateQueries.tenant(queryClient, tenantId),
    invalidateUser: (tenantId: string, userId?: string) => invalidateQueries.user(queryClient, tenantId, userId),
    invalidateRole: (tenantId: string, roleId?: string) => invalidateQueries.role(queryClient, tenantId, roleId),
    invalidateTenantLists: () => invalidateQueries.tenantLists(queryClient),
    invalidateUserStatus: (tenantId: string) => invalidateQueries.userStatus(queryClient, tenantId),
    invalidateBulkUsers: (tenantId: string) => invalidateQueries.bulkUsers(queryClient, tenantId),
    invalidateTenantComprehensive: (tenantId: string) => invalidateQueries.tenantComprehensive(queryClient, tenantId),
  };
};
