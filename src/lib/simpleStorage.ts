/**
 * Simple Storage Utility
 * 
 * Basic localStorage wrapper for essential functionality only
 */

// Simple localStorage wrapper for auth tokens with 3-month persistence
export const simpleStorage = {
  // Auth operations
  getAuthToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    // First check localStorage
    const item = localStorage.getItem('auth_token');
    if (item) {
      try {
        const parsedItem = JSON.parse(item);
        if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
          // Token has expired, remove it
          localStorage.removeItem('auth_token');
        } else {
          return parsedItem.value || item; // Fallback to original item
        }
      } catch (error) {
        // If parsing fails, return the original item (backward compatibility)
        return item;
      }
    }
    
    // If no token in localStorage, check for superadmin token in cookies
    const cookies = document.cookie.split(';');
    const superadminTokenCookie = cookies.find(cookie => cookie.trim().startsWith('superadmin_token='));
    if (superadminTokenCookie) {
      const token = superadminTokenCookie.split('=')[1];
      if (token) {
        // Store it in localStorage for consistency
        simpleStorage.setAuthToken(token);
        return token;
      }
    }
    
    return null;
  },
  
  setAuthToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    
    // Store with expiration date (3 months from now)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 3);
    
    const itemWithExpiry = {
      value: token,
      expiry: expirationDate.getTime(),
    };
    
    localStorage.setItem('auth_token', JSON.stringify(itemWithExpiry));
    
    // Also set superadmin token cookie for middleware compatibility
    document.cookie = `superadmin_token=${token}; path=/; max-age=900; samesite=lax`;
  },
  
  getAuthUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    
    try {
      const parsedItem = JSON.parse(userStr);
      if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
        // User data has expired, remove it
        localStorage.removeItem('auth_user');
        return null;
      }
      return parsedItem.value ? JSON.parse(parsedItem.value) : parsedItem; // Fallback to original item
    } catch (error) {
      // If parsing fails, return the original item (backward compatibility)
      return JSON.parse(userStr);
    }
  },
  
  setAuthUser: (user: any): void => {
    if (typeof window === 'undefined') return;
    
    // Store with expiration date (3 months from now)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 3);
    
    const itemWithExpiry = {
      value: JSON.stringify(user),
      expiry: expirationDate.getTime(),
    };
    
    localStorage.setItem('auth_user', JSON.stringify(itemWithExpiry));
  },
  
  clearAuth: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Also clear superadmin token cookie
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  },

  // Theme
  getTheme: (): string => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  },
  
  setTheme: (theme: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', theme);
  },

  // Sidebar state
  getSidebarState: () => {
    if (typeof window === 'undefined') return { isExpanded: true };
    const stateStr = localStorage.getItem('sidebar_state');
    return stateStr ? JSON.parse(stateStr) : { isExpanded: true };
  },
  
  setSidebarState: (state: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sidebar_state', JSON.stringify(state));
  },

  // Clear all
  clearAll: () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}; 