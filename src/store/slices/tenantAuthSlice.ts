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

// Tenant Auth slice
const tenantAuthSlice = createSlice({
  name: 'tenantAuth',
  initialState,
  reducers: {
    setTenantLogin: (state, action: PayloadAction<TenantLoginPayload>) => {
      const { user, token, refreshToken, email, tenantSlug } = action.payload;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Tenant Redux: setTenantLogin called with payload:', {
          email: email,
          tenantSlug: tenantSlug,
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          hasUser: !!user,
        });
      }
      
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.email = email;
      state.tenantSlug = tenantSlug;
      state.isLoggedIn = true;
      state.lastValidatedAt = Date.now();
      state.isInitialized = true;
      state.isHydrated = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Tenant Redux: setTenantLogin completed, new state:', {
          isLoggedIn: state.isLoggedIn,
          hasUser: !!state.user,
          hasToken: !!state.token,
          hasRefreshToken: !!state.refreshToken,
          email: state.email,
          tenantSlug: state.tenantSlug,
        });
      }
    },
    setTenantLogout: (state) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Tenant Redux: setTenantLogout called');
      }
      
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.email = null;
      state.tenantSlug = null;
      state.isLoggedIn = false;
      state.lastValidatedAt = null;
      state.sessionExpiresAt = null;
      state.isInitialized = true;
      state.isHydrated = false;
      state.permissions = null;
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
    clearTenantAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.email = null;
      state.tenantSlug = null;
      state.isLoggedIn = false;
      state.permissions = null;
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

export default tenantAuthSlice.reducer; 