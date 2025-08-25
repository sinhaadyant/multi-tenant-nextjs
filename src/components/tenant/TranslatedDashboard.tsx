"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Globe,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star
} from 'lucide-react';

export const TranslatedDashboard: React.FC = () => {
  const { t } = useTranslation(['common', 'users', 'settings']);
  const { currentLanguage, isLoading } = useTenantLanguage();

  const stats = [
    {
      title: t('users.totalUsers'),
      value: '1,234',
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: t('users.activeUsers'),
      value: '892',
      icon: <Activity className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: t('common.analytics'),
      value: '156',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+23%',
      changeType: 'positive' as const
    },
    {
      title: t('common.reports'),
      value: '45',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+5%',
      changeType: 'positive' as const
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: t('users.userCreated'),
      user: 'John Doe',
      time: '2 minutes ago',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      id: 2,
      action: t('users.userUpdated'),
      user: 'Jane Smith',
      time: '5 minutes ago',
      icon: <Clock className="w-4 h-4 text-blue-500" />
    },
    {
      id: 3,
      action: t('common.analytics'),
      user: 'Mike Johnson',
      time: '10 minutes ago',
      icon: <BarChart3 className="w-4 h-4 text-purple-500" />
    },
    {
      id: 4,
      action: t('common.reports'),
      user: 'Sarah Wilson',
      time: '15 minutes ago',
      icon: <TrendingUp className="w-4 h-4 text-orange-500" />
    }
  ];

  const quickActions = [
    {
      title: t('users.addUser'),
      description: t('users.userManagement'),
      icon: <Users className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('common.settings'),
      description: t('settings.generalSettings'),
      icon: <Settings className="w-8 h-8" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: t('common.language'),
      description: t('settings.languageSettings'),
      icon: <Globe className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('common.dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('common.overview')} - {t('common.lastUpdated')}: {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('common.language')}: {currentLanguage.toUpperCase()}
            </span>
          </div>
          <LanguageSwitcher variant="dropdown" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} dark:bg-gray-700`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                {t('common.lastUpdated')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('users.userActivity')}
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {activity.icon}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('common.actions')}
          </h2>
          <div className="space-y-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <div className={action.color}>{action.icon}</div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('settings.languageSettings')}
          </h3>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          {t('settings.defaultLanguage')}: {currentLanguage.toUpperCase()} • 
          {currentLanguage === 'ar' || currentLanguage === 'ur' ? ' RTL' : ' LTR'} {t('common.language')}
        </p>
      </div>
    </div>
  );
};
