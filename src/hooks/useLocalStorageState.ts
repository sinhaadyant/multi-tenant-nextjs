import { useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/localStorage';

/**
 * Hook for managing state with localStorage persistence
 * @param key - localStorage key
 * @param defaultValue - default value if no data exists
 * @param expiresIn - expiration time in milliseconds (optional)
 * @returns [value, setValue, removeValue, hasValue]
 */
export function useLocalStorageState<T = any>(
  key: string,
  defaultValue?: T,
  expiresIn?: number
): [T | null, (value: T) => boolean, () => boolean, () => boolean] {
  // Initialize state from localStorage
  const [value, setValueState] = useState<T | null>(() => {
    return storage.get<T>(key, defaultValue);
  });

  // Update localStorage when state changes
  const setValue = useCallback((newValue: T): boolean => {
    const success = storage.set(key, newValue, expiresIn);
    if (success) {
      setValueState(newValue);
    }
    return success;
  }, [key, expiresIn]);

  // Remove value from localStorage
  const removeValue = useCallback((): boolean => {
    const success = storage.remove(key);
    if (success) {
      setValueState(null);
    }
    return success;
  }, [key]);

  // Check if value exists
  const hasValue = useCallback((): boolean => {
    return storage.has(key);
  }, [key]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setValueState(newValue);
        } catch (error) {
          console.error('Error parsing localStorage value:', error);
        }
      } else if (e.key === key && e.newValue === null) {
        setValueState(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, setValue, removeValue, hasValue];
}

/**
 * Hook for managing cached state with automatic expiration
 * @param key - localStorage key
 * @param defaultValue - default value if no data exists
 * @param expiresIn - expiration time in milliseconds
 * @returns [value, setValue, removeValue, isExpired]
 */
export function useCachedState<T = any>(
  key: string,
  defaultValue?: T,
  expiresIn: number = 5 * 60 * 1000 // 5 minutes default
): [T | null, (value: T) => boolean, () => boolean, boolean] {
  const [value, setValueState] = useState<T | null>(() => {
    return storage.getCached<T>(key, defaultValue);
  });

  const [isExpired, setIsExpired] = useState(false);

  const setValue = useCallback((newValue: T): boolean => {
    const success = storage.cache(key, newValue, expiresIn);
    if (success) {
      setValueState(newValue);
      setIsExpired(false);
    }
    return success;
  }, [key, expiresIn]);

  const removeValue = useCallback((): boolean => {
    const success = storage.remove(key);
    if (success) {
      setValueState(null);
      setIsExpired(false);
    }
    return success;
  }, [key]);

  // Check expiration on mount and periodically
  useEffect(() => {
    const checkExpiration = () => {
      const cachedValue = storage.getCached<T>(key);
      if (cachedValue === null && value !== null) {
        setIsExpired(true);
        setValueState(null);
      } else {
        setIsExpired(false);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [key, value]);

  return [value, setValue, removeValue, isExpired];
}

/**
 * Hook for managing form state with localStorage persistence
 * @param key - localStorage key
 * @param initialValues - initial form values
 * @param expiresIn - expiration time in milliseconds (optional)
 * @returns [values, setValues, updateValue, resetValues, clearValues]
 */
export function useFormState<T extends Record<string, any>>(
  key: string,
  initialValues: T,
  expiresIn?: number
) {
  const [values, setValuesState] = useState<T>(() => {
    const saved = storage.get<T>(key);
    return saved || initialValues;
  });

  const setValues = useCallback((newValues: T): boolean => {
    const success = storage.set(key, newValues, expiresIn);
    if (success) {
      setValuesState(newValues);
    }
    return success;
  }, [key, expiresIn]);

  const updateValue = useCallback((field: keyof T, value: any): boolean => {
    const newValues = { ...values, [field]: value };
    return setValues(newValues);
  }, [values, setValues]);

  const resetValues = useCallback((): boolean => {
    return setValues(initialValues);
  }, [setValues, initialValues]);

  const clearValues = useCallback((): boolean => {
    const success = storage.remove(key);
    if (success) {
      setValuesState(initialValues);
    }
    return success;
  }, [key, initialValues]);

  return [values, setValues, updateValue, resetValues, clearValues];
}

/**
 * Hook for managing pagination state with localStorage persistence
 * @param key - localStorage key
 * @param initialPage - initial page number
 * @param initialPageSize - initial page size
 * @returns [pagination, setPage, setPageSize, resetPagination]
 */
export function usePaginationState(
  key: string,
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [pagination, setPaginationState] = useState(() => {
    const saved = storage.getTablePreferences(key);
    return saved || {
      currentPage: initialPage,
      pageSize: initialPageSize,
      totalItems: 0
    };
  });

  const setPage = useCallback((page: number): boolean => {
    const newPagination = { ...pagination, currentPage: page };
    const success = storage.setTablePreferences(key, newPagination);
    if (success) {
      setPaginationState(newPagination);
    }
    return success;
  }, [key, pagination]);

  const setPageSize = useCallback((pageSize: number): boolean => {
    const newPagination = { 
      ...pagination, 
      pageSize, 
      currentPage: 1 // Reset to first page when changing page size
    };
    const success = storage.setTablePreferences(key, newPagination);
    if (success) {
      setPaginationState(newPagination);
    }
    return success;
  }, [key, pagination]);

  const resetPagination = useCallback((): boolean => {
    const newPagination = {
      currentPage: initialPage,
      pageSize: initialPageSize,
      totalItems: 0
    };
    const success = storage.setTablePreferences(key, newPagination);
    if (success) {
      setPaginationState(newPagination);
    }
    return success;
  }, [key, initialPage, initialPageSize]);

  return [pagination, setPage, setPageSize, resetPagination];
}

/**
 * Hook for managing filter state with localStorage persistence
 * @param key - localStorage key
 * @param initialFilters - initial filter values
 * @returns [filters, setFilters, updateFilter, clearFilters, resetFilters]
 */
export function useFilterState<T extends Record<string, any>>(
  key: string,
  initialFilters: T
) {
  const [filters, setFiltersState] = useState<T>(() => {
    const saved = storage.getFilterState(key);
    return saved || initialFilters;
  });

  const setFilters = useCallback((newFilters: T): boolean => {
    const success = storage.setFilterState(key, newFilters);
    if (success) {
      setFiltersState(newFilters);
    }
    return success;
  }, [key]);

  const updateFilter = useCallback((field: keyof T, value: any): boolean => {
    const newFilters = { ...filters, [field]: value };
    return setFilters(newFilters);
  }, [filters, setFilters]);

  const clearFilters = useCallback((): boolean => {
    const success = storage.remove(`${STORAGE_KEYS.FILTER_STATE}_${key}`);
    if (success) {
      setFiltersState(initialFilters);
    }
    return success;
  }, [key, initialFilters]);

  const resetFilters = useCallback((): boolean => {
    return setFilters(initialFilters);
  }, [setFilters, initialFilters]);

  return [filters, setFilters, updateFilter, clearFilters, resetFilters];
}

/**
 * Hook for managing search history
 * @param key - localStorage key
 * @param maxHistory - maximum number of search terms to keep
 * @returns [history, addSearch, clearHistory, removeSearch]
 */
export function useSearchHistory(
  key: string = 'search-history',
  maxHistory: number = 10
) {
  const [history, setHistoryState] = useState<string[]>(() => {
    return storage.getSearchHistory() || [];
  });

  const addSearch = useCallback((term: string): boolean => {
    const success = storage.addSearchHistory(term);
    if (success) {
      const newHistory = [term, ...history.filter(item => item !== term)].slice(0, maxHistory);
      setHistoryState(newHistory);
    }
    return success;
  }, [history, maxHistory]);

  const clearHistory = useCallback((): boolean => {
    const success = storage.set(STORAGE_KEYS.SEARCH_HISTORY, []);
    if (success) {
      setHistoryState([]);
    }
    return success;
  }, []);

  const removeSearch = useCallback((term: string): boolean => {
    const newHistory = history.filter(item => item !== term);
    const success = storage.set(STORAGE_KEYS.SEARCH_HISTORY, newHistory);
    if (success) {
      setHistoryState(newHistory);
    }
    return success;
  }, [history]);

  return [history, addSearch, clearHistory, removeSearch];
} 