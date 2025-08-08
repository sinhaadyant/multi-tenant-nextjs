import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { 
  selectIsLoggedIn, 
  selectToken, 
  selectRefreshToken, 
  selectIsHydrated, 
  selectIsInitialized,
  selectUser,
  setLogout,
  setInitialized
} from '@/store/slices/authSlice';
import { validateToken, isTokenExpiringSoon } from '@/lib/tokenValidation';
import { instantLogout } from '@/lib/instantAuth';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const token = useAppSelector(selectToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const isHydrated = useAppSelector(selectIsHydrated);
  const isInitialized = useAppSelector(selectIsInitialized);
  const user = useAppSelector(selectUser);

  /**
   * Validate current authentication state
   */
  const validateAuth = useCallback(() => {
    console.log('🔍 useAuth: Validating authentication...');
    
    // Check if Redux is hydrated
    if (!isHydrated) {
      console.log('🔍 useAuth: Redux not hydrated yet');
      return { isValid: false, reason: 'not_hydrated' };
    }

    // Check if user is logged in
    if (!isLoggedIn) {
      console.log('🔍 useAuth: User not logged in');
      return { isValid: false, reason: 'not_logged_in' };
    }

    // Check if token exists
    if (!token) {
      console.log('🔍 useAuth: No token found');
      return { isValid: false, reason: 'no_token' };
    }

    // Validate token
    const validation = validateToken(token);
    console.log('🔍 useAuth: Token validation result:', validation);

    if (!validation.isValid) {
      console.log('🔍 useAuth: Token is invalid:', validation.error);
      return { isValid: false, reason: 'invalid_token', error: validation.error };
    }

    if (validation.isExpired) {
      console.log('🔍 useAuth: Token is expired');
      return { isValid: false, reason: 'token_expired' };
    }

    // Check if token is expiring soon
    if (isTokenExpiringSoon(token)) {
      console.log('🔍 useAuth: Token expiring soon');
      return { isValid: true, reason: 'token_expiring_soon' };
    }

    console.log('🔍 useAuth: Authentication is valid');
    return { isValid: true, reason: 'valid' };
  }, [isHydrated, isLoggedIn, token]);

  /**
   * Logout user and clear all data
   */
  const logout = useCallback(() => {
    console.log('🚪 useAuth: Logging out user');
    instantLogout();
    dispatch(setLogout());
  }, [dispatch]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(() => {
    console.log('🚀 useAuth: Initializing authentication');
    
    if (!isHydrated) {
      console.log('🚀 useAuth: Waiting for Redux hydration');
      return;
    }

    const validation = validateAuth();
    
    if (!validation.isValid) {
      console.log('🚀 useAuth: Authentication invalid, logging out');
      logout();
    }

    dispatch(setInitialized());
  }, [isHydrated, validateAuth, logout, dispatch]);

  // Initialize auth when Redux is hydrated
  useEffect(() => {
    if (isHydrated && !isInitialized) {
      initializeAuth();
    }
  }, [isHydrated, isInitialized, initializeAuth]);

  // Auto-logout if token becomes invalid
  useEffect(() => {
    if (isHydrated && isLoggedIn && token) {
      const validation = validateToken(token);
      if (!validation.isValid || validation.isExpired) {
        console.log('🚪 useAuth: Auto-logout due to invalid token');
        logout();
      }
    }
  }, [isHydrated, isLoggedIn, token, logout]);

  return {
    // State
    isLoggedIn,
    isHydrated,
    isInitialized,
    user,
    token,
    refreshToken,
    
    // Actions
    logout,
    validateAuth,
    initializeAuth,
    
    // Computed
    isAuthenticated: isLoggedIn && isHydrated && isInitialized,
    isLoading: !isHydrated || !isInitialized,
  };
}; 