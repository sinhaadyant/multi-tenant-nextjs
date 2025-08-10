import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { simpleStorage } from '@/lib/simpleStorage';

export interface SearchResult {
  id: string;
  type: 'user' | 'tenant' | 'superadmin' | 'support_ticket' | 'audit_log';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

interface UseGlobalSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
}

export const useGlobalSearch = (
  query: string,
  options: UseGlobalSearchOptions = {}
) => {
  const {
    debounceMs = 250,
    minQueryLength = 2,
    limit = 10,
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Only search if query meets minimum length
  const shouldSearch = debouncedQuery.trim().length >= minQueryLength;

  const searchQuery = useQuery({
    queryKey: ['global-search', debouncedQuery, limit],
    queryFn: async (): Promise<SearchResponse> => {
      const token = simpleStorage.getAuthToken();
      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json();
    },
    enabled: shouldSearch,
  });

  return {
    results: searchQuery.data?.results || [],
    total: searchQuery.data?.total || 0,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    isSearching: shouldSearch && searchQuery.isLoading,
    hasResults: (searchQuery.data?.results || []).length > 0,
    query: debouncedQuery,
  };
};

// Hook for getting trending/popular results when no query is provided
export const useTrendingResults = (limit: number = 5) => {
  return useQuery({
    queryKey: ['trending-results', limit],
    queryFn: async (): Promise<SearchResult[]> => {
      const token = simpleStorage.getAuthToken();
      
      // Get recent support tickets
      const ticketsResponse = await fetch('/api/superadmin/support-tickets?limit=3&sortBy=createdAt&sortOrder=desc', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const ticketsData = await ticketsResponse.json();
      
      // Get recent users
        // Note: This would need to be updated to use tenant-specific search
  // For now, we'll keep the superadmin endpoint but this should be refactored
  const usersResponse = await fetch('/api/superadmin/users?limit=2&sortBy=createdAt&sortOrder=desc', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

      const usersData = await usersResponse.json();

      const trendingResults: SearchResult[] = [];

      // Add recent tickets
      ticketsData.tickets?.forEach((ticket: any) => {
        trendingResults.push({
          id: ticket.id,
          type: 'support_ticket',
          title: ticket.title,
          subtitle: `#${ticket.id.slice(-8)}`,
          description: `${ticket.status} • ${ticket.priority}`,
          url: `/superadmin/support/${ticket.id}`,
          icon: '🎫',
          metadata: {
            status: ticket.status,
            priority: ticket.priority,
          },
        });
      });

      // Add recent users
      usersData.users?.forEach((user: any) => {
        trendingResults.push({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: user.email,
          description: user.role?.name || 'No Role',
          url: `/superadmin/users/${user.id}`,
          icon: '🧑‍💼',
          metadata: {
            role: user.role?.name,
            isActive: user.isActive,
          },
        });
      });

      return trendingResults.slice(0, limit);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}; 