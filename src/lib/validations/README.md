# Validation Utilities

This directory contains comprehensive validation utilities for the multi-tenant Next.js application.

## Structure

- `common.ts` - Common validation patterns, schemas, and helper functions
- `superadmin.ts` - Superadmin-specific validation schemas
- `index.ts` - Main export file for all validation utilities

## Usage

### Importing Validation Utilities

```typescript
// Import from the main validations directory
import { 
  VALIDATION_PATTERNS, 
  baseSchemas, 
  loginSchema, 
  signupSchema,
  checkPasswordStrength,
  isValidEmail,
  COMMON_ERROR_MESSAGES 
} from '@/lib/validations';

// Or import specific schemas
import { createTenantSchema, createUserSchema } from '@/lib/validations/superadmin';
```

### Using Validation Patterns

```typescript
import { VALIDATION_PATTERNS } from '@/lib/validations';

// Email validation
const isValidEmail = VALIDATION_PATTERNS.EMAIL.test(email);

// Phone validation
const isValidPhone = VALIDATION_PATTERNS.PHONE.test(phone);

// Password strength patterns
const hasUpperCase = VALIDATION_PATTERNS.PASSWORD_UPPERCASE.test(password);
```

### Using Base Schemas

```typescript
import { baseSchemas } from '@/lib/validations';

// Create a custom schema using base schemas
const userSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email,
  phone: baseSchemas.phone.optional(),
  password: baseSchemas.password,
});
```

### Using Pre-built Schemas

```typescript
import { loginSchema, signupSchema, changePasswordSchema } from '@/lib/validations';

// Use with React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema)
});
```

### Using Helper Functions

```typescript
import { 
  checkPasswordStrength, 
  validateFile, 
  isValidEmail,
  isValidSubdomain 
} from '@/lib/validations';

// Check password strength
const strength = checkPasswordStrength(password);
console.log(strength.score); // 0-5
console.log(strength.feedback); // Array of improvement suggestions

// Validate file upload
const fileValidation = validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: [/\.jpg$/, /\.png$/]
});

// Validate email
const emailValid = isValidEmail(email);

// Validate subdomain
const subdomainValid = isValidSubdomain(subdomain);
```

### Using Error Messages

```typescript
import { COMMON_ERROR_MESSAGES } from '@/lib/validations';

// Use consistent error messages
const errorMessage = COMMON_ERROR_MESSAGES.INVALID_EMAIL;
```

## Available Schemas

### Common Schemas
- `loginSchema` - User login form
- `signupSchema` - User registration form
- `changePasswordSchema` - Password change form
- `profileUpdateSchema` - Profile update form
- `fileUploadSchema` - Generic file upload
- `sqlFileUploadSchema` - SQL file upload
- `csvFileUploadSchema` - CSV file upload
- `imageUploadSchema` - Image file upload

### Superadmin Schemas
- `createTenantSchema` - Create tenant form
- `updateTenantSchema` - Update tenant form
- `createUserSchema` - Create user form
- `updateUserSchema` - Update user form
- `createRoleSchema` - Create role form
- `updateRoleSchema` - Update role form
- `createNotificationSchema` - Create notification form
- `createSupportTicketSchema` - Create support ticket form
- `generateReportSchema` - Generate report form
- `tenantFiltersSchema` - Tenant filters
- `userFiltersSchema` - User filters

## Available Helper Functions

- `checkPasswordStrength(password)` - Check password strength and provide feedback
- `validateFile(file, options)` - Validate file uploads
- `isValidEmail(email)` - Validate email format
- `isValidPhone(phone)` - Validate phone number
- `isValidUrl(url)` - Validate URL format
- `isValidSubdomain(subdomain)` - Validate subdomain format
- `isValidSlug(slug)` - Validate slug format
- `isValidName(name)` - Validate name format

## Best Practices

1. **Use base schemas** for consistent validation across forms
2. **Use helper functions** for client-side validation
3. **Use pre-built schemas** for common forms
4. **Use consistent error messages** from `COMMON_ERROR_MESSAGES`
5. **Validate files** before upload using `validateFile`
6. **Check password strength** using `checkPasswordStrength`

## Adding New Validations

1. Add new patterns to `VALIDATION_PATTERNS`
2. Add new base schemas to `baseSchemas`
3. Add new helper functions for specific validation logic
4. Add new schemas for specific forms
5. Export new types for TypeScript support
6. Update this README with new functionality 