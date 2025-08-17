import { QueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";
import type { ApiResponse, ApiError } from "@/types";

// Query key factories for consistent cache management
export const queryKeys = {
  // Auth queries
  auth: {
    profile: () => ["auth", "profile"] as const,
    permissions: () => ["auth", "permissions"] as const,
    devices: () => ["auth", "devices"] as const,
  },

  // User queries
  users: {
    all: (params?: any) => ["users", "list", params] as const,
    lists: () => ["users", "list"] as const,
    list: (params: any) => ["users", "list", params] as const,
    details: () => ["users", "detail"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },

  // Tenant queries
  tenants: {
    all: (params?: any) => ["tenants", "list", params] as const,
    lists: () => ["tenants", "list"] as const,
    list: (params: any) => ["tenants", "list", params] as const,
    details: () => ["tenants", "detail"] as const,
    detail: (id: string) => ["tenants", "detail", id] as const,
    current: () => ["tenants", "current"] as const,
  },

  // Role queries
  roles: {
    all: (params?: any) => ["roles", "list", params] as const,
    lists: () => ["roles", "list"] as const,
    list: (params: any) => ["roles", "list", params] as const,
    details: () => ["roles", "detail"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },

  // Module queries
  modules: {
    all: (params?: any) => ["modules", "list", params] as const,
    lists: () => ["modules", "list"] as const,
    list: (params: any) => ["modules", "list", params] as const,
    details: () => ["modules", "detail"] as const,
    detail: (id: string) => ["modules", "detail", id] as const,
  },

  // Support ticket queries
  tickets: {
    all: (params?: any) => ["tickets", "list", params] as const,
    lists: () => ["tickets", "list"] as const,
    list: (params: any) => ["tickets", "list", params] as const,
    details: () => ["tickets", "detail"] as const,
    detail: (id: string) => ["tickets", "detail", id] as const,
    replies: (id: string) => ["tickets", "replies", id] as const,
  },

  // Audit log queries
  audit: {
    all: (params?: any) => ["audit", "list", params] as const,
    lists: () => ["audit", "list"] as const,
    list: (params: any) => ["audit", "list", params] as const,
  },

  // System queries
  system: {
    settings: () => ["system", "settings"] as const,
    stats: () => ["system", "stats"] as const,
    health: () => ["system", "health"] as const,
  },
};

// Default query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: true,
};

// Default mutation options
const defaultMutationOptions = {
  retry: false, // Don't retry mutations by default
  onError: (error: any) => {
    // Global error handling for mutations
    const message = error?.response?.data?.message || "An error occurred";
    notificationService.error({ message: `Error: ${message}` });
  },
};

// Create QueryClient with configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
    mutations: defaultMutationOptions,
  },
});

// Utility functions for query management
export const queryUtils = {
  // Invalidate and refetch queries
  invalidateQueries: (queryKey: any) => {
    return queryClient.invalidateQueries({ queryKey });
  },

  // Remove queries from cache
  removeQueries: (queryKey: any) => {
    return queryClient.removeQueries({ queryKey });
  },

  // Reset entire cache
  resetQueries: () => {
    return queryClient.resetQueries();
  },

  // Prefetch queries
  prefetchQuery: (queryKey: any, queryFn: any, options?: any) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      ...options,
    });
  },

  // Set query data
  setQueryData: (queryKey: any, data: any) => {
    return queryClient.setQueryData(queryKey, data);
  },

  // Get query data
  getQueryData: (queryKey: any) => {
    return queryClient.getQueryData(queryKey);
  },

  // Optimistic updates
  setQueryDataOptimistic: (queryKey: any, updater: any) => {
    return queryClient.setQueryData(queryKey, updater);
  },
};

// Custom hook for API queries
export const createApiQuery = <T>(
  queryKey: any,
  queryFn: () => Promise<ApiResponse<T>>,
  options?: any
) => {
  return {
    queryKey,
    queryFn: async () => {
      const response = await queryFn();
      return response.data;
    },
    ...options,
  };
};

// Custom hook for API mutations
export const createApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: any
) => {
  return {
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      return response.data;
    },
    ...options,
  };
};

// Export types
export type { QueryClient };
