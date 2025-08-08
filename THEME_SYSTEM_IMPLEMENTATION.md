# Dark/Light Theme System Implementation

A comprehensive dark/light theme system has been implemented for the multi-tenant Next.js project with full persistence, SSR compatibility, and multi-tenant considerations.

## 🎯 Features Implemented

### ✅ Core Theme System
- **React Context API** - Global theme state management
- **localStorage Persistence** - Theme preference survives browser sessions
- **SSR-Safe Loading** - No hydration mismatches with Next.js
- **System Theme Detection** - Automatically follows user's OS preference
- **Smooth Transitions** - 200ms CSS transitions for all theme changes

### ✅ User Experience
- **Multiple Toggle Variants** - Icon, switch, and dropdown options
- **Accessible Components** - Full ARIA support and keyboard navigation
- **Visual Feedback** - Clear indication of current theme state
- **Instant Updates** - Real-time theme switching across all components

### ✅ Multi-Tenant Support
- **Tenant-Specific Themes** - Custom color schemes per tenant
- **Dynamic CSS Variables** - Runtime theme customization
- **Logo Management** - Automatic light/dark logo switching
- **Brand Consistency** - Tenant branding preserved across themes

### ✅ Server Integration
- **User Preferences API** - Store theme preference on server
- **Cross-Device Sync** - Theme syncs across user's devices
- **Tenant Theme API** - Admin can configure tenant themes
- **Graceful Fallbacks** - Works offline with cached preferences

### ✅ Developer Experience
- **TypeScript Support** - Full type safety for theme components
- **Tailwind Integration** - Native dark mode classes throughout
- **Component Library** - Reusable theme-aware components
- **Easy Configuration** - Simple theme customization options

## 📁 File Structure

```
src/
├── context/
│   └── ThemeContext.tsx          # Main theme context and provider
├── components/
│   └── common/
│       ├── ThemeToggle.tsx       # Reusable theme toggle component
│       └── ThemeToggleButton.tsx # Header theme toggle button
├── hooks/
│   └── useThemeSync.ts          # Server synchronization hook
├── lib/
│   ├── localStorage.ts          # Enhanced localStorage utilities
│   └── tenantTheme.ts          # Multi-tenant theme management
├── app/
│   ├── api/user/preferences/    # User preference API endpoints
│   ├── layout.tsx              # Root layout with ThemeProvider
│   └── superadmin/theme-demo/  # Theme showcase page
└── globals.css                 # Theme CSS variables and utilities
```

## 🔧 Implementation Details

### 1. Theme Context & Provider

**File:** `src/context/ThemeContext.tsx`

```typescript
// Enhanced context with server sync and system detection
const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isInitialized: boolean;
  syncWithUserPreferences: (userTheme?: Theme) => void;
}>();
```

**Features:**
- System preference detection with `window.matchMedia`
- SSR-safe initialization with `useEffect`
- Automatic localStorage persistence
- Server-side preference synchronization
- DOM class and CSS variable management

### 2. Theme Toggle Components

**File:** `src/components/common/ThemeToggle.tsx`

```typescript
// Multiple toggle variants
<ThemeToggle variant="icon" size="lg" />           // Icon button
<ThemeToggle variant="switch" showLabel />         // Toggle switch
<ThemeToggle variant="dropdown" />                 // Select dropdown
```

**Features:**
- Three distinct UI variants
- Customizable sizing (sm, md, lg)
- Accessible ARIA attributes
- Lucide React icons integration
- Full TypeScript prop validation

### 3. Multi-Tenant Theme System

**File:** `src/lib/tenantTheme.ts`

```typescript
// Tenant-specific theme configuration
interface TenantThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkPrimaryColor?: string;
  darkSecondaryColor?: string;
  darkAccentColor?: string;
  logo?: { light: string; dark: string };
  favicon?: string;
  customCSS?: string;
}
```

**Features:**
- Pre-configured tenant theme templates
- Dynamic CSS variable injection
- Logo and favicon management
- Custom CSS support per tenant
- Caching for performance optimization

