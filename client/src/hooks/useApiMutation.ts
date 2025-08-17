import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { apiHelpers } from "@/lib/axios";
import { notificationService } from "@/services/notificationService";
import type { ApiResponse, ApiError } from "@/types";

// Custom hook for API mutations
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, TVariables>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, TVariables>({
    mutationFn,
    onError: (error: any) => {
      // Global error handling for mutations
      const message =
        error?.response?.data?.message || error?.message || "Operation failed";
      notificationService.error({ message: `Mutation Error: ${message}` });
    },
    ...options,
  });
};

// Custom hook for POST mutations
export const usePostMutation = <TData, TVariables>(
  endpoint: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, TVariables>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiHelpers.post<TData>(endpoint, data);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create resource";
      notificationService.error({ message: `Create Error: ${message}` });
    },
    ...options,
  });
};

// Custom hook for PUT mutations
export const usePutMutation = <TData, TVariables>(
  endpoint: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, TVariables>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiHelpers.put<TData>(endpoint, data);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update resource";
      notificationService.error({ message: `Update Error: ${message}` });
    },
    ...options,
  });
};

// Custom hook for PATCH mutations
export const usePatchMutation = <TData, TVariables>(
  endpoint: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, TVariables>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiHelpers.patch<TData>(endpoint, data);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update resource";
      notificationService.error({ message: `Update Error: ${message}` });
    },
    ...options,
  });
};

// Custom hook for DELETE mutations
export const useDeleteMutation = <TData>(
  endpoint: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, void>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, void>({
    mutationFn: async () => {
      const response = await apiHelpers.delete<TData>(endpoint);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete resource";
      notificationService.error({ message: `Delete Error: ${message}` });
    },
    ...options,
  });
};

// Custom hook for file upload mutations
export const useUploadMutation = <TData>(
  endpoint: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, File>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, File>({
    mutationFn: async (file: File) => {
      const response = await apiHelpers.upload<TData>(endpoint, file);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload file";
      notificationService.error({ message: `Upload Error: ${message}` });
    },
    ...options,
  });
};

// Custom hook for bulk operations
export const useBulkMutation = <TData, TVariables>(
  endpoint: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, any, TVariables>,
    "mutationFn"
  >
) => {
  return useMutation<ApiResponse<TData>, any, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiHelpers.post<TData>(endpoint, data);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to perform bulk operation";
      notificationService.error({
        message: `Bulk Operation Error: ${message}`,
      });
    },
    ...options,
  });
};
