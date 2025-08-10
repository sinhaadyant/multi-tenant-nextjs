import React from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  plan: string;
}

interface RecentTenantsProps {
  tenants: Tenant[];
}



export const RecentTenants: React.FC<RecentTenantsProps> = ({ tenants }) => {
  // Add null checks to prevent errors
  if (!tenants) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Tenants
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Latest tenant registrations and updates
            </p>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 mt-2 dark:bg-gray-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Tenants
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Latest tenant registrations and updates
          </p>
        </div>
        <Link 
          href="/superadmin/tenants"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
        >
          View All
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Tenants List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tenants.slice(0, 5).map((tenant) => (
          <div key={tenant.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {tenant.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span>Active</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {tenant.plan} Plan
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{tenant.userCount} users</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">•</span>
                    <span className="font-mono text-xs">{tenant.slug}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  href={`/superadmin/tenants/${tenant.id}`}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
                >
                  View
                </Link>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {tenants.length > 5 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href="/superadmin/tenants"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View all {tenants.length} tenants →
          </Link>
        </div>
      )}
    </div>
  );
}; 