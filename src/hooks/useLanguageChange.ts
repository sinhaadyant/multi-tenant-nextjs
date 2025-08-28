import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export const useLanguageChange = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    // Set initial language from localStorage
    const savedLanguage = localStorage.getItem('language') || 'en';
    if (savedLanguage !== currentLanguage) {
      i18n.changeLanguage(savedLanguage);
      setCurrentLanguage(savedLanguage);
    }

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [currentLanguage]);

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Set RTL for Arabic and Urdu
      if (language === 'ar' || language === 'ur') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
      
      // Save to localStorage
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    i18n: i18nInstance,
  };
};