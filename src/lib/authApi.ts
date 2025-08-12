import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { setLogout, refreshTokens, updateLastValidated } from '@/store/slices/authSlice';
import type { RefreshTokenPayload } from '@/store/slices/authSlice';

// Store reference for Redux actions
let store: any = null;

export const setAuthStore = (storeInstance: any) => {
  store = storeInstance;
};

// Token management utilities
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get('refresh_token') || null;
};

const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  
  // Store access token in sessionStorage (short-lived)
  sessionStorage.setItem('access_token', accessToken);
  
  // Store refresh token in secure cookie (longer-lived)
  Cookies.set('refresh_token', refreshToken, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: false, // We need access from JS for refresh flow
  });
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('access_token');
  Cookies.remove('refresh_token');
  
  // Clear any other auth-related storage
  localStorage.removeItem('user_preferences');
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    // Add 30 second buffer to prevent edge cases
    return payload.exp < (currentTime + 30);
  } catch (error) {
    return true;
  }
};

const getTokenExpirationTime = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    return null;
  }
};

// Refresh token logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post('/api/superadmin/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken, expiresAt } = response.data;
    
    // Update tokens
    setTokens(accessToken, newRefreshToken);
    
    // Update Redux store
    if (store) {
      const payload: RefreshTokenPayload = {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      };
      store.dispatch(refreshTokens(payload));
      
      // Show subtle notification
      toast.success('Session refreshed', { duration: 2000 });
    }
    
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Create axios instance
const authApi: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
authApi.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    if (typeof window === 'undefined') return config;

    // Skip auth for public endpoints
    if (
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/signup') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password')
    ) {
      return config;
    }

    let accessToken = getAccessToken();
    
    // Check if token exists and is valid
    if (accessToken && !isTokenExpired(accessToken)) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
      
      // Update last validated timestamp
      if (store) {
        store.dispatch(updateLastValidated());
      }
      
      return config;
    }

    // Token is expired or missing, try to refresh
    if (isRefreshing) {
      // If a refresh is already in progress, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    }

    // Start refresh process
    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      isRefreshing = false;
      processQueue(null, newAccessToken);
      
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      return config;
    } catch (error) {
      isRefreshing = false;
      processQueue(error, null);
      
      // Refresh failed, logout user
      if (store) {
        store.dispatch(setLogout());
      }
      clearTokens();
      
      toast.error('Session expired. Please log in again.');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/superadmin/login';
      }
      
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
authApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Skip refresh attempt for refresh endpoint to prevent loops
      if (originalRequest.url?.includes('/auth/refresh')) {
        if (store) {
          store.dispatch(setLogout());
        }
        clearTokens();
        
        toast.error('Session expired. Please log in again.');
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/superadmin/login';
        }
        
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request
        return authApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        if (store) {
          store.dispatch(setLogout());
        }
        clearTokens();
        
        toast.error('Session expired. Please log in again.');
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/superadmin/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other error statuses
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 422) {
      const errorMessage = (error.response?.data as { message?: string })?.message || 'Validation error';
      toast.error(errorMessage);
    } else if (error.response?.status !== 401) {
      // Don't show error for 401 as it's handled above
      const errorMessage = (error.response?.data as { message?: string })?.message || 'An error occurred';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Utility functions for external use
export const initializeAuth = () => {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();
  
  return {
    hasRefreshToken: !!refreshToken,
    hasAccessToken: !!accessToken,
    isAccessTokenExpired: accessToken ? isTokenExpired(accessToken) : true,
  };
};

export const validateCurrentSession = async (): Promise<boolean> => {
  try {
    const response = await authApi.get('/superadmin/auth/validate');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const forceLogout = async (reason = 'Session ended') => {
  try {
    // Call logout endpoint to invalidate tokens on server
    await authApi.post('/superadmin/auth/logout');
  } catch (error) {
    // Continue with logout even if server call fails
    console.warn('Server logout failed:', error);
  }
  
  // Clear local storage
  clearTokens();
  
  // Clear Redux state
  if (store) {
    store.dispatch(setLogout());
  }
  
  toast.error(reason);
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/superadmin/login';
  }
};

export { authApi, setTokens, clearTokens, getAccessToken, getRefreshToken, getTokenExpirationTime };
export default authApi;