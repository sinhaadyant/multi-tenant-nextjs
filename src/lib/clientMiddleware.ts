import { fastAuthCheck } from './fastAuthCheck';

/**
 * Client-side middleware for ultra-fast auth redirects
 * This runs immediately when the page loads, before any React components
 */
export const clientAuthMiddleware = {
  /**
   * Check if user should be redirected to login (not authenticated)
   */
  requireAuth: () => {
    if (typeof window === 'undefined') return false;
    
    const { isAuthenticated } = fastAuthCheck();
    if (!isAuthenticated) {
      window.location.href = '/superadmin/login';
      return true; // Redirecting
    }
    return false; // No redirect needed
  },

  /**
   * Check if user should be redirected to dashboard (already authenticated)
   */
  requireGuest: () => {
    if (typeof window === 'undefined') return false;
    
    const { isAuthenticated } = fastAuthCheck();
    if (isAuthenticated) {
      window.location.href = '/superadmin/dashboard';
      return true; // Redirecting
    }
    return false; // No redirect needed
  },

  /**
   * Get current auth status without redirecting
   */
  getAuthStatus: () => {
    if (typeof window === 'undefined') return { isAuthenticated: false };
    return fastAuthCheck();
  }
};

/**
 * Run auth middleware on page load
 * Call this in useEffect or on component mount
 */
export const runAuthMiddleware = (options: { requireAuth?: boolean; requireGuest?: boolean }) => {
  const { requireAuth, requireGuest } = options;
  
  if (requireAuth) {
    return clientAuthMiddleware.requireAuth();
  }
  
  if (requireGuest) {
    return clientAuthMiddleware.requireGuest();
  }
  
  return false;
}; 