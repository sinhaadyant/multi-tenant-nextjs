import { QueryClient } from '@tanstack/react-query';

// Data synchronization utilities for ensuring consistent data across the application
export class DataSync {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Invalidate all tenant-related queries
  invalidateTenantData(tenantId: string) {
    this.queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    this.queryClient.invalidateQueries({ queryKey: ['superadmin-tenant', tenantId] });
    this.queryClient.invalidateQueries({ queryKey: ['tenants'] });
    this.queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
  }

  // Invalidate all user-related queries for a tenant
  invalidateUserData(tenantId: string, userId?: string) {
    this.queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    this.queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-users', tenantId] });
    
    if (userId) {
      this.queryClient.invalidateQueries({ queryKey: ['tenant-user', tenantId, userId] });
      this.queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-user', tenantId, userId] });
    }
  }

  // Invalidate all role-related queries for a tenant
  invalidateRoleData(tenantId: string, roleId?: string) {
    this.queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantId] });
    this.queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-roles', tenantId] });
    
    if (roleId) {
      this.queryClient.invalidateQueries({ queryKey: ['tenant-role', tenantId, roleId] });
    }
  }

  // Invalidate stats and counts
  invalidateStats(tenantId: string) {
    this.queryClient.invalidateQueries({ queryKey: ['tenant-stats', tenantId] });
    this.queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  }

  // Comprehensive invalidation for user operations
  invalidateUserOperations(tenantId: string, userId?: string) {
    this.invalidateUserData(tenantId, userId);
    this.invalidateStats(tenantId);
  }

  // Comprehensive invalidation for role operations
  invalidateRoleOperations(tenantId: string, roleId?: string) {
    this.invalidateRoleData(tenantId, roleId);
    this.invalidateUserData(tenantId); // Roles affect users
  }

  // Comprehensive invalidation for tenant operations
  invalidateTenantOperations(tenantId: string) {
    this.invalidateTenantData(tenantId);
    this.invalidateUserData(tenantId);
    this.invalidateRoleData(tenantId);
    this.invalidateStats(tenantId);
  }

  // Optimistic updates for better UX
  optimisticallyUpdateUser(tenantId: string, userId: string, updates: any) {
    // Update user list
    this.queryClient.setQueryData(
      ['tenant-users', tenantId],
      (oldData: any) => {
        if (!oldData?.users) return oldData;
        return {
          ...oldData,
          users: oldData.users.map((user: any) =>
            user.id === userId ? { ...user, ...updates } : user
          ),
        };
      }
    );

    // Update specific user
    this.queryClient.setQueryData(
      ['tenant-user', tenantId, userId],
      (oldData: any) => {
        if (!oldData?.user) return oldData;
        return {
          ...oldData,
          user: { ...oldData.user, ...updates },
        };
      }
    );
  }

  // Optimistic updates for user creation
  optimisticallyAddUser(tenantId: string, newUser: any) {
    this.queryClient.setQueryData(
      ['tenant-users', tenantId],
      (oldData: any) => {
        if (!oldData?.users) return oldData;
        return {
          ...oldData,
          users: [newUser, ...oldData.users],
          stats: {
            ...oldData.stats,
            total: oldData.stats.total + 1,
            active: newUser.isActive ? oldData.stats.active + 1 : oldData.stats.active,
          },
        };
      }
    );
  }

  // Optimistic updates for user deletion
  optimisticallyRemoveUser(tenantId: string, userId: string) {
    this.queryClient.setQueryData(
      ['tenant-users', tenantId],
      (oldData: any) => {
        if (!oldData?.users) return oldData;
        const deletedUser = oldData.users.find((user: any) => user.id === userId);
        return {
          ...oldData,
          users: oldData.users.filter((user: any) => user.id !== userId),
          stats: {
            ...oldData.stats,
            total: oldData.stats.total - 1,
            active: deletedUser?.isActive ? oldData.stats.active - 1 : oldData.stats.active,
          },
        };
      }
    );

    // Remove specific user cache
    this.queryClient.removeQueries({
      queryKey: ['tenant-user', tenantId, userId],
    });
  }
}

// Hook for easy access to data sync utilities
export const useDataSync = () => {
  const queryClient = useQueryClient();
  const dataSync = new DataSync(queryClient);

  return {
    invalidateTenantData: (tenantId: string) => dataSync.invalidateTenantData(tenantId),
    invalidateUserData: (tenantId: string, userId?: string) => dataSync.invalidateUserData(tenantId, userId),
    invalidateRoleData: (tenantId: string, roleId?: string) => dataSync.invalidateRoleData(tenantId, roleId),
    invalidateStats: (tenantId: string) => dataSync.invalidateStats(tenantId),
    invalidateUserOperations: (tenantId: string, userId?: string) => dataSync.invalidateUserOperations(tenantId, userId),
    invalidateRoleOperations: (tenantId: string, roleId?: string) => dataSync.invalidateRoleOperations(tenantId, roleId),
    invalidateTenantOperations: (tenantId: string) => dataSync.invalidateTenantOperations(tenantId),
    optimisticallyUpdateUser: (tenantId: string, userId: string, updates: any) => dataSync.optimisticallyUpdateUser(tenantId, userId, updates),
    optimisticallyAddUser: (tenantId: string, newUser: any) => dataSync.optimisticallyAddUser(tenantId, newUser),
    optimisticallyRemoveUser: (tenantId: string, userId: string) => dataSync.optimisticallyRemoveUser(tenantId, userId),
  };
};
