import { z } from 'zod';
import { Response } from 'express';
import { badRequestResponse } from './apiResponse';

/**
 * Handle Zod validation errors and return a standardized error response
 * @param validationResult - The result from Zod schema validation
 * @param res - Express response object
 * @returns true if validation failed (error was sent), false if validation passed
 */
export const handleValidationError = (
  validationResult: z.SafeParseReturnType<any, any>,
  res: Response
): boolean => {
  if (!validationResult.success) {
    // Extract all validation error messages
    const errorMessages = validationResult.error.issues.map(
      issue => issue.message
    );
    const errorMessage = errorMessages.join(', ');
    badRequestResponse(res, errorMessage);
    return true; // Validation failed
  }
  return false; // Validation passed
};

/**
 * Validate request body against a Zod schema and handle errors
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param res - Express response object
 * @returns The validated data if successful, null if validation failed
 */
export const validateRequestBody = <T>(
  schema: z.ZodSchema<T>,
  data: any,
  res: Response
): T | null => {
  const validationResult = schema.safeParse(data);

  if (handleValidationError(validationResult, res)) {
    return null; // Validation failed
  }

  return validationResult.data || null; // Validation passed
};

/**
 * Create a validation middleware for Express routes
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: Response, next: any) => {
    const validationResult = schema.safeParse(req.body);

    if (handleValidationError(validationResult, res)) {
      return; // Validation failed, response already sent
    }

    // Add validated data to request
    req.validatedBody = validationResult.data;
    next();
  };
};
