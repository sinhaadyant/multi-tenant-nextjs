import React from 'react';
import Skeleton from './Skeleton';

interface CardSkeletonProps {
  showHeader?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
  className?: string;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showHeader = true,
  showContent = true,
  showFooter = false,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Skeleton height={24} width="40%" />
            <Skeleton height={32} width={80} />
          </div>
        </div>
      )}
      
      {showContent && (
        <div className="px-6 py-4">
          <div className="space-y-3">
            <Skeleton height={20} width="100%" />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} width="60%" />
          </div>
        </div>
      )}
      
      {showFooter && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Skeleton height={16} width="30%" />
            <div className="flex space-x-2">
              <Skeleton height={32} width={60} />
              <Skeleton height={32} width={60} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSkeleton; 