import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// We'll need to access the store for logout action
let store: { dispatch: (action: any) => void; getState: () => any } | null = null;

export const setStore = (storeInstance: { dispatch: (action: any) => void; getState: () => any }) => {
  store = storeInstance;
};

// Get auth token from Redux store first, then fallback to localStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try to get from Redux store first
    if (store) {
      const state = store.getState();
      const reduxToken = state.tenantAuth?.token;
      if (reduxToken) {
        return reduxToken;
      }
    }
    
    // Fallback to localStorage and sessionStorage
    return localStorage.getItem('tenant_auth_token') || 
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('access_token') ||
           sessionStorage.getItem('tenant_auth_token');
  } catch (error) {
    // Fallback to localStorage and sessionStorage if Redux is not available
    return localStorage.getItem('tenant_auth_token') || 
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('access_token') ||
           sessionStorage.getItem('tenant_auth_token');
  }
};

// Get refresh token from Redux store first, then fallback to localStorage
const getRefreshToken = async (): Promise<string | null> => {
  try {
    // Try to get from Redux store first
    if (store) {
      const state = store.getState();
      const reduxRefreshToken = state.tenantAuth?.refreshToken;
      if (reduxRefreshToken) {
        return reduxRefreshToken;
      }
    }
    
    // Fallback to localStorage
    return localStorage.getItem('refresh_token');
  } catch (error) {
    // Fallback to localStorage if Redux is not available
    return localStorage.getItem('refresh_token');
  }
};

// Update tokens in Redux store
const updateTokensInRedux = async (accessToken: string, refreshToken?: string) => {
  try {
    if (store) {
      const { refreshTenantTokens } = await import('@/store/slices/tenantAuthSlice');
      store.dispatch(refreshTenantTokens({
        token: accessToken,
        refreshToken: refreshToken || '',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));
    }
  } catch (error) {
    console.warn('Failed to update tokens in Redux:', error);
  }
};

const clearAuthData = async () => {
  try {
    if (typeof window !== 'undefined') {
      // Clear Redux state if available
      if (store) {
        try {
          const { clearTenantAuth } = await import('@/store/slices/tenantAuthSlice');
          const { clearPermissions } = await import('@/store/slices/permissionsSlice');
          store.dispatch(clearTenantAuth());
          store.dispatch(clearPermissions());
        } catch (error) {
          console.warn('Failed to clear Redux state:', error);
        }
      }
      
      // Clear all possible token locations
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_auth_token');
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('persist:superadmin-root');
      
      // Clear cookies
      document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

const isValidToken = (token: string): boolean => {
  try {
    // Check if token has the correct format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Try to decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if payload has required fields
    return !!(payload.id && payload.email && payload.role);
  } catch (error) {
    return false;
  }
};

// Redirect to appropriate login page based on current route
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    
    // Determine which login page to redirect to
    let loginUrl = '/login';
    
    if (currentPath.startsWith('/superadmin')) {
      loginUrl = '/superadmin/login';
    } else if (currentPath.includes('/[tenantSlug]') || currentPath.includes('/tenant')) {
      // Extract tenant slug from path
      const pathParts = currentPath.split('/');
      const tenantIndex = pathParts.findIndex(part => part && part !== 'tenant');
      if (tenantIndex !== -1 && pathParts[tenantIndex]) {
        loginUrl = `/${pathParts[tenantIndex]}/login`;
      } else {
        loginUrl = '/login'; // Fallback
      }
    }
    
    // Store the current path for redirect after login
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    // Redirect to login page
    window.location.href = loginUrl;
  }
};

// Debug utility to log token info
export const debugToken = async () => {
  if (typeof window !== 'undefined') {
    const token = await getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token Debug Info:', {
          hasToken: true,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          isExpired: isTokenExpired(token),
          payload: {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            iat: new Date(payload.iat * 1000).toISOString(),
            exp: new Date(payload.exp * 1000).toISOString()
          }
        });
      } catch (error) {
        console.log('🔍 Token Debug Info:', {
          hasToken: true,
          isExpired: true,
          error: 'Invalid token format'
        });
      }
    } else {
      console.log('🔍 Token Debug Info:', {
        hasToken: false
      });
    }
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from Redux store instead of localStorage
      const token = await getAuthToken();
      
      if (token) {
        // Check if token is expired
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ Token expired in request interceptor, will handle in response interceptor');
            }
            // Don't reject here, let the response interceptor handle the refresh
            // Just continue without the expired token
          } else {
            config.headers.Authorization = `Bearer ${token}`;
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🔐 Adding auth token to request:', config.url);
            }
          }
        } catch (error) {
          // Token is malformed, continue without it
          if (process.env.NODE_ENV === 'development') {
            console.warn('Malformed token, continuing without auth header');
          }
        }
      } else {
        // Only log in development and only for non-public endpoints
        if (process.env.NODE_ENV === 'development' && 
            !config.url?.includes('/public') && 
            !config.url?.includes('/auth/login')) {
          console.log('⚠️ No auth token found for request:', config.url);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error in request interceptor:', error);
      }
    }
    
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API response success:', response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ API response error:', error.config?.url, error.response?.status);
    }
    
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle authentication errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Skip refresh attempt for refresh endpoint and login endpoints to prevent loops
      if (originalRequest.url?.includes('/auth/refresh') || 
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/login')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Authentication failed on auth endpoint, clearing session and redirecting to login');
        }
        
        try {
          await clearAuthData();
          toast.error('Session expired. Please log in again.');
          redirectToLogin();
        } catch (clearError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error clearing auth data:', clearError);
          }
        }
        return Promise.reject(error);
      }

      // Try to refresh the token
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Attempting to refresh token...');
        }

        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Check if refresh token is also expired
        if (isTokenExpired(refreshToken)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ Refresh token is also expired');
          }
          throw new Error('Refresh token expired');
        }

        // Get tenant slug from URL or current path
        const pathSegments = window.location.pathname.split('/');
        const tenantSlug = pathSegments[1]; // Assuming format: /tenantSlug/...

        if (!tenantSlug) {
          throw new Error('No tenant slug found');
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post(`/api/tenant/auth/refresh`, {
          refreshToken
        });

        if (refreshResponse.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
          
          // Update tokens in storage
          await updateTokensInRedux(accessToken, newRefreshToken);

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Token refreshed successfully');
          }

          // Update the original request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Token refresh failed:', refreshError);
          console.log('🔐 Clearing session and redirecting to login');
        }
        
        try {
          await clearAuthData();
          toast.error('Session expired. Please log in again.');
          redirectToLogin();
        } catch (clearError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error clearing auth data:', clearError);
          }
        }
      }
    }
    
    // Handle forbidden errors
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    }
    
    // Handle server errors
    if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { api }; 