import { z } from 'zod';

// Base user schema
export const userBaseSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  roleId: z.string().min(1, 'Role is required'),
  tenantId: z.string().optional(),
});

// Create user schema
export const createUserSchema = userBaseSchema
  .extend({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Update user schema
export const updateUserSchema = userBaseSchema
  .partial()
  .extend({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    data => {
      if (data.password && !data.confirmPassword) {
        return false;
      }
      if (
        data.password &&
        data.confirmPassword &&
        data.password !== data.confirmPassword
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }
  );

// User ID parameter schema
export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

// User query schema
export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// User password reset schema
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// User password change schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// User profile update schema
export const userProfileSchema = userBaseSchema
  .pick({
    firstName: true,
    lastName: true,
    phone: true,
  })
  .partial();
