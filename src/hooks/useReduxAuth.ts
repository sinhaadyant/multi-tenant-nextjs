import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { 
  selectTenantAuth, 
  selectTenantIsLoggedIn, 
  selectTenantUser, 
  selectTenantToken,
  selectTenantModules,
  selectTenantModulesLoading,
  selectTenantModulesError,
  setTenantLogin,
  setTenantModules,
  setTenantModulesLoading,
  setTenantModulesError,
  clearTenantAuth
} from '@/store/slices/tenantAuthSlice';
import {
  selectPermissions,
  selectUserPermissions,
  setPermissions,
  setPermissionsLoading,
  setPermissionsError,
  clearPermissions,
  selectHasPermission,
  selectHasAnyPermission,
  selectHasRole
} from '@/store/slices/permissionsSlice';
import { RootState } from '@/store/store';

export const useReduxAuth = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  // Selectors
  const isLoggedIn = useSelector(selectTenantIsLoggedIn);
  const user = useSelector(selectTenantUser);
  const token = useSelector(selectTenantToken);
  const permissions = useSelector(selectPermissions);
  const userPermissions = useSelector(selectUserPermissions);
  const modules = useSelector(selectTenantModules);
  const modulesLoading = useSelector(selectTenantModulesLoading);
  const modulesError = useSelector(selectTenantModulesError);

  const getAuthToken = () => {
    // Try to get from Redux state first
    if (token) {
      return token;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('tenant_auth_token') || 
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('access_token');
  };

  const getRefreshToken = () => {
    // Try to get from Redux state first
    const reduxRefreshToken = useSelector((state: RootState) => state.tenantAuth.refreshToken);
    if (reduxRefreshToken) {
      return reduxRefreshToken;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('refresh_token');
  };

  const clearAuthData = () => {
    // Clear Redux state
    dispatch(clearTenantAuth());
    dispatch(clearPermissions());
    
    // Clear tokens from storage as backup
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
  };

  const fetchUserProfile = useCallback(async () => {
    if (!tenantSlug) {
      console.log('🔍 No tenant slug available');
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      console.log('🔍 No auth token available');
      clearAuthData();
      return;
    }

    // Check if token is expired before making the request
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('🔍 Token expired, attempting refresh...');
        
        // Try to refresh the token first
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(`/api/tenant/auth/refresh`, {
              refreshToken
            });
            
                         if (refreshResponse.data.success) {
               const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
               
               // Update Redux state with new tokens
               dispatch(setTenantLogin({
                 user: {
                   id: '',
                   email: '',
                   name: '',
                   role: 'user',
                   tenantId: '',
                   tenantSlug: tenantSlug,
                   permissions: [],
                   accessibleModules: [],
                   hasAccess: true
                 },
                 token: accessToken,
                 refreshToken: newRefreshToken || '',
                 email: '',
                 tenantSlug: tenantSlug,
                 expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
               }));
               
               console.log('✅ Token refreshed successfully, retrying user profile fetch');
               // Recursively call with new token
               return fetchUserProfile();
             }
          } catch (refreshError) {
            console.log('❌ Token refresh failed:', refreshError);
            clearAuthData();
            return;
          }
        } else {
          console.log('🔍 No refresh token available, clearing auth data');
          clearAuthData();
          return;
        }
      }
    } catch (error) {
      console.log('🔍 Error checking token expiration:', error);
      // Continue with the request, let the API handle it
    }

    try {
      dispatch(setPermissionsLoading(true));
      console.log('🔍 Fetching user profile from Redux auth...');

      // Use optimized endpoint that includes modules data
      const response = await axios.get(`/api/tenant/${tenantSlug}/me?includeModules=true`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('🔍 API Response:', {
        success: response.data.success,
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      if (response.data.success) {
        const userData = response.data.data;
        
        console.log('🔍 Raw API Response Data:', userData);
        console.log('🔍 Permissions from API:', userData.permissions);
        console.log('🔍 Roles from API:', userData.roles);
        console.log('🔍 Modules from API:', userData.modules);
        
        console.log('🔍 Setting user data in Redux:', {
          userId: userData.id,
          userEmail: userData.email,
          tenantName: userData.tenant?.name,
          rolesCount: userData.roles?.length || 0,
          permissionsCount: userData.permissions?.length || 0,
          modulesCount: userData.modules?.length || 0,
          permissions: userData.permissions?.map((p: any) => `${p.moduleKey}:${p.canRead ? 'read' : ''}${p.canCreate ? 'create' : ''}${p.canUpdate ? 'update' : ''}${p.canDelete ? 'delete' : ''}`)
        });

        // Update tenant auth state
        dispatch(setTenantLogin({
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.roles?.[0]?.name || 'user',
            tenantId: userData.tenant?.id || '',
            tenantSlug: userData.tenant?.slug || '',
            avatar: userData.avatar,
            permissions: userData.permissions?.map((p: any) => p.moduleKey) || [],
            accessibleModules: userData.permissions?.map((p: any) => p.moduleKey) || [],
            hasAccess: true
          },
          token: authToken,
          refreshToken: localStorage.getItem('refresh_token') || '',
          email: userData.email,
          tenantSlug: userData.tenant?.slug || '',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));

        // Create module permissions mapping
        const modulePermissions: { [key: string]: string[] } = {};
        if (userData.permissions && Array.isArray(userData.permissions)) {
          userData.permissions.forEach((permission: any) => {
            const actions = [];
            if (permission.canRead) actions.push('read');
            if (permission.canCreate) actions.push('create');
            if (permission.canUpdate) actions.push('update');
            if (permission.canDelete) actions.push('delete');
            if (permission.canViewAll) actions.push('viewall');
            modulePermissions[permission.moduleKey] = actions;
          });
        }

        console.log('🔍 Module Permissions Mapping:', modulePermissions);

        // Update permissions state with detailed logging
        const permissionsPayload = {
          user: userData,
          permissions: userData.permissions || [],
          modulePermissions,
          accessibleModules: userData.permissions?.map((p: any) => p.moduleKey) || [],
          menuItems: [],
          hasAccess: true,
          totalPermissions: userData.permissions?.length || 0,
          totalModules: userData.permissions?.length || 0
        };

        console.log('🔍 Dispatching permissions to Redux:', permissionsPayload);
        dispatch(setPermissions(permissionsPayload));

        // Update modules state if modules data is available
        if (userData.modules) {
          dispatch(setTenantModules({
            modules: userData.modules || []
          }));
        }

        console.log('🔍 Redux state updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }
    } catch (err: any) {
      console.error('❌ Error fetching user profile:', err);
      
      // Handle different types of errors
      if (err.response?.status === 401) {
        console.log('🔍 401 Unauthorized - clearing auth data');
        clearAuthData();
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        console.log('🔍 Request timeout - clearing auth data');
        clearAuthData();
      } else if (err.response?.status >= 500) {
        console.log('🔍 Server error - setting error state');
        dispatch(setPermissionsError('Server error. Please try again later.'));
      } else {
        console.log('🔍 Other error - setting error state');
        dispatch(setPermissionsError(err.response?.data?.message || err.message || 'Failed to fetch user profile'));
      }
    } finally {
      dispatch(setPermissionsLoading(false));
    }
  }, [tenantSlug, dispatch]);

  // Separate effect to fetch modules after user profile is loaded
  useEffect(() => {
    if (isLoggedIn && userPermissions?.permissions && userPermissions.permissions.length > 0 && (!modules || modules.length === 0)) {
      // fetchModules(); // Removed separate modules fetch
    }
  }, [isLoggedIn, userPermissions?.permissions, modules]); // Removed fetchModules from dependency array

  const logout = () => {
    console.log('🔍 Logging out user from Redux...');
    clearAuthData();
  };

  const hasPermission = (module: string, action: string): boolean => {
    const state = { permissions } as RootState;
    const result = selectHasPermission(module, action)(state);
    return result;
  };

  const hasAnyPermission = (module: string): boolean => {
    const state = { permissions } as RootState;
    const result = selectHasAnyPermission(module)(state);
    return result;
  };

  const hasRole = (roleName: string): boolean => {
    const state = { permissions } as RootState;
    const result = selectHasRole(roleName)(state);
    return result;
  };

  const refreshUser = async () => {
    console.log('🔍 Refreshing user profile from Redux...');
    await fetchUserProfile();
  };

  const refreshModules = useCallback(async () => {
    console.log('🔍 Refreshing modules from Redux...');
    // This function is no longer needed as modules are fetched in fetchUserProfile
    // await fetchModules(); 
  }, []);

  // Optimized useEffect to prevent unnecessary API calls
  useEffect(() => {
    console.log('🔍 ReduxAuth - useEffect triggered, tenantSlug:', tenantSlug);
    
    // Only fetch if we have a tenant slug, user is not logged in, and we have a valid token
    const authToken = getAuthToken();
    if (tenantSlug && !isLoggedIn && authToken) {
      // Add a small delay to prevent rapid API calls during page loads
      const timeoutId = setTimeout(() => {
        console.log('🔍 Fetching user profile...');
        fetchUserProfile();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (tenantSlug && !authToken) {
      console.log('🔍 No auth token found, clearing auth data');
      clearAuthData();
    }
  }, [tenantSlug, fetchUserProfile, isLoggedIn]);

  // Remove excessive logging in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Current Redux State:', {
        isLoggedIn,
        user: user?.name,
        permissionsCount: userPermissions?.permissions?.length || 0,
        rolesCount: userPermissions?.user?.roles?.length || 0,
        modulesCount: modules?.length || 0,
        modulesLoading,
        modulesError
      });
    }
  }, [isLoggedIn, user, userPermissions, modules, modulesLoading, modulesError]);

  return {
    // Auth state
    isLoggedIn,
    user,
    token,
    tenant: userPermissions?.user?.tenant || null,
    isLoading: permissions.isLoading,
    error: permissions.error,
    
    // Permissions
    permissions: userPermissions?.permissions || [],
    roles: userPermissions?.user?.roles || [],
    
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
