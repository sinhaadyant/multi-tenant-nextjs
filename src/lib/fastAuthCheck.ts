/**
 * Fast authentication check that doesn't rely on Redux state
 * Used for immediate redirects and quick auth status checks
 */
export const fastAuthCheck = () => {
  try {
    // Direct localStorage access for auth tokens
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
    const user = userStr ? JSON.parse(userStr) : null;
    
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