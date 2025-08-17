// Import entity types
import type { AuthUser, Tenant } from "./entities";

// Authentication Types

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
  device_name?: string;
}

// Register Request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms_accepted: boolean;
  tenant_name?: string;
  tenant_domain?: string;
}

// Token Response
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  expires_at: string;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refresh_token: string;
}

// Password Reset Request
export interface PasswordResetRequest {
  email: string;
}

// Password Reset Confirm Request
export interface PasswordResetConfirmRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// Email Verification Request
export interface EmailVerificationRequest {
  token: string;
}

// Resend Email Verification Request
export interface ResendEmailVerificationRequest {
  email: string;
}

// Logout Request
export interface LogoutRequest {
  device_id?: string;
  all_devices?: boolean;
}

// Two-Factor Authentication Types
export interface TwoFactorAuthRequest {
  code: string;
  remember?: boolean;
}

export interface TwoFactorAuthSetupRequest {
  secret: string;
  code: string;
}

export interface TwoFactorAuthSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

// Session Management
export interface SessionInfo {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  is_current: boolean;
  device_name?: string;
  device_type?: string;
  browser?: string;
  os?: string;
}

// Authentication State
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
  sessionTimeout: number;
}

// Permission Check Types
export interface PermissionCheck {
  module: string;
  action: "create" | "read" | "update" | "delete" | "view_all";
  submodule?: string;
}

export interface PermissionResult {
  hasPermission: boolean;
  reason?: string;
}

// Authentication Events
export type AuthEvent =
  | "login_success"
  | "login_failure"
  | "logout"
  | "token_refresh"
  | "token_expired"
  | "session_timeout"
  | "permission_denied"
  | "account_locked"
  | "password_changed"
  | "profile_updated";

// Authentication Error Types
export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export type AuthErrorCode =
  | "invalid_credentials"
  | "account_locked"
  | "email_not_verified"
  | "password_expired"
  | "too_many_attempts"
  | "invalid_token"
  | "token_expired"
  | "permission_denied"
  | "tenant_not_found"
  | "tenant_inactive"
  | "user_inactive"
  | "two_factor_required"
  | "two_factor_invalid"
  | "session_expired"
  | "device_not_found"
  | "device_revoked";

// Authentication Configuration
export interface AuthConfig {
  tokenKey: string;
  refreshTokenKey: string;
  userKey: string;
  sessionTimeout: number;
  refreshThreshold: number;
  autoRefresh: boolean;
  persistSession: boolean;
  storageType: "localStorage" | "sessionStorage";
}

// Multi-factor Authentication
export interface MFASetup {
  enabled: boolean;
  method: "totp" | "sms" | "email";
  backup_codes_count: number;
  last_used?: string;
}

export interface MFAMethod {
  id: string;
  type: "totp" | "sms" | "email";
  name: string;
  is_primary: boolean;
  is_enabled: boolean;
  created_at: string;
  last_used?: string;
}

// Social Authentication
export interface SocialAuthProvider {
  name: string;
  key: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface SocialAuthRequest {
  provider: string;
  code: string;
  state?: string;
}

// Authentication Hooks
export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  hasPermission: (permission: PermissionCheck) => boolean;
  hasRole: (roleName: string) => boolean;
  isSuperAdmin: boolean;
  currentTenant: Tenant | null;
}
