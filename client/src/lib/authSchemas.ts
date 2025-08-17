import { z } from "zod";

// Login form schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  tenant_slug: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: "Tenant slug must be at least 2 characters",
    }),
  remember_me: z.boolean().optional(),
});

// Forgot password form schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

// Reset password form schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  password_confirmation: z
    .string()
    .min(1, "Please confirm your password"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// Verify email form schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Resend verification email form schema
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;
