import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';
import { Globe, ChevronDown } from 'lucide-react';

const languageOptions = [
  { code: 'en', name: 'EN', nativeName: 'English' },
  { code: 'hi', name: 'HI', nativeName: 'हिंदी' },
  { code: 'ur', name: 'UR', nativeName: 'اُردُو' },
  { code: 'ar', name: 'AR', nativeName: 'العربية' },
  { code: 'bn', name: 'BN', nativeName: 'বাংলা' },
  { code: 'fr', name: 'FR', nativeName: 'Français' },
];

export const HeaderLanguageSwitcher: React.FC = () => {
  const { t } = useTranslation('common');
  const { currentLanguage, changeLanguage, isLoading } = useTenantLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    await changeLanguage(newLanguage);
    setIsOpen(false);
  };

  const currentLanguageOption = languageOptions.find(lang => lang.code === currentLanguage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-10 h-10">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
        title={t('selectLanguage')}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:block">{currentLanguageOption?.name || 'EN'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleLanguageChange(option.code)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    currentLanguage === option.code
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="font-medium">{option.nativeName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};
