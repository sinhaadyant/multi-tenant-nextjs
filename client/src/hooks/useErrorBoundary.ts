import { useState, useCallback } from "react";

export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error, errorInfo?: any) => {
    console.error("Error caught by useErrorBoundary:", error, errorInfo);
    setError(error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: !!error,
  };
}
