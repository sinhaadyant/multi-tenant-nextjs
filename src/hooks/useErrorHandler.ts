import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false
  });

  const handleError = useCallback((error: Error, errorInfo?: any) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    setErrorState({
      hasError: true,
      error,
      errorInfo
    });

    // Show toast notification
    toast.error(error.message || 'An unexpected error occurred');

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error reporting services here
      // Example: Sentry, LogRocket, etc.
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        errorInfo
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false
    });
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    fallbackValue?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error);
      return fallbackValue;
    }
  }, [handleError]);

  return {
    errorState,
    handleError,
    clearError,
    handleAsyncError
  };
}; 