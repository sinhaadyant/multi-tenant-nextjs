import { useUserLanguage } from './useUserLanguage';

interface UseTenantLanguageReturn {
  currentLanguage: string;
  isLoading: boolean;
  error: string | null;
  changeLanguage: (language: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const useTenantLanguage = (): UseTenantLanguageReturn => {
  // Get user ID from localStorage or session (this should ideally come from auth context)
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || sessionStorage.getItem('userId');
    }
    return null;
  };

  const getUserType = () => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('userType') || 'user') as 'user' | 'superadmin';
    }
    return 'user' as const;
  };

  // Use the new user language hook with automatic user detection
  const {
    currentLanguage,
    isLoading,
    error,
    changeLanguage,
    refreshSettings
  } = useUserLanguage(getUserId() || undefined, getUserType());

  return {
    currentLanguage,
    isLoading,
    error,
    changeLanguage,
    refreshSettings,
  };
};