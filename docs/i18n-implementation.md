# Multi-Language Support (i18n) Implementation

This document outlines the internationalization (i18n) implementation for the Next.js multi-tenant project.

## Overview

The project now supports full internationalization with the following features:
- Dynamic language switching
- Persistent language preferences
- RTL (Right-to-Left) support for Arabic and Urdu
- Comprehensive translation coverage
- Fallback to English for missing translations

## Supported Languages

1. **English (en)** - Default language
2. **French (fr)** - Français
3. **Hindi (hi)** - हिंदी
4. **Arabic (ar)** - العربية (RTL)
5. **Bengali (bn)** - বাংলা
6. **Urdu (ur)** - اُردُو (RTL)

## Technical Implementation

### Core Setup

The project uses `react-i18next` for internationalization:

```typescript
// src/app/i18n-provider.tsx
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
```

### Translation Structure

Translation files are organized by namespace:

```
public/locales/
  ├── en/
  │   ├── common.json      # Common UI elements
  │   ├── auth.json        # Authentication
  │   ├── users.json       # User management
  │   ├── settings.json    # Settings
  │   ├── tenants.json     # Tenant management
  │   ├── navigation.json  # Navigation menus
  │   ├── forms.json       # Form elements
  │   └── walkthrough.json # Onboarding
  ├── fr/ (same structure)
  ├── hi/ (same structure)
  ├── ar/ (same structure)
  ├── bn/ (same structure)
  └── ur/ (same structure)
```

### Language Persistence

Languages are stored in localStorage and automatically applied:

```typescript
// Get language from localStorage or default to 'en'
const storedLanguage = localStorage.getItem('language') || 'en';
i18n.changeLanguage(storedLanguage);
```

### RTL Support

Arabic and Urdu automatically set document direction:

```typescript
if (storedLanguage === 'ar' || storedLanguage === 'ur') {
  document.documentElement.dir = 'rtl';
} else {
  document.documentElement.dir = 'ltr';
}
```

## Usage Examples

### Basic Translation

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <button>{t('save')}</button>
    </div>
  );
};
```

### Multiple Namespaces

```typescript
const { t } = useTranslation(['tenants', 'common', 'forms']);

return (
  <div>
    <h1>{t('tenants:tenantManagement')}</h1>
    <button>{t('common:save')}</button>
  </div>
);
```

### Interpolation

```typescript
const { t } = useTranslation('tenants');

return (
  <p>{t('deleteTenantConfirm', { name: tenant.name })}</p>
);
```

### Language Switching

```typescript
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

// Dropdown variant
<LanguageSwitcher variant="dropdown" showFlags={true} />

// List variant for settings
<LanguageSwitcher 
  variant="list" 
  showFlags={true} 
  showNativeNames={true} 
/>
```

## Translation Keys Organization

### Common Keys (common.json)
- Basic UI elements: save, cancel, delete, edit, etc.
- Navigation: dashboard, users, settings, etc.
- States: loading, error, success, etc.

### Forms Keys (forms.json)
- Labels: firstName, lastName, email, etc.
- Placeholders: enterEmail, enterPassword, etc.
- Validation: required, email, password, etc.
- Buttons: submit, reset, clear, etc.

### Tenants Keys (tenants.json)
- Management: tenantManagement, createTenant, etc.
- Actions: deleteTenant, suspendTenant, etc.
- Confirmation messages with interpolation

### Navigation Keys (navigation.json)
- Superadmin menu items
- Tenant menu items
- Organized by user type

## Component Updates

### Forms
All form components now use translation keys:
- Input labels and placeholders
- Validation messages
- Button text
- Error states

### Navigation
- Dynamic menu generation based on translations
- Supports both superadmin and tenant contexts

### Modals and Dialogs
- Confirmation messages
- Error dialogs
- Success notifications

### Data Tables
- Column headers
- Action buttons
- Status indicators

## Testing

Comprehensive test suite includes:
- Translation loading verification
- Language switching functionality
- RTL/LTR direction changes
- Interpolation support
- Fallback behavior
- localStorage persistence

Run tests:
```bash
npm test i18n.test.tsx
```

## Best Practices

### For Developers

1. **Always use translation keys** - Never hardcode UI text
2. **Use descriptive keys** - `forms.labels.email` not `email`
3. **Group related keys** - Organize by feature/component
4. **Test all languages** - Verify layout with longer translations
5. **Handle interpolation** - Use variables for dynamic content

### For Translators

1. **Maintain context** - Keep related translations together
2. **Consider length** - Some languages require more space
3. **Preserve placeholders** - Don't translate `{{variable}}` parts
4. **Test UI layout** - Verify translations fit in design

### Key Naming Convention

```
namespace.section.element
```

Examples:
- `forms.labels.email`
- `tenants.actions.delete`
- `common.buttons.save`
- `navigation.superadmin.dashboard`

## File Structure

```
src/
├── app/
│   └── i18n-provider.tsx        # Main i18n setup
├── components/
│   └── common/
│       └── LanguageSwitcher.tsx # Language dropdown
├── hooks/
│   ├── useTenantLanguage.ts     # Tenant language hook
│   └── useUserLanguage.ts       # User language hook
└── __tests__/
    └── i18n.test.tsx            # i18n tests

public/
└── locales/                     # Translation files
    ├── en/
    ├── fr/
    ├── hi/
    ├── ar/
    ├── bn/
    └── ur/
```

## Deployment Considerations

1. **Build optimization** - All translations are bundled
2. **CDN considerations** - Translation files are static assets
3. **SEO support** - Consider implementing next-i18next for SSR
4. **Performance** - Translations are loaded on demand by namespace

## Future Enhancements

1. **Server-side rendering** - Implement next-i18next for SSR
2. **Dynamic imports** - Load translations on demand
3. **Translation management** - Integrate with translation services
4. **User preferences** - Store language per user in database
5. **Region-specific variants** - Support en-US, en-GB, etc.

## Troubleshooting

### Common Issues

1. **Missing translations** - Check console for missing key warnings
2. **Layout breaking** - Test with longer translations (German, French)
3. **RTL issues** - Verify Arabic/Urdu display correctly
4. **Persistence not working** - Check localStorage permissions

### Debug Mode

Enable i18n debugging:
```typescript
i18n.init({
  debug: process.env.NODE_ENV === 'development',
  // ... other config
});
```

## Maintenance

### Adding New Languages

1. Create new directory in `public/locales/`
2. Copy English files as templates
3. Translate all keys
4. Add language to `LanguageSwitcher` options
5. Add language imports to `i18n-provider.tsx`
6. Test RTL if applicable

### Adding New Keys

1. Add key to English files first
2. Use in components
3. Add to other language files
4. Test across all languages
5. Update documentation if needed

This implementation provides a robust, scalable internationalization system that supports the multi-tenant architecture while maintaining excellent user experience across all supported languages.
