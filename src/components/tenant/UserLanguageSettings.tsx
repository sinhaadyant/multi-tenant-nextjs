"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserLanguage } from '@/hooks/useUserLanguage';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Globe, User, Settings, Building } from 'lucide-react';

interface UserLanguageSettingsProps {
  userId: string;
  className?: string;
}

export const UserLanguageSettings: React.FC<UserLanguageSettingsProps> = ({
  userId,
  className = ""
}) => {
  const { t } = useTranslation(['common', 'settings']);
  const { currentLanguage, isLoading, userLanguageData } = useUserLanguage(userId, 'user');

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
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings.languageSettings')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.userPreferences')} - {t('settings.defaultLanguage')}
          </p>
        </div>
      </div>

      {/* Language Hierarchy Info */}
      {userLanguageData && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Building className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t('settings.languageSettings')} Hierarchy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">1. Your Preference</p>
                  <p className="font-medium text-blue-600">
                    {userLanguageData.userLanguage || 'Not set'}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">2. Tenant Default</p>
                  <p className="font-medium text-green-600">
                    {userLanguageData.tenantLanguage || 'Not set'}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">3. Currently Using</p>
                  <p className="font-medium text-purple-600">
                    {userLanguageData.effectiveLanguage.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Language Status */}
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
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('common.language')}</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {currentLanguage.toUpperCase()}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-1">Text Direction</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {currentLanguage === 'ar' || currentLanguage === 'ur' ? 'RTL' : 'LTR'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('common.status')}</p>
            <p className="font-medium text-green-600">
              {t('common.active')}
            </p>
          </div>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <LanguageSwitcher 
          variant="list" 
          userId={userId}
          userType="user"
          showFlags={true}
          showNativeNames={true}
        />
      </div>

      {/* Information */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              Language Preference Priority
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Your personal language preference takes priority over the tenant default. 
              If you haven't set a preference, the system will use your tenant's default language.
            </p>
            <ul className="mt-2 text-xs text-amber-600 dark:text-amber-400 list-disc list-inside space-y-1">
              <li>Personal preference is saved to your user profile</li>
              <li>Falls back to tenant default if not set</li>
              <li>RTL languages automatically adjust interface direction</li>
              <li>Changes apply immediately across the platform</li>
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
                Access other user preferences
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
                Manage your user profile
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
