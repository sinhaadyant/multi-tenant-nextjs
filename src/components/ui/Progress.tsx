import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
