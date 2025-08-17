import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeys, queryUtils } from "@/lib/queryClient";
import api, { apiHelpers } from "@/lib/axios";
import type { ApiResponse, PaginationParams, PaginatedResponse } from "@/types";

// Custom hook for API queries
export function useApiQuery<T>(
  queryKey: any,
  url: string,
  params?: PaginationParams,
  options?: Partial<UseQueryOptions<T, any, T, any>>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiHelpers.get<T>(url, { params });
      return response.data.data as T;
    },
    ...options,
  });
}

// Custom hook for paginated API queries
export function useApiQueryPaginated<T>(
  queryKey: any,
  url: string,
  params?: PaginationParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<T>, any, PaginatedResponse<T>, any>
  >
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiHelpers.get<PaginatedResponse<T>>(url, {
        params,
      });
      return response.data.data as PaginatedResponse<T>;
    },
    ...options,
  });
}

// Custom hook for API mutations
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: Partial<UseMutationOptions<TData, any, TVariables, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      return response.data as TData;
    },
    onSuccess: (data, variables, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options,
  });
}

// Custom hook for create mutations
export function useCreateMutation<TData, TVariables>(
  url: string,
  invalidateQueries?: any[],
  options?: Partial<UseMutationOptions<TData, any, TVariables, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiHelpers.post<TData>(url, variables);
      return response.data.data as TData;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

// Custom hook for update mutations
export function useUpdateMutation<TData, TVariables>(
  url: string,
  invalidateQueries?: any[],
  options?: Partial<UseMutationOptions<TData, any, TVariables, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiHelpers.put<TData>(url, variables);
      return response.data.data as TData;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

// Custom hook for delete mutations
export function useDeleteMutation<TData = void>(
  url: string,
  invalidateQueries?: any[],
  options?: Partial<UseMutationOptions<TData, any, string | undefined, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id?: string) => {
      const deleteUrl = id ? `${url}/${id}` : url;
      const response = await apiHelpers.delete<TData>(deleteUrl);
      return response.data.data as TData;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

// Custom hook for file upload mutations
export function useUploadMutation<TData>(
  url: string,
  invalidateQueries?: any[],
  options?: Partial<UseMutationOptions<TData, any, File, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await apiHelpers.upload<TData>(url, file);
      return response.data.data as TData;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

// Custom hook for bulk operations
export function useBulkMutation<TData, TVariables>(
  url: string,
  operation: "delete" | "activate" | "deactivate" | "export",
  invalidateQueries?: any[],
  options?: Partial<UseMutationOptions<TData, any, TVariables, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiHelpers.post<TData>(
        `${url}/bulk/${operation}`,
        variables
      );
      return response.data.data as TData;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

// Custom hook for optimistic updates
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  queryKey: any,
  updateFn: (oldData: TData, variables: TVariables) => TData,
  options?: Partial<UseMutationOptions<TData, any, TVariables, any>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      return response.data as TData;
    },
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: TData) =>
        updateFn(old, variables)
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (options?.onError) {
        options.onError(err, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });

      if (options?.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
    ...options,
  });
}

// Export query keys for convenience
export { queryKeys, queryUtils };
