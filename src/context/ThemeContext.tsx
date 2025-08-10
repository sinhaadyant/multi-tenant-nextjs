"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { simpleStorage } from "@/lib/simpleStorage";


type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isInitialized: boolean;
  syncWithUserPreferences: (userTheme?: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to apply theme to DOM
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      // Also set a data attribute for CSS custom properties if needed
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Set CSS custom property for theme-aware components
      document.documentElement.style.setProperty('--theme', newTheme);
    }
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First check localStorage
        const savedTheme = localStorage.getItem('theme') as Theme || null;
        
        let initialTheme: Theme;
        
        if (savedTheme) {
          initialTheme = savedTheme;
        } else {
          // Fallback to system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          initialTheme = prefersDark ? "dark" : "light";
        }

        setThemeState(initialTheme);
        applyThemeToDOM(initialTheme);
      } catch (error) {
        console.warn('Error loading theme preference:', error);
        setThemeState("light");
        applyThemeToDOM("light");
      }
      setIsInitialized(true);
    }
  }, [applyThemeToDOM]);

  // Save theme to localStorage and apply to DOM when theme changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('theme', theme);
      applyThemeToDOM(theme);
      
      // Sync with user preferences API if authenticated
      syncThemeWithServer(theme);
    }
  }, [theme, isInitialized, applyThemeToDOM]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        // Only apply system theme if user hasn't explicitly set a preference
        const userHasPreference = localStorage.getItem('theme') || null;
        if (!userHasPreference) {
          const systemTheme: Theme = e.matches ? "dark" : "light";
          setThemeState(systemTheme);
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, []);

  // Function to sync theme with server-side user preferences
  const syncThemeWithServer = async (newTheme: Theme) => {
    try {
      const authUser = simpleStorage.getAuthUser();
      if (authUser?.id) {
        // Update user preferences on the server
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${simpleStorage.getAuthToken()}`,
          },
          body: JSON.stringify({ theme: newTheme }),
        });
      }
    } catch (error) {
      // Silently fail - theme still works locally
      console.warn('Failed to sync theme with server:', error);
    }
  };

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Function to sync with user preferences from server
  const syncWithUserPreferences = useCallback((userTheme?: Theme) => {
    if (userTheme && (userTheme === "light" || userTheme === "dark")) {
      setThemeState(userTheme);
      simpleStorage.setTheme(userTheme);
      applyThemeToDOM(userTheme);
    }
  }, [applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme, 
      isInitialized, 
      syncWithUserPreferences 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
