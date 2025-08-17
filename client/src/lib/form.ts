import { useForm, UseFormProps, FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Common form schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  tenantSlug: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  is_active: z.boolean().default(true),
  is_superadmin: z.boolean().default(false),
  tenant_id: z.string().optional(),
});

export const tenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  domain: z.string().min(1, "Domain is required"),
  is_active: z.boolean().default(true),
  login_restrictions: z.object({
    max_devices: z.number().min(1, "Max devices must be at least 1"),
    allow_multiple_sessions: z.boolean().default(true),
    session_timeout: z.number().min(300, "Session timeout must be at least 5 minutes"),
  }),
});

export const roleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().optional(),
  is_global: z.boolean().default(false),
  tenant_id: z.string().optional(),
});

export const moduleSchema = z.object({
  name: z.string().min(2, "Module name must be at least 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  order_index: z.number().min(0, "Order index must be 0 or greater"),
  parent_id: z.string().optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type TenantFormData = z.infer<typeof tenantSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type ModuleFormData = z.infer<typeof moduleSchema>;

// Utility function to get field error
export function getFieldError<T extends FieldValues>(
  form: ReturnType<typeof useForm<T>>,
  field: Path<T>
) {
  return form.formState.errors[field]?.message;
}

// Utility function to check if field is invalid
export function isFieldInvalid<T extends FieldValues>(
  form: ReturnType<typeof useForm<T>>,
  field: Path<T>
) {
  return !!form.formState.errors[field];
}
