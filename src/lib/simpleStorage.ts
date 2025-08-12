/**
 * Simple Storage Utility
 * 
 * Basic localStorage wrapper for essential functionality only
 */

// Simple localStorage wrapper for auth tokens with configurable persistence
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
        simpleStorage.setAuthToken(token, false); // Default to session storage
        return token;
      }
    }
    
    return null;
  },
  
  setAuthToken: (token: string, rememberMe: boolean = false): void => {
    if (typeof window === 'undefined') return;
    
    // Store with expiration date based on "Remember Me" preference
    const expirationDate = new Date();
    if (rememberMe) {
      // 30 days for "Remember Me"
      expirationDate.setDate(expirationDate.getDate() + 30);
    } else {
      // 7 days for regular session
      expirationDate.setDate(expirationDate.getDate() + 7);
    }
    
    const itemWithExpiry = {
      value: token,
      expiry: expirationDate.getTime(),
      rememberMe: rememberMe
    };
    
    localStorage.setItem('auth_token', JSON.stringify(itemWithExpiry));
    
    // Also set superadmin token cookie for middleware compatibility
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
    document.cookie = `superadmin_token=${token}; path=/; max-age=${cookieMaxAge}; samesite=lax`;
  },
  
  // Note: User data is now stored in Redux, not localStorage
  getAuthUser: () => {
    // This method is kept for backward compatibility but returns null
    // User data should be accessed from Redux store instead
    return null;
  },
  
  setAuthUser: (user: any): void => {
    // This method is kept for backward compatibility but does nothing
    // User data should be stored in Redux store instead
    console.warn('setAuthUser called - user data should be stored in Redux, not localStorage');
  },
  
  clearAuth: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    // Note: auth_user is no longer stored in localStorage (moved to Redux)
    
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

  // Note: Sidebar state is now managed in Redux/Context, not localStorage
  getSidebarState: () => {
    // This method is kept for backward compatibility but returns default state
    return { isExpanded: true };
  },
  
  setSidebarState: (state: any): void => {
    // This method is kept for backward compatibility but does nothing
    console.warn('setSidebarState called - sidebar state should be managed in Context, not localStorage');
  },

  // Clear all
  clearAll: () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}; 