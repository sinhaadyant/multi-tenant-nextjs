import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorComponentProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tenant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your tenant dashboard
          </p>
        </div>
      </div>
      
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-red-400 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Dashboard Error
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
          Need Help?
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          If this problem persists, please contact your system administrator or try the following:
        </p>
        <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1 text-sm">
          <li>Check your internet connection</li>
          <li>Refresh the page</li>
          <li>Clear your browser cache</li>
          <li>Contact support if the issue continues</li>
        </ul>
      </div>
    </div>
  );
}; 