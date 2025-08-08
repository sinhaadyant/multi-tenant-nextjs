import { storage } from './localStorage';

// Tenant-specific theme configuration
export interface TenantThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkPrimaryColor?: string;
  darkSecondaryColor?: string;
  darkAccentColor?: string;
  logo?: {
    light: string;
    dark: string;
  };
  favicon?: string;
  customCSS?: string;
}

// Default theme configurations for different tenant types
export const defaultTenantThemes: Record<string, TenantThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default Theme',
    primaryColor: '#465fff',
    secondaryColor: '#667085',
    accentColor: '#12b76a',
    darkPrimaryColor: '#3641f5',
    darkSecondaryColor: '#98a2b3',
    darkAccentColor: '#32d583',
    logo: {
      light: '/images/logo/logo.svg',
      dark: '/images/logo/logo-dark.svg'
    }
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Theme',
    primaryColor: '#1d4ed8',
    secondaryColor: '#6b7280',
    accentColor: '#059669',
    darkPrimaryColor: '#2563eb',
    darkSecondaryColor: '#9ca3af',
    darkAccentColor: '#10b981',
  },
  creative: {
    id: 'creative',
    name: 'Creative Theme',
    primaryColor: '#7c3aed',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    darkPrimaryColor: '#8b5cf6',
    darkSecondaryColor: '#94a3b8',
    darkAccentColor: '#fbbf24',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare Theme',
    primaryColor: '#0d9488',
    secondaryColor: '#64748b',
    accentColor: '#dc2626',
    darkPrimaryColor: '#14b8a6',
    darkSecondaryColor: '#94a3b8',
    darkAccentColor: '#ef4444',
  }
};

export class TenantThemeManager {
  private currentTenant: string | null = null;
  private currentThemeConfig: TenantThemeConfig | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTenantTheme();
    }
  }

  /**
   * Initialize theme based on current tenant
   */
  private initializeTenantTheme() {
    // Get tenant from URL or storage
    const tenantSlug = this.getTenantFromURL();
    if (tenantSlug) {
      this.setTenantTheme(tenantSlug);
    }
  }

  /**
   * Extract tenant slug from URL
   */
  private getTenantFromURL(): string | null {
    if (typeof window === 'undefined') return null;
    
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    // Assuming tenant slug is the first segment: /[tenantSlug]/...
    return pathSegments[0] || null;
  }

  /**
   * Set theme configuration for a specific tenant
   */
  setTenantTheme(tenantSlug: string, customConfig?: Partial<TenantThemeConfig>) {
    this.currentTenant = tenantSlug;
    
    // Get cached tenant theme or use default
    const cachedTheme = this.getCachedTenantTheme(tenantSlug);
    const baseTheme = cachedTheme || defaultTenantThemes.default;
    
    // Merge with custom configuration if provided
    this.currentThemeConfig = customConfig 
      ? { ...baseTheme, ...customConfig }
      : baseTheme;

    this.applyTenantTheme();
    this.cacheTenantTheme(tenantSlug, this.currentThemeConfig);
  }

  /**
   * Apply the current tenant theme to the DOM
   */
  private applyTenantTheme() {
    if (!this.currentThemeConfig || typeof window === 'undefined') return;

    const root = document.documentElement;
    const { 
      primaryColor, 
      secondaryColor, 
      accentColor,
      darkPrimaryColor,
      darkSecondaryColor,
      darkAccentColor 
    } = this.currentThemeConfig;

    // Apply CSS custom properties for light mode
    root.style.setProperty('--tenant-primary', primaryColor);
    root.style.setProperty('--tenant-secondary', secondaryColor);
    root.style.setProperty('--tenant-accent', accentColor);

    // Apply CSS custom properties for dark mode
    root.style.setProperty('--tenant-primary-dark', darkPrimaryColor || primaryColor);
    root.style.setProperty('--tenant-secondary-dark', darkSecondaryColor || secondaryColor);
    root.style.setProperty('--tenant-accent-dark', darkAccentColor || accentColor);

    // Apply custom CSS if provided
    if (this.currentThemeConfig.customCSS) {
      this.injectCustomCSS(this.currentThemeConfig.customCSS);
    }

    // Update favicon if provided
    if (this.currentThemeConfig.favicon) {
      this.updateFavicon(this.currentThemeConfig.favicon);
    }
  }

  /**
   * Inject custom CSS for tenant
   */
  private injectCustomCSS(css: string) {
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'tenant-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Update favicon
   */
  private updateFavicon(faviconUrl: string) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || 
                 document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  /**
   * Get tenant theme from cache
   */
  private getCachedTenantTheme(tenantSlug: string): TenantThemeConfig | null {
    return storage.get(`tenant_theme_${tenantSlug}`);
  }

  /**
   * Cache tenant theme
   */
  private cacheTenantTheme(tenantSlug: string, config: TenantThemeConfig) {
    storage.set(`tenant_theme_${tenantSlug}`, config, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get current tenant theme configuration
   */
  getCurrentThemeConfig(): TenantThemeConfig | null {
    return this.currentThemeConfig;
  }

  /**
   * Get tenant-specific logo based on current theme (light/dark)
   */
  getTenantLogo(isDark: boolean = false): string {
    if (!this.currentThemeConfig?.logo) {
      return isDark ? '/images/logo/logo-dark.svg' : '/images/logo/logo.svg';
    }

    return isDark ? 
      (this.currentThemeConfig.logo.dark || this.currentThemeConfig.logo.light) :
      this.currentThemeConfig.logo.light;
  }

  /**
   * Reset to default theme
   */
  resetToDefaultTheme() {
    this.setTenantTheme('default');
  }

  /**
   * Load tenant theme from server API
   */
  async loadTenantThemeFromServer(tenantId: string): Promise<TenantThemeConfig | null> {
    try {
      const response = await fetch(`/api/tenant/${tenantId}/theme`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.theme || null;
      }
    } catch (error) {
      console.warn('Failed to load tenant theme from server:', error);
    }
    return null;
  }

  /**
   * Save tenant theme to server
   */
  async saveTenantThemeToServer(tenantId: string, themeConfig: TenantThemeConfig): Promise<boolean> {
    try {
      const authToken = storage.getAuthToken();
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ theme: themeConfig }),
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to save tenant theme to server:', error);
      return false;
    }
  }
}

// Create singleton instance
export const tenantThemeManager = new TenantThemeManager();

// React hook for tenant theme
export const useTenantTheme = () => {
  const getCurrentConfig = () => tenantThemeManager.getCurrentThemeConfig();
  const setTenantTheme = (slug: string, config?: Partial<TenantThemeConfig>) => 
    tenantThemeManager.setTenantTheme(slug, config);
  const getTenantLogo = (isDark?: boolean) => tenantThemeManager.getTenantLogo(isDark);
  
  return {
    getCurrentConfig,
    setTenantTheme,
    getTenantLogo,
    resetToDefault: () => tenantThemeManager.resetToDefaultTheme(),
    loadFromServer: (tenantId: string) => tenantThemeManager.loadTenantThemeFromServer(tenantId),
    saveToServer: (tenantId: string, config: TenantThemeConfig) => 
      tenantThemeManager.saveTenantThemeToServer(tenantId, config),
  };
};