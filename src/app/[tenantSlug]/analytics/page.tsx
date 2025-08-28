"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.response?.status === 401) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
  },
});

// Error fallback for the entire page
const PageErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Analytics Dashboard Error
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Something went wrong while loading the analytics dashboard.
      </p>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded">
        {error.message}
      </div>
      <button
        onClick={resetErrorBoundary}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default function AnalyticsPage() {
  return (
    <ErrorBoundary FallbackComponent={PageErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AnalyticsProvider>
          <AnalyticsDashboard />
        </AnalyticsProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
