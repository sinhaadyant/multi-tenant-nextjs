import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiHelpers } from "@/lib/axios";
import { notificationService } from "@/services/notificationService";
import type { ApiResponse, ApiError } from "@/types";

// Custom hook for API queries
export const useApiQuery = <T>(
  queryKey: any,
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>, any>, "queryKey" | "queryFn">
) => {
  return useQuery<ApiResponse<T>, any>({
    queryKey,
    queryFn: async () => {
      const response = await apiHelpers.get<T>(endpoint);
      return response.data;
    },
    ...options,
  });
};

// Custom hook for API queries with parameters
export const useApiQueryWithParams = <T>(
  queryKey: any,
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<ApiResponse<T>, any>, "queryKey" | "queryFn">
) => {
  return useQuery<ApiResponse<T>, any>({
    queryKey,
    queryFn: async () => {
      const response = await apiHelpers.get<T>(endpoint, { params });
      return response.data;
    },
    enabled: !!params, // Only run query if params are provided
    ...options,
  });
};

// Custom hook for authenticated API queries
export const useAuthApiQuery = <T>(
  queryKey: any,
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>, any>, "queryKey" | "queryFn">
) => {
  return useQuery<ApiResponse<T>, any>({
    queryKey,
    queryFn: async () => {
      const response = await apiHelpers.get<T>(endpoint);
      return response.data;
    },
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};