### 4. User Preferences API

**File:** `src/app/api/user/preferences/route.ts`

```typescript
// RESTful API endpoints
GET    /api/user/preferences      // Fetch user preferences
PATCH  /api/user/preferences      // Update specific preferences
PUT    /api/user/preferences      // Replace all preferences
```

**Features:**
- JWT authentication required
- JSON preference storage in database
- Merge vs replace operations
- Error handling and validation
- Support for theme and other preferences

### 5. Enhanced localStorage Utilities

**File:** `src/lib/localStorage.ts`

```typescript
// Theme-specific utilities
storage.getTheme()                // Get saved theme
storage.setTheme(theme)           // Save theme preference
storage.clearExpired()            // Clean up expired cache
```

**Features:**
- Expiration support for cached data
- Error handling for storage quota
- Development logging
- TypeScript type safety
- Browser compatibility checks

## 🎨 Tailwind CSS Integration

### Dark Mode Configuration

**File:** `src/app/globals.css`

```css
@custom-variant dark (&:is(.dark *));

/* Multi-tenant theme variables */
:root {
  --tenant-primary: #465fff;
  --tenant-secondary: #667085;
  --tenant-accent: #12b76a;
}
```

### Component Styling Examples

```tsx
// Button with dark mode support
<button className="
  bg-white dark:bg-gray-800 
  text-gray-900 dark:text-gray-100
  border-gray-300 dark:border-gray-600
  hover:bg-gray-50 dark:hover:bg-gray-700
  transition-colors duration-200
">

// Input with theme states
<input className="
  bg-transparent dark:bg-gray-900
  text-gray-800 dark:text-white/90
  border-gray-300 dark:border-gray-700
  focus:border-brand-300 dark:focus:border-brand-800
  placeholder:text-gray-400 dark:placeholder:text-white/30
">
```

## 🚀 Usage Examples

### Basic Theme Toggle

```tsx
import ThemeToggle from '@/components/common/ThemeToggle';

export default function Header() {
  return (
    <header>
      <ThemeToggle variant="switch" showLabel />
    </header>
  );
}
```

### Theme-Aware Component

```tsx
import { useTheme } from '@/context/ThemeContext';

export default function MyComponent() {
  const { theme, isInitialized } = useTheme();
  
  if (!isInitialized) {
    return <div>Loading...</div>; // Prevent flash
  }
  
  return (
    <div className={`
      transition-colors duration-200
      ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}
    `}>
      Current theme: {theme}
    </div>
  );
}
```

### Tenant Theme Management

```tsx
import { useTenantTheme } from '@/lib/tenantTheme';

export default function TenantSettings() {
  const { setTenantTheme, getCurrentConfig } = useTenantTheme();
  
  const switchToHealthcareTheme = () => {
    setTenantTheme('healthcare');
  };
  
  return (
    <button onClick={switchToHealthcareTheme}>
      Switch to Healthcare Theme
    </button>
  );
}
```

### Server Preference Sync

```tsx
import { useThemeSync } from '@/hooks/useThemeSync';

export default function UserProfile() {
  const { loadUserPreferences } = useThemeSync();
  
  useEffect(() => {
    // Load user's saved theme on login
    loadUserPreferences();
  }, []);
  
  return <div>Profile content...</div>;
}
```

## 🔧 Configuration Options

### Theme Provider Setup

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Custom Tenant Theme

```tsx
const customTheme: TenantThemeConfig = {
  id: 'custom',
  name: 'Custom Theme',
  primaryColor: '#ff6b6b',
  secondaryColor: '#4ecdc4',
  accentColor: '#45b7d1',
  darkPrimaryColor: '#ff8e8e',
  darkSecondaryColor: '#6fd4cd',
  darkAccentColor: '#67c5da',
  logo: {
    light: '/logos/custom-light.svg',
    dark: '/logos/custom-dark.svg'
  },
  customCSS: `
    .custom-component {
      background: var(--tenant-primary);
    }
  `
};

tenantThemeManager.setTenantTheme('custom', customTheme);
```

