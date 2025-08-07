import React from 'react';

const RolesSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesSkeleton; 