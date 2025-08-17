// Import entity types
import type { AuthUser } from "./entities";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

// API Request Types
export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: any;
}

export interface ApiRequestParams extends PaginationParams {
  filters?: FilterParams;
}

// HTTP Methods
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// API Endpoint Types
export interface ApiEndpoint {
  url: string;
  method: HttpMethod;
  requiresAuth?: boolean;
  requiresTenant?: boolean;
}

// Standard API Responses
export interface LoginResponse {
  user: AuthUser;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenResponse {
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ApiError[];
  code?: string;
}
