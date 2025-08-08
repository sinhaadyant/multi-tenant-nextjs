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
    performance?: {
      queryTime?: number;
      totalTime?: number;
    };
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
  },
  performance?: {
    queryTime?: number;
    totalTime?: number;
  }
): NextResponse<ApiResponse> => {
  const response: ApiResponse = {
    success: true,
    status,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(pagination && { pagination }),
      ...(performance && { performance })
    }
  };

  const nextResponse = NextResponse.json(response, { status });
  
  // Add performance headers
  nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  nextResponse.headers.set('Pragma', 'no-cache');
  nextResponse.headers.set('Expires', '0');
  
  if (performance?.queryTime) {
    nextResponse.headers.set('X-Query-Time', `${performance.queryTime}ms`);
  }
  if (performance?.totalTime) {
    nextResponse.headers.set('X-Total-Time', `${performance.totalTime}ms`);
  }

  return nextResponse;
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

  const nextResponse = NextResponse.json(response, { status });
  
  // Add error response headers
  nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  return nextResponse;
};

// Performance measurement utility
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'operation'
): Promise<{ result: T; queryTime: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const queryTime = performance.now() - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${operationName} took ${queryTime.toFixed(2)}ms`);
  }
  
  return { result, queryTime };
}; 