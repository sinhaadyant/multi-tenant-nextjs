import { useState, useEffect } from 'react';

/**
 * Hook to ensure code only runs on the client side
 * Useful for localStorage, window, document access
 */
export const useClientSide = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

/**
 * Hook to safely access localStorage
 * Returns null during SSR and the actual value on client
 */
export const useLocalStorageSafe = <T = any>(
  key: string,
  defaultValue?: T
) => {
  const [value, setValue] = useState<T | null>(defaultValue || null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored));
        } else if (defaultValue !== undefined) {
          setValue(defaultValue);
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        if (defaultValue !== undefined) {
          setValue(defaultValue);
        }
      }
    }
  }, [key, defaultValue]);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error writing localStorage key "${key}":`, error);
      }
    }
  };

  const removeStoredValue = () => {
    setValue(null);
    
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
      }
    }
  };

  return {
    value,
    setValue: setStoredValue,
    removeValue: removeStoredValue,
    isClient,
  };
};

/**
 * Hook to safely access window object
 */
export const useWindowSafe = () => {
  const [windowObj, setWindowObj] = useState<Window | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setWindowObj(window);
  }, []);

  return { window: windowObj, isClient };
};

/**
 * Hook to safely access document object
 */
export const useDocumentSafe = () => {
  const [documentObj, setDocumentObj] = useState<Document | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDocumentObj(document);
  }, []);

  return { document: documentObj, isClient };
}; 