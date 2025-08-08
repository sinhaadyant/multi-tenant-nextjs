import { storage } from './localStorage';

/**
 * Fast authentication check that doesn't rely on Redux state
 * Used for immediate redirects and quick auth status checks
 */
export const fastAuthCheck = () => {
  try {
    const token = storage.getAuthToken();
    const user = storage.getAuthUser();
    
    return {
      isAuthenticated: !!(token && user && typeof user === 'object' && user.id && user.email),
      token,
      user: user && typeof user === 'object' && user.id ? user : null,
    };
  } catch (error) {
    console.warn('Fast auth check error:', error);
    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  }
};

/**
 * Check if user should be redirected to login
 */
export const shouldRedirectToLogin = () => {
  const { isAuthenticated } = fastAuthCheck();
  return !isAuthenticated;
};

/**
 * Check if user should be redirected to dashboard (already logged in)
 */
export const shouldRedirectToDashboard = () => {
  const { isAuthenticated } = fastAuthCheck();
  return isAuthenticated;
};

/**
 * Get user info quickly without Redux
 */
export const getQuickUserInfo = () => {
  const { user } = fastAuthCheck();
  return user;
}; 