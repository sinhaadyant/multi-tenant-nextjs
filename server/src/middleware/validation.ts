import { Request, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, next: NextFunction) => {
    try {
      // Validate request based on schema
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      (req as any)['body'] = validatedData['body'];
      (req as any)['query'] = validatedData['query'];
      (req as any)['params'] = validatedData['params'];

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error?.errors?.map(
          err => `${err?.path?.join('.')}: ${err.message}`
        );
        next(new ValidationError('Validation failed', validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Partial validation for specific parts of the request
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error?.errors?.map(
          err => `${err?.path?.join('.')}: ${err.message}`
        );
        next(
          new ValidationError(
            'Request body validation failed',
            validationErrors
          )
        );
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error?.errors?.map(
          err => `${err?.path?.join('.')}: ${err.message}`
        );
        next(
          new ValidationError(
            'Query parameters validation failed',
            validationErrors
          )
        );
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error?.errors?.map(
          err => `${err?.path?.join('.')}: ${err.message}`
        );
        next(
          new ValidationError(
            'URL parameters validation failed',
            validationErrors
          )
        );
      } else {
        next(error);
      }
    }
  };
};
