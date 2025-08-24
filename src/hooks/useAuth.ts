import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLogin, setLogout, updateUser, selectAuth, User } from '@/store/slices/authSlice';
import { clearPermissions } from '@/store/slices/permissionsSlice';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { simpleStorage } from '@/lib/simpleStorage';


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
  const dispatch = useAppDispatch();
  const authState = useAppSelector(selectAuth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define clearAuth first to avoid hoisting issues
  const clearAuth = useCallback(() => {
    // Clear auth token from localStorage
    simpleStorage.clearAuth();
    
    // Clear other storage locations
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('auth_token');
    
    // Clear cookies
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // Clear Redux state
    dispatch(setLogout());
    dispatch(clearPermissions());
    
    // Reset loading and error states
    setIsLoading(false);
    setError(null);
  }, [dispatch]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have a token in localStorage
      let token = simpleStorage.getAuthToken();
      
      // If no token in storage, check for superadmin token in cookies
      if (!token) {
        // Get token from cookies (for superadmin)
        const cookies = document.cookie.split(';');
        const superadminTokenCookie = cookies.find(cookie => cookie.trim().startsWith('superadmin_token='));
        if (superadminTokenCookie) {
          token = superadminTokenCookie.split('=')[1];
          // Store it in localStorage for consistency
          if (token) {
            simpleStorage.setAuthToken(token);
          }
        }
      }
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token by making a request to a protected endpoint
      const response = await api.get('/auth/verify');
      
      if (response.data.success) {
        const userData = response.data;
        
        // Ensure we have the correct user data structure
        const user = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          tenantId: userData.tenantId,
          tenantSlug: userData.tenantSlug,
          avatar: userData.avatar
        };
        
        // Update Redux state with user data
        dispatch(updateUser(user));
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
        setError('Failed to verify authentication');
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const login = useCallback(async (credentials: LoginCredentials & { rememberMe?: boolean }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const endpoint = credentials.tenantSlug 
        ? `/tenant/auth/login`
        : '/superadmin/auth/login';

      const response = await api.post(endpoint, credentials);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data;
        
        // Store tokens using simpleStorage with "Remember Me" preference
        simpleStorage.setAuthToken(token, credentials.rememberMe || false);
        simpleStorage.setAuthUser(user);
        
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Update Redux state with user data
        dispatch(setLogin({
          user,
          token,
          refreshToken: refreshToken || '',
          email: user.email,
        }));

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
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, dispatch]);

  const logout = useCallback(async (options: {
    redirect?: boolean;
    redirectTo?: string;
    showToast?: boolean;
  } = {}) => {
    const { redirect = true, redirectTo, showToast = true } = options;

    // Prevent multiple logout calls
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      // Call logout endpoint if user is authenticated
      if (authState.isLoggedIn) {
        const endpoint = authState.user?.role === 'superadmin' 
          ? '/superadmin/auth/logout'
          : '/auth/logout';
        
        try {
          await api.post(endpoint);
        } catch (error) {
          // Ignore logout API errors, just clear local data
          console.warn('Logout API call failed:', error);
        }
      }
    } catch (error: any) {
      // Ignore any errors during logout
      console.warn('Logout error:', error);
    } finally {
      // Always clear auth data
      clearAuth();
      
      // Reset loading state immediately after clearing auth
      setIsLoading(false);

      if (showToast) {
        toast.success('Logged out successfully');
      }

      // Redirect if requested
      if (redirect) {
        const loginPath = redirectTo || (authState.user?.role === 'superadmin' ? '/superadmin/login' : '/auth/sign-in');
        router.push(loginPath);
      }
    }
  }, [isLoading, authState.isLoggedIn, authState.user?.role, router, clearAuth]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return false;
      }

      // Determine the correct refresh endpoint based on user role
      const userRole = authState.user?.role;
      const endpoint = userRole === 'superadmin' 
        ? '/superadmin/auth/refresh'
        : '/tenant/auth/refresh';

      const response = await api.post(endpoint, { refreshToken });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens
        simpleStorage.setAuthToken(accessToken, false); // Default to session storage for refresh
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        return true;
      }
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // Only clear auth if it's a 401 error (invalid token)
      if (error.response?.status === 401) {
        clearAuth();
      }
    }
    
    return false;
  }, [clearAuth, authState.user?.role]);

  const updateUserData = useCallback((userData: Partial<User>) => {
    dispatch(updateUser(userData));
  }, [dispatch]);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isLoggedIn,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    checkAuthStatus,
    refreshToken,
    updateUser: updateUserData,
    clearAuth
  };
}; 