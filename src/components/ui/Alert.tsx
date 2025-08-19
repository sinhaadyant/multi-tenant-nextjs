import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertProps {
  children: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variantClasses = {
    default: 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100',
    destructive: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/50 text-red-900 dark:text-red-100'
  };

  return (
    <div className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};
