import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, Tenant, Permission } from "@/types";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  tenant: Tenant | null;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  tenant: null,
  permissions: [],
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: state => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        token: string;
        refreshToken: string;
        tenant?: Tenant;
        permissions?: Permission[];
      }>
    ) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.tenant = action.payload.tenant || null;
      state.permissions = action.payload.permissions || [];
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
    },
    logout: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.tenant = null;
      state.permissions = [];
      state.error = null;
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    setTenant: (state, action: PayloadAction<Tenant>) => {
      state.tenant = action.payload;
    },
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateToken,
  updateUser,
  setTenant,
  setPermissions,
  setLoading,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
