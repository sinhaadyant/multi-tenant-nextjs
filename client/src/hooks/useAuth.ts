import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useApiMutation } from "./useApiMutation";
import { AuthService } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateToken,
  updateUser,
  setTenant,
  setPermissions,
  setLoading,
  clearError,
} from "@/store/slices/authSlice";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
  Tenant,
  Permission,
} from "@/types";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  // Login mutation
  const loginMutation = useApiMutation<LoginResponse, LoginRequest>(
    async (credentials: LoginRequest) => {
      dispatch(loginStart());
      try {
        const response = await AuthService.login(credentials);

        // Extract user, token, and other data from response
        const { user, token, refresh_token } = response;

        // Dispatch success action with all data
        dispatch(
          loginSuccess({
            user,
            token,
            refreshToken: refresh_token,
            tenant: user.tenant || undefined,
            permissions: user.permissions || [],
          })
        );

        notificationService.success({
          message: `Welcome back, ${user.name}!`,
        });

        return {
          success: true,
          message: "Login successful",
          data: response,
        };
      } catch (error: any) {
        const message = error?.response?.data?.message || "Login failed";
        dispatch(loginFailure(message));
        throw error;
      }
    },
    {
      onError: (error: any) => {
        const message = error?.response?.data?.message || "Login failed";
        notificationService.error({ message });
      },
    }
  );

  // Logout function
  const logoutUser = useCallback(async () => {
    try {
      if (auth.token) {
        await AuthService.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      notificationService.success({ message: "Logged out successfully" });
    }
  }, [dispatch, auth.token]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!auth.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await AuthService.refreshToken(auth.refreshToken);
      dispatch(updateToken(response.token));
      return response;
    } catch (error) {
      dispatch(logout());
      throw error;
    }
  }, [dispatch, auth.refreshToken]);

  // Update user profile
  const updateUserProfile = useCallback(
    (user: AuthUser) => {
      dispatch(updateUser(user));
    },
    [dispatch]
  );

  // Set current tenant
  const setCurrentTenant = useCallback(
    (tenant: Tenant) => {
      dispatch(setTenant(tenant));
    },
    [dispatch]
  );

  // Set permissions
  const setUserPermissions = useCallback(
    (permissions: Permission[]) => {
      dispatch(setPermissions(permissions));
    },
    [dispatch]
  );

  // Set loading state
  const setAuthLoading = useCallback(
    (loading: boolean) => {
      dispatch(setLoading(loading));
    },
    [dispatch]
  );

  // Clear error
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Check if user has permission
  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return false;
      }

      // Superadmin bypass
      if (auth.user?.is_superadmin) {
        return true;
      }

      // Check specific permission
      return auth.permissions.some(
        permission =>
          permission.module_id === module &&
          permission[
            `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof Permission
          ] === true
      );
    },
    [auth.user, auth.permissions]
  );

  // Check if user can view all data (data scope)
  const canViewAll = useCallback(
    (module: string): boolean => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return false;
      }

      // Superadmin can view all data
      if (auth.user?.is_superadmin) {
        return true;
      }

      // Check canViewAll permission for module
      return auth.permissions.some(
        permission =>
          permission.module_id === module && permission.can_view_all === true
      );
    },
    [auth.user, auth.permissions]
  );

  return {
    // State
    user: auth.user,
    token: auth.token,
    refreshToken: auth.refreshToken,
    isAuthenticated: auth.isAuthenticated,
    tenant: auth.tenant,
    permissions: auth.permissions,
    isLoading: auth.isLoading,
    error: auth.error,

    // Actions
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    logout: logoutUser,
    refreshTokenFn: refreshToken,
    updateUser: updateUserProfile,
    setTenant: setCurrentTenant,
    setPermissions: setUserPermissions,
    setLoading: setAuthLoading,
    clearError: clearAuthError,

    // Permission checks
    hasPermission,
    canViewAll,

    // Mutation state
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
  };
};
