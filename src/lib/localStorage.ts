import toast from 'react-hot-toast';

// Types for localStorage data
export interface LocalStorageData {
  value: any;
  expiresAt?: number;
}

// LocalStorage key constants
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
  USER_PREFERENCES: 'user_preferences',
  DASHBOARD_DATA: 'dashboard_data',
  TENANT_DATA: 'tenant_data',
  TABLE_PREFERENCES: 'table_preferences',
  FILTER_STATE: 'filter_state',
  SEARCH_HISTORY: 'search_history',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_SETTINGS: 'system_settings',
} as const;

// Cache expiry times (in milliseconds)
export const CACHE_EXPIRY = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes
  TENANT_DATA: 10 * 60 * 1000, // 10 minutes
  USER_PREFERENCES: 24 * 60 * 60 * 1000, // 24 hours
  AUDIT_LOGS: 30 * 60 * 1000, // 30 minutes
  SYSTEM_SETTINGS: 60 * 60 * 1000, // 1 hour
} as const;

// LocalStorage error types
export enum LocalStorageError {
  NOT_AVAILABLE = 'localStorage_not_available',
  QUOTA_EXCEEDED = 'localStorage_quota_exceeded',
  INVALID_DATA = 'localStorage_invalid_data',
}

// LocalStorage utility class
class LocalStorageUtil {
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Check if localStorage is available
   */
  private isAvailable(): boolean {
    if (!this.isClient) {
      return false;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      }
    } catch (error) {
      console.warn('localStorage is not available:', error);
    }
    return false;
  }

  /**
   * Get data from localStorage with error handling
   */
  get<T = any>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`localStorage not available, cannot get key: ${key}`);
      }
      return defaultValue || null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }

      const data: LocalStorageData = JSON.parse(item);
      
      // Check if data has expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(key);
        return defaultValue || null;
      }

      return data.value as T;
    } catch (error) {
      console.error(`Error parsing localStorage data for key "${key}":`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set data in localStorage with error handling
   */
  set<T = any>(key: string, value: T, expiresIn?: number): boolean {
    if (!this.isAvailable()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`localStorage not available, cannot set key: ${key}`);
      }
      return false;
    }

    try {
      const data: LocalStorageData = {
        value,
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      };

      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ localStorage set: ${key}`, { value, expiresIn });
      }
      return true;
    } catch (error) {
      console.error(`Error setting localStorage data for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove data from localStorage
   */
  remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ localStorage removed: ${key}`);
      }
      return true;
    } catch (error) {
      console.error(`Error removing localStorage data for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage data
   */
  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.clear();
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ localStorage cleared');
      }
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   */
  has(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  keys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Cache data with expiration
   */
  cache<T = any>(key: string, value: T, expiresIn: number): boolean {
    return this.set(key, value, expiresIn);
  }

  /**
   * Get cached data
   */
  getCached<T = any>(key: string): T | null {
    return this.get<T>(key);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    if (!this.isAvailable()) {
      return;
    }

    const keys = this.keys();
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data: LocalStorageData = JSON.parse(item);
          if (data.expiresAt && Date.now() > data.expiresAt) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Ignore parsing errors for expired items
      }
    });
  }

  /**
   * Get storage information
   */
  getStorageInfo(): { used: number; available: number; total: number } | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const used = JSON.stringify(localStorage).length;
      const total = 5 * 1024 * 1024; // 5MB typical limit
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  /**
   * Check if storage is available
   */
  get isStorageAvailable(): boolean {
    return this.isAvailable();
  }
}

// Create singleton instance
const localStorageUtil = new LocalStorageUtil();

// Export the singleton instance
export default localStorageUtil;

