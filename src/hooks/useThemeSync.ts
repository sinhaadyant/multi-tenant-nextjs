"use client";

import { useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { storage } from '@/lib/localStorage';

/**
 * Hook to sync theme preferences with server-side user preferences
 */
export const useThemeSync = () => {
  const { theme, setTheme, isInitialized, syncWithUserPreferences } = useTheme();

  // Load user preferences from server on login
  const loadUserPreferences = useCallback(async () => {
    try {
      const authToken = storage.getAuthToken();
      const authUser = storage.getAuthUser();
      
      if (!authToken || !authUser?.id) {
        return;
      }

      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userTheme = data.data?.preferences?.theme;
        
        if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
          // Only sync if the server theme is different from local theme
          const localTheme = storage.getTheme();
          if (localTheme !== userTheme) {
            syncWithUserPreferences(userTheme);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load user theme preferences:', error);
    }
  }, [syncWithUserPreferences]);

  // Save theme to server
  const saveThemeToServer = useCallback(async (themeToSave: string) => {
    try {
      const authToken = storage.getAuthToken();
      const authUser = storage.getAuthUser();
      
      if (!authToken || !authUser?.id) {
        return;
      }

      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: themeToSave }),
      });
    } catch (error) {
      console.warn('Failed to save theme to server:', error);
    }
  }, []);

  // Load preferences when component mounts and user is authenticated
  useEffect(() => {
    if (isInitialized) {
      const authUser = storage.getAuthUser();
      if (authUser?.id) {
        loadUserPreferences();
      }
    }
  }, [isInitialized, loadUserPreferences]);

  // Save theme to server when it changes (with debouncing)
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveThemeToServer(theme);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [theme, isInitialized, saveThemeToServer]);

  return {
    theme,
    setTheme,
    isInitialized,
    loadUserPreferences,
    saveThemeToServer,
  };
};

export default useThemeSync;