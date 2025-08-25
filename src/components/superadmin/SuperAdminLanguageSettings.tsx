"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserLanguage } from '@/hooks/useUserLanguage';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Globe, User, Settings, Crown } from 'lucide-react';

interface SuperAdminLanguageSettingsProps {
  superAdminId: string;
  className?: string;
}

export const SuperAdminLanguageSettings: React.FC<SuperAdminLanguageSettingsProps> = ({
  superAdminId,
  className = ""
}) => {
  const { t } = useTranslation(['common', 'settings']);
  const { currentLanguage, isLoading, userLanguageData } = useUserLanguage(superAdminId, 'superadmin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Crown className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('common.superadmin')} {t('settings.languageSettings')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.userPreferences')} - {t('settings.defaultLanguage')}
          </p>
        </div>
      </div>

      {/* Current Language Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('common.status')}
          </h3>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600">
              {currentLanguage.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('common.user')} {t('common.language')}</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {userLanguageData?.userLanguage || t('settings.defaultLanguage')}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('common.status')}</p>
            <p className="font-medium text-green-600">
              {t('common.active')}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-1">RTL {t('common.support')}</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {currentLanguage === 'ar' || currentLanguage === 'ur' ? t('common.yes') : t('common.no')}
            </p>
          </div>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <LanguageSwitcher 
          variant="list" 
          userId={superAdminId}
          userType="superadmin"
          showFlags={true}
          showNativeNames={true}
        />
      </div>

      {/* Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              {t('settings.languageSettings')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              As a Super Admin, your language preference is independent of any tenant settings. 
              This setting will apply across all areas of the super admin panel.
            </p>
            <ul className="mt-2 text-xs text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
              <li>Your language choice is saved to your personal profile</li>
              <li>RTL languages (Arabic, Urdu) automatically adjust the interface direction</li>
              <li>This setting doesn't affect tenant-specific language preferences</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('common.actions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('settings.generalSettings')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Access other super admin preferences
              </p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <User className="w-5 h-5 text-gray-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('common.profile')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Manage your admin profile
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
