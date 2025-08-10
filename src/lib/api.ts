import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// We'll need to access the store for logout action
let store: { dispatch: (action: { type: string }) => void } | null = null;

export const setStore = (storeInstance: { dispatch: (action: { type: string }) => void }) => {
  store = storeInstance;
};

// Token management utilities
const getAuthToken = (): string | null => {
  try {
    if (typeof window !== 'undefined') {
      // Primary: Get from localStorage (where simpleStorage stores it)
      const localToken = localStorage.getItem('auth_token');
      if (localToken && isValidToken(localToken)) {
        return localToken;
      }
      
      // Fallback: Check sessionStorage
      const sessionToken = sessionStorage.getItem('access_token');
      if (sessionToken && isValidToken(sessionToken)) {
        return sessionToken;
      }
      
      // Fallback: Check Redux persist state
      const persistedState = localStorage.getItem('persist:superadmin-root');
      if (persistedState) {
        try {
          const parsed = JSON.parse(persistedState);
          const authData = parsed.auth ? JSON.parse(parsed.auth) : null;
          if (authData?.token && isValidToken(authData.token)) {
            return authData.token;
          }
        } catch (parseError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error parsing Redux persist state:', parseError);
          }
          // Clear corrupted persisted state
          localStorage.removeItem('persist:superadmin-root');
        }
      }
      
      // If we found invalid tokens, clear them
      if (localToken && !isValidToken(localToken)) {
        localStorage.removeItem('auth_token');
      }
      if (sessionToken && !isValidToken(sessionToken)) {
        sessionStorage.removeItem('access_token');
      }
    }
    
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting auth token:', error);
    }
    return null;
  }
};

const clearAuthData = () => {
  try {
    if (typeof window !== 'undefined') {
      // Clear all possible token locations
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('persist:superadmin-root');
      
      // Clear cookies
      document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error clearing auth data:', error);
    }
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
export const debugToken = () => {
  if (typeof window !== 'undefined') {
    const token = getAuthToken();
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
      const token = await getAuthToken();
      
      if (token) {
        // Check if token is expired
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ Token expired, clearing auth data');
            }
            await clearAuthData();
            redirectToLogin();
            return Promise.reject(new Error('Token expired'));
          }
        } catch (error) {
          // Token is malformed, continue without it
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Adding auth token to request:', config.url);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
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
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Authentication failed, clearing session and redirecting to login');
      }
      
      try {
        // Clear all auth data
        await clearAuthData();
        
        // Show toast notification
        toast.error('Session expired. Please log in again.');
        
        // Redirect to appropriate login page
        redirectToLogin();
        
      } catch (clearError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error clearing auth data:', clearError);
        }
      }
    }
    
    // Handle forbidden errors
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { api }; 