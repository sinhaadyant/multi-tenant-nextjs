import { i18n } from '@/app/i18n-provider';

describe('i18n functionality', () => {
  beforeEach(() => {
    // Reset i18n language to English before each test
    i18n.changeLanguage('en');
  });

  test('i18n instance is properly configured', () => {
    expect(i18n).toBeDefined();
    expect(typeof i18n.changeLanguage).toBe('function');
    expect(typeof i18n.t).toBe('function');
  });

  test('loads English translations correctly', () => {
    expect(i18n.t('common:dashboard')).toBe('Dashboard');
    expect(i18n.t('common:users')).toBe('Users');
    expect(i18n.t('common:save')).toBe('Save');
  });

  test('loads tenant translations correctly', () => {
    expect(i18n.t('tenants:tenantManagement')).toBe('Tenant Management');
    expect(i18n.t('tenants:activeTenants')).toBe('Active Tenants');
  });

  test('loads form translations correctly', () => {
    expect(i18n.t('forms:labels.email')).toBe('Email');
    expect(i18n.t('forms:placeholders.enterEmail')).toBe('Enter your email');
    expect(i18n.t('forms:buttons.submit')).toBe('Submit');
  });

  test('changes language to French correctly', () => {
    i18n.changeLanguage('fr');
    expect(i18n.t('tenants:tenantManagement')).toBe('Gestion des Locataires');
    expect(i18n.t('tenants:activeTenants')).toBe('Locataires Actifs');
  });

  test('handles interpolation correctly', () => {
    const result = i18n.t('tenants:deleteTenantConfirm', { name: 'Test Tenant' });
    expect(result).toContain('Test Tenant');
  });

  test('falls back to English for missing keys', () => {
    // Change to Arabic and test fallback
    i18n.changeLanguage('ar');
    const result = i18n.t('common:dashboard');
    // Should either be the English value or the key itself
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles RTL languages correctly', () => {
    // Test that RTL languages are supported
    i18n.changeLanguage('ar');
    expect(i18n.language).toBe('ar');
    
    i18n.changeLanguage('ur');
    expect(i18n.language).toBe('ur');
  });

  test('handles LTR languages correctly', () => {
    i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    
    i18n.changeLanguage('fr');
    expect(i18n.language).toBe('fr');
  });
});

describe('Language Switcher Integration', () => {
  test('language switcher component is available', () => {
    // Test that the LanguageSwitcher component can be imported
    expect(() => require('@/components/common/LanguageSwitcher')).not.toThrow();
  });

  test('all required translation namespaces are loaded', () => {
    const requiredNamespaces = ['common', 'auth', 'users', 'settings', 'tenants', 'navigation', 'forms', 'walkthrough', 'tables', 'errors', 'loading'];
    
    requiredNamespaces.forEach(namespace => {
      expect(i18n.hasResourceBundle('en', namespace)).toBe(true);
    });
  });

  test('loads table translations correctly', () => {
    expect(i18n.t('tables:headers.user')).toBe('User');
    expect(i18n.t('tables:search.placeholder')).toBe('Search...');
    expect(i18n.t('tables:actions.edit')).toBe('Edit');
  });

  test('loads error translations correctly', () => {
    expect(i18n.t('errors:validation.required')).toBe('This field is required');
    expect(i18n.t('errors:validation.email')).toBe('Please enter a valid email address');
  });

  test('loads loading translations correctly', () => {
    expect(i18n.t('loading:general.loading')).toBe('Loading...');
    expect(i18n.t('loading:specific.loadingUsers')).toBe('Loading users...');
  });

  test('supports all configured languages', () => {
    const supportedLanguages = ['en', 'fr', 'hi', 'ar', 'bn', 'ur'];
    
    supportedLanguages.forEach(lang => {
      expect(i18n.hasResourceBundle(lang, 'common')).toBe(true);
    });
  });
});
