module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'ur', 'ar', 'bn', 'fr'],
    localeDetection: false, // We'll handle this manually based on tenant settings
  },
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Important for SSR
  },
  // Custom locale detection based on tenant settings
  detection: {
    order: ['localStorage', 'cookie', 'navigator'],
    caches: ['localStorage'],
  },
};
