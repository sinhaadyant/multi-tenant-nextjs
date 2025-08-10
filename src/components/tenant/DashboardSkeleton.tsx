import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 dark:bg-gray-700 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mt-2 dark:bg-gray-700 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 dark:bg-gray-700 animate-pulse"></div>
        </div>
      </div>

      {/* Count Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
                <div className="h-6 bg-gray-200 rounded w-16 mt-2 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="h-4 bg-gray-200 rounded w-12 dark:bg-gray-700"></div>
              <div className="h-4 bg-gray-200 rounded w-24 ml-2 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mt-1 dark:bg-gray-700"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mt-1 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((index) => (
          <div key={index} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        ))}
      </div>

      {/* Login Trends Chart Skeleton */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 