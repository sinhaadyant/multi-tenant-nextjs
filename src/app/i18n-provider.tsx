"use client";

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useEffect, useState } from 'react';

// Import translation files
import enCommon from '../../public/locales/en/common.json';
import enUsers from '../../public/locales/en/users.json';
import enSettings from '../../public/locales/en/settings.json';
import enWalkthrough from '../../public/locales/en/walkthrough.json';
import enAuth from '../../public/locales/en/auth.json';
import enTenants from '../../public/locales/en/tenants.json';
import enNavigation from '../../public/locales/en/navigation.json';
import enForms from '../../public/locales/en/forms.json';
import enTables from '../../public/locales/en/tables.json';
import enErrors from '../../public/locales/en/errors.json';
import enLoading from '../../public/locales/en/loading.json';

import hiCommon from '../../public/locales/hi/common.json';
import hiUsers from '../../public/locales/hi/users.json';
import hiSettings from '../../public/locales/hi/settings.json';
import hiWalkthrough from '../../public/locales/hi/walkthrough.json';
import hiAuth from '../../public/locales/hi/auth.json';
import hiTenants from '../../public/locales/hi/tenants.json';
import hiNavigation from '../../public/locales/hi/navigation.json';
import hiForms from '../../public/locales/hi/forms.json';
import hiTables from '../../public/locales/hi/tables.json';
import hiErrors from '../../public/locales/hi/errors.json';
import hiLoading from '../../public/locales/hi/loading.json';

import urCommon from '../../public/locales/ur/common.json';
import urUsers from '../../public/locales/ur/users.json';
import urSettings from '../../public/locales/ur/settings.json';
import urWalkthrough from '../../public/locales/ur/walkthrough.json';
import urAuth from '../../public/locales/ur/auth.json';
import urTenants from '../../public/locales/ur/tenants.json';
import urNavigation from '../../public/locales/ur/navigation.json';
import urForms from '../../public/locales/ur/forms.json';
import urTables from '../../public/locales/ur/tables.json';
import urErrors from '../../public/locales/ur/errors.json';
import urLoading from '../../public/locales/ur/loading.json';

import arCommon from '../../public/locales/ar/common.json';
import arUsers from '../../public/locales/ar/users.json';
import arSettings from '../../public/locales/ar/settings.json';
import arAuth from '../../public/locales/ar/auth.json';
import arTenants from '../../public/locales/ar/tenants.json';
import arNavigation from '../../public/locales/ar/navigation.json';
import arForms from '../../public/locales/ar/forms.json';
import arTables from '../../public/locales/ar/tables.json';
import arErrors from '../../public/locales/ar/errors.json';
import arLoading from '../../public/locales/ar/loading.json';

import bnCommon from '../../public/locales/bn/common.json';
import bnUsers from '../../public/locales/bn/users.json';
import bnSettings from '../../public/locales/bn/settings.json';
import bnAuth from '../../public/locales/bn/auth.json';
import bnTenants from '../../public/locales/bn/tenants.json';
import bnNavigation from '../../public/locales/bn/navigation.json';
import bnForms from '../../public/locales/bn/forms.json';
import bnTables from '../../public/locales/bn/tables.json';
import bnErrors from '../../public/locales/bn/errors.json';
import bnLoading from '../../public/locales/bn/loading.json';

import frCommon from '../../public/locales/fr/common.json';
import frUsers from '../../public/locales/fr/users.json';
import frSettings from '../../public/locales/fr/settings.json';
import frAuth from '../../public/locales/fr/auth.json';
import frTenants from '../../public/locales/fr/tenants.json';
import frNavigation from '../../public/locales/fr/navigation.json';
import frForms from '../../public/locales/fr/forms.json';
import frTables from '../../public/locales/fr/tables.json';
import frErrors from '../../public/locales/fr/errors.json';
import frLoading from '../../public/locales/fr/loading.json';

const resources = {
  en: {
    common: enCommon,
    users: enUsers,
    settings: enSettings,
    walkthrough: enWalkthrough,
    auth: enAuth,
    tenants: enTenants,
    navigation: enNavigation,
    forms: enForms,
    tables: enTables,
    errors: enErrors,
    loading: enLoading,
  },
  hi: {
    common: hiCommon,
    users: hiUsers,
    settings: hiSettings,
    walkthrough: hiWalkthrough,
    auth: hiAuth,
    tenants: hiTenants,
    navigation: hiNavigation,
    forms: hiForms,
    tables: hiTables,
    errors: hiErrors,
    loading: hiLoading,
  },
  ur: {
    common: urCommon,
    users: urUsers,
    settings: urSettings,
    walkthrough: urWalkthrough,
    auth: urAuth,
    tenants: urTenants,
    navigation: urNavigation,
    forms: urForms,
    tables: urTables,
    errors: urErrors,
    loading: urLoading,
  },
  ar: {
    common: arCommon,
    users: arUsers,
    settings: arSettings,
    walkthrough: enWalkthrough,
    auth: arAuth,
    tenants: arTenants,
    navigation: arNavigation,
    forms: arForms,
    tables: arTables,
    errors: arErrors,
    loading: arLoading,
  },
  bn: {
    common: bnCommon,
    users: bnUsers,
    settings: bnSettings,
    walkthrough: enWalkthrough,
    auth: bnAuth,
    tenants: bnTenants,
    navigation: bnNavigation,
    forms: bnForms,
    tables: bnTables,
    errors: bnErrors,
    loading: bnLoading,
  },
  fr: {
    common: frCommon,
    users: frUsers,
    settings: frSettings,
    walkthrough: enWalkthrough,
    auth: frAuth,
    tenants: frTenants,
    navigation: frNavigation,
    forms: frForms,
    tables: frTables,
    errors: frErrors,
    loading: frLoading,
  },
};

// Create i18n instance
const i18n = createInstance();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export { i18n };

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get language from localStorage or default to 'en'
    const storedLanguage = localStorage.getItem('language') || 'en';
    
    // Set the language
    i18n.changeLanguage(storedLanguage);
    
    // Set RTL for Arabic and Urdu
    if (storedLanguage === 'ar' || storedLanguage === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
