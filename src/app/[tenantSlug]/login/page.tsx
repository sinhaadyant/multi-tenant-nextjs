"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { useDispatch } from "react-redux";
import { setTenantLogin, setTenantPermissions, setTenantModules, setTenantModulesLoading, setTenantModulesError } from "@/store/slices/tenantAuthSlice";
import { setPermissions } from "@/store/slices/permissionsSlice";
import TenantLogin from "@/components/auth/TenantLogin";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import axios from "axios";

const TenantLoginPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const tenantSlug = params.tenantSlug as string;
  const { isLoggedIn } = useReduxAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to fetch user permissions and modules
  const fetchUserData = async (authToken: string) => {
    try {
      console.log('🔍 Fetching user permissions and modules...');
      
      // Fetch user profile with permissions
      const userResponse = await axios.get(`/api/tenant/${tenantSlug}/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!userResponse.data.success) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = userResponse.data.data;
      console.log('🔍 User data fetched:', {
        userId: userData.id,
        permissionsCount: userData.permissions?.length || 0,
        rolesCount: userData.roles?.length || 0
      });

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

      // Fetch modules
      dispatch(setTenantModulesLoading(true));
      const modulesResponse = await axios.get(`/api/tenant/${tenantSlug}/modules`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!modulesResponse.data.success) {
        throw new Error('Failed to fetch modules');
      }

      const modulesData = modulesResponse.data.data;
      console.log('🔍 Modules data fetched:', {
        modulesCount: modulesData.modules?.length || 0
      });

      // Update permissions state
      dispatch(setTenantPermissions({
        allPermissions: userData.permissions?.map((p: any) => p.moduleKey) || [],
        modulePermissions,
        accessibleModules: userData.permissions?.map((p: any) => p.moduleKey) || [],
        menuItems: []
      }));

      // Update modules state
      dispatch(setTenantModules({
        modules: modulesData.modules || []
      }));

      // Update global permissions state
      dispatch(setPermissions({
        user: userData,
        permissions: userData.permissions || [],
        modulePermissions,
        accessibleModules: userData.permissions?.map((p: any) => p.moduleKey) || [],
        menuItems: [],
        hasAccess: true,
        totalPermissions: userData.permissions?.length || 0,
        totalModules: userData.permissions?.length || 0
      }));

      console.log('🔍 User data, permissions, and modules loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      dispatch(setTenantModulesError(error instanceof Error ? error.message : 'Failed to fetch user data'));
      throw error;
    }
  };

  const handleLoginSuccess = async (result: any) => {
    try {
      setIsSubmitting(true);
      console.log('🔍 Login successful, setting up Redux state...');

      // Clear any existing tokens first
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_auth_token');
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Store access token in localStorage (primary location for API)
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('tenant_auth_token', result.data.token);

      // Store access token in sessionStorage (backup)
      sessionStorage.setItem('access_token', result.data.token);

      // Store refresh token in localStorage
      if (result.data.refreshToken) {
        localStorage.setItem('refresh_token', result.data.refreshToken);
      }

      // Update Redux state with basic user info
      dispatch(setTenantLogin({
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          role: result.data.user.roles?.[0]?.name || 'user',
          tenantId: result.data.user.tenant?.id || '',
          tenantSlug: result.data.user.tenant?.slug || '',
          avatar: result.data.user.avatar,
          permissions: result.data.user.permissions?.map((p: any) => p.moduleKey) || [],
          accessibleModules: result.data.user.permissions?.map((p: any) => p.moduleKey) || [],
          hasAccess: true
        },
        token: result.data.token,
        refreshToken: result.data.refreshToken || '',
        email: result.data.user.email,
        tenantSlug: result.data.user.tenant?.slug || '',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));

      // Fetch complete user data including permissions and modules
      await fetchUserData(result.data.token);

      // Add a small delay to ensure tokens are stored
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect immediately after successful login
      try {
        console.log('🔄 Redirecting to dashboard...');
        const dashboardPath = `/${tenantSlug}/dashboard`;
        router.replace(dashboardPath);

        // Fallback redirect after a short delay
        setTimeout(() => {
          if (window.location.pathname !== dashboardPath) {
            console.log('🔄 Fallback redirect...');
            window.location.href = dashboardPath;
          }
        }, 500);

      } catch (error) {
        console.error('❌ Router redirect failed:', error);
        // Fallback to window.location
        window.location.href = `/${tenantSlug}/dashboard`;
      }

    } catch (error) {
      console.error('❌ Error during login success handling:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <TenantLogin 
          tenantSlug={tenantSlug} 
          onLoginSuccess={handleLoginSuccess}
          isSubmitting={isSubmitting}
        />
      </div>
    </ProtectedRoute>
  );
};

export default TenantLoginPage;