import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const DashboardOverviewSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="ml-4 flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-3 w-12 ml-2" />
          <Skeleton className="h-3 w-24 ml-2" />
        </div>
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-32" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

export const ActivitySkeleton: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-start space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SystemHealthSkeleton: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-20 ml-2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Overview Cards Skeleton */}
    <DashboardOverviewSkeleton />

    {/* Charts and Activity Skeleton */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ActivitySkeleton />
      <div className="space-y-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>

    {/* System Health Skeleton */}
    <SystemHealthSkeleton />
  </div>
); 