import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    timestamp: string;
    path: string;
    method: string;
    duration?: number;
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, errors?: string[]) {
    super(message, 400);
    this.errors = errors;
  }
  public errors?: string[];
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

// Helper function for sending success responses
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: any
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      path: res?.req?.path,
      method: res?.req?.method,
      ...meta,
    },
  };

  res.status(statusCode).json(response);
};

// Helper function for sending error responses
export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: string[],
  meta?: any
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
      path: res?.req?.path,
      method: res?.req?.method,
      ...meta,
    },
  };

  res.status(statusCode).json(response);
};

// Centralized error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | undefined;

  // Log the error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;

    if (error instanceof ValidationError && error.errors) {
      errors = error.errors;
    }
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errors = error?.errors?.map(
      err => `${err?.path?.join('.')}: ${err.message}`
    );
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // Send error response
  sendErrorResponse(res, message, statusCode, errors);
};

// 404 handler for unmatched routes
export const notFoundHandler = (_req: Request, res: Response): void => {
  sendErrorResponse(res, 'Route not found', 404);
};

// Async error wrapper for controllers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
