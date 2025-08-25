"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { i18nInitialized } from '@/lib/i18n';

export const I18nTest: React.FC = () => {
  const { t } = useTranslation('auth');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkInitialization = () => {
      if (i18nInitialized) {
        setIsInitialized(true);
        setCurrentLanguage(i18n.language);
      } else {
        setTimeout(checkInitialization, 100);
      }
    };
    checkInitialization();
  }, []);

  const handleLanguageChange = async (lang: string) => {
    try {
      console.log('Changing language to:', lang);
      await i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
      console.log('Language changed successfully to:', i18n.language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  if (!isInitialized) {
    return <div>i18n not initialized yet...</div>;
  }

  return (
    <div className="p-4 border rounded bg-white dark:bg-gray-800">
      <h2 className="text-lg font-bold mb-4">i18n Debug Component</h2>
      <p>Current Language: {currentLanguage}</p>
      <p>i18n Language: {i18n.language}</p>
      <p>Translation Test: {t('superadminSignIn')}</p>
      <p>Welcome Text: {t('welcomeBack')}</p>

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

      <div className="mt-4 text-sm text-gray-600">
        <p>Available namespaces: {i18n.options.ns?.join(', ')}</p>
        <p>Fallback language: {i18n.options.fallbackLng}</p>
      </div>
    </div>
  );
};
