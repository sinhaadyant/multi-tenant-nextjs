import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TenantErrorComponentProps {
  error: string;
  onRetry: () => void;
}

interface TenantNoDataComponentProps {
  title: string;
  message: string;
}

export const TenantErrorComponent: React.FC<TenantErrorComponentProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading dashboard
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export const TenantNoDataComponent: React.FC<TenantNoDataComponentProps> = ({ title, message }) => {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {title}
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
