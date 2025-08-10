import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUnifiedAuth } from './useUnifiedAuth';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { redirectTo, requireAuth = false, allowedRoles = [] } = options;
  const router = useRouter();
  const params = useParams();
  const { currentUser, isLoggedIn, isHydrated, userType } = useUnifiedAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Helper function to get tenant slug from user or params
  const getTenantSlug = () => {
    if (userType === 'tenant' && currentUser && 'tenant' in currentUser) {
      return (currentUser as any).tenant?.slug;
    }
    return params.tenantSlug as string;
  };

  useEffect(() => {
    // Don't do anything while not hydrated
    if (!isHydrated) {
      return;
    }

    // If user is authenticated and we're on a login page, redirect to dashboard
    if (isLoggedIn && currentUser) {
      const currentPath = window.location.pathname;
      const isOnLoginPage = currentPath.includes('/login');
      const isOnSignupPage = currentPath.includes('/signup');
      const isOnForgotPasswordPage = currentPath.includes('/forgot-password');
      const isOnResetPasswordPage = currentPath.includes('/reset-password');

      // If user is on any auth page and is already authenticated, redirect them
      if (isOnLoginPage || isOnSignupPage || isOnForgotPasswordPage || isOnResetPasswordPage) {
        setShouldRedirect(true);
        
        // Determine the correct dashboard path
        let dashboardPath = '';
        
        if (userType === 'superadmin') {
          dashboardPath = '/superadmin/dashboard';
        } else if (userType === 'tenant') {
          const tenantSlug = getTenantSlug();
          if (tenantSlug) {
            dashboardPath = `/${tenantSlug}/dashboard`;
          } else {
            dashboardPath = '/dashboard';
          }
        } else {
          // Fallback to main dashboard
          dashboardPath = '/dashboard';
        }

        // Use the provided redirectTo if available, otherwise use the determined dashboard path
        const finalRedirectPath = redirectTo || dashboardPath;
        
        console.log(`User already authenticated. Redirecting from ${currentPath} to ${finalRedirectPath}`);
        
        // Small delay to ensure the redirect happens after the component mounts
        setTimeout(() => {
          router.replace(finalRedirectPath);
        }, 100);
      }
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && isHydrated && !isLoggedIn) {
      const currentPath = window.location.pathname;
      const isOnAuthPage = currentPath.includes('/login') || 
                          currentPath.includes('/signup') || 
                          currentPath.includes('/forgot-password') || 
                          currentPath.includes('/reset-password');

      if (!isOnAuthPage) {
        // Redirect to login page
        const tenantSlug = getTenantSlug();
        const loginPath = tenantSlug ? `/${tenantSlug}/login` : '/superadmin/login';
        
        console.log(`Authentication required. Redirecting from ${currentPath} to ${loginPath}`);
        
        setTimeout(() => {
          router.replace(loginPath);
        }, 100);
      }
    }

    // Check role-based access if allowedRoles are specified
    if (allowedRoles.length > 0 && isLoggedIn && currentUser && isHydrated) {
      // Get user role - handle different user structures
      let userRole = '';
      if (userType === 'superadmin' && 'role' in currentUser) {
        userRole = (currentUser as any).role;
      } else if (userType === 'tenant' && 'roles' in currentUser && Array.isArray((currentUser as any).roles)) {
        userRole = (currentUser as any).roles[0]?.name || '';
      }
      
      const hasRequiredRole = allowedRoles.includes(userRole);
      
      if (!hasRequiredRole) {
        console.log(`User role ${userRole} not in allowed roles: ${allowedRoles.join(', ')}`);
        
        // Redirect to appropriate dashboard based on user role
        let dashboardPath = '';
        if (userType === 'superadmin') {
          dashboardPath = '/superadmin/dashboard';
        } else if (userType === 'tenant') {
          const tenantSlug = getTenantSlug();
          dashboardPath = tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard';
        } else {
          dashboardPath = '/dashboard';
        }
        
        setTimeout(() => {
          router.replace(dashboardPath);
        }, 100);
      }
    }
  }, [isLoggedIn, currentUser, isHydrated, userType, router, params.tenantSlug, redirectTo, requireAuth, allowedRoles]);

  return {
    shouldRedirect,
    isLoggedIn,
    currentUser,
    isLoading: !isHydrated
  };
}; 