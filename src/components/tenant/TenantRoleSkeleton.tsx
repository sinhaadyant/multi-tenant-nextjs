"use client";

import React from 'react';

const TenantRoleSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="lg:w-48">
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="lg:w-48">
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                </th>
                <th className="px-6 py-3 text-right">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 mt-1 animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8 animate-pulse"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-16 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantRoleSkeleton;
