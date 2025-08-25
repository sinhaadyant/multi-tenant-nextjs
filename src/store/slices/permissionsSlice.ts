import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { mapFrontendToBackendKey } from '@/utils/moduleKeyMapping';

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

export interface Permission {
  id: string;
  moduleKey: string;
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  permissions: Permission[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
}

export interface UserProfile {
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

export interface ModulePermission {
  [moduleKey: string]: string[];
}

export interface UserPermissions {
  user: UserProfile;
  permissions: Permission[];
  modulePermissions: ModulePermission;
  accessibleModules: string[];
  menuItems: MenuItem[];
  hasAccess: boolean;
  totalPermissions: number;
  totalModules: number;
}

export interface PermissionsState {
  userPermissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  lastFetched: number | null;
  tenantSlug: string | null;
}

const initialState: PermissionsState = {
  userPermissions: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  lastFetched: null,
  tenantSlug: null,
};

// Permissions slice
const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<UserPermissions>) => {
      console.log('🔍 Redux: setPermissions action dispatched with payload:', action.payload);
      console.log('🔍 Redux: Current state before update:', state);
      
      state.userPermissions = action.payload;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      
      console.log('🔍 Redux: State after update:', state);
      console.log('🔍 Redux: Permissions count:', action.payload.permissions?.length || 0);
      console.log('🔍 Redux: User permissions count:', action.payload.user?.permissions?.length || 0);
    },
    setPermissionsLoading: (state, action: PayloadAction<boolean>) => {
      console.log('🔍 Redux: setPermissionsLoading action dispatched:', action.payload);
      state.isLoading = action.payload;
    },
    setPermissionsError: (state, action: PayloadAction<string | null>) => {
      console.log('🔍 Redux: setPermissionsError action dispatched:', action.payload);
      state.error = action.payload;
      state.isLoading = false;
    },
    setPermissionsInitialized: (state, action: PayloadAction<boolean>) => {
      console.log('🔍 Redux: setPermissionsInitialized action dispatched:', action.payload);
      state.isInitialized = action.payload;
    },
    setTenantSlug: (state, action: PayloadAction<string>) => {
      console.log('🔍 Redux: setTenantSlug action dispatched:', action.payload);
      state.tenantSlug = action.payload;
    },
    updateUserPermissions: (state, action: PayloadAction<Partial<UserPermissions>>) => {
      console.log('🔍 Redux: updateUserPermissions action dispatched:', action.payload);
      if (state.userPermissions) {
        state.userPermissions = { ...state.userPermissions, ...action.payload };
      }
    },
    clearPermissions: (state) => {
      console.log('🔍 Redux: clearPermissions action dispatched');
      state.userPermissions = null;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = false;
      state.lastFetched = null;
      state.tenantSlug = null;
    },
    refreshPermissions: (state) => {
      console.log('🔍 Redux: refreshPermissions action dispatched');
      state.lastFetched = Date.now();
    },
  },
});

export const {
  setPermissions,
  setPermissionsLoading,
  setPermissionsError,
  setPermissionsInitialized,
  setTenantSlug,
  updateUserPermissions,
  clearPermissions,
  refreshPermissions,
} = permissionsSlice.actions;

// Selectors
export const selectPermissions = (state: { permissions: PermissionsState }) => state.permissions;
export const selectUserPermissions = (state: { permissions: PermissionsState }) => state.permissions.userPermissions;
export const selectPermissionsLoading = (state: { permissions: PermissionsState }) => state.permissions.isLoading;
export const selectPermissionsError = (state: { permissions: PermissionsState }) => state.permissions.error;
export const selectPermissionsInitialized = (state: { permissions: PermissionsState }) => state.permissions.isInitialized;
export const selectLastFetched = (state: { permissions: PermissionsState }) => state.permissions.lastFetched;
export const selectTenantSlug = (state: { permissions: PermissionsState }) => state.permissions.tenantSlug;

// Permission check selectors - Updated for new permission structure
export const selectHasPermission = (moduleKey: string, action: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  const mappedModuleKey = mapFrontendToBackendKey(moduleKey);
  console.log('🔍 Redux: selectHasPermission called with:', { moduleKey, mappedModuleKey, action, permissions });
  
  if (!permissions || !permissions.permissions || !Array.isArray(permissions.permissions)) {
    console.log('🔍 Redux: No permissions available for check');
    return false;
  }
  
  // Validate action parameter
  if (!action || typeof action !== 'string') {
    console.log('🔍 Redux: Invalid action parameter:', action);
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
    'manage': 'canUpdate'
  };
  
  const permissionField = actionMap[action.toLowerCase()] || action;
  
  // Validate that the permission field exists in the Permission interface
  const validPermissionFields = ['canCreate', 'canRead', 'canUpdate', 'canDelete', 'canViewAll'];
  if (!validPermissionFields.includes(permissionField)) {
    console.log('🔍 Redux: Invalid permission field:', permissionField);
    return false;
  }
  
  const result = permissions.permissions.some(permission => 
    permission.moduleKey === mappedModuleKey && permission[permissionField as keyof Permission] === true
  );
  
  console.log('🔍 Redux: Permission check result:', { moduleKey, mappedModuleKey, action, permissionField, result });
  return result;
};

export const selectHasAnyPermission = (moduleKey: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  const mappedModuleKey = mapFrontendToBackendKey(moduleKey);
  console.log('🔍 Redux: selectHasAnyPermission called with:', { moduleKey, mappedModuleKey, permissions });
  
  if (!permissions || !permissions.permissions || !Array.isArray(permissions.permissions)) {
    console.log('🔍 Redux: No permissions available for any permission check');
    return false;
  }
  
  const result = permissions.permissions.some(permission => 
    permission.moduleKey === mappedModuleKey
  );
  
  console.log('🔍 Redux: Any permission check result:', { moduleKey, mappedModuleKey, result });
  return result;
};

export const selectHasRole = (roleName: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  console.log('🔍 Redux: selectHasRole called with:', { roleName, permissions });
  
  if (!permissions || !permissions.user || !permissions.user.roles || !Array.isArray(permissions.user.roles)) {
    console.log('🔍 Redux: No roles available for check');
    return false;
  }
  
  const result = permissions.user.roles.some(role => 
    role && role.name && typeof role.name === 'string' && role.name.toLowerCase() === roleName.toLowerCase()
  );
  
  console.log('🔍 Redux: Role check result:', { roleName, result });
  return result;
};

export const selectCanAccessModule = (moduleKey: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  if (!permissions || !permissions.accessibleModules || !Array.isArray(permissions.accessibleModules)) return false;
  
  return permissions.accessibleModules.includes(moduleKey);
};

export const selectMenuItems = (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  if (!permissions || !permissions.menuItems || !Array.isArray(permissions.menuItems)) return [];
  
  return permissions.menuItems;
};

export const selectModulePermissions = (moduleKey: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  if (!permissions || !permissions.modulePermissions) return [];
  
  return permissions.modulePermissions[moduleKey] || [];
};

export default permissionsSlice.reducer;
