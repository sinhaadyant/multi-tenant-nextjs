import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '@/lib/localStorage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'user';
  tenantId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Get initial state from localStorage if available
const getInitialState = (): AuthState => {
  const token = storage.getAuthToken();
  const user = storage.getAuthUser();
  
  if (token && user) {
    return {
      isAuthenticated: true,
      user,
      token,
      isLoading: false,
      error: null,
      isInitialized: true,
    };
  }

  return {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isInitialized: true,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      // Clear localStorage
      storage.clearAuth();
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const {
  setLoading,
  setUser,
  setToken,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setInitialized,
} = authSlice.actions;

export default authSlice.reducer; 