import { NextResponse } from 'next/server';

export interface ApiResponse {
  success: boolean;
  status: number;
  message: string;
  data?: any;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      totalPages: number;
      totalRecords: number;
    };
    timestamp: string;
    requestId?: string;
  };
}

export const createSuccessResponse = (
  data: any,
  message: string = 'Operation completed successfully',
  status: number = 200,
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  }
): NextResponse<ApiResponse> => {
  const response: ApiResponse = {
    success: true,
    status,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(pagination && { pagination })
    }
  };

  return NextResponse.json(response, { status });
};

export const createErrorResponse = (
  message: string,
  status: number = 400,
  errors?: Array<{ field: string; message: string }>,
  requestId?: string
): NextResponse<ApiResponse> => {
  const response: ApiResponse = {
    success: false,
    status,
    message,
    ...(errors && { errors }),
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    }
  };

  return NextResponse.json(response, { status });
}; 