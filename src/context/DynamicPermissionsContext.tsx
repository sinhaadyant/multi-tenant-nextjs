"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

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
  // Use the Redux-based permissions hook
  const permissions = usePermissions();

  const value: DynamicPermissionsContextType = {
    userPermissions: permissions.userPermissions,
    isLoading: permissions.isLoading,
    error: permissions.error,
    isInitialized: permissions.isInitialized,
    hasAccess: permissions.hasAccess,
    hasPermission: permissions.hasPermission,
    hasAnyPermission: permissions.hasAnyPermission,
    hasRole: permissions.hasRole,
    canAccessModule: permissions.canAccessModule,
    canPerformAction: permissions.canPerformAction,
    getMenuItems: permissions.getMenuItems,
    getModulePermissions: permissions.getModulePermissions,
    refreshPermissions: permissions.refreshPermissions,
    clearPermissions: permissions.clearPermissions
  };

  return (
    <DynamicPermissionsContext.Provider value={value}>
      {children}
    </DynamicPermissionsContext.Provider>
  );
}; 