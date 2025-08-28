import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export const useSuperAdminLanguage = () => {
  const { i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get saved language or default to 'en'
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    
    // Apply the language
    i18n.changeLanguage(savedLanguage);
    
    // Set RTL for Arabic and Urdu
    if (savedLanguage === 'ar' || savedLanguage === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    setIsLoading(false);
  }, []);

  const changeLanguage = async (newLanguage: string) => {
    try {
      setIsLoading(true);
      
      // Update i18next
      await i18n.changeLanguage(newLanguage);
      
      // Update state
      setCurrentLanguage(newLanguage);
      
      // Save to localStorage
      localStorage.setItem('language', newLanguage);

      // Set RTL for Arabic and Urdu
      if (newLanguage === 'ar' || newLanguage === 'ur') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }

      // Force re-render of all components
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));

    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLanguage,
    changeLanguage,
    isLoading,
  };
};
