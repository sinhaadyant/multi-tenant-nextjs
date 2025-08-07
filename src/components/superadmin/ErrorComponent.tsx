import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface ErrorComponentProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({ error, onRetry }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

interface NoDataComponentProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const NoDataComponent: React.FC<NoDataComponentProps> = ({ 
  title = "No data available", 
  message = "There's no data to display at the moment.",
  icon = <Database className="w-12 h-12 text-gray-400" />
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="text-center py-8">
        <div className="mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {message}
        </p>
      </div>
    </div>
  );
}; 