import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translation files (these exist)
import enCommon from '../../public/locales/en/common.json';
import enAuth from '../../public/locales/en/auth.json';
import enErrors from '../../public/locales/en/errors.json';
import enUsers from '../../public/locales/en/users.json';
import enPlans from '../../public/locales/en/plans.json';
import enSettings from '../../public/locales/en/settings.json';
import enSuperadmin from '../../public/locales/en/superadmin.json';

// Import Hindi translation files
import hiAuth from '../../public/locales/hi/auth.json';
import hiSuperadmin from '../../public/locales/hi/superadmin.json';

// Import Bengali translation files
import bnAuth from '../../public/locales/bn/auth.json';

// For now, we'll use English translations for other languages to ensure basic functionality
// In a production environment, you would import actual translations for each language

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    users: enUsers,
    plans: enPlans,
    settings: enSettings,
    superadmin: enSuperadmin,
  },
  hi: {
    common: enCommon,
    auth: hiAuth,
    errors: enErrors,
    users: enUsers,
    plans: enPlans,
    settings: enSettings,
    superadmin: hiSuperadmin,
  },
  ur: {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    users: enUsers,
    plans: enPlans,
    settings: enSettings,
    superadmin: enSuperadmin,
  },
  ar: {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    users: enUsers,
    plans: enPlans,
    settings: enSettings,
    superadmin: enSuperadmin,
  },
  bn: {
    common: enCommon,
    auth: bnAuth,
    errors: enErrors,
    users: enUsers,
    plans: enPlans,
    settings: enSettings,
    superadmin: enSuperadmin,
  },
  fr: {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    users: enUsers,
    plans: enPlans,
    settings: enSettings,
    superadmin: enSuperadmin,
  },
};

// Initialize i18n only on client side
let i18nInitialized = false;

if (typeof window !== 'undefined') {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      
      interpolation: {
        escapeValue: false,
      },
      
      react: {
        useSuspense: false,
      },
      
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      
      defaultNS: 'common',
      ns: ['common', 'auth', 'errors', 'users', 'plans', 'settings', 'superadmin'],
    })
    .then(() => {
      i18nInitialized = true;
    });
}

export default i18n;
export { i18nInitialized };
