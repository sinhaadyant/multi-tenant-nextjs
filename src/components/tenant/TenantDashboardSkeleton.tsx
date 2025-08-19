import React from 'react';

export const TenantDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Last Updated Skeleton */}
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 