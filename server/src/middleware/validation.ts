import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { badRequestResponse } from '@/utils/apiResponse';

// Validation target types
export type ValidationTarget = 'body' | 'query' | 'params';

// Validation middleware options
export interface ValidationOptions {
  target: ValidationTarget;
  schema: ZodSchema;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
}

/**
 * Create validation middleware for request validation
 */
export function validateRequest(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { target, schema } = options;

      // Get data from the specified target
      const data = req[target];

      // Validate the data
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        badRequestResponse(res, 'Validation failed', errors);
        return;
      }

      // Update the request with validated data
      req[target] = result.data;

      next();
    } catch (error) {
      badRequestResponse(res, 'Validation error occurred');
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(
  schema: ZodSchema,
  options: Partial<ValidationOptions> = {}
) {
  return validateRequest({
    target: 'body',
    schema,
    ...options,
  });
}

/**
 * Validate query parameters
 */
export function validateQuery(
  schema: ZodSchema,
  options: Partial<ValidationOptions> = {}
) {
  return validateRequest({
    target: 'query',
    schema,
    ...options,
  });
}

/**
 * Validate path parameters
 */
export function validateParams(
  schema: ZodSchema,
  options: Partial<ValidationOptions> = {}
) {
  return validateRequest({
    target: 'params',
    schema,
    ...options,
  });
}

/**
 * Validate multiple targets at once
 */
export function validateMultiple(validations: ValidationOptions[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const validation of validations) {
        const { target, schema } = validation;

        const data = req[target];
        const result = schema.safeParse(data);

        if (!result.success) {
          const errors = result.error.issues.map(issue => ({
            field: `${target}.${issue.path.join('.')}`,
            message: issue.message,
            code: issue.code,
          }));

          badRequestResponse(res, 'Validation failed', errors);
          return;
        }

        req[target] = result.data;
      }

      next();
    } catch (error) {
      badRequestResponse(res, 'Validation error occurred');
    }
  };
}

/**
 * Create a custom validation function
 */
export function createCustomValidator<T>(
  schema: ZodSchema<T>,
  transform?: (data: any) => any
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let data = req.body;

      // Apply transformation if provided
      if (transform) {
        data = transform(data);
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        badRequestResponse(res, 'Validation failed', errors);
        return;
      }

      req.body = result.data;
      next();
    } catch (error) {
      badRequestResponse(res, 'Validation error occurred');
    }
  };
}

/**
 * Validate file uploads
 */
export function validateFileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { maxSize, allowedTypes } = options;

      if (!req.files && !req.file) {
        badRequestResponse(res, 'No files uploaded');
        return;
      }

      // Simplified file validation
      const file = req.file;
      if (file) {
        // Check file size
        if (maxSize && file.size > maxSize) {
          badRequestResponse(
            res,
            `File ${file.originalname} exceeds maximum size of ${maxSize} bytes`
          );
          return;
        }

        // Check file type
        if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
          badRequestResponse(res, `File type ${file.mimetype} is not allowed`);
          return;
        }
      }

      next();
    } catch (error) {
      badRequestResponse(res, 'File validation error occurred', []);
    }
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination() {
  const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });

  return validateQuery(paginationSchema);
}

/**
 * Validate search parameters
 */
export function validateSearch() {
  const searchSchema = z.object({
    q: z.string().optional(),
    search: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
  });

  return validateQuery(searchSchema);
}

/**
 * Validate ID parameter
 */
export function validateId() {
  const idSchema = z.object({
    id: z.string().min(1, 'ID is required'),
  });

  return validateParams(idSchema);
}

/**
 * Validate UUID parameter
 */
export function validateUUID() {
  const uuidSchema = z.object({
    id: z.string().uuid('Invalid UUID format'),
  });

  return validateParams(uuidSchema);
}

/**
 * Validate email parameter
 */
export function validateEmail() {
  const emailSchema = z.object({
    email: z.string().email('Invalid email format'),
  });

  return validateParams(emailSchema);
}

/**
 * Create a conditional validation middleware
 */
export function conditionalValidation(
  condition: (req: Request) => boolean,
  validation: ValidationOptions
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      validateRequest(validation)(req, res, next);
    } else {
      next();
    }
  };
}

/**
 * Validate request headers
 */
export function validateHeaders(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.headers);

      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: `header.${issue.path.join('.')}`,
          message: issue.message,
          code: issue.code,
        }));

        badRequestResponse(res, 'Header validation failed', errors);
        return;
      }

      next();
    } catch (error) {
      badRequestResponse(res, 'Header validation error occurred');
    }
  };
}

/**
 * Sanitize and validate input
 */
export function sanitizeAndValidate(
  schema: ZodSchema,
  sanitizers: Record<string, (value: any) => any> = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let data = req.body;

      // Apply sanitizers
      Object.entries(sanitizers).forEach(([key, sanitizer]) => {
        if (data[key] !== undefined) {
          data[key] = sanitizer(data[key]);
        }
      });

      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        badRequestResponse(res, 'Validation failed', errors);
        return;
      }

      req.body = result.data;
      next();
    } catch (error) {
      badRequestResponse(res, 'Validation error occurred');
    }
  };
}