// Convenience functions for common operations
export const storage = {
  // Auth operations
  getAuthToken: (): string | null => localStorageUtil.get(STORAGE_KEYS.AUTH_TOKEN),
  setAuthToken: (token: string): boolean => localStorageUtil.set(STORAGE_KEYS.AUTH_TOKEN, token),
  getAuthUser: () => localStorageUtil.get(STORAGE_KEYS.AUTH_USER),
  setAuthUser: (user: any): boolean => localStorageUtil.set(STORAGE_KEYS.AUTH_USER, user),
  clearAuth: () => {
    localStorageUtil.remove(STORAGE_KEYS.AUTH_TOKEN);
    localStorageUtil.remove(STORAGE_KEYS.AUTH_USER);
  },

  // Dashboard data
  getDashboardData: (range: string) => localStorageUtil.getCached(`${STORAGE_KEYS.DASHBOARD_DATA}_${range}`),
  setDashboardData: (range: string, data: any) => 
    localStorageUtil.cache(`${STORAGE_KEYS.DASHBOARD_DATA}_${range}`, data, CACHE_EXPIRY.DASHBOARD),

  // Tenant data
  getTenantData: (tenantId: string) => localStorageUtil.getCached(`${STORAGE_KEYS.TENANT_DATA}_${tenantId}`),
  setTenantData: (tenantId: string, data: any) => 
    localStorageUtil.cache(`${STORAGE_KEYS.TENANT_DATA}_${tenantId}`, data, CACHE_EXPIRY.TENANT_DATA),

  // User preferences
  getUserPreferences: () => localStorageUtil.get(STORAGE_KEYS.USER_PREFERENCES),
  setUserPreferences: (preferences: any): boolean => 
    localStorageUtil.set(STORAGE_KEYS.USER_PREFERENCES, preferences, CACHE_EXPIRY.USER_PREFERENCES),

  // Theme
  getTheme: () => localStorageUtil.get(STORAGE_KEYS.THEME, 'light'),
  setTheme: (theme: string): boolean => localStorageUtil.set(STORAGE_KEYS.THEME, theme),

  // Sidebar state
  getSidebarState: () => localStorageUtil.get(STORAGE_KEYS.SIDEBAR_STATE, { isExpanded: true }),
  setSidebarState: (state: any): boolean => localStorageUtil.set(STORAGE_KEYS.SIDEBAR_STATE, state),

  // Table preferences
  getTablePreferences: (tableId: string) => localStorageUtil.get(`${STORAGE_KEYS.TABLE_PREFERENCES}_${tableId}`),
  setTablePreferences: (tableId: string, preferences: any): boolean => 
    localStorageUtil.set(`${STORAGE_KEYS.TABLE_PREFERENCES}_${tableId}`, preferences),

  // Filter state
  getFilterState: (filterId: string) => localStorageUtil.get(`${STORAGE_KEYS.FILTER_STATE}_${filterId}`),
  setFilterState: (filterId: string, state: any): boolean => 
    localStorageUtil.set(`${STORAGE_KEYS.FILTER_STATE}_${filterId}`, state),

  // Search history
  getSearchHistory: () => localStorageUtil.get(STORAGE_KEYS.SEARCH_HISTORY, []),
  addSearchHistory: (query: string): boolean => {
    const history = localStorageUtil.get(STORAGE_KEYS.SEARCH_HISTORY, []) as string[];
    const newHistory = [query, ...history.filter(item => item !== query)].slice(0, 10);
    return localStorageUtil.set(STORAGE_KEYS.SEARCH_HISTORY, newHistory);
  },

  // Notifications
  getNotifications: () => localStorageUtil.get(STORAGE_KEYS.NOTIFICATIONS, []),
  setNotifications: (notifications: any[]): boolean => 
    localStorageUtil.set(STORAGE_KEYS.NOTIFICATIONS, notifications),

  // Audit logs
  getAuditLogs: () => localStorageUtil.getCached(STORAGE_KEYS.AUDIT_LOGS),
  setAuditLogs: (logs: any[]): boolean => 
    localStorageUtil.cache(STORAGE_KEYS.AUDIT_LOGS, logs, CACHE_EXPIRY.AUDIT_LOGS),

  // System settings
  getSystemSettings: () => localStorageUtil.getCached(STORAGE_KEYS.SYSTEM_SETTINGS),
  setSystemSettings: (settings: any): boolean => 
    localStorageUtil.cache(STORAGE_KEYS.SYSTEM_SETTINGS, settings, CACHE_EXPIRY.SYSTEM_SETTINGS),

  // Utility functions
  clearAll: () => localStorageUtil.clear(),
  clearExpired: () => localStorageUtil.clearExpiredCache(),
  getStorageInfo: () => localStorageUtil.getStorageInfo(),
  isAvailable: () => localStorageUtil.isStorageAvailable,
};

// React hook for localStorage
export const useLocalStorage = <T = any>(
  key: string,
  defaultValue?: T
) => {
  const getValue = () => localStorageUtil.get<T>(key, defaultValue);
  const setValue = (value: T, expiresIn?: number) => localStorageUtil.set<T>(key, value, expiresIn);
  const removeValue = () => localStorageUtil.remove(key);
  const hasValue = () => localStorageUtil.has(key);

  return {
    get: getValue,
    set: setValue,
    remove: removeValue,
    has: hasValue,
  };
}; 