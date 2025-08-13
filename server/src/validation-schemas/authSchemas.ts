import { z } from 'zod';

// Login request schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  deviceInfo: z
    .object({
      deviceId: z.string().optional(),
      deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
      browser: z.string().optional(),
      os: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    })
    .optional(),
  rememberMe: z.boolean().default(false),
});

// Refresh token request schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().optional(),
});

// Logout request schema
export const logoutSchema = z.object({
  deviceId: z.string().optional(),
  allDevices: z.boolean().default(false),
});

// Request password reset schema
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Reset password schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Revoke device schema
export const revokeDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

// Verify email schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  method: z.enum(['totp', 'sms', 'email']).default('totp'),
  phoneNumber: z.string().optional(),
});

export const verify2FASchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be at least 6 characters')
    .max(6, 'Code must be at most 6 characters'),
  method: z.enum(['totp', 'sms', 'email']).default('totp'),
});

export const disable2FASchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be at least 6 characters')
    .max(6, 'Code must be at most 6 characters'),
  method: z.enum(['totp', 'sms', 'email']).default('totp'),
});

// Session management schemas
export const getSessionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// Device management schemas
export const getDevicesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  active: z.boolean().optional(),
});

export const updateDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  name: z
    .string()
    .min(1, 'Device name is required')
    .max(100, 'Device name must be less than 100 characters'),
  trusted: z.boolean().optional(),
});

// Export types
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type LogoutRequest = z.infer<typeof logoutSchema>;
export type RequestPasswordResetRequest = z.infer<
  typeof requestPasswordResetSchema
>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type RevokeDeviceRequest = z.infer<typeof revokeDeviceSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationRequest = z.infer<
  typeof resendVerificationSchema
>;
export type Enable2FARequest = z.infer<typeof enable2FASchema>;
export type Verify2FARequest = z.infer<typeof verify2FASchema>;
export type Disable2FARequest = z.infer<typeof disable2FASchema>;
export type GetSessionsRequest = z.infer<typeof getSessionsSchema>;
export type RevokeSessionRequest = z.infer<typeof revokeSessionSchema>;
export type GetDevicesRequest = z.infer<typeof getDevicesSchema>;
export type UpdateDeviceRequest = z.infer<typeof updateDeviceSchema>;
