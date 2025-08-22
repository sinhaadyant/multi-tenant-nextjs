import { useTenantAuth } from '@/hooks/useTenantAuth';
import { useDataPermissions } from '@/hooks/usePermissionBasedData';

export const useDashboardPermissions = () => {
  const { permissions, modules } = useTenantAuth();
  
  // Get permissions for specific modules
  const usersPermissions = useDataPermissions('users');
  const rolesPermissions = useDataPermissions('roles');
  const auditPermissions = useDataPermissions('audit');
  const reportsPermissions = useDataPermissions('reports');
  const notificationsPermissions = useDataPermissions('notifications');
  const contentPermissions = useDataPermissions('content');
  const analyticsPermissions = useDataPermissions('analytics');

  // Helper function to check if user has any permission for a module
  const hasAnyPermission = (moduleKey: string): boolean => {
    const modulePermissions = permissions?.filter(p => p.moduleKey === moduleKey) || [];
    return modulePermissions.length > 0;
  };

  // Helper function to check if user has specific permission
  const hasPermission = (moduleKey: string, action: string): boolean => {
    const modulePermission = permissions?.find(p => p.moduleKey === moduleKey) || null;
    
    if (!modulePermission) return false;
    
    switch (action) {
      case 'view':
      case 'read':
        return modulePermission.canRead === true;
      case 'create':
        return modulePermission.canCreate === true;
      case 'update':
      case 'edit':
        return modulePermission.canUpdate === true;
      case 'delete':
        return modulePermission.canDelete === true;
      case 'viewall':
        return modulePermission.canViewAll === true;
      default:
        return false;
    }
  };

  // Helper function to check if module is available
  const isModuleAvailable = (moduleKey: string): boolean => {
    const module = modules?.find(m => (m.key || m.moduleKey) === moduleKey);
    return !!(module && module.isEnabled !== false && module.isVisible !== false);
  };

  // Dashboard-specific permission checks
  const dashboardPermissions = {
    // User-related blocks
    canViewUsers: hasPermission('users', 'view') || hasPermission('user-management', 'view'),
    canCreateUsers: hasPermission('users', 'create') || hasPermission('user-management', 'create'),
    canManageUsers: hasPermission('users', 'update') || hasPermission('user-management', 'update'),
    
    // Role-related blocks
    canViewRoles: hasPermission('roles', 'view') || hasPermission('roles-permissions', 'view'),
    canCreateRoles: hasPermission('roles', 'create') || hasPermission('roles-permissions', 'create'),
    canManageRoles: hasPermission('roles', 'update') || hasPermission('roles-permissions', 'update'),
    
    // Audit-related blocks
    canViewAudit: hasPermission('audit', 'view') || hasPermission('audit-logs', 'view'),
    canViewActivity: hasPermission('audit', 'view') || hasPermission('audit-logs', 'view'),
    
    // Report-related blocks
    canViewReports: hasPermission('reports', 'view') || hasPermission('reports-analytics', 'view'),
    canCreateReports: hasPermission('reports', 'create') || hasPermission('reports-analytics', 'create'),
    
    // Analytics-related blocks
    canViewAnalytics: hasPermission('analytics', 'view') || hasPermission('reports-analytics', 'view'),
    canViewCharts: hasPermission('analytics', 'view') || hasPermission('reports-analytics', 'view'),
    
    // Notification-related blocks
    canViewNotifications: hasPermission('notifications', 'view'),
    canManageNotifications: hasPermission('notifications', 'create'),
    
    // Content-related blocks
    canViewContent: hasPermission('content', 'view') || hasPermission('content-management', 'view'),
    canManageContent: hasPermission('content', 'create') || hasPermission('content-management', 'create'),
    
    // System-related blocks
    canViewSystemHealth: true, // Usually available to all users
    canViewDashboard: true, // Dashboard access is usually available to all users
  };

  // Module availability checks
  const moduleAvailability = {
    users: isModuleAvailable('users') || isModuleAvailable('user-management'),
    roles: isModuleAvailable('roles') || isModuleAvailable('roles-permissions'),
    audit: isModuleAvailable('audit') || isModuleAvailable('audit-logs'),
    reports: isModuleAvailable('reports') || isModuleAvailable('reports-analytics'),
    analytics: isModuleAvailable('analytics') || isModuleAvailable('reports-analytics'),
    notifications: isModuleAvailable('notifications'),
    content: isModuleAvailable('content') || isModuleAvailable('content-management'),
    dashboard: isModuleAvailable('dashboard'),
  };

  // Permission objects for PermissionBasedBlock component
  const permissionObjects = {
    users: {
      canView: dashboardPermissions.canViewUsers,
      canCreate: dashboardPermissions.canCreateUsers,
      canUpdate: dashboardPermissions.canManageUsers,
      canDelete: hasPermission('users', 'delete') || hasPermission('user-management', 'delete'),
    },
    roles: {
      canView: dashboardPermissions.canViewRoles,
      canCreate: dashboardPermissions.canCreateRoles,
      canUpdate: dashboardPermissions.canManageRoles,
      canDelete: hasPermission('roles', 'delete') || hasPermission('roles-permissions', 'delete'),
    },
    audit: {
      canView: dashboardPermissions.canViewAudit,
      canCreate: hasPermission('audit', 'create') || hasPermission('audit-logs', 'create'),
      canUpdate: hasPermission('audit', 'update') || hasPermission('audit-logs', 'update'),
      canDelete: hasPermission('audit', 'delete') || hasPermission('audit-logs', 'delete'),
    },
    reports: {
      canView: dashboardPermissions.canViewReports,
      canCreate: dashboardPermissions.canCreateReports,
      canUpdate: hasPermission('reports', 'update') || hasPermission('reports-analytics', 'update'),
      canDelete: hasPermission('reports', 'delete') || hasPermission('reports-analytics', 'delete'),
    },
    analytics: {
      canView: dashboardPermissions.canViewAnalytics,
      canCreate: hasPermission('analytics', 'create'),
      canUpdate: hasPermission('analytics', 'update'),
      canDelete: hasPermission('analytics', 'delete'),
    },
    notifications: {
      canView: dashboardPermissions.canViewNotifications,
      canCreate: dashboardPermissions.canManageNotifications,
      canUpdate: hasPermission('notifications', 'update'),
      canDelete: hasPermission('notifications', 'delete'),
    },
    content: {
      canView: dashboardPermissions.canViewContent,
      canCreate: dashboardPermissions.canManageContent,
      canUpdate: hasPermission('content', 'update') || hasPermission('content-management', 'update'),
      canDelete: hasPermission('content', 'delete') || hasPermission('content-management', 'delete'),
    },
  };

  return {
    // Permission checks
    ...dashboardPermissions,
    
    // Module availability
    ...moduleAvailability,
    
    // Permission objects for components
    permissionObjects,
    
    // Helper functions
    hasAnyPermission,
    hasPermission,
    isModuleAvailable,
    
    // Raw data
    permissions,
    modules,
    
    // Individual module permissions (for backward compatibility)
    usersPermissions,
    rolesPermissions,
    auditPermissions,
    reportsPermissions,
    notificationsPermissions,
    contentPermissions,
    analyticsPermissions,
  };
};
