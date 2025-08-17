import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { store } from "@/store";
import { logout, updateToken } from "@/store/slices/authSlice";
import { notificationService } from "@/services/notificationService";
import type {
  ApiResponse,
  ApiError,
  LoginResponse,
  RefreshTokenResponse,
} from "@/types";

// Environment configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000");

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;
    const currentTenant = state.tenant.currentTenant;

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant header if tenant is selected
    if (currentTenant) {
      config.headers["X-Tenant"] = currentTenant.id;
    }

    // Add request ID for tracking
    config.headers["X-Request-ID"] = generateRequestId();

    return config;
  },
  (error: AxiosError) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as any;
    const state = store.getState();
    const refreshToken = state.auth.refreshToken;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.data
      );
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // If this is not a refresh token request and we have a refresh token
      if (
        !originalRequest._retry &&
        refreshToken &&
        !originalRequest.url?.includes("/auth/refresh")
      ) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          const refreshResponse = await axios.post<
            ApiResponse<RefreshTokenResponse>
          >(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (refreshResponse.data.success && refreshResponse.data.data) {
            const { token, refresh_token } = refreshResponse.data.data;

            // Update tokens in store
            store.dispatch(updateToken(token));

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;

            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      // If refresh failed or no refresh token, logout user
      store.dispatch(logout());
      notificationService.error({
        message: "Session expired. Please log in again.",
      });

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }

      return Promise.reject(error);
    }

    // Handle other HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || getErrorMessage(status);
      const title = getErrorTitle(status);

      // Show error notification
      notificationService.error({ message: `${title}: ${message}` });

      // Handle specific error cases
      switch (status) {
        case 403:
          notificationService.error({
            message:
              "Access Denied: You don't have permission to perform this action.",
          });
          break;
        case 404:
          notificationService.error({
            message: "Not Found: The requested resource was not found.",
          });
          break;
        case 422:
          // Validation errors - handled by form components
          break;
        case 429:
          notificationService.error({
            message:
              "Too Many Requests: Please wait a moment before trying again.",
          });
          break;
        case 500:
          notificationService.error({
            message:
              "Server Error: An unexpected error occurred. Please try again later.",
          });
          break;
        default:
          if (status >= 500) {
            notificationService.error({
              message:
                "Server Error: An unexpected error occurred. Please try again later.",
            });
          }
      }
    } else if (error.request) {
      // Network error
      notificationService.error({
        message:
          "Network Error: Unable to connect to the server. Please check your internet connection.",
      });
    } else {
      // Other errors
      notificationService.error({ message: "An unexpected error occurred." });
    }

    return Promise.reject(error);
  }
);

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getErrorMessage(status: number): string {
  const errorMessages: Record<number, string> = {
    400: "Bad Request - The request was invalid",
    401: "Unauthorized - Please log in again",
    403: "Forbidden - You don't have permission",
    404: "Not Found - The resource was not found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict - The request conflicts with current state",
    422: "Validation Error - Please check your input",
    429: "Too Many Requests - Please wait before trying again",
    500: "Internal Server Error - Please try again later",
    502: "Bad Gateway",
    503: "Service Unavailable - Please try again later",
    504: "Gateway Timeout",
  };

  return errorMessages[status] || "An unexpected error occurred";
}

function getErrorTitle(status: number): string {
  const errorTitles: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Access Denied",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return errorTitles[status] || "Error";
}

// API helper functions
export const apiHelpers = {
  // GET request
  get: <T = any>(
    url: string,
    config?: any
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.get<ApiResponse<T>>(url, config);
  },

  // POST request
  post: <T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.post<ApiResponse<T>>(url, data, config);
  },

  // PUT request
  put: <T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.put<ApiResponse<T>>(url, data, config);
  },

  // PATCH request
  patch: <T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.patch<ApiResponse<T>>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(
    url: string,
    config?: any
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return api.delete<ApiResponse<T>>(url, config);
  },

  // Upload file
  upload: <T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  },

  // Download file
  download: (url: string, filename?: string): Promise<void> => {
    return api
      .get(url, {
        responseType: "blob",
      })
      .then(response => {
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      });
  },
};

// Export the configured axios instance
export default api;

// Export types for use in other files
export type { AxiosInstance, AxiosResponse, AxiosError };
