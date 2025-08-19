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
    return token || localStorage.getItem('tenant_auth_token') || 
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('access_token');
  };

  const clearAuthData = () => {
    dispatch(clearTenantAuth());
    dispatch(clearPermissions());
    
    // Clear tokens from storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
  };

  const fetchModules = useCallback(async () => {
    if (!tenantSlug || !token) {
      console.log('🔍 No tenant slug or token available for modules fetch');
      return;
    }

    try {
      dispatch(setTenantModulesLoading(true));
      console.log('🔍 Fetching modules from Redux auth...');

      const response = await axios.get(`/tenant/${tenantSlug}/modules`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const modulesData = response.data.data;
        console.log('🔍 Modules fetched successfully:', {
          modulesCount: modulesData.modules?.length || 0
        });

        dispatch(setTenantModules({
          modules: modulesData.modules || []
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch modules');
      }
    } catch (err: any) {
      console.error('❌ Error fetching modules:', err);
      dispatch(setTenantModulesError(err.response?.data?.message || err.message || 'Failed to fetch modules'));
    } finally {
      dispatch(setTenantModulesLoading(false));
    }
  }, [tenantSlug, token, dispatch]);

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

    try {
      dispatch(setPermissionsLoading(true));
      console.log('🔍 Fetching user profile from Redux auth...');

      const response = await axios.get(`/tenant/${tenantSlug}/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
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
        
        console.log('🔍 Setting user data in Redux:', {
          userId: userData.id,
          userEmail: userData.email,
          tenantName: userData.tenant?.name,
          rolesCount: userData.roles?.length || 0,
          permissionsCount: userData.permissions?.length || 0,
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

        // Fetch modules after user profile is loaded
        await fetchModules();

        console.log('🔍 Redux state updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }
    } catch (err: any) {
      console.error('❌ Error fetching user profile:', err);
      
      if (err.response?.status === 401) {
        console.log('🔍 401 Unauthorized - clearing auth data');
        clearAuthData();
      } else {
        dispatch(setPermissionsError(err.response?.data?.message || err.message || 'Failed to fetch user profile'));
      }
    } finally {
      dispatch(setPermissionsLoading(false));
    }
  }, [tenantSlug, dispatch, fetchModules]);

  const logout = () => {
    console.log('🔍 Logging out user from Redux...');
    clearAuthData();
  };

  const hasPermission = (module: string, action: string): boolean => {
    const state = { permissions } as RootState;
    const result = selectHasPermission(module, action)(state);
    console.log(`🔒 hasPermission(${module}, ${action}) = ${result}`);
    return result;
  };

  const hasAnyPermission = (module: string): boolean => {
    const state = { permissions } as RootState;
    const result = selectHasAnyPermission(module)(state);
    console.log(`🔒 hasAnyPermission(${module}) = ${result}`);
    return result;
  };

  const hasRole = (roleName: string): boolean => {
    const state = { permissions } as RootState;
    const result = selectHasRole(roleName)(state);
    console.log(`🔒 hasRole(${roleName}) = ${result}`);
    return result;
  };

  const refreshUser = async () => {
    console.log('🔍 Refreshing user profile from Redux...');
    await fetchUserProfile();
  };

  const refreshModules = useCallback(async () => {
    console.log('🔍 Refreshing modules from Redux...');
    await fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    console.log('🔍 ReduxAuth - useEffect triggered, tenantSlug:', tenantSlug);
    if (tenantSlug && !isLoggedIn) {
      fetchUserProfile();
    }
  }, [tenantSlug, fetchUserProfile, isLoggedIn]);

  // Log current state for debugging
  useEffect(() => {
    console.log('🔍 Current Redux State:', {
      isLoggedIn,
      user: user?.name,
      permissionsCount: userPermissions?.permissions?.length || 0,
      rolesCount: userPermissions?.user?.roles?.length || 0,
      modulesCount: modules?.length || 0,
      modulesLoading,
      modulesError,
      permissionsState: permissions
    });
  }, [isLoggedIn, user, userPermissions, modules, modulesLoading, modulesError, permissions]);

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
