import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface UserLanguageData {
  userId: string;
  userLanguage: string | null;
  tenantLanguage: string | null;
  effectiveLanguage: string;
  userType: 'user' | 'superadmin';
}

interface UseUserLanguageReturn {
  currentLanguage: string;
  isLoading: boolean;
  error: string | null;
  changeLanguage: (language: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  userLanguageData: UserLanguageData | null;
}

export const useUserLanguage = (userId?: string, userType: 'user' | 'superadmin' = 'user'): UseUserLanguageReturn => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLanguageData, setUserLanguageData] = useState<UserLanguageData | null>(null);

  // Get user ID from various sources if not provided
  const getUserId = useCallback(() => {
    if (userId) return userId;
    
    // Try to get from localStorage or session
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (storedUserId) return storedUserId;
    }
    
    return null;
  }, [userId]);

  // Fetch user language settings
  const fetchUserLanguageSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentUserId = getUserId();
      if (!currentUserId) {
        // If no user ID, use default language from localStorage or fallback to 'en'
        const storedLanguage = localStorage.getItem('language') || 'en';
        setCurrentLanguage(storedLanguage);
        
        if (i18n.language !== storedLanguage) {
          await i18n.changeLanguage(storedLanguage);
        }
        
        // Set RTL for Arabic and Urdu
        if (storedLanguage === 'ar' || storedLanguage === 'ur') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
        
        return;
      }

      const response = await api.get(`/user/language?userId=${currentUserId}&userType=${userType}`);
      
      if (response.data.success) {
        const data: UserLanguageData = response.data.data;
        setUserLanguageData(data);
        
        const effectiveLanguage = data.effectiveLanguage;
        setCurrentLanguage(effectiveLanguage);
        
        // Apply language to i18next
        if (i18n.language !== effectiveLanguage) {
          await i18n.changeLanguage(effectiveLanguage);
        }
        
        // Set RTL for Arabic and Urdu
        if (effectiveLanguage === 'ar' || effectiveLanguage === 'ur') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
        
        // Save to localStorage
        localStorage.setItem('language', effectiveLanguage);
        localStorage.setItem('userId', currentUserId);
        localStorage.setItem('userType', userType);
      }
    } catch (err: any) {
      console.error('Error fetching user language settings:', err);
      setError(err.message || 'Failed to load language settings');
      
      // Fallback to stored language or default
      const storedLanguage = localStorage.getItem('language') || 'en';
      setCurrentLanguage(storedLanguage);
      
      if (i18n.language !== storedLanguage) {
        await i18n.changeLanguage(storedLanguage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [i18n, getUserId, userType]);

  // Change language function
  const changeLanguage = useCallback(async (language: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentUserId = getUserId();
      if (!currentUserId) {
        // If no user ID, just update locally
        setCurrentLanguage(language);
        await i18n.changeLanguage(language);
        
        // Set RTL for Arabic and Urdu
        if (language === 'ar' || language === 'ur') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
        
        localStorage.setItem('language', language);
        return;
      }

      // Update user language preference via API
      const response = await api.patch('/user/language', {
        userId: currentUserId,
        language: language,
        userType: userType
      });

      if (response.data.success) {
        const data: UserLanguageData = response.data.data;
        setUserLanguageData(data);
        setCurrentLanguage(language);
        
        // Apply language to i18next
        await i18n.changeLanguage(language);
        
        // Set RTL for Arabic and Urdu
        if (language === 'ar' || language === 'ur') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
        
        // Save to localStorage
        localStorage.setItem('language', language);
        
        // Refresh to ensure all components re-render under new lang
        router.refresh();
      } else {
        throw new Error(response.data.message || 'Failed to update language');
      }
    } catch (err: any) {
      console.error('Error changing language:', err);
      setError(err.message || 'Failed to change language');
    } finally {
      setIsLoading(false);
    }
  }, [i18n, router, getUserId, userType]);

  // Refresh settings function
  const refreshSettings = useCallback(async () => {
    await fetchUserLanguageSettings();
  }, [fetchUserLanguageSettings]);

  // Initialize on mount
  useEffect(() => {
    fetchUserLanguageSettings();
  }, [fetchUserLanguageSettings]);

  // Re-evaluate language when route changes (App Router)
  useEffect(() => {
    fetchUserLanguageSettings();
  }, [pathname, fetchUserLanguageSettings]);

  return {
    currentLanguage,
    isLoading,
    error,
    changeLanguage,
    refreshSettings,
    userLanguageData,
  };
};
