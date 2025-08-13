import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import {
  AppError,
  InternalError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  createErrorResponse,
} from '@/utils/errors';
import { ZodError } from 'zod';

export interface ErrorHandlerRequest extends Request {
  requestId: string;
}

export const errorHandler = (
  error: Error,
  req: ErrorHandlerRequest,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';

  // Log the error
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      url: req.url,
      requestId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    },
  });

  let appError: AppError;

  // Handle different types of errors
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    // Handle Zod validation errors
    appError = new ValidationError(
      'Validation failed',
      error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
    );
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else if (error.name === 'CastError') {
    appError = new BadRequestError('Invalid ID format');
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError('Validation failed');
  } else if (
    error.name === 'MongoError' ||
    error.name === 'PrismaClientKnownRequestError'
  ) {
    // Handle database errors
    if (error.message.includes('duplicate key')) {
      appError = new ConflictError('Resource already exists');
    } else if (error.message.includes('not found')) {
      appError = new NotFoundError('Resource not found');
    } else {
      appError = new InternalError('Database operation failed');
    }
  } else {
    // Handle unknown errors
    appError = new InternalError('An unexpected error occurred');
  }

  // Create standardized error response
  const errorResponse = createErrorResponse(appError, requestId);

  // Send error response
  res.status(appError.statusCode).json(errorResponse);

  // Log operational vs programming errors differently
  if (appError.isOperational) {
    logger.warn({
      message: 'Operational error occurred',
      error: errorResponse,
      requestId,
    });
  } else {
    logger.error({
      message: 'Programming error occurred',
      error: errorResponse,
      requestId,
    });
  }
};

// 404 handler for unmatched routes
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`);
  next(error);
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
