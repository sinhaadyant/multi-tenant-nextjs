import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';

const languageOptions = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी' },
  { code: 'ur', name: 'اُردُو', nativeName: 'اُردُو' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية' },
  { code: 'bn', name: 'বাংলা', nativeName: 'বাংলা' },
  { code: 'fr', name: 'Français', nativeName: 'Français' },
];

export const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation('settings');
  const { currentLanguage, changeLanguage, isLoading } = useTenantLanguage();

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    await changeLanguage(newLanguage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">{t('updatingLanguage')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('defaultLanguage')}
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeName} ({option.name})
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('changesApplyImmediately')}
      </p>
    </div>
  );
};
