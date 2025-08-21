import { useEffect, useState } from 'react';
import { useReduxAuth } from './useReduxAuth';
import { useParams } from 'next/navigation';

export const useTenantAuth = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    isLoggedIn,
    user,
    token,
    tenant,
    isLoading,
    error,
    permissions,
    roles,
    modules,
    modulesLoading,
    modulesError,
    hasPermission,
    hasAnyPermission,
    hasRole,
    refreshUser,
    refreshModules,
    logout,
    fetchUserProfile
  } = useReduxAuth();

  // Initialize auth state when component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isInitialized && tenantSlug) {
        console.log('🔍 Initializing tenant auth for:', tenantSlug);
        
        // If user is logged in but permissions/modules are not loaded, fetch them
        if (isLoggedIn && (!permissions || permissions.length === 0 || !modules || modules.length === 0)) {
          console.log('🔍 User logged in but missing permissions/modules, fetching...');
          await fetchUserProfile();
        }
        
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [tenantSlug, isLoggedIn, permissions, modules, isInitialized]);

  // Check if auth is fully loaded
  const isFullyLoaded = isInitialized && !isLoading && !modulesLoading && 
    (isLoggedIn ? (permissions && permissions.length > 0 && modules && modules.length > 0) : true);

  return {
    // Auth state
    isLoggedIn,
    user,
    token,
    tenant,
    isLoading: isLoading || modulesLoading || !isInitialized,
    isFullyLoaded,
    error: error || modulesError,
    
    // Permissions
    permissions,
    roles,
    
    // Modules
    modules,
    modulesLoading,
    modulesError,
    
    // Functions
    hasPermission,
    hasAnyPermission,
    hasRole,
    refreshUser,
    refreshModules,
    logout,
    fetchUserProfile
  };
};
