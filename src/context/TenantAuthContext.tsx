"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Permission {
  id: string;
  moduleKey: string;
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  permissions: Permission[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  tenant: Tenant;
  roles: Role[];
  permissions: Permission[];
}

interface TenantAuthContextType {
  user: UserProfile | null;
  permissions: Permission[];
  roles: Role[];
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (module: string) => boolean;
  hasRole: (roleName: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

export const useTenantAuth = () => {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
};

interface TenantAuthProviderProps {
  children: ReactNode;
}

export const TenantAuthProvider: React.FC<TenantAuthProviderProps> = ({ children }) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    // Try multiple token sources in order of preference
    const token = localStorage.getItem('tenant_auth_token') || 
                  localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('access_token');
    
    return token;
  };

  const clearAuthData = () => {
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setTenant(null);
    setError(null);
    
    // Clear tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
  };

  const fetchUserProfile = async () => {
    if (!tenantSlug) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = getAuthToken();
      
      // Debug logging for token
      console.log('🔍 TenantAuthContext - Token Debug:', {
        tenantSlug,
        tenantAuthToken: localStorage.getItem('tenant_auth_token'),
        authToken: localStorage.getItem('auth_token'),
        accessToken: sessionStorage.getItem('access_token'),
        finalToken: token ? 'present' : 'missing',
        hasToken: !!token
      });
      
      if (!token) {
        console.log('🔍 No token found, user not authenticated');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Making API call to:', `/api/tenant/${tenantSlug}/me`);
      
      const response = await axios.get(`/api/tenant/${tenantSlug}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('🔍 API Response:', {
        success: response.data.success,
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      if (response.data.success) {
        const userData = response.data;
        
        console.log('🔍 Setting user data:', {
          userId: userData.id,
          userEmail: userData.email,
          tenantName: userData.tenant?.name,
          rolesCount: userData.roles?.length || 0,
          permissionsCount: userData.permissions?.length || 0
        });

        console.log('🔍 Raw permissions data:', userData.permissions);
        console.log('🔍 Raw roles data:', userData.roles);
        
        setUser(userData);
        setPermissions(userData.permissions || []);
        setRoles(userData.roles || []);
        setTenant(userData.tenant);

        console.log('🔍 State updated - checking permissions after setState');
        console.log('🔍 Permissions state will be:', userData.permissions || []);
        console.log('🔍 Roles state will be:', userData.roles || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }
    } catch (err: any) {
      console.error('❌ Error fetching user profile:', err);
      
      // Only log error in development and if it's not a 401 (which is expected when not logged in)
      if (process.env.NODE_ENV === 'development' && err.response?.status !== 401) {
        console.error('Error fetching user profile:', err);
      }
      
      setError(err.response?.data?.message || err.message || 'Failed to fetch user profile');
      
      // If unauthorized, clear tokens and auth data
      if (err.response?.status === 401) {
        console.log('🔍 401 Unauthorized - clearing auth data');
        clearAuthData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    console.log(`🔒 hasPermission called - module: ${module}, action: ${action}`);
    console.log(`🔒 Current permissions state:`, permissions);
    
    if (!permissions || permissions.length === 0) {
      console.log(`🔒 No permissions available for module: ${module}, action: ${action}`);
      return false;
    }
    
    // Map action names to permission field names
    const actionMap: { [key: string]: string } = {
      'view': 'canRead',
      'read': 'canRead',
      'create': 'canCreate',
      'update': 'canUpdate',
      'delete': 'canDelete',
      'viewall': 'canViewAll',
      'manage': 'canUpdate' // manage typically means update permissions
    };
    
    const permissionField = actionMap[action.toLowerCase()] || action;
    console.log(`🔒 Mapped action "${action}" to field "${permissionField}"`);
    
    const matchingPermissions = permissions.filter(p => p.moduleKey === module);
    console.log(`🔒 Matching permissions for module "${module}":`, matchingPermissions);
    
    const hasPerm = permissions.some(p => p.moduleKey === module && p[permissionField as keyof Permission] === true);
    
    console.log(`🔒 Permission check - module: ${module}, action: ${action} (${permissionField}), result: ${hasPerm}`);
    return hasPerm;
  };

  const hasAnyPermission = (module: string): boolean => {
    console.log(`🔒 hasAnyPermission called - module: ${module}`);
    console.log(`🔒 Current permissions state:`, permissions);
    
    if (!permissions || permissions.length === 0) {
      console.log(`🔒 No permissions available for module: ${module}`);
      return false;
    }
    
    const matchingPermissions = permissions.filter(p => p.moduleKey === module);
    console.log(`🔒 Matching permissions for module "${module}":`, matchingPermissions);
    
    const hasAny = permissions.some(p => p.moduleKey === module);
    console.log(`🔒 Any permission check - module: ${module}, result: ${hasAny}`);
    return hasAny;
  };

  const hasRole = (roleName: string): boolean => {
    console.log(`🔒 hasRole called - role: ${roleName}`);
    console.log(`🔒 Current roles state:`, roles);
    
    if (!roles || roles.length === 0) {
      console.log(`🔒 No roles available for role: ${roleName}`);
      return false;
    }
    
    const matchingRoles = roles.filter(r => r.name.toLowerCase() === roleName.toLowerCase());
    console.log(`🔒 Matching roles for "${roleName}":`, matchingRoles);
    
    const hasRoleCheck = roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
    console.log(`🔒 Role check - role: ${roleName}, result: ${hasRoleCheck}`);
    return hasRoleCheck;
  };

  const refreshUser = async () => {
    console.log('🔍 Refreshing user profile...');
    await fetchUserProfile();
  };

  const logout = () => {
    console.log('🔍 Logging out user...');
    clearAuthData();
  };

  useEffect(() => {
    console.log('🔍 TenantAuthContext - useEffect triggered, tenantSlug:', tenantSlug);
    fetchUserProfile();
  }, [tenantSlug]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('🔍 State changed - user:', user?.name);
    console.log('🔍 State changed - permissions count:', permissions.length);
    console.log('🔍 State changed - roles count:', roles.length);
    console.log('🔍 State changed - permissions:', permissions);
    console.log('🔍 State changed - roles:', roles);
  }, [user, permissions, roles]);

  const value: TenantAuthContextType = {
    user,
    permissions,
    roles,
    tenant,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasRole,
    refreshUser,
    logout
  };

  return (
    <TenantAuthContext.Provider value={value}>
      {children}
    </TenantAuthContext.Provider>
  );
}; 