import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
      state.userPermissions = action.payload;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
      state.lastFetched = Date.now();
    },
    setPermissionsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPermissionsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setPermissionsInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setTenantSlug: (state, action: PayloadAction<string>) => {
      state.tenantSlug = action.payload;
    },
    updateUserPermissions: (state, action: PayloadAction<Partial<UserPermissions>>) => {
      if (state.userPermissions) {
        state.userPermissions = { ...state.userPermissions, ...action.payload };
      }
    },
    clearPermissions: (state) => {
      state.userPermissions = null;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = false;
      state.lastFetched = null;
      state.tenantSlug = null;
    },
    refreshPermissions: (state) => {
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

// Permission check selectors
export const selectHasPermission = (moduleKey: string, action: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  if (!permissions || !permissions.permissions || !Array.isArray(permissions.permissions)) return false;
  
  const permissionKey = `${moduleKey}:${action}`;
  return permissions.permissions.includes(permissionKey);
};

export const selectHasAnyPermission = (moduleKey: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  if (!permissions || !permissions.permissions || !Array.isArray(permissions.permissions)) return false;
  
  return permissions.permissions.some(permission => 
    permission && typeof permission === 'string' && permission.startsWith(`${moduleKey}:`)
  );
};

export const selectHasRole = (roleName: string) => (state: { permissions: PermissionsState }) => {
  const permissions = state.permissions.userPermissions;
  if (!permissions || !permissions.user || !permissions.user.roles || !Array.isArray(permissions.user.roles)) return false;
  
  return permissions.user.roles.some(role => 
    role && role.name && typeof role.name === 'string' && role.name.toLowerCase() === roleName.toLowerCase()
  );
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
