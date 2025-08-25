"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { useDispatch } from "react-redux";
import { setTenantLogin, setTenantPermissions, setTenantModules, setTenantModulesLoading, setTenantModulesError } from "@/store/slices/tenantAuthSlice";
import { setPermissions } from "@/store/slices/permissionsSlice";
import TenantLogin from "@/components/auth/TenantLogin";
import { GuestLanguageSwitcher } from "@/components/common/GuestLanguageSwitcher";
import { Loader2 } from "lucide-react";
import axios from "axios";

const TenantLoginPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const tenantSlug = params.tenantSlug as string;
  const { isLoggedIn, isLoading, error } = useReduxAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

  useEffect(() => {
    // Check if we have a valid session
    const checkSession = async () => {
      try {
        // Try to get token from Redux state first, then fallback to localStorage
        const authToken = localStorage.getItem('tenant_auth_token') || 
                         localStorage.getItem('auth_token') || 
                         sessionStorage.getItem('access_token');
        
        if (authToken && tenantSlug) {
          console.log('🔍 Checking existing session...');
          
          // Try to validate the token by making a quick API call
          try {
            const response = await axios.get(`/api/tenant/${tenantSlug}/me`, {
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: 5000 // 5 second timeout
            });
            
            if (response.data.success) {
              // If successful, user has valid session, redirect to dashboard
              console.log('✅ Valid session found, redirecting to dashboard');
              
              // Check if user was trying to access a specific page before login
              const redirectPath = sessionStorage.getItem('redirectAfterLogin') || `/${tenantSlug}/dashboard`;
              sessionStorage.removeItem('redirectAfterLogin');
              
              router.replace(redirectPath);
              return;
            }
          } catch (apiError: any) {
            console.log('❌ Invalid or expired session:', apiError.response?.status);
            
            // Clear invalid tokens
            localStorage.removeItem('auth_token');
            localStorage.removeItem('tenant_auth_token');
            localStorage.removeItem('refresh_token');
            sessionStorage.removeItem('access_token');
            
            // Continue to login page
            setSessionCheckComplete(true);
          }
        } else {
          // No token found, continue to login page
          setSessionCheckComplete(true);
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        setSessionCheckComplete(true);
      }
    };

    if (tenantSlug) {
      checkSession();
    }
  }, [tenantSlug, router]);

  // If user is already logged in (from Redux), redirect to dashboard
  useEffect(() => {
    if (isLoggedIn && !isLoading && sessionCheckComplete) {
      console.log('🔍 User already logged in (Redux), redirecting to dashboard');
      router.replace(`/${tenantSlug}/dashboard`);
    }
  }, [isLoggedIn, isLoading, sessionCheckComplete, router, tenantSlug]);

  // Optimized function to fetch user data and modules in parallel
  const fetchUserDataOptimized = async (authToken: string) => {
    try {
      console.log('🔍 Fetching user data with modules in single API call...');
      
      // Use the optimized endpoint that includes modules data
      const userResponse = await axios.get(`/api/tenant/${tenantSlug}/me?includeModules=true`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!userResponse.data.success) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = userResponse.data.data;

      console.log('🔍 User data and modules fetched successfully:', {
        userId: userData.id,
        permissionsCount: userData.permissions?.length || 0,
        modulesCount: userData.modules?.length || 0
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

      // Update all Redux state in parallel
      dispatch(setTenantModulesLoading(false));
      
      // Update permissions state
      dispatch(setTenantPermissions({
        allPermissions: userData.permissions?.map((p: any) => p.moduleKey) || [],
        modulePermissions,
        accessibleModules: userData.permissions?.map((p: any) => p.moduleKey) || [],
        menuItems: []
      }));

      // Update modules state
      dispatch(setTenantModules({
        modules: userData.modules || []
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

      console.log('🔍 All Redux state updated successfully');

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
      
      // Store tokens in localStorage for API client fallback
      localStorage.setItem('tenant_auth_token', result.data.token);
      localStorage.setItem('auth_token', result.data.token);
      sessionStorage.setItem('access_token', result.data.token);
      if (result.data.refreshToken) {
        localStorage.setItem('refresh_token', result.data.refreshToken);
      }
      
      // Also store in sessionStorage for immediate access
      sessionStorage.setItem('tenant_auth_token', result.data.token);
      if (result.data.refreshToken) {
        sessionStorage.setItem('refresh_token', result.data.refreshToken);
      }

      // Update Redux state with basic user info
      dispatch(setTenantLogin({
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
                          role: result.data.user.roles?.map(role => role.name).join(', ') || 'user',
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

      // Fetch complete user data including permissions and modules (optimized)
      await fetchUserDataOptimized(result.data.token);

      // Redirect immediately after successful login
      console.log('🔄 Redirecting to dashboard...');
      
      // Check if user was trying to access a specific page before login
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || `/${tenantSlug}/dashboard`;
      sessionStorage.removeItem('redirectAfterLogin');
      
      router.replace(redirectPath);

    } catch (error) {
      console.error('❌ Error during login success handling:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking session or if Redux is loading
  if (!sessionCheckComplete || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking session...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is logged in (redirecting)
  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Authentication Error
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Language Switcher */}
      <GuestLanguageSwitcher 
        position="top-right" 
        className="z-10"
        size="sm"
      />
      
      <TenantLogin 
        tenantSlug={tenantSlug} 
        onLoginSuccess={handleLoginSuccess}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TenantLoginPage;