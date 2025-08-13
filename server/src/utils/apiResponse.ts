import { Response } from 'express';

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cursor?: string;
  };
}

// Success response helper
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

// Error response helper
export const errorResponse = (
  res: Response,
  message: string = 'Error occurred',
  statusCode: number = 500,
  errors?: any
): Response<ApiResponse> => {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Pagination helper
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Success'
): Response<ApiResponse<T[]>> => {
  return successResponse(res, data, message, 200, {
    page,
    limit,
    total,
  });
};

// Common HTTP status responses
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
) => errorResponse(res, message, 404);

export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized'
) => errorResponse(res, message, 401);

export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
) => errorResponse(res, message, 403);

export const badRequestResponse = (
  res: Response,
  message: string = 'Bad request',
  errors?: any
) => errorResponse(res, message, 400, errors);

export const validationErrorResponse = (res: Response, errors: any) =>
  errorResponse(res, 'Validation failed', 422, errors);

export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
) => successResponse(res, data, message, 201);

export const noContentResponse = (res: Response) => res.status(204).send();
