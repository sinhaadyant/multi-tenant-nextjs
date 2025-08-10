import React from 'react';
import { User, Building2, Sparkles } from 'lucide-react';

interface WelcomeMessageProps {
  userName: string;
  tenantName: string;
  className?: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  userName,
  tenantName,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-4 ${className}`}>
      {/* Welcome Icon */}
      <div className="mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-yellow-800" />
          </div>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Hello, {userName} 👋
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome to the Multi-Tenant Module
        </p>
        
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-8">
          <Building2 className="w-5 h-5" />
          <span className="text-lg">{tenantName}</span>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              User Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Access your profile and manage your account settings
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Modern Interface
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enjoy a clean, intuitive user experience
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Secure Platform
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Navigation
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/profile" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Profile
            </a>
            <a 
              href="/utilities" 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Settings
            </a>
            <a 
              href="/support" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Get Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 