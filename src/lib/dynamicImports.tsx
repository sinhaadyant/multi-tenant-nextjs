import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import React from 'react';

// Loading fallback component
const LoadingFallback = ({ className = "h-48" }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, retry }: { error?: Error; retry?: () => void }) => (
  <div className="flex flex-col items-center justify-center h-48 p-4 text-center">
    <div className="text-red-500 mb-2">
      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-2">Failed to load component</p>
    {retry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

// Dynamic import wrapper with error boundary
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: ComponentType<any>;
    error?: ComponentType<any>;
    ssr?: boolean;
    className?: string;
  } = {}
) {
  const {
    loading = () => <LoadingFallback className={options.className} />,
    error = ErrorFallback,
    ssr = false,
  } = options;

  return dynamic(importFn, {
    ssr,
    loading,
    // Note: Next.js dynamic doesn't support error boundaries directly
    // We'll handle errors in the component itself
  });
}

// Pre-configured dynamic imports for common heavy components
export const DynamicChart = createDynamicComponent(
  () => import('react-apexcharts'),
  { ssr: false, className: "h-64" }
);

export const DynamicDataTable = createDynamicComponent(
  () => import('@/components/superadmin/DataTable'),
  { ssr: false, className: "h-96" }
);

export const DynamicModal = createDynamicComponent(
  () => import('@/components/ui/modal').then(module => ({ default: module.Modal })),
  { ssr: false }
);

export const DynamicCalendar = createDynamicComponent(
  () => import('@/components/calendar/Calendar'),
  { ssr: false, className: "h-96" }
);

// Utility for conditional dynamic imports
export function createConditionalDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  condition: () => boolean,
  fallback?: ComponentType<any>
) {
  return dynamic(
    () => {
      if (condition()) {
        return importFn();
      }
      return Promise.resolve({ default: fallback || (() => null) });
    },
    { ssr: false }
  );
}