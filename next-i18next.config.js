module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'ur', 'ar', 'bn', 'fr'],
    localeDetection: false, // We'll handle this manually for tenant-based language
  },
  defaultNS: 'common',
  ns: ['common', 'users', 'plans', 'settings', 'superadmin'],
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};
