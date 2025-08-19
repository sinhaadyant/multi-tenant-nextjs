import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

interface CountCardSkeletonProps {
  showGrowth?: boolean;
  className?: string;
}

export const CountCardSkeleton: React.FC<CountCardSkeletonProps> = ({ 
  showGrowth = true, 
  className = "" 
}) => (
  <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    <div className="flex items-center">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="ml-4 flex-1">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
    {showGrowth && (
      <div className="mt-4 flex items-center">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-3 w-12 ml-2" />
        <Skeleton className="h-3 w-24 ml-2" />
      </div>
    )}
  </div>
);

export const CountCardsGridSkeleton: React.FC<{ 
  count?: number; 
  showGrowth?: boolean;
  className?: string;
}> = ({ 
  count = 4, 
  showGrowth = true,
  className = ""
}) => (
  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
    {[...Array(count)].map((_, index) => (
      <CountCardSkeleton key={index} showGrowth={showGrowth} />
    ))}
  </div>
);
