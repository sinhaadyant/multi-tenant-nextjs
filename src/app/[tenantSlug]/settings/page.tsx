"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { 
  Settings, 
  Globe, 
  User, 
  Shield, 
  Bell, 
  Palette,
  Database,
  Key,
  Clock,
  Save
} from 'lucide-react';

export default function TenantSettingsPage() {
  const { t } = useTranslation(['common', 'settings']);
  const { currentLanguage, isLoading } = useTenantLanguage();

  const settingsSections = [
    {
      id: 'general',
      title: t('settings.generalSettings'),
      description: t('settings.accountSettings'),
      icon: <Settings className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'language',
      title: t('settings.languageSettings'),
      description: t('settings.defaultLanguage'),
      icon: <Globe className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'security',
      title: t('settings.securitySettings'),
      description: t('settings.passwordPolicy'),
      icon: <Shield className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'notifications',
      title: t('settings.notificationSettings'),
      description: t('settings.emailNotifications'),
      icon: <Bell className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'theme',
      title: t('settings.themeSettings'),
      description: t('common.theme'),
      icon: <Palette className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'privacy',
      title: t('settings.privacySettings'),
      description: t('settings.privacyPolicy'),
      icon: <User className="w-6 h-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
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
            {t('common.settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('settings.tenantSettings')} - {t('settings.userPreferences')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('common.language')}: {currentLanguage.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Language Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('settings.languageSettings')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.defaultLanguage')} - {t('settings.userPreferences')}
          </p>
        </div>
        
        <LanguageSwitcher variant="list" />
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-lg ${section.bgColor} dark:bg-gray-700`}>
                <div className={section.color}>{section.icon}</div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {section.id === 'language' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>{t('settings.defaultLanguage')}:</strong> {currentLanguage.toUpperCase()}</p>
                  <p><strong>{t('common.theme')}:</strong> {t('common.system')}</p>
                  <p><strong>{t('settings.timezone')}:</strong> UTC</p>
                </div>
              )}
              
              {section.id === 'security' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>{t('settings.twoFactorAuth')}:</strong> {t('common.active')}</p>
                  <p><strong>{t('settings.sessionTimeout')}:</strong> 24 {t('common.time')}</p>
                  <p><strong>{t('settings.loginHistory')}:</strong> 30 {t('common.date')}</p>
                </div>
              )}
              
              {section.id === 'notifications' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>{t('settings.emailNotifications')}:</strong> {t('common.active')}</p>
                  <p><strong>{t('settings.pushNotifications')}:</strong> {t('common.active')}</p>
                  <p><strong>{t('settings.notificationFrequency')}:</strong> {t('settings.immediate')}</p>
                </div>
              )}
              
              {section.id === 'theme' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>{t('common.theme')}:</strong> {t('common.system')}</p>
                  <p><strong>{t('common.dark')}:</strong> {t('common.active')}</p>
                  <p><strong>{t('common.light')}:</strong> {t('common.inactive')}</p>
                </div>
              )}
              
              {section.id === 'privacy' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>{t('settings.privacyPolicy')}:</strong> {t('common.active')}</p>
                  <p><strong>{t('settings.gdprCompliance')}:</strong> {t('common.active')}</p>
                  <p><strong>{t('settings.dataRetention')}:</strong> 90 {t('common.date')}</p>
                </div>
              )}
              
              {section.id === 'general' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>{t('settings.timezone')}:</strong> UTC</p>
                  <p><strong>{t('settings.dateFormat')}:</strong> MM/DD/YYYY</p>
                  <p><strong>{t('settings.timeFormat')}:</strong> 12-hour</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                <Settings className="w-4 h-4" />
                <span>{t('common.edit')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* System Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('settings.systemSettings')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">{t('settings.version')}</p>
            <p className="font-medium text-gray-900 dark:text-white">2.0.2</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">{t('settings.systemHealth')}</p>
            <p className="font-medium text-green-600">98%</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">{t('settings.uptime')}</p>
            <p className="font-medium text-gray-900 dark:text-white">99.9%</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Save className="w-4 h-4" />
          <span>{t('common.save')}</span>
        </button>
      </div>
    </div>
  );
}
