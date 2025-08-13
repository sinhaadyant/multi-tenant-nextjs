import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  login_restrictions: {
    max_devices: number;
    allow_multiple_sessions: boolean;
    session_timeout: number;
  };
  created_at: string;
  updated_at: string;
}

export interface TenantState {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  currentTenant: null,
  availableTenants: [],
  isLoading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<Tenant | null>) => {
      state.currentTenant = action.payload;
    },
    setAvailableTenants: (state, action: PayloadAction<Tenant[]>) => {
      state.availableTenants = action.payload;
    },
    clearCurrentTenant: state => {
      state.currentTenant = null;
    },
    setTenantLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTenantError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearTenantError: state => {
      state.error = null;
    },
  },
});

export const {
  setCurrentTenant,
  setAvailableTenants,
  clearCurrentTenant,
  setTenantLoading,
  setTenantError,
  clearTenantError,
} = tenantSlice.actions;

export default tenantSlice.reducer;
