"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

// Types
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  description?: string;
  permissions: string[];
  children?: MenuItem[];
  hasChildren: boolean;
}

export interface ModulePermission {
  [moduleKey: string]: string[];
}

export interface UserPermissions {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    };
    roles: Array<{
      id: string;
      name: string;
      description: string;
      isDefault: boolean;
    }>;
  };
  permissions: string[];
  modulePermissions: ModulePermission;
  accessibleModules: string[];
  menuItems: MenuItem[];
  hasAccess: boolean;
  totalPermissions: number;
  totalModules: number;
}

interface DynamicPermissionsContextType {
  // State
  userPermissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  hasAccess: boolean;
  
  // Permission checks
  hasPermission: (moduleKey: string, action: string) => boolean;
  hasAnyPermission: (moduleKey: string) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccessModule: (moduleKey: string) => boolean;
  canPerformAction: (moduleKey: string, action: string) => boolean;
  
  // Menu utilities
  getMenuItems: () => MenuItem[];
  getModulePermissions: (moduleKey: string) => string[];
  
  // Actions
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

const DynamicPermissionsContext = createContext<DynamicPermissionsContextType | undefined>(undefined);

export const useDynamicPermissions = () => {
  const context = useContext(DynamicPermissionsContext);
  if (context === undefined) {
    // Add debugging to understand when this happens
    console.warn('useDynamicPermissions called outside of DynamicPermissionsProvider - using fallback context');
    
    // Return a fallback context instead of throwing an error
    // This allows components to render during SSR or when provider is not yet available
    return {
      userPermissions: null,
      isLoading: true,
      error: null,
      isInitialized: false,
      hasAccess: false,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasRole: () => false,
      canAccessModule: () => false,
      canPerformAction: () => false,
      getMenuItems: () => [],
      getModulePermissions: () => [],
      refreshPermissions: async () => {},
      clearPermissions: () => {}
    };
  }
  return context;
};

interface DynamicPermissionsProviderProps {
  children: ReactNode;
}

export const DynamicPermissionsProvider: React.FC<DynamicPermissionsProviderProps> = ({ children }) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserPermissions = useCallback(async () => {
    if (!tenantSlug) {
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      console.log('🔍 DynamicPermissionsContext - Token found:', !!token, 'Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
      
      if (!token) {
        // No token means user is not authenticated - this is normal for login pages
        console.log('🔍 DynamicPermissionsContext - No token found, skipping permissions fetch');
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      console.log('🔍 DynamicPermissionsContext - Making API request to:', `/api/tenant/${tenantSlug}/permissions/current-user`);
      
      const response = await axios.get(`/api/tenant/${tenantSlug}/permissions/current-user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('🔍 DynamicPermissionsContext - API response received');
      console.log('Permissions API response:', response.data);

      if (response.data.success) {
        const permissionsData = response.data.data;
        
        console.log('Raw permissions data:', permissionsData);
        console.log('Permissions data type:', typeof permissionsData);
        console.log('Permissions data keys:', permissionsData ? Object.keys(permissionsData) : 'null');
        
        // Ensure the permissions data has the expected structure
        const validatedPermissionsData: UserPermissions = {
          user: permissionsData.user || {
            id: '',
            name: '',
            email: '',
            isActive: false,
            createdAt: new Date().toISOString(),
            tenant: {
              id: '',
              name: '',
              slug: '',
              isActive: false
            },
            roles: []
          },
          permissions: permissionsData.permissions || [],
          modulePermissions: permissionsData.modulePermissions || {},
          accessibleModules: permissionsData.accessibleModules || [],
          menuItems: permissionsData.menuItems || [],
          hasAccess: permissionsData.hasAccess || false,
          totalPermissions: permissionsData.totalPermissions || 0,
          totalModules: permissionsData.totalModules || 0
        };
        
        setUserPermissions(validatedPermissionsData);
        
        // Store in localStorage for offline access
        localStorage.setItem('user_permissions', JSON.stringify(validatedPermissionsData));
        localStorage.setItem('permissions_timestamp', Date.now().toString());
      } else {
        throw new Error(response.data.message || 'Failed to fetch user permissions');
      }
    } catch (err: any) {
      console.error('Error fetching user permissions:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Only set error if it's not a missing token (which is normal for login pages)
      if (err.message !== 'No authentication token found') {
        setError(err.response?.data?.message || err.message || 'Failed to fetch user permissions');
      }
      
      // Try to load from localStorage as fallback
      const cachedPermissions = localStorage.getItem('user_permissions');
      const timestamp = localStorage.getItem('permissions_timestamp');
      
      if (cachedPermissions && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        // Use cached data if less than 1 hour old
        if (cacheAge < 60 * 60 * 1000) {
          try {
            const parsedPermissions = JSON.parse(cachedPermissions);
            
            console.log('Cached permissions data:', parsedPermissions);
            console.log('Cached permissions type:', typeof parsedPermissions);
            console.log('Cached permissions keys:', parsedPermissions ? Object.keys(parsedPermissions) : 'null');
            
            // Validate cached permissions structure
            const validatedCachedPermissions: UserPermissions = {
              user: parsedPermissions.user || {
                id: '',
                name: '',
                email: '',
                isActive: false,
                createdAt: new Date().toISOString(),
                tenant: {
                  id: '',
                  name: '',
                  slug: '',
                  isActive: false
                },
                roles: []
              },
              permissions: parsedPermissions.permissions || [],
              modulePermissions: parsedPermissions.modulePermissions || {},
              accessibleModules: parsedPermissions.accessibleModules || [],
              menuItems: parsedPermissions.menuItems || [],
              hasAccess: parsedPermissions.hasAccess || false,
              totalPermissions: parsedPermissions.totalPermissions || 0,
              totalModules: parsedPermissions.totalModules || 0
            };
            
            setUserPermissions(validatedCachedPermissions);
            console.log('Using cached permissions');
          } catch (parseError) {
            console.error('Error parsing cached permissions:', parseError);
          }
        }
      }
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('user_permissions');
        localStorage.removeItem('permissions_timestamp');
        window.location.href = `/${tenantSlug}/login`;
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [tenantSlug]);

  const hasPermission = useCallback((moduleKey: string, action: string): boolean => {
    if (!userPermissions || !userPermissions.permissions || !Array.isArray(userPermissions.permissions)) return false;
    
    const permissionKey = `${moduleKey}:${action}`;
    return userPermissions.permissions.includes(permissionKey);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((moduleKey: string): boolean => {
    if (!userPermissions || !userPermissions.permissions || !Array.isArray(userPermissions.permissions)) return false;
    
    return userPermissions.permissions.some(permission => 
      permission && typeof permission === 'string' && permission.startsWith(`${moduleKey}:`)
    );
  }, [userPermissions]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!userPermissions || !userPermissions.user || !userPermissions.user.roles || !Array.isArray(userPermissions.user.roles)) return false;
    
    return userPermissions.user.roles.some(role => 
      role && role.name && typeof role.name === 'string' && role.name.toLowerCase() === roleName.toLowerCase()
    );
  }, [userPermissions]);

  const canAccessModule = useCallback((moduleKey: string): boolean => {
    if (!userPermissions || !userPermissions.accessibleModules || !Array.isArray(userPermissions.accessibleModules)) return false;
    
    return userPermissions.accessibleModules.includes(moduleKey);
  }, [userPermissions]);

  const canPerformAction = useCallback((moduleKey: string, action: string): boolean => {
    if (!userPermissions || !userPermissions.modulePermissions) return false;
    
    const modulePerms = userPermissions.modulePermissions[moduleKey];
    if (!modulePerms || !Array.isArray(modulePerms)) return false;
    
    return modulePerms.includes(action);
  }, [userPermissions]);

  const getMenuItems = useCallback((): MenuItem[] => {
    if (!userPermissions || !userPermissions.menuItems || !Array.isArray(userPermissions.menuItems)) return [];
    
    // If menu items are empty, return fallback items with proper tenant slug
    if (userPermissions.menuItems.length === 0) {
      const tenantSlug = userPermissions.user?.tenant?.slug;
      if (!tenantSlug) return [];
      
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "LayoutDashboard",
          path: `/${tenantSlug}/dashboard`,
          description: "Main dashboard with overview and analytics",
          permissions: ["dashboard:view"],
          hasChildren: false
        },
        {
          id: "users",
          label: "Users",
          icon: "Users",
          path: `/${tenantSlug}/users`,
          description: "Manage users and their roles",
          permissions: ["users:view"],
          hasChildren: false
        },
        {
          id: "roles",
          label: "Roles",
          icon: "Shield",
          path: `/${tenantSlug}/roles`,
          description: "Manage roles and permissions",
          permissions: ["roles:view"],
          hasChildren: false
        },
        {
          id: "audit",
          label: "Audit Logs",
          icon: "ClipboardList",
          path: `/${tenantSlug}/audit`,
          description: "View system audit logs",
          permissions: ["audit:view"],
          hasChildren: false
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: "Bell",
          path: `/${tenantSlug}/notifications`,
          description: "Manage notifications",
          permissions: ["notifications:view"],
          hasChildren: false
        },
        {
          id: "settings",
          label: "Settings",
          icon: "Settings",
          path: `/${tenantSlug}/settings`,
          description: "System and tenant settings",
          permissions: ["settings:view"],
          hasChildren: false
        },
        {
          id: "support",
          label: "Support",
          icon: "LifeBuoy",
          path: `/${tenantSlug}/support`,
          description: "Support tickets and help",
          permissions: ["support:view"],
          hasChildren: false
        }
      ];
    }
    
    return userPermissions.menuItems;
  }, [userPermissions]);

  const getModulePermissions = useCallback((moduleKey: string): string[] => {
    if (!userPermissions || !userPermissions.modulePermissions) return [];
    
    return userPermissions.modulePermissions[moduleKey] || [];
  }, [userPermissions]);

  const refreshPermissions = useCallback(async () => {
    await fetchUserPermissions();
  }, [fetchUserPermissions]);

  const clearPermissions = useCallback(() => {
    setUserPermissions(null);
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('permissions_timestamp');
  }, []);

  // Check if user has access (has permissions and is authenticated)
  // Also return true if we have fallback menu items available
  const hasAccess = useCallback((): boolean => {
    return userPermissions !== null && userPermissions.hasAccess === true;
  }, [userPermissions]);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Set up periodic refresh (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (userPermissions && !isLoading) {
        fetchUserPermissions();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [fetchUserPermissions, userPermissions, isLoading]);

  const value: DynamicPermissionsContextType = {
    userPermissions,
    isLoading,
    error,
    isInitialized,
    hasAccess: hasAccess(),
    hasPermission,
    hasAnyPermission,
    hasRole,
    canAccessModule,
    canPerformAction,
    getMenuItems,
    getModulePermissions,
    refreshPermissions,
    clearPermissions
  };

  return (
    <DynamicPermissionsContext.Provider value={value}>
      {children}
    </DynamicPermissionsContext.Provider>
  );
}; 