"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';
import { useUserLanguage } from '@/hooks/useUserLanguage';
import { ChevronDown, Globe, Check } from 'lucide-react';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اُردُو',
    flag: '🇵🇰'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇧🇩'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  }
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'list';
  showFlags?: boolean;
  showNativeNames?: boolean;
  userId?: string;
  userType?: 'user' | 'superadmin';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  userId,
  userType = 'user'
}) => {
  const { t } = useTranslation('settings');
  
  // Use the specific user language hook if userId is provided, otherwise fall back to tenant language
  const userLanguageHook = useUserLanguage(userId, userType);
  const tenantLanguageHook = useTenantLanguage();
  
  const { currentLanguage, isLoading, error, changeLanguage, userLanguageData } = userId 
    ? userLanguageHook 
    : tenantLanguageHook;
    
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguageOption = languageOptions.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('languageSettings')}
          </h3>
        </div>
        
                 {error && (
           <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
             <p className="text-sm text-red-600">{error}</p>
           </div>
         )}
         
         {/* Language Source Information */}
         {userLanguageData && (
           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
             <div className="text-xs text-blue-700 dark:text-blue-300">
               <p><strong>{t('settings.userPreferences')}:</strong> {userLanguageData.userLanguage || 'Not set'}</p>
               {userLanguageData.tenantLanguage && (
                 <p><strong>Tenant Default:</strong> {userLanguageData.tenantLanguage}</p>
               )}
               <p><strong>Using:</strong> {userLanguageData.effectiveLanguage}</p>
             </div>
           </div>
         )}
        
        <div className="grid grid-cols-1 gap-3">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageChange(option.code)}
              disabled={isLoading}
              className={`
                flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                ${currentLanguage === option.code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center space-x-3">
                {showFlags && (
                  <span className="text-2xl">{option.flag}</span>
                )}
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.name}
                  </div>
                  {showNativeNames && option.nativeName !== option.name && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.nativeName}
                    </div>
                  )}
                </div>
              </div>
              
              {currentLanguage === option.code && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
            </button>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-500">{t('common:updatingLanguage')}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 
          bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-2">
          {showFlags && currentLanguageOption?.flag && (
            <span className="text-lg">{currentLanguageOption.flag}</span>
          )}
          <span>
            {currentLanguageOption?.name || t('common:selectLanguage')}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600">
          <div className="py-1">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                onClick={() => handleLanguageChange(option.code)}
                disabled={isLoading}
                className={`
                  flex items-center justify-between w-full px-4 py-2 text-sm text-left
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${currentLanguage === option.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center space-x-2">
                  {showFlags && (
                    <span className="text-lg">{option.flag}</span>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.name}
                    </div>
                    {showNativeNames && option.nativeName !== option.name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.nativeName}
                      </div>
                    )}
                  </div>
                </div>
                
                {currentLanguage === option.code && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
