import React from 'react';
import Skeleton from './Skeleton';

interface FormSkeletonProps {
  fields?: number;
  showButtons?: boolean;
  className?: string;
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  showButtons = true,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height={16} width="20%" />
          <Skeleton height={40} width="100%" />
        </div>
      ))}
      
      {showButtons && (
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Skeleton height={40} width={80} />
          <Skeleton height={40} width={100} />
        </div>
      )}
    </div>
  );
};

export default FormSkeleton; 