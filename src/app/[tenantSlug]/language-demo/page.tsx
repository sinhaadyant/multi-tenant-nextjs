"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserLanguageSettings } from '@/components/tenant/UserLanguageSettings';
import { SuperAdminLanguageSettings } from '@/components/superadmin/SuperAdminLanguageSettings';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { 
  Users, 
  Crown, 
  Globe, 
  Settings,
  User,
  Building,
  ArrowRight
} from 'lucide-react';

export default function LanguageDemoPage() {
  const { t } = useTranslation(['common', 'settings', 'users']);
  const [activeTab, setActiveTab] = useState<'overview' | 'user' | 'superadmin'>('overview');
  
  // Mock user IDs for testing (in real app, these would come from auth)
  const mockUserId = 'demo-user-123';
  const mockSuperAdminId = 'demo-superadmin-456';

  const tabs = [
    {
      id: 'overview' as const,
      label: t('common.overview'),
      icon: <Globe className="w-4 h-4" />,
      description: 'Multi-user language system overview'
    },
    {
      id: 'user' as const,
      label: t('common.user') + ' ' + t('settings.languageSettings'),
      icon: <User className="w-4 h-4" />,
      description: 'Tenant user language preferences'
    },
    {
      id: 'superadmin' as const,
      label: t('common.superadmin') + ' ' + t('settings.languageSettings'),
      icon: <Crown className="w-4 h-4" />,
      description: 'Super admin language preferences'
    }
  ];

  const languageFeatures = [
    {
      title: 'User-Specific Languages',
      description: 'Each user can set their own language preference',
      icon: <User className="w-6 h-6 text-blue-500" />,
      details: [
        'Personal language overrides tenant default',
        'Saved to user profile in database',
        'Independent of tenant settings'
      ]
    },
    {
      title: 'SuperAdmin Languages',
      description: 'Super admins have global language preferences',
      icon: <Crown className="w-6 h-6 text-purple-500" />,
      details: [
        'Independent of all tenant settings',
        'Applies across super admin panel',
        'Saved to super admin profile'
      ]
    },
    {
      title: 'Tenant Fallback',
      description: 'Tenant default used when user preference not set',
      icon: <Building className="w-6 h-6 text-green-500" />,
      details: [
        'Fallback for users without personal preference',
        'Set by tenant administrators',
        'Applies to all tenant users by default'
      ]
    },
    {
      title: 'RTL Support',
      description: 'Automatic right-to-left support for Arabic and Urdu',
      icon: <ArrowRight className="w-6 h-6 text-orange-500" />,
      details: [
        'Automatic direction switching',
        'CSS and layout adjustments',
        'Full RTL language support'
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Multi-User Language System Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test individual language preferences for users and super admins
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 min-w-0 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Language System Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Language Preference Hierarchy
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">1</span>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">User Preference</h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Individual user's language choice (highest priority)
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full">2</span>
                    <h3 className="font-medium text-green-900 dark:text-green-100">Tenant Default</h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Fallback when user preference not set
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full">3</span>
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">System Default</h3>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    English (en) as final fallback
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {languageFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {feature.description}
                      </p>
                      <ul className="space-y-1">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-gray-500 dark:text-gray-500 flex items-center space-x-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current System Status */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Current Session
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Active Language</p>
                  <p className="font-medium text-gray-900 dark:text-white">English (en)</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Text Direction</p>
                  <p className="font-medium text-gray-900 dark:text-white">LTR</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'user' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Demo User ID:</strong> {mockUserId} (This would normally come from your authentication system)
              </p>
            </div>
            <UserLanguageSettings userId={mockUserId} />
          </div>
        )}

        {activeTab === 'superadmin' && (
          <div>
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                <strong>Demo SuperAdmin ID:</strong> {mockSuperAdminId} (This would normally come from your authentication system)
              </p>
            </div>
            <SuperAdminLanguageSettings superAdminId={mockSuperAdminId} />
          </div>
        )}
      </div>

      {/* Quick Test Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Language Test
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Use this component to quickly test language changes:
        </p>
        <LanguageSwitcher variant="dropdown" showFlags={true} showNativeNames={true} />
      </div>
    </div>
  );
}
