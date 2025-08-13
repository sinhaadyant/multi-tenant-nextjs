import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { store } from "@/store";
import { logout, updateToken } from "@/store/slices/authSlice";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant header if available
    const currentTenant = state.tenant.currentTenant;
    if (currentTenant) {
      config.headers["X-Tenant"] = currentTenant.id;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/refresh`,
            {
              refreshToken,
            }
          );

          const { token } = response.data.data;
          store.dispatch(updateToken(token));

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          store.dispatch(logout());
          window.location.href = "/signin";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        store.dispatch(logout());
        window.location.href = "/signin";
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      console.error("API Error:", error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;
