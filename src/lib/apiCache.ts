import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of cached items

// Cache key generator
function generateCacheKey(path: string, params?: Record<string, any>): string {
  const sortedParams = params ? Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&') : '';
  return `${path}${sortedParams ? `?${sortedParams}` : ''}`;
}

// Cache middleware for API routes
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    ttl?: number;
    key?: string;
    invalidateOn?: string[];
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { ttl = DEFAULT_TTL, key, invalidateOn = [] } = options;
    
    // Check if this is a cache invalidation request
    if (invalidateOn.some(pattern => req.nextUrl.pathname.includes(pattern))) {
      clearCache();
      return handler(req);
    }

    // Generate cache key
    const cacheKey = key || generateCacheKey(
      req.nextUrl.pathname,
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    // Check cache
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      const response = NextResponse.json(cached.data);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Age', String(Math.floor((Date.now() - cached.timestamp) / 1000)));
      return response;
    }

    // Execute handler
    const response = await handler(req);
    
    // Cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        const data = await response.clone().json();
        setCache(cacheKey, data, ttl);
        response.headers.set('X-Cache', 'MISS');
      } catch (error) {
        // Skip caching if response is not JSON
        console.warn('Failed to cache non-JSON response:', error);
      }
    }

    return response;
  };
}

// Set cache item
function setCache(key: string, data: any, ttl: number): void {
  // Clean up old entries if cache is full
  if (apiCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = apiCache.keys().next().value;
    apiCache.delete(oldestKey);
  }

  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Get cache item
export function getCache(key: string): any | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  
  if (cached) {
    apiCache.delete(key); // Remove expired entry
  }
  
  return null;
}

// Clear specific cache entry
export function clearCacheEntry(key: string): void {
  apiCache.delete(key);
}

// Clear all cache
export function clearCache(): void {
  apiCache.clear();
}

// Get cache statistics
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  entries: Array<{ key: string; age: number; ttl: number }>;
} {
  const entries = Array.from(apiCache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    ttl: value.ttl,
  }));

  return {
    size: apiCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: 0, // Would need to track hits/misses to calculate
    entries,
  };
}

// Cache-aware fetch wrapper
export async function cachedFetch(
  url: string,
  options: RequestInit = {},
  ttl: number = DEFAULT_TTL
): Promise<Response> {
  const cacheKey = generateCacheKey(url);
  const cached = getCache(cacheKey);
  
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const response = await fetch(url, options);
  
  if (response.ok) {
    try {
      const data = await response.clone().json();
      setCache(cacheKey, data, ttl);
    } catch (error) {
      console.warn('Failed to cache fetch response:', error);
    }
  }

  return response;
}

// Cache invalidation utilities
export const cacheInvalidators = {
  // Invalidate all tenant-related cache
  invalidateTenantCache: (tenantId?: string) => {
    const keysToDelete = Array.from(apiCache.keys()).filter(key => 
      key.includes('/tenants') || 
      key.includes('/users') || 
      (tenantId && key.includes(tenantId))
    );
    keysToDelete.forEach(key => apiCache.delete(key));
  },

  // Invalidate all user-related cache
  invalidateUserCache: (userId?: string) => {
    const keysToDelete = Array.from(apiCache.keys()).filter(key => 
      key.includes('/users') || 
      (userId && key.includes(userId))
    );
    keysToDelete.forEach(key => apiCache.delete(key));
  },

  // Invalidate dashboard cache
  invalidateDashboardCache: () => {
    const keysToDelete = Array.from(apiCache.keys()).filter(key => 
      key.includes('/dashboard') || 
      key.includes('/stats') || 
      key.includes('/metrics')
    );
    keysToDelete.forEach(key => apiCache.delete(key));
  },
};

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      apiCache.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute 