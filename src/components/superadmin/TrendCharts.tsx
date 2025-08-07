"use client";

import React from 'react';
import { TrendingUp, Users, Building2 } from 'lucide-react';
import { TrendData } from '@/hooks/useSuperadminOverview';

interface TrendChartsProps {
  data: TrendData[];
  isLoading?: boolean;
}

const TrendCharts: React.FC<TrendChartsProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const maxTenants = Math.max(...data.map(d => d.tenants));
  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Tenant Growth Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tenant Growth
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monthly new tenant registrations
            </p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.tenants / maxTenants) * 100;
            const growth = index > 0 ? item.tenants - data[index - 1].tenants : 0;
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(item.date)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.tenants} tenants
                    </span>
                    {index > 0 && (
                      <span className={`text-xs flex items-center ${
                        growth > 0 ? 'text-green-600 dark:text-green-400' : 
                        growth < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {growth > 0 ? '+' : ''}{growth}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Growth
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total users across all tenants
            </p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.users / maxUsers) * 100;
            const growth = index > 0 ? item.users - data[index - 1].users : 0;
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(item.date)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.users.toLocaleString()} users
                    </span>
                    {index > 0 && (
                      <span className={`text-xs flex items-center ${
                        growth > 0 ? 'text-green-600 dark:text-green-400' : 
                        growth < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {growth > 0 ? '+' : ''}{growth.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendCharts; 