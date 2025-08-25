"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';

export const I18nTest: React.FC = () => {
  const { t } = useTranslation('common');
  const { currentLanguage, changeLanguage, isLoading } = useTenantLanguage();

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
  };

  if (isLoading) {
    return <div>Loading i18n...</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">i18n Test Component</h2>
      <p>Current Language: {currentLanguage}</p>
      <p>Translated Text: {t('quickActions')}</p>
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={() => handleLanguageChange('en')}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          English
        </button>
        <button 
          onClick={() => handleLanguageChange('hi')}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Hindi
        </button>
        <button 
          onClick={() => handleLanguageChange('ar')}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Arabic
        </button>
      </div>
    </div>
  );
};
