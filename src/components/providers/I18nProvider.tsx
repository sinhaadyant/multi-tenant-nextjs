"use client";

import React, { useEffect, useState } from 'react';
import { useTenantLanguage } from '@/hooks/useTenantLanguage';
import { i18nInitialized } from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  
  // The useTenantLanguage hook handles initialization automatically
  useTenantLanguage();

  useEffect(() => {
    const checkI18nReady = () => {
      if (i18nInitialized) {
        setIsReady(true);
      } else {
        setTimeout(checkI18nReady, 100);
      }
    };
    
    checkI18nReady();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading language settings...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
