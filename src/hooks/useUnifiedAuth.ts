import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { 
  selectAuth, 
  selectIsLoggedIn, 
  selectUser, 
  selectToken, 
  selectRefreshToken,
  selectIsHydrated,
  selectIsInitialized,
  setLogin,
  setLogout,
  clearAuth
} from '@/store/slices/authSlice';
import {
  selectTenantAuth,
  selectTenantIsLoggedIn,
  selectTenantUser,
  selectTenantToken,
  selectTenantRefreshToken,
  selectTenantIsHydrated,
  selectTenantIsInitialized,
  selectTenantSlug,
  setTenantLogin,
  setTenantLogout,
  clearTenantAuth,
  setTenantPermissions
} from '@/store/slices/tenantAuthSlice';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface LoginResponse {
  user: any;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

export const useUnifiedAuth = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Superadmin auth state
  const superadminAuth = useAppSelector(selectAuth);
  const isSuperadminLoggedIn = useAppSelector(selectIsLoggedIn);
  const superadminUser = useAppSelector(selectUser);
  const superadminToken = useAppSelector(selectToken);
  const superadminRefreshToken = useAppSelector(selectRefreshToken);
  const isSuperadminHydrated = useAppSelector(selectIsHydrated);
  const isSuperadminInitialized = useAppSelector(selectIsInitialized);

  // Tenant auth state
  const tenantAuth = useAppSelector(selectTenantAuth);
  const isTenantLoggedIn = useAppSelector(selectTenantIsLoggedIn);
  const tenantUser = useAppSelector(selectTenantUser);
  const tenantToken = useAppSelector(selectTenantToken);
  const tenantRefreshToken = useAppSelector(selectTenantRefreshToken);
  const isTenantHydrated = useAppSelector(selectTenantIsHydrated);
  const isTenantInitialized = useAppSelector(selectTenantIsInitialized);
  const tenantSlug = useAppSelector(selectTenantSlug);

  // Determine current user type and state
  const isLoggedIn = isSuperadminLoggedIn || isTenantLoggedIn;
  const currentUser = isSuperadminLoggedIn ? superadminUser : (isTenantLoggedIn ? tenantUser : null);
  const currentToken = isSuperadminLoggedIn ? superadminToken : (isTenantLoggedIn ? tenantToken : null);
  const currentRefreshToken = isSuperadminLoggedIn ? superadminRefreshToken : (isTenantLoggedIn ? tenantRefreshToken : null);
  const isHydrated = isSuperadminHydrated && isTenantHydrated;
  const isInitialized = isSuperadminInitialized && isTenantInitialized;
  const userType = isSuperadminLoggedIn ? 'superadmin' : (isTenantLoggedIn ? 'tenant' : null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      // Check if we have any tokens
      const hasSuperadminToken = !!superadminToken || !!localStorage.getItem('auth_token');
      const hasTenantToken = !!tenantToken || !!localStorage.getItem('tenant_auth_token');
      
      if (!hasSuperadminToken && !hasTenantToken) {
        return;
      }

      // Try to verify superadmin token first
      if (hasSuperadminToken) {
        try {
          const response = await api.get('/auth/verify');
          if (response.data.success) {
            // Superadmin is authenticated
            return;
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Clear superadmin auth if token is invalid
            dispatch(clearAuth());
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
          }
        }
      }

      // Try to verify tenant token
      if (hasTenantToken && tenantSlug) {
        try {
          const response = await api.get(`/tenant/${tenantSlug}/auth/verify`);
          if (response.data.success) {
            // Tenant is authenticated
            return;
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Clear tenant auth if token is invalid
            dispatch(clearTenantAuth());
            localStorage.removeItem('tenant_auth_token');
            localStorage.removeItem('tenant_refresh_token');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }, [superadminToken, tenantToken, tenantSlug, dispatch]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const endpoint = credentials.tenantSlug 
        ? `/tenant/${credentials.tenantSlug}/auth/login`
        : '/superadmin/auth/login';

      const response = await api.post(endpoint, credentials);
      
      if (response.data.success) {
        const { user, token, refreshToken, expiresAt } = response.data.data;
        
        if (credentials.tenantSlug) {
          // Tenant login
          const loginPayload = {
            user,
            token,
            refreshToken: refreshToken || '',
            email: user.email,
            tenantSlug: credentials.tenantSlug,
            expiresAt
          };
          
          dispatch(setTenantLogin(loginPayload));
          
          // Store tokens in localStorage for tenant
          localStorage.setItem('tenant_auth_token', token);
          if (refreshToken) {
            localStorage.setItem('tenant_refresh_token', refreshToken);
          }
        } else {
          // Superadmin login
          const loginPayload = {
            user,
            token,
            refreshToken: refreshToken || '',
            email: user.email,
            expiresAt
          };
          
          dispatch(setLogin(loginPayload));
          
          // Store tokens in localStorage for superadmin
          localStorage.setItem('auth_token', token);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
        }

        toast.success('Login successful!');
        
        // Redirect to appropriate dashboard
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
        } else {
          const dashboardPath = credentials.tenantSlug 
            ? `/${credentials.tenantSlug}/dashboard`
            : '/superadmin/dashboard';
          router.push(dashboardPath);
        }

        return true;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      return false;
    }
  }, [dispatch, router]);

  const logout = useCallback(async (options: {
    redirect?: boolean;
    redirectTo?: string;
    showToast?: boolean;
  } = {}) => {
    const { redirect = true, redirectTo, showToast = true } = options;

    try {
      // Call logout endpoint if user is authenticated
      if (isLoggedIn) {
        const endpoint = userType === 'superadmin' ? '/auth/logout' : `/tenant/${tenantSlug}/auth/logout`;
        await api.post(endpoint);
      }
    } catch (error) {
      // Ignore logout API errors, just clear local data
      console.warn('Logout API call failed:', error);
    }

    // Clear both auth states
    dispatch(clearAuth());
    dispatch(clearTenantAuth());
    
    // Clear all tokens from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('tenant_auth_token');
    localStorage.removeItem('tenant_refresh_token');
    localStorage.removeItem('persist:superadmin-root');

    if (showToast) {
      toast.success('Logged out successfully');
    }

    // Redirect if requested
    if (redirect) {
      const loginPath = redirectTo || (userType === 'superadmin' ? '/superadmin/login' : '/login');
      router.push(loginPath);
    }
  }, [isLoggedIn, userType, tenantSlug, dispatch, router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = userType === 'superadmin' 
        ? superadminRefreshToken || localStorage.getItem('refresh_token')
        : tenantRefreshToken || localStorage.getItem('tenant_refresh_token');
      
      if (!refreshToken) {
        return false;
      }

      const endpoint = userType === 'superadmin' ? '/auth/refresh' : `/tenant/${tenantSlug}/auth/refresh`;
      const response = await api.post(endpoint, { refreshToken });
      
      if (response.data.success) {
        const { token, refreshToken: newRefreshToken, expiresAt } = response.data.data;
        
        if (userType === 'superadmin') {
          // Update superadmin tokens
          dispatch(setLogin({
            user: superadminUser!,
            token,
            refreshToken: newRefreshToken || '',
            email: superadminUser!.email,
            expiresAt
          }));
          localStorage.setItem('auth_token', token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
        } else {
          // Update tenant tokens
          dispatch(setTenantLogin({
            user: tenantUser!,
            token,
            refreshToken: newRefreshToken || '',
            email: tenantUser!.email,
            tenantSlug: tenantSlug!,
            expiresAt
          }));
          localStorage.setItem('tenant_auth_token', token);
          if (newRefreshToken) {
            localStorage.setItem('tenant_refresh_token', newRefreshToken);
          }
        }
        
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth on refresh failure
      dispatch(clearAuth());
      dispatch(clearTenantAuth());
    }
    
    return false;
  }, [userType, superadminRefreshToken, tenantRefreshToken, tenantSlug, superadminUser, tenantUser, dispatch]);

  const updateUser = useCallback((userData: any) => {
    if (userType === 'superadmin') {
      dispatch(setLogin({
        user: { ...superadminUser!, ...userData },
        token: superadminToken!,
        refreshToken: superadminRefreshToken || '',
        email: superadminUser!.email
      }));
    } else if (userType === 'tenant') {
      dispatch(setTenantLogin({
        user: { ...tenantUser!, ...userData },
        token: tenantToken!,
        refreshToken: tenantRefreshToken || '',
        email: tenantUser!.email,
        tenantSlug: tenantSlug!
      }));
    }
  }, [userType, superadminUser, superadminToken, superadminRefreshToken, tenantUser, tenantToken, tenantRefreshToken, tenantSlug, dispatch]);

  const setPermissions = useCallback((permissions: any) => {
    if (userType === 'tenant') {
      dispatch(setTenantPermissions(permissions));
    }
  }, [userType, dispatch]);

  return {
    // State
    isLoggedIn,
    currentUser,
    currentToken,
    currentRefreshToken,
    isHydrated,
    isInitialized,
    userType,
    
    // Superadmin specific
    isSuperadminLoggedIn,
    superadminUser,
    superadminToken,
    superadminAuth,
    
    // Tenant specific
    isTenantLoggedIn,
    tenantUser,
    tenantToken,
    tenantAuth,
    tenantSlug,
    
    // Actions
    login,
    logout,
    checkAuthStatus,
    refreshToken,
    updateUser,
    setPermissions
  };
}; 