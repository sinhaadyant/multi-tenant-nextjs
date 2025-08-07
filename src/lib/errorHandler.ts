import { NextResponse } from 'next/server';
import { createErrorResponse } from './apiResponse';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const createError = (message: string, statusCode: number = 500, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const handleApiError = (error: unknown): NextResponse => {
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 API Error:', error);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;

  if (error instanceof Error) {
    const apiError = error as ApiError;
    statusCode = apiError.statusCode || 500;
    message = apiError.message || 'Internal server error';
    code = apiError.code;
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid foreign key reference';
        code = 'FOREIGN_KEY_CONSTRAINT';
        break;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Prisma error code:', prismaError.code);
        }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📤 Sending error response:', { message, statusCode, code });
  }

  return createErrorResponse(message, statusCode, undefined, code);
};

export const asyncHandler = (handler: Function) => {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}; 