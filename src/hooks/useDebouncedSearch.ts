import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
  onSearch?: (term: string) => void;
  onClear?: () => void;
}

interface UseDebouncedSearchReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  isPending: boolean;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
}

/**
 * Optimized debounced search hook with React Fiber features
 * Provides smooth search experience with useTransition for non-blocking updates
 */
export const useDebouncedSearch = (options: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn => {
  const {
    delay = 300,
    minLength = 0,
    onSearch,
    onClear
  } = options;

  const [searchTerm, setSearchTermState] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  // Memoized search validation
  const isValidSearch = useMemo(() => {
    return debouncedSearchTerm.length >= minLength;
  }, [debouncedSearchTerm, minLength]);

  // Debounced search effect with transition
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchTerm(searchTerm);
        setIsSearching(true);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Effect to handle search callback
  useEffect(() => {
    if (isValidSearch && onSearch) {
      onSearch(debouncedSearchTerm);
    } else if (!isValidSearch && onClear) {
      onClear();
    }
    
    if (isValidSearch) {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isValidSearch, onSearch, onClear]);

  // Memoized setter with transition
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  // Memoized clear function
  const clearSearch = useCallback(() => {
    startTransition(() => {
      setSearchTermState('');
      setDebouncedSearchTerm('');
      setIsSearching(false);
      onClear?.();
    });
  }, [onClear]);

  return {
    searchTerm,
    debouncedSearchTerm,
    isPending,
    setSearchTerm,
    clearSearch,
    isSearching: isSearching || isPending
  };
};

/**
 * Advanced search hook with filters and sorting
 */
export const useAdvancedSearch = <T>(
  items: T[],
  searchFields: (keyof T)[],
  options: UseDebouncedSearchOptions & {
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  } = {}
) => {
  const {
    delay = 300,
    minLength = 0,
    sortBy,
    sortOrder = 'asc',
    filters = {}
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchTerm(searchTerm);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Memoized filtered and sorted results
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < minLength) {
      return items;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return items.filter(item => {
      // Search in specified fields
      const matchesSearch = searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      });

      // Apply additional filters
      const matchesFilters = Object.entries(filters).every(([key, filterValue]) => {
        const itemValue = item[key as keyof T];
        if (filterValue == null) return true;
        
        if (typeof filterValue === 'string') {
          return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
        }
        
        if (typeof filterValue === 'boolean') {
          return itemValue === filterValue;
        }
        
        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }
        
        return itemValue === filterValue;
      });

      return matchesSearch && matchesFilters;
    });
  }, [items, debouncedSearchTerm, minLength, searchFields, filters]);

  // Memoized sorted results
  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }, [filteredItems, sortBy, sortOrder]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredItems: sortedItems,
    isPending,
    isSearching: isPending || (debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < minLength)
  };
}; 