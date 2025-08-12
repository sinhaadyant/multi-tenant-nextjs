import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin';
  avatar?: string;
  permissions?: string[];
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null; // Access token (short-lived)
  refreshToken: string | null; // Refresh token (longer-lived)
  email: string | null; // User email
  isHydrated: boolean; // Tracks if Redux Persist has rehydrated
  lastValidatedAt: number | null; // Timestamp of last token validation
  sessionExpiresAt: number | null; // When the session expires
  isImpersonating: boolean;
  impersonatedUser: User | null;
  originalUser: User | null;
  isInitialized: boolean; // Tracks if initial auth check is complete
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  token: null,
  refreshToken: null,
  email: null,
  isHydrated: false,
  lastValidatedAt: null,
  sessionExpiresAt: null,
  isImpersonating: false,
  impersonatedUser: null,
  originalUser: null,
  isInitialized: false,
};

export interface LoginPayload {
  user: User;
  token: string;
  refreshToken: string;
  email: string;
  expiresAt?: number;
}

export interface RefreshTokenPayload {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ImpersonationPayload {
  impersonatedUser: User;
  token: string;
}

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLogin: (state, action: PayloadAction<LoginPayload>) => {
      const { user, token, refreshToken, email } = action.payload;
      
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.email = email;
      state.isLoggedIn = true;
      state.lastValidatedAt = Date.now();
      state.isInitialized = true;
      state.isHydrated = true; // Mark as hydrated after successful login
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.email = null;
      state.isLoggedIn = false;
      state.lastValidatedAt = null;
      state.sessionExpiresAt = null;
      state.isImpersonating = false;
      state.impersonatedUser = null;
      state.originalUser = null;
      state.isInitialized = true;
      state.isHydrated = false; // Reset hydration state on logout
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
    },
    setHydrated: (state) => {
      state.isHydrated = true;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.lastValidatedAt = Date.now();
    },
    refreshTokens: (state, action: PayloadAction<RefreshTokenPayload>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.sessionExpiresAt = action.payload.expiresAt;
      state.lastValidatedAt = Date.now();
    },
    updateLastValidated: (state) => {
      state.lastValidatedAt = Date.now();
    },
    startImpersonation: (state, action: PayloadAction<ImpersonationPayload>) => {
      state.originalUser = state.user;
      state.impersonatedUser = action.payload.impersonatedUser;
      state.isImpersonating = true;
      state.token = action.payload.token;
    },
    stopImpersonation: (state) => {
      state.user = state.originalUser;
      state.impersonatedUser = null;
      state.originalUser = null;
      state.isImpersonating = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.email = null;
      state.isLoggedIn = false;
    },
  },
});

export const {
  setLogin,
  setLogout,
  setUser,
  setToken,
  setRefreshToken,
  setHydrated,
  setInitialized,
  updateUser,
  updateToken,
  refreshTokens,
  updateLastValidated,
  startImpersonation,
  stopImpersonation,
  clearAuth,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsLoggedIn = (state: { auth: AuthState }) => state.auth.isLoggedIn;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectEmail = (state: { auth: AuthState }) => state.auth.email;
export const selectIsHydrated = (state: { auth: AuthState }) => state.auth.isHydrated;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectLastValidatedAt = (state: { auth: AuthState }) => state.auth.lastValidatedAt;
export const selectSessionExpiresAt = (state: { auth: AuthState }) => state.auth.sessionExpiresAt;
export const selectIsImpersonating = (state: { auth: AuthState }) => state.auth.isImpersonating;
export const selectImpersonatedUser = (state: { auth: AuthState }) => state.auth.impersonatedUser;
export const selectOriginalUser = (state: { auth: AuthState }) => state.auth.originalUser;
export const selectCurrentUser = (state: { auth: AuthState }) => 
  state.auth.isImpersonating ? state.auth.impersonatedUser : state.auth.user;

export default authSlice.reducer;