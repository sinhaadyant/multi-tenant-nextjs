import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from "@/store/slices/authSlice";
import api from "@/lib/axios";

interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      is_superadmin: boolean;
      is_active: boolean;
      tenant_id?: string;
      last_login_at?: string;
      created_at: string;
      updated_at: string;
    };
    token: string;
    refreshToken: string;
  };
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      dispatch(loginStart());
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    },
    onSuccess: data => {
      if (data.success) {
        dispatch(
          loginSuccess({
            user: data.data.user,
            token: data.data.token,
            refreshToken: data.data.refreshToken,
          })
        );
      } else {
        dispatch(loginFailure(data.message || "Login failed"));
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      dispatch(loginFailure(message));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      dispatch(logout());
    },
    onError: () => {
      // Even if logout API fails, clear local state
      dispatch(logout());
    },
  });

  const refreshUserQuery = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await api.get("/auth/profile");
      return response.data;
    },
    enabled: !!auth.token && auth.isAuthenticated,
  });

  return {
    // State
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,

    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,

    // Queries
    refreshUser: refreshUserQuery.refetch,
    isRefreshingUser: refreshUserQuery.isFetching,
  };
};
