"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
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

  const fetchUserProfile = async () => {
    if (!tenantSlug) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      
      // Debug logging for token
      console.log('🔍 Token Debug:', {
        tenantAuthToken: localStorage.getItem('tenant_auth_token'),
        authToken: localStorage.getItem('auth_token'),
        accessToken: sessionStorage.getItem('access_token'),
        finalToken: token,
        hasToken: !!token,
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage)
      });
      
      if (!token) {
        // Don't throw error if no token - just set loading to false
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
        

        
        setUser(userData);
        setPermissions(userData.permissions);
        setRoles(userData.roles);
        setTenant(userData.tenant);
      } else {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }
    } catch (err: any) {
      // Only log error in development and if it's not a 401 (which is expected when not logged in)
      if (process.env.NODE_ENV === 'development' && err.response?.status !== 401) {
        console.error('Error fetching user profile:', err);
      }
      setError(err.response?.data?.message || err.message || 'Failed to fetch user profile');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_auth_token');
        sessionStorage.removeItem('access_token');
        window.location.href = `/${tenantSlug}/login`;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    return permissions.some(p => p.module === module && p.action === action);
  };

  const hasAnyPermission = (module: string): boolean => {
    return permissions.some(p => p.module === module);
  };

  const hasRole = (roleName: string): boolean => {
    return roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  useEffect(() => {
    fetchUserProfile();
  }, [tenantSlug]);

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
    refreshUser
  };

  return (
    <TenantAuthContext.Provider value={value}>
      {children}
    </TenantAuthContext.Provider>
  );
}; 