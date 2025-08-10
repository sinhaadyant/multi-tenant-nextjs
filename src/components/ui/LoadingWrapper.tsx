import React, { ReactNode } from 'react';
import Skeleton from './skeleton/Skeleton';
import CardSkeleton from './skeleton/CardSkeleton';
import TableSkeleton from './skeleton/TableSkeleton';

interface LoadingWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  error?: Error | null;
  skeleton?: 'default' | 'card' | 'table';
  skeletonProps?: {
    rows?: number;
    columns?: number;
    fields?: number;
    showHeader?: boolean;
    showContent?: boolean;
    showFooter?: boolean;
    showButtons?: boolean;
  };
  fallback?: ReactNode;
  onRetry?: () => void;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  children,
  isLoading,
  error,
  skeleton = 'default',
  skeletonProps = {},
  fallback,
  onRetry
}) => {
  if (isLoading) {
    switch (skeleton) {
      case 'card':
        return <CardSkeleton {...skeletonProps} />;
      case 'table':
        return <TableSkeleton {...skeletonProps} />;
      default:
        return (
          <div className="space-y-4">
            <Skeleton height={24} width="40%" />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} width="60%" />
          </div>
        );
    }
  }

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An error occurred while loading the data.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingWrapper; 