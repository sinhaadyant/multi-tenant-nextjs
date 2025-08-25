import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import i18n, { i18nInitialized } from '@/lib/i18n';

interface TenantSettings {
  defaultLanguage: string;
  // Add other tenant settings as needed
}

export const useTenantLanguage = () => {
  const { i18n: i18nInstance } = useTranslation();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTenantLanguage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for i18n to be initialized
        if (!i18nInitialized) {
          // Wait for i18n to be ready
          await new Promise<void>((resolve) => {
            const checkInitialized = () => {
              if (i18nInitialized) {
                resolve();
              } else {
                setTimeout(checkInitialized, 100);
              }
            };
            checkInitialized();
          });
        }

        // Check if we're in a tenant context
        const tenantSlug = params.tenantSlug as string;
        if (!tenantSlug) {
          // Not in tenant context, use default language
          const savedLanguage = localStorage.getItem('language') || 'en';
          await i18n.changeLanguage(savedLanguage);
          setIsLoading(false);
          return;
        }

        // Fetch tenant settings
        const response = await fetch(`/api/tenant/settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tenant settings');
        }

        const settings: TenantSettings = await response.json();
        const tenantLanguage = settings.defaultLanguage || 'en';

        // Apply tenant language
        await i18n.changeLanguage(tenantLanguage);
        
        // Save to localStorage for persistence
        localStorage.setItem('language', tenantLanguage);

        // Set RTL for Arabic and Urdu
        if (tenantLanguage === 'ar' || tenantLanguage === 'ur') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading tenant language:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to saved language or default
        const savedLanguage = localStorage.getItem('language') || 'en';
        if (i18nInitialized) {
          await i18n.changeLanguage(savedLanguage);
        }
        setIsLoading(false);
      }
    };

    loadTenantLanguage();
  }, [i18nInstance, params.tenantSlug]);

  const changeLanguage = async (newLanguage: string) => {
    try {
      // Wait for i18n to be initialized
      if (!i18nInitialized) {
        await new Promise<void>((resolve) => {
          const checkInitialized = () => {
            if (i18nInitialized) {
              resolve();
            } else {
              setTimeout(checkInitialized, 100);
            }
          };
          checkInitialized();
        });
      }

      // Update i18next
      await i18n.changeLanguage(newLanguage);
      
      // Save to localStorage
      localStorage.setItem('language', newLanguage);

      // Set RTL for Arabic and Urdu
      if (newLanguage === 'ar' || newLanguage === 'ur') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }

      // Update tenant settings if in tenant context
      const tenantSlug = params.tenantSlug as string;
      if (tenantSlug) {
        await fetch(`/api/tenant/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            defaultLanguage: newLanguage,
          }),
        });
      }
    } catch (err) {
      console.error('Error changing language:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isLoading,
    error,
  };
};
