import React from 'react';
import { Module } from '@/hooks/useModuleManagement';
import { BarChart3, TrendingUp, Users, Clock, Activity, Package, CheckCircle, XCircle } from 'lucide-react';

interface ModuleAnalyticsProps {
  modules: Module[];
  permissions: {
    canViewAnalytics: boolean;
  };
}

const ModuleAnalytics: React.FC<ModuleAnalyticsProps> = ({ modules, permissions }) => {
  if (!permissions.canViewAnalytics) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <BarChart3 className="w-5 h-5 text-yellow-500 mr-2" />
          <span className="text-yellow-800 dark:text-yellow-200">
            You don't have permission to view module analytics
          </span>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalModules = modules.length;
  const enabledModules = modules.filter(m => m.isEnabled).length;
  const disabledModules = totalModules - enabledModules;
  const modulesWithAnalytics = modules.filter(m => m.analytics);
  const totalAccessCount = modulesWithAnalytics.reduce((sum, m) => sum + (m.analytics?.accessCount || 0), 0);
  const mostAccessedModule = modulesWithAnalytics.reduce((max, m) => 
    (m.analytics?.accessCount || 0) > (max.analytics?.accessCount || 0) ? m : max
  , modulesWithAnalytics[0]);

  // Get recent activity (modules accessed in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentActivity = modulesWithAnalytics.filter(m => 
    m.analytics?.lastAccessedAt && new Date(m.analytics.lastAccessedAt) > thirtyDaysAgo
  ).length;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Module Analytics
          </h2>
          <BarChart3 className="w-6 h-6 text-blue-500" />
        </div>
        
        <p className="text-gray-600 dark:text-gray-300">
          Usage statistics and performance metrics for your tenant modules
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Modules */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Modules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalModules}</p>
            </div>
          </div>
        </div>

        {/* Enabled Modules */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enabled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{enabledModules}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalModules > 0 ? Math.round((enabledModules / totalModules) * 100) : 0}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Total Access Count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Access</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAccessCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across {modulesWithAnalytics.length} modules
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentActivity}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Usage Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Module Usage
        </h3>
        
        <div className="space-y-4">
          {modulesWithAnalytics
            .sort((a, b) => (b.analytics?.accessCount || 0) - (a.analytics?.accessCount || 0))
            .slice(0, 10)
            .map(module => {
              const accessCount = module.analytics?.accessCount || 0;
              const percentage = totalAccessCount > 0 ? (accessCount / totalAccessCount) * 100 : 0;
              
              return (
                <div key={module.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.moduleName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {accessCount} accesses
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Most Accessed Module */}
      {mostAccessedModule && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Accessed Module
          </h3>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {mostAccessedModule.moduleName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {mostAccessedModule.description}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  {mostAccessedModule.analytics?.accessCount || 0} total accesses
                </span>
                {mostAccessedModule.analytics?.lastAccessedAt && (
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Last accessed: {new Date(mostAccessedModule.analytics.lastAccessedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {mostAccessedModule.analytics?.accessCount || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">accesses</div>
            </div>
          </div>
        </div>
      )}

      {/* Module Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Module Status Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enabled Modules */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Enabled Modules ({enabledModules})
            </h4>
            <div className="space-y-2">
              {modules
                .filter(m => m.isEnabled)
                .slice(0, 5)
                .map(module => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {module.moduleName}
                    </span>
                  </div>
                ))}
              {enabledModules > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{enabledModules - 5} more enabled modules
                </p>
              )}
            </div>
          </div>

          {/* Disabled Modules */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Disabled Modules ({disabledModules})
            </h4>
            <div className="space-y-2">
              {modules
                .filter(m => !m.isEnabled)
                .slice(0, 5)
                .map(module => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {module.moduleName}
                    </span>
                  </div>
                ))}
              {disabledModules > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{disabledModules - 5} more disabled modules
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleAnalytics; 