## 📱 Browser Support

### Supported Features
- ✅ **Chrome/Edge 80+** - Full support including CSS custom properties
- ✅ **Firefox 75+** - Complete feature support
- ✅ **Safari 13+** - Native dark mode detection
- ✅ **Mobile Browsers** - Touch-friendly toggle components
- ✅ **All Modern Browsers** - Progressive enhancement

### Fallbacks
- **No JavaScript** - Defaults to light theme with CSS-only styles
- **No localStorage** - Theme persists only for session
- **Legacy Browsers** - Graceful degradation to basic styling
- **Slow Networks** - Cached preferences prevent layout shift

## 🔍 Testing

### Manual Testing Checklist
- [ ] Theme toggle works in all variants (icon, switch, dropdown)
- [ ] Theme persists after browser refresh
- [ ] System theme detection works correctly
- [ ] All components render properly in both themes
- [ ] No flash of incorrect theme on page load
- [ ] Multi-tenant themes apply correctly
- [ ] User preferences sync with server
- [ ] Graceful degradation without JavaScript

### Automated Testing
```bash
# Run theme-specific tests
npm run test -- --grep "theme"

# Visual regression testing
npm run test:visual

# Accessibility testing
npm run test:a11y
```

## 🚀 Deployment Considerations

### Environment Variables
```env
# Optional: Default theme for new users
NEXT_PUBLIC_DEFAULT_THEME=light

# API endpoints
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

### Performance Optimizations
- **CSS Variables** - Runtime theme switching without re-renders
- **localStorage Caching** - Prevents unnecessary API calls
- **Component Memoization** - Reduces re-renders on theme change
- **Lazy Loading** - Theme components load only when needed

### SEO Considerations
- **Meta Tags** - Theme-aware color scheme meta tags
- **Structured Data** - Consistent branding in search results
- **Social Sharing** - Correct logo selection for dark/light previews

## 🐛 Troubleshooting

### Common Issues

**1. Flash of Incorrect Theme**
```tsx
// Solution: Use isInitialized flag
const { theme, isInitialized } = useTheme();
if (!isInitialized) return <LoadingSkeleton />;
```

**2. Theme Not Persisting**
```javascript
// Check localStorage availability
if (storage.isAvailable()) {
  // localStorage is working
} else {
  // Use session storage or cookies
}
```

**3. Server Sync Failing**
```tsx
// Add error handling
try {
  await syncThemeWithServer(theme);
} catch (error) {
  console.warn('Theme sync failed, using local preference');
}
```

**4. Tenant Theme Not Applying**
```javascript
// Verify tenant slug extraction
const tenantSlug = window.location.pathname.split('/')[1];
tenantThemeManager.setTenantTheme(tenantSlug);
```

## 📈 Future Enhancements

### Potential Improvements
- [ ] **Auto Theme Scheduling** - Switch themes based on time of day
- [ ] **Theme Animations** - Smooth transitions between theme changes
- [ ] **Color Blind Support** - High contrast and accessible color modes
- [ ] **Theme Marketplace** - User-created theme sharing
- [ ] **Advanced Customization** - Per-component theme overrides
- [ ] **Analytics Integration** - Track theme usage patterns
- [ ] **Theme Templates** - Industry-specific theme presets

### Technical Debt
- [ ] **Performance Monitoring** - Track theme switch performance
- [ ] **Bundle Size Optimization** - Tree-shake unused theme variants
- [ ] **Test Coverage** - Increase automated test coverage
- [ ] **Documentation** - Component Storybook integration

## 📞 Support

For technical support or questions about the theme system:

1. **Check the demo page** - `/superadmin/theme-demo`
2. **Review component documentation** - Inline TypeScript types
3. **Check browser console** - Development mode logging
4. **Test in isolation** - Use individual theme components

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Compatible With:** Next.js 14+, Tailwind CSS 4+, React 18+