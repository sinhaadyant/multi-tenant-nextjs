import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  avatar?: string;
  permissions?: string[];
  accessibleModules?: string[];
  menuItems?: any[];
  hasAccess?: boolean;
}

export interface Module {
  id: string;
  moduleKey: string;
  moduleName: string;
  path?: string;
  icon?: string;
  description?: string;
  version?: string;
  minVersion?: string;
  maxVersion?: string;
  releaseNotes?: string;
  isVisible: boolean;
  orderIndex: number;
  permissions: any[];
  childModules: Module[];
  // Tenant-specific settings
  isEnabled: boolean;
  isVisibleInTenant: boolean;
  tenantVersion?: string;
  tenantSettings?: any;
  enabledAt?: string;
  disabledAt?: string;
  enabledBy?: string;
  disabledBy?: string;
  analytics?: {
    lastAccessedAt?: string;
    accessCount: number;
  };
}

export interface TenantAuthState {
  isLoggedIn: boolean;
  user: TenantUser | null;
  token: string | null;
  refreshToken: string | null;
  email: string | null;
  tenantSlug: string | null;
  isHydrated: boolean;
  lastValidatedAt: number | null;
  sessionExpiresAt: number | null;
  isInitialized: boolean;
  permissions: {
    allPermissions: string[];
    modulePermissions: Record<string, string[]>;
    accessibleModules: string[];
    menuItems: any[];
  } | null;
  modules: Module[] | null;
  modulesLoading: boolean;
  modulesError: string | null;
}

const initialState: TenantAuthState = {
  isLoggedIn: false,
  user: null,
  token: null,
  refreshToken: null,
  email: null,
  tenantSlug: null,
  isHydrated: false,
  lastValidatedAt: null,
  sessionExpiresAt: null,
  isInitialized: false,
  permissions: null,
  modules: null,
  modulesLoading: false,
  modulesError: null,
};

export interface TenantLoginPayload {
  user: TenantUser;
  token: string;
  refreshToken: string;
  email: string;
  tenantSlug: string;
  expiresAt?: number;
}

export interface TenantRefreshTokenPayload {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface TenantPermissionsPayload {
  allPermissions: string[];
  modulePermissions: Record<string, string[]>;
  accessibleModules: string[];
  menuItems: any[];
}

export interface TenantModulesPayload {
  modules: Module[];
}

// Tenant Auth slice
const tenantAuthSlice = createSlice({
  name: 'tenantAuth',
  initialState,
  reducers: {
    setTenantLogin: (state, action: PayloadAction<TenantLoginPayload>) => {
      const { user, token, refreshToken, email, tenantSlug } = action.payload;
      
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.email = email;
      state.tenantSlug = tenantSlug;
      state.isLoggedIn = true;
      state.lastValidatedAt = Date.now();
      state.isInitialized = true;
      state.isHydrated = true; // Mark as hydrated after successful login
    },
    setTenantLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.email = null;
      state.tenantSlug = null;
      state.isLoggedIn = false;
      state.lastValidatedAt = null;
      state.sessionExpiresAt = null;
      state.isInitialized = true;
      state.isHydrated = false; // Reset hydration state on logout
      state.permissions = null;
      state.modules = null;
      state.modulesLoading = false;
      state.modulesError = null;
    },
    setTenantUser: (state, action: PayloadAction<TenantUser>) => {
      state.user = action.payload;
    },
    setTenantToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setTenantRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
    },
    setTenantHydrated: (state) => {
      state.isHydrated = true;
    },
    setTenantInitialized: (state) => {
      state.isInitialized = true;
    },
    updateTenantUser: (state, action: PayloadAction<Partial<TenantUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateTenantToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.lastValidatedAt = Date.now();
    },
    refreshTenantTokens: (state, action: PayloadAction<TenantRefreshTokenPayload>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.sessionExpiresAt = action.payload.expiresAt;
      state.lastValidatedAt = Date.now();
    },
    updateTenantLastValidated: (state) => {
      state.lastValidatedAt = Date.now();
    },
    setTenantPermissions: (state, action: PayloadAction<TenantPermissionsPayload>) => {
      state.permissions = action.payload;
    },
    setTenantModules: (state, action: PayloadAction<TenantModulesPayload>) => {
      state.modules = action.payload.modules;
      state.modulesLoading = false;
      state.modulesError = null;
    },
    setTenantModulesLoading: (state, action: PayloadAction<boolean>) => {
      state.modulesLoading = action.payload;
    },
    setTenantModulesError: (state, action: PayloadAction<string | null>) => {
      state.modulesError = action.payload;
      state.modulesLoading = false;
    },
    clearTenantAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.email = null;
      state.tenantSlug = null;
      state.isLoggedIn = false;
      state.permissions = null;
      state.modules = null;
      state.modulesLoading = false;
      state.modulesError = null;
    },
  },
});

export const {
  setTenantLogin,
  setTenantLogout,
  setTenantUser,
  setTenantToken,
  setTenantRefreshToken,
  setTenantHydrated,
  setTenantInitialized,
  updateTenantUser,
  updateTenantToken,
  refreshTenantTokens,
  updateTenantLastValidated,
  setTenantPermissions,
  setTenantModules,
  setTenantModulesLoading,
  setTenantModulesError,
  clearTenantAuth,
} = tenantAuthSlice.actions;

// Selectors
export const selectTenantAuth = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth;
export const selectTenantIsLoggedIn = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.isLoggedIn;
export const selectTenantUser = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.user;
export const selectTenantToken = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.token;
export const selectTenantRefreshToken = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.refreshToken;
export const selectTenantEmail = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.email;
export const selectTenantSlug = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.tenantSlug;
export const selectTenantIsHydrated = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.isHydrated;
export const selectTenantIsInitialized = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.isInitialized;
export const selectTenantLastValidatedAt = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.lastValidatedAt;
export const selectTenantSessionExpiresAt = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.sessionExpiresAt;
export const selectTenantPermissions = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.permissions;
export const selectTenantModules = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.modules;
export const selectTenantModulesLoading = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.modulesLoading;
export const selectTenantModulesError = (state: { tenantAuth: TenantAuthState }) => state.tenantAuth.modulesError;

export default tenantAuthSlice.reducer; 