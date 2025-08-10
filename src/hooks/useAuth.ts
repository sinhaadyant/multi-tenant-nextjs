import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  tenantSlug?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if we have a token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      
      if (!token) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return;
      }

      // Verify token by making a request to a protected endpoint
      const response = await api.get('/auth/verify');
      
      if (response.data.success) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        // Token is invalid, clear it
        clearAuth();
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      
      // If it's a 401 error, clear auth data
      if (error.response?.status === 401) {
        clearAuth();
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to verify authentication'
        }));
      }
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const endpoint = credentials.tenantSlug 
        ? `/tenant/${credentials.tenantSlug}/auth/login`
        : '/superadmin/auth/login';

      const response = await api.post(endpoint, credentials);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;
        
        // Store tokens
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Update state
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

        // Show success message
        toast.success('Login successful!');
        
        // Redirect to appropriate dashboard
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
        } else {
          const dashboardPath = user.role === 'superadmin' 
            ? '/superadmin/dashboard'
            : `/${user.tenantSlug}/dashboard`;
          router.push(dashboardPath);
        }

        return true;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      toast.error(errorMessage);
      return false;
    }
  }, [router]);

  const logout = useCallback(async (options: {
    redirect?: boolean;
    redirectTo?: string;
    showToast?: boolean;
  } = {}) => {
    const { redirect = true, redirectTo, showToast = true } = options;

    try {
      // Call logout endpoint if user is authenticated
      if (state.isAuthenticated) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      // Ignore logout API errors, just clear local data
      console.warn('Logout API call failed:', error);
    }

    // Clear auth data
    clearAuth();

    if (showToast) {
      toast.success('Logged out successfully');
    }

    // Redirect if requested
    if (redirect) {
      const loginPath = redirectTo || (state.user?.role === 'superadmin' ? '/superadmin/login' : '/login');
      router.push(loginPath);
    }
  }, [state.isAuthenticated, state.user?.role, router]);

  const clearAuth = useCallback(() => {
    // Clear all auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('persist:superadmin-root');
    
    // Clear cookies
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // Reset state
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return false;
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens
        localStorage.setItem('auth_token', token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
    }
    
    return false;
  }, [clearAuth]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));
  }, []);

  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    logout,
    checkAuthStatus,
    refreshToken,
    updateUser,
    clearAuth
  };
}; 