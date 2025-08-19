import { QueryClient, useQueryClient } from '@tanstack/react-query';

// Simple utility for ensuring data consistency across the application
export const ensureDataConsistency = {
  // Invalidate all tenant-related data
  invalidateTenantData: (queryClient: QueryClient, tenantId: string) => {
    // Invalidate tenant details
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant', tenantId] });
    
    // Invalidate tenant lists
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
    
    // Invalidate user data
    queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-users', tenantId] });
    
    // Invalidate role data
    queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-roles', tenantId] });
    
    // Invalidate stats
    queryClient.invalidateQueries({ queryKey: ['tenant-stats', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    
    // Invalidate dashboard data
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
  },

  // Invalidate user-related data
  invalidateUserData: (queryClient: QueryClient, tenantId: string, userId?: string) => {
    // Invalidate user lists
    queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-users', tenantId] });
    
    // Invalidate specific user if provided
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['tenant-user', tenantId, userId] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-user', tenantId, userId] });
    }
    
    // Invalidate stats
    queryClient.invalidateQueries({ queryKey: ['tenant-stats', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    
    // Invalidate dashboard data
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
  },

  // Invalidate role-related data
  invalidateRoleData: (queryClient: QueryClient, tenantId: string, roleId?: string) => {
    // Invalidate role lists
    queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-roles', tenantId] });
    
    // Invalidate specific role if provided
    if (roleId) {
      queryClient.invalidateQueries({ queryKey: ['tenant-role', tenantId, roleId] });
    }
    
    // Invalidate user data since roles affect users
    queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-users', tenantId] });
    
    // Invalidate dashboard data
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
  },

  // Optimistic updates for better UX
  optimisticallyUpdateUser: (queryClient: QueryClient, tenantId: string, userId: string, updates: any) => {
    // Update user list
    queryClient.setQueryData(
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
    queryClient.setQueryData(
      ['tenant-user', tenantId, userId],
      (oldData: any) => {
        if (!oldData?.user) return oldData;
        return {
          ...oldData,
          user: { ...oldData.user, ...updates },
        };
      }
    );
  },

  // Optimistic updates for user creation
  optimisticallyAddUser: (queryClient: QueryClient, tenantId: string, newUser: any) => {
    queryClient.setQueryData(
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
  },

  // Optimistic updates for user deletion
  optimisticallyRemoveUser: (queryClient: QueryClient, tenantId: string, userId: string) => {
    queryClient.setQueryData(
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
    queryClient.removeQueries({
      queryKey: ['tenant-user', tenantId, userId],
    });
  },

  // Invalidate bulk operations
  bulkUsers: (queryClient: QueryClient, tenantId: string) => {
    // Invalidate user lists and stats
    queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant-stats', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
  },
  
  // Invalidate dashboard data
  invalidateDashboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard-stats'] });
  },
  
  // Comprehensive invalidation for tenant operations
  tenantComprehensive: (queryClient: QueryClient, tenantId: string) => {
    // Invalidate all tenant-related queries
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
    queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-users', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant-roles', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant-stats', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
  },
};

// Hook for easy access to data consistency utilities
export const useDataConsistency = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateTenantData: (tenantId: string) => ensureDataConsistency.invalidateTenantData(queryClient, tenantId),
    invalidateUserData: (tenantId: string, userId?: string) => ensureDataConsistency.invalidateUserData(queryClient, tenantId, userId),
    invalidateRoleData: (tenantId: string, roleId?: string) => ensureDataConsistency.invalidateRoleData(queryClient, tenantId, roleId),
    invalidateStats: (tenantId: string) => ensureDataConsistency.invalidateStats(queryClient, tenantId),
    invalidateUserOperations: (tenantId: string, userId?: string) => ensureDataConsistency.invalidateUserOperations(queryClient, tenantId, userId),
    invalidateRoleOperations: (tenantId: string, roleId?: string) => ensureDataConsistency.invalidateRoleOperations(queryClient, tenantId, roleId),
    invalidateTenantOperations: (tenantId: string) => ensureDataConsistency.invalidateTenantOperations(queryClient, tenantId),
    invalidateBulkUsers: (tenantId: string) => ensureDataConsistency.bulkUsers(queryClient, tenantId),
    invalidateDashboard: () => ensureDataConsistency.invalidateDashboard(queryClient),
    invalidateTenantComprehensive: (tenantId: string) => ensureDataConsistency.tenantComprehensive(queryClient, tenantId),
    optimisticallyUpdateUser: (tenantId: string, userId: string, updates: any) => ensureDataConsistency.optimisticallyUpdateUser(queryClient, tenantId, userId, updates),
    optimisticallyAddUser: (tenantId: string, newUser: any) => ensureDataConsistency.optimisticallyAddUser(queryClient, tenantId, newUser),
    optimisticallyRemoveUser: (tenantId: string, userId: string) => ensureDataConsistency.optimisticallyRemoveUser(queryClient, tenantId, userId),
  };
};

// Example usage in mutations:
/*
// In a user creation mutation:
const createUserMutation = useMutation({
  mutationFn: (data) => createUser(data),
  onSuccess: (data) => {
    // Invalidate all relevant data
    invalidateUserData(tenantId);
    invalidateTenantData(tenantId);
    
    // Or use optimistic updates for better UX
    optimisticallyAddUser(tenantId, data.user);
    
    toast.success('User created successfully');
  },
});

// In a user update mutation:
const updateUserMutation = useMutation({
  mutationFn: ({ userId, data }) => updateUser(userId, data),
  onSuccess: (data, variables) => {
    // Invalidate specific user and lists
    invalidateUserData(tenantId, variables.userId);
    
    // Or use optimistic updates
    optimisticallyUpdateUser(tenantId, variables.userId, data.user);
    
    toast.success('User updated successfully');
  },
});

// In a user status toggle mutation:
const toggleUserStatusMutation = useMutation({
  mutationFn: ({ userId, isActive }) => toggleUserStatus(userId, isActive),
  onSuccess: (data, variables) => {
    // Invalidate user data and stats
    invalidateUserData(tenantId, variables.userId);
    
    // Or use optimistic updates
    optimisticallyUpdateUser(tenantId, variables.userId, { isActive: variables.isActive });
    
    toast.success('User status updated successfully');
  },
});

// In a bulk operation mutation:
const bulkOperationMutation = useMutation({
  mutationFn: (data) => bulkOperation(data),
  onSuccess: () => {
    // Invalidate all user data for the tenant
    invalidateUserData(tenantId);
    
    toast.success('Bulk operation completed successfully');
  },
});
*/
