import { z } from 'zod';

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  // Email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone number validation (E.164 format)
  PHONE: /^\+?[1-9]\d{1,14}$/,
  
  // Phone number validation (10 digits)
  PHONE_10_DIGITS: /^\d{10}$/,
  
  // Password strength patterns
  PASSWORD_UPPERCASE: /[A-Z]/,
  PASSWORD_LOWERCASE: /[a-z]/,
  PASSWORD_NUMBER: /\d/,
  PASSWORD_SPECIAL: /[@$!%*?&]/,
  
  // URL validation
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Subdomain validation (lowercase, numbers, dashes only)
  SUBDOMAIN: /^[a-z0-9-]+$/,
  
  // Slug validation (lowercase, numbers, hyphens only)
  SLUG: /^[a-z0-9-]+$/,
  
  // Name validation (letters, spaces, hyphens, apostrophes)
  NAME: /^[a-zA-Z\s\-']+$/,
  
  // Alphanumeric with spaces
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
  
  // File extensions
  SQL_FILE: /\.sql$/,
  CSV_FILE: /\.csv$/,
  EXCEL_FILE: /\.(xlsx|xls)$/,
  IMAGE_FILE: /\.(jpg|jpeg|png|gif|webp|svg)$/,
  PDF_FILE: /\.pdf$/,
} as const;

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// Base schemas for reuse
export const baseSchemas = {
  // Email schema
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  
  // Password schema with strength requirements
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(VALIDATION_PATTERNS.PASSWORD_UPPERCASE, 'Password must contain at least one uppercase letter')
    .regex(VALIDATION_PATTERNS.PASSWORD_LOWERCASE, 'Password must contain at least one lowercase letter')
    .regex(VALIDATION_PATTERNS.PASSWORD_NUMBER, 'Password must contain at least one number')
    .regex(VALIDATION_PATTERNS.PASSWORD_SPECIAL, 'Password must contain at least one special character'),
  
  // Simple password schema (min length only)
  simplePassword: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  
  // Phone number schema (E.164 format)
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(VALIDATION_PATTERNS.PHONE, 'Please enter a valid phone number')
    .trim(),
  
  // Phone number schema (10 digits)
  phone10Digits: z
    .string()
    .min(1, 'Phone number is required')
    .regex(VALIDATION_PATTERNS.PHONE_10_DIGITS, 'Phone number must be exactly 10 digits')
    .trim(),
  
  // Name schema
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(VALIDATION_PATTERNS.NAME, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  // Full name schema
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  
  // URL schema
  url: z
    .string()
    .min(1, 'URL is required')
    .regex(VALIDATION_PATTERNS.URL, 'Please enter a valid URL')
    .trim(),
  
  // Subdomain schema
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be less than 50 characters')
    .regex(VALIDATION_PATTERNS.SUBDOMAIN, 'Subdomain can only contain lowercase letters, numbers, and dashes')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'Subdomain cannot start or end with a dash'),
  
  // Slug schema
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(VALIDATION_PATTERNS.SLUG, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  // Description schema
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  // Long description schema
  longDescription: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  // Required string schema
  requiredString: (fieldName: string, minLength = 1, maxLength = 100) =>
    z
      .string()
      .min(minLength, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
      .trim(),
  
  // Optional string schema
  optionalString: (maxLength = 100) =>
    z
      .string()
      .max(maxLength, `Must be less than ${maxLength} characters`)
      .optional(),
} as const;

// ============================================================================
// COMMON FORM SCHEMAS
// ============================================================================

// Login form schema
export const loginSchema = z.object({
  email: baseSchemas.email,
  password: baseSchemas.simplePassword,
});

// Signup form schema
export const signupSchema = z.object({
  name: baseSchemas.fullName,
  email: baseSchemas.email,
  password: baseSchemas.password,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  contactNumber: baseSchemas.phone,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: baseSchemas.password,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: baseSchemas.fullName,
  email: baseSchemas.email,
  phone: baseSchemas.phone.optional(),
  avatar: z.any().optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File is required')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB'),
});

// SQL file upload schema
export const sqlFileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File is required')
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine((file) => VALIDATION_PATTERNS.SQL_FILE.test(file.name), 'Please select a valid SQL file'),
});

// CSV file upload schema
export const csvFileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File is required')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine((file) => VALIDATION_PATTERNS.CSV_FILE.test(file.name), 'Please select a valid CSV file'),
});

// Image upload schema
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File is required')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((file) => VALIDATION_PATTERNS.IMAGE_FILE.test(file.name), 'Please select a valid image file'),
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

// Password strength checker
export const checkPasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (VALIDATION_PATTERNS.PASSWORD_UPPERCASE.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (VALIDATION_PATTERNS.PASSWORD_LOWERCASE.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  if (VALIDATION_PATTERNS.PASSWORD_NUMBER.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (VALIDATION_PATTERNS.PASSWORD_SPECIAL.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  return {
    isValid: score === 5,
    score,
    feedback,
  };
};

// File validation helper
export const validateFile = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: RegExp[];
  } = {}
): { isValid: boolean; error?: string } => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0 && !allowedExtensions.some(ext => ext.test(file.name))) {
    return {
      isValid: false,
      error: `File extension not allowed. Allowed extensions: ${allowedExtensions.map(ext => ext.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(', ')}`,
    };
  }

  return { isValid: true };
};

// Email validation helper
export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

// Phone validation helper
export const isValidPhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.PHONE.test(phone);
};

// URL validation helper
export const isValidUrl = (url: string): boolean => {
  return VALIDATION_PATTERNS.URL.test(url);
};

// Subdomain validation helper
export const isValidSubdomain = (subdomain: string): boolean => {
  return VALIDATION_PATTERNS.SUBDOMAIN.test(subdomain) && 
         !subdomain.startsWith('-') && 
         !subdomain.endsWith('-');
};

// Slug validation helper
export const isValidSlug = (slug: string): boolean => {
  return VALIDATION_PATTERNS.SLUG.test(slug);
};

// Name validation helper
export const isValidName = (name: string): boolean => {
  return VALIDATION_PATTERNS.NAME.test(name);
};

// ============================================================================
// COMMON ERROR MESSAGES
// ============================================================================

export const COMMON_ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_SUBDOMAIN: 'Subdomain can only contain lowercase letters, numbers, and dashes',
  INVALID_SLUG: 'Slug can only contain lowercase letters, numbers, and hyphens',
  INVALID_NAME: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISMATCH: "Passwords don't match",
  FILE_TOO_LARGE: 'File size is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  NETWORK_ERROR: 'Network error. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Please check your input and try again',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type SqlFileUploadData = z.infer<typeof sqlFileUploadSchema>;
export type CsvFileUploadData = z.infer<typeof csvFileUploadSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>; 