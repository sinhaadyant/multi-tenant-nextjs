import { apiHelpers } from "@/lib/axios";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
} from "@/types";

export class AuthService {
  // Login user
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiHelpers.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    if (!response.data.data) {
      throw new Error("Login response data is missing");
    }
    return response.data.data;
  }

  // Logout user
  static async logout(data?: LogoutRequest): Promise<void> {
    await apiHelpers.post("/auth/logout", data);
  }

  // Refresh token
  static async refreshToken(
    refreshToken: string
  ): Promise<RefreshTokenResponse> {
    const response = await apiHelpers.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      }
    );
    if (!response.data.data) {
      throw new Error("Refresh token response data is missing");
    }
    return response.data.data;
  }

  // Get current user profile
  static async getProfile(): Promise<any> {
    const response = await apiHelpers.get("/auth/profile");
    if (!response.data.data) {
      throw new Error("Profile response data is missing");
    }
    return response.data.data;
  }

  // Forgot password
  static async forgotPassword(email: string): Promise<void> {
    await apiHelpers.post("/auth/forgot-password", { email });
  }

  // Reset password
  static async resetPassword(
    token: string,
    password: string,
    passwordConfirmation: string
  ): Promise<void> {
    await apiHelpers.post("/auth/reset-password", {
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  // Verify email
  static async verifyEmail(token: string): Promise<void> {
    await apiHelpers.post("/auth/verify-email", { token });
  }

  // Resend email verification
  static async resendEmailVerification(email: string): Promise<void> {
    await apiHelpers.post("/auth/resend-verification", { email });
  }

  // Get available tenants for user
  static async getAvailableTenants(): Promise<any[]> {
    const response = await apiHelpers.get("/auth/tenants");
    if (!response.data.data) {
      throw new Error("Tenants response data is missing");
    }
    return response.data.data;
  }

  // Set current tenant
  static async setCurrentTenant(tenantId: string): Promise<void> {
    await apiHelpers.post("/auth/set-tenant", { tenant_id: tenantId });
  }
}
