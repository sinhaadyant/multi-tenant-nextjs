import React from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  plan: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  plan: string;
}

interface DashboardData {
  topTenants?: Tenant[];
  recentTenants?: Tenant[];
  tenants?: Tenant[];
}

interface RecentTenantsProps {
  data?: DashboardData;
}

export const RecentTenants = ({ data }: RecentTenantsProps) => {
  const { t } = useTranslation('superadmin');
  
  // Extract tenants from data
  const tenants = data?.topTenants || data?.recentTenants || data?.tenants || [];

  // Add null checks to prevent errors
  if (!tenants || tenants.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentTenants.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('dashboard.recentTenants.subtitle')}
            </p>
          </div>
        </div>
        <div className="p-6 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.recentTenants.noTenants')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.recentTenants.noTenantsDesc')}</p>
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
            {t('dashboard.recentTenants.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Latest tenant registrations and updates
          </p>
        </div>
        <Link 
          href="/superadmin/tenants"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
        >
          {t('dashboard.recentTenants.viewAll')}
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Tenants List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tenants.slice(0, 5).map((tenant: Tenant) => (
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
                        {t('dashboard.recentTenants.status.active')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{tenant.userCount || 0} {t('dashboard.recentTenants.userCount')}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tenant.plan || t('dashboard.recentTenants.plan')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 