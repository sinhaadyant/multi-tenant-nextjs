export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL',
  BAD_REQUEST = 'BAD_REQUEST',
  RATE_LIMIT = 'RATE_LIMIT',
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorType: ErrorType;
  errorCode?: string;
  details?: any;
  requestId?: string;
}

export class AppError extends Error {
  public readonly errorType: ErrorType;
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    errorType: ErrorType,
    statusCode: number = 500,
    errorCode?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.VALIDATION, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, ErrorType.AUTHENTICATION, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, ErrorType.AUTHORIZATION, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, ErrorType.NOT_FOUND, 404, 'NOT_FOUND_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, ErrorType.CONFLICT, 409, 'CONFLICT_ERROR', details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, ErrorType.BAD_REQUEST, 400, 'BAD_REQUEST_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, ErrorType.RATE_LIMIT, 429, 'RATE_LIMIT_ERROR', details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, ErrorType.INTERNAL, 500, 'INTERNAL_ERROR', details, false);
  }
}

// Helper function to create standardized error responses
export const createErrorResponse = (
  error: AppError,
  requestId?: string
): ErrorResponse => {
  return {
    success: false,
    message: error.message,
    errorType: error.errorType,
    errorCode: error.errorCode,
    details: error.details,
    requestId,
  };
};
