/**
 * Instant Authentication Check
 * Provides real-time token validation without waiting for Redux rehydration
 */

export interface InstantAuthResult {
  hasToken: boolean;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Instantly checks authentication status from localStorage
 * This runs synchronously and doesn't wait for Redux
 */
export const instantAuthCheck = (): boolean => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 instantAuthCheck: Starting authentication check...');
    }

    // Check sessionStorage for access token
    const accessToken = sessionStorage.getItem('access_token');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 instantAuthCheck: sessionStorage access_token:', accessToken ? 'FOUND' : 'NOT FOUND');
    }
    
    if (accessToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 instantAuthCheck: Returning authenticated with access token');
      }
      return true;
    }

    // Check localStorage for refresh token
    const refreshToken = localStorage.getItem('refresh_token');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 instantAuthCheck: localStorage refresh_token:', refreshToken ? 'FOUND' : 'NOT FOUND');
    }
    
    if (refreshToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 instantAuthCheck: Returning authenticated with refresh token');
      }
      return true;
    }

    // Check Redux persisted state
    const persistedRoot = localStorage.getItem('persist:superadmin-root');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 instantAuthCheck: localStorage persist:superadmin-root:', persistedRoot ? 'EXISTS' : 'NOT FOUND');
    }
    
    if (persistedRoot) {
      try {
        const authData = JSON.parse(persistedRoot);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 instantAuthCheck: Redux auth data:', authData);
        }
        
        if (authData && authData.refreshToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 instantAuthCheck: Returning authenticated with Redux refresh token');
          }
          return true;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Check cookies for token
    const cookieToken = getCookie('auth_token');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 instantAuthCheck: Cookie token:', cookieToken ? 'FOUND' : 'NOT FOUND');
    }
    
    if (cookieToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 instantAuthCheck: Returning authenticated with cookie token');
      }
      return true;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 instantAuthCheck: No authentication found, returning false');
    }
    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Instant auth check failed:', error);
    }
    return false;
  }
};

/**
 * Get token from cookie
 */
function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'superadmin_token') {
      return value || null;
    }
  }
  return null;
}

/**
 * Get token from cookie (alternative method)
 */
function getCookieTokenAlt(): string | null {
  if (typeof document === 'undefined') return null;
  
  // Try to get cookie using a more robust method
  const match = document.cookie.match(new RegExp('(^| )superadmin_token=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * Clear all authentication data instantly
 */
export const instantLogout = (): void => {
  try {
    // Clear sessionStorage (authApi tokens)
    sessionStorage.removeItem('access_token');
    
    // Clear localStorage (Redux Persist)
    localStorage.removeItem('persist:superadmin-root');
    localStorage.removeItem('superadmin_token');
    
    // Clear cookies
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'superadmin_token=; path=/; max-age=0;';
    document.cookie = 'refresh_token=; path=/; max-age=0;';
  } catch (error) {
    console.warn('Instant logout cleanup failed:', error);
  }
};