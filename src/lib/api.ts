import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { storage } from './localStorage';

// We'll need to access the store for logout action
let store: any = null;

export const setStore = (storeInstance: any) => {
  store = storeInstance;
};

// Token management utilities
const getAuthToken = (): string | null => {
  try {
    return storage.getAuthToken();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting auth token:', error);
    }
    return null;
  }
};

const clearAuthData = () => {
  try {
    storage.clearAuth();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
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

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const token = getAuthToken();
        
        if (token) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ Token expired, clearing auth data');
            }
            clearAuthData();
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/signin')) {
              toast.error('Session expired. Please log in again.');
              window.location.href = '/superadmin/signin';
            }
            return Promise.reject(new Error('Token expired'));
          }
          
          config.headers.Authorization = `Bearer ${token}`;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Adding auth token to request:', config.url);
            try {
              console.log('🔐 Token payload:', JSON.parse(atob(token.split('.')[1])));
            } catch (error) {
              console.log('🔐 Token payload: Unable to decode');
            }
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ No auth token found for request:', config.url);
          }
          
          // For protected routes, redirect to login
          if (config.url?.includes('/superadmin/') && !config.url?.includes('/auth/')) {
            if (!window.location.pathname.includes('/signin')) {
              toast.error('Authentication required. Please log in.');
              window.location.href = '/superadmin/signin';
            }
            return Promise.reject(new Error('Authentication required'));
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error in request interceptor:', error);
        }
        // Don't block the request, just continue without auth
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API response success:', response.config.url);
    }
    return response;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ API response error:', error.config?.url, error.response?.status);
    }

    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      if (typeof window !== 'undefined') {
        console.log('🔐 Authentication failed, clearing session');
        try {
          clearAuthData();
          
          // Dispatch logout action if store is available
          if (store) {
            store.dispatch({ type: 'auth/logout' });
          }
          
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/signin')) {
            toast.error('Session expired. Please log in again.');
            window.location.href = '/superadmin/signin';
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error clearing auth data:', error);
          }
        }
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 422) {
      const errorMessage = (error.response?.data as any)?.message || 'Validation error';
      toast.error(errorMessage);
    } else {
      // Show error toast for other API errors
      const errorMessage = (error.response?.data as any)?.message || 'An error occurred';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api; 