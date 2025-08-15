import { redisClient } from '@/config/redis';
import { logger } from '@/config/logger';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
  maxSize?: number; // Maximum number of items
}

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage: number;
  hitRate: number;
}

// Default cache configurations
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300, // 5 minutes
  prefix: 'cache:',
  maxSize: 1000,
};

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  keys: 0,
  memoryUsage: 0,
};

export class CacheService {
  private static instance: CacheService;
  private config: CacheConfig;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      await redisClient.setEx(
        cacheKey,
        ttl || this.config.ttl,
        JSON.stringify(entry)
      );
      cacheStats.keys++;

      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = await redisClient.get(cacheKey);

      if (!cached) {
        cacheStats.misses++;
        logger.debug(`Cache miss: ${key}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if entry is expired
      if (this.isExpired(entry)) {
        await this.delete(key);
        cacheStats.misses++;
        logger.debug(`Cache expired: ${key}`);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await redisClient.setEx(cacheKey, entry.ttl, JSON.stringify(entry));

      cacheStats.hits++;
      logger.debug(`Cache hit: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      cacheStats.misses++;
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      await redisClient.del(cacheKey);
      cacheStats.keys = Math.max(0, cacheStats.keys - 1);
      logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      const exists = await redisClient.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate =
      cacheStats.hits + cacheStats.misses > 0
        ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
        : 0;

    return {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      keys: cacheStats.keys,
      memoryUsage: cacheStats.memoryUsage,
      hitRate,
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const pattern = `${this.config.prefix}*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        // Delete keys in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await redisClient.del(batch);
        }
      }

      cacheStats.keys = 0;
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
      throw error;
    }
  }

  /**
   * Get cache keys matching pattern
   */
  async getKeys(pattern: string): Promise<string[]> {
    try {
      const cachePattern = this.getCacheKey(pattern);
      const keys = await redisClient.keys(cachePattern);
      return keys.map(key => key.replace(this.config.prefix, ''));
    } catch (error) {
      logger.error(`Cache getKeys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Set cache with custom TTL
   */
  async setWithTTL<T>(key: string, data: T, ttl: number): Promise<void> {
    return this.set(key, data, ttl);
  }

  /**
   * Get cache entry with metadata
   */
  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = await redisClient.get(cacheKey);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      logger.error(`Cache getEntry error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      const cacheKey = this.getCacheKey(key);
      const result = await redisClient.incrBy(cacheKey, value);
      await redisClient.expire(cacheKey, this.config.ttl);
      return result;
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset<T>(
    entries: Array<{ key: string; data: T; ttl?: number }>
  ): Promise<void> {
    try {
      for (const entry of entries) {
        const cacheKey = this.getCacheKey(entry.key);
        const cacheEntry: CacheEntry<T> = {
          data: entry.data,
          timestamp: Date.now(),
          ttl: entry.ttl || this.config.ttl,
          accessCount: 0,
          lastAccessed: Date.now(),
        };

        await redisClient.setEx(
          cacheKey,
          entry.ttl || this.config.ttl,
          JSON.stringify(cacheEntry)
        );
      }

      cacheStats.keys += entries.length;
      logger.debug(`Cache mset: ${entries.length} keys`);
    } catch (error) {
      logger.error('Cache mset error:', error);
      throw error;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const cacheKeys = keys.map(key => this.getCacheKey(key));
      const results = await redisClient.mGet(cacheKeys);

      const parsedResults: Array<T | null> = [];
      let hits = 0;
      let misses = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (!result) {
          parsedResults.push(null);
          misses++;
          continue;
        }

        try {
          const entry: CacheEntry<T> = JSON.parse(result);

          if (this.isExpired(entry)) {
            if (keys[i]) {
              await this.delete(keys[i]!);
            }
            parsedResults.push(null);
            misses++;
            continue;
          }

          // Update access statistics
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          if (cacheKeys[i]) {
            await redisClient.setEx(
              cacheKeys[i]!,
              entry.ttl,
              JSON.stringify(entry)
            );
          }

          parsedResults.push(entry.data);
          hits++;
        } catch (error) {
          logger.error(`Cache mget parse error for key ${keys[i]}:`, error);
          parsedResults.push(null);
          misses++;
        }
      }

      cacheStats.hits += hits;
      cacheStats.misses += misses;

      logger.debug(`Cache mget: ${hits} hits, ${misses} misses`);
      return parsedResults;
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set cache with tags for invalidation
   */
  async setWithTags<T>(
    key: string,
    data: T,
    tags: string[],
    ttl?: number
  ): Promise<void> {
    try {
      // Store the data
      await this.set(key, data, ttl);

      // Store tag associations
      const tagKey = this.getCacheKey(`tags:${key}`);
      await redisClient.setEx(
        tagKey,
        ttl || this.config.ttl,
        JSON.stringify(tags)
      );

      // Store reverse tag mappings
      for (const tag of tags) {
        const tagKeysKey = this.getCacheKey(`tag:${tag}`);
        const existingKeys = await redisClient.get(tagKeysKey);
        const keys = existingKeys ? JSON.parse(existingKeys) : [];

        if (!keys.includes(key)) {
          keys.push(key);
          await redisClient.setEx(
            tagKeysKey,
            ttl || this.config.ttl,
            JSON.stringify(keys)
          );
        }
      }

      logger.debug(`Cache setWithTags: ${key} with tags ${tags.join(', ')}`);
    } catch (error) {
      logger.error(`Cache setWithTags error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keysToDelete: string[] = [];

      for (const tag of tags) {
        const tagKeysKey = this.getCacheKey(`tag:${tag}`);
        const tagKeys = await redisClient.get(tagKeysKey);

        if (tagKeys) {
          const keys = JSON.parse(tagKeys);
          keysToDelete.push(...keys);

          // Delete tag mapping
          await redisClient.del(tagKeysKey);
        }
      }

      // Delete all associated keys
      if (keysToDelete.length > 0) {
        const uniqueKeys = [...new Set(keysToDelete)];
        const cacheKeys = uniqueKeys.map(key => this.getCacheKey(key));
        const tagKeys = uniqueKeys.map(key => this.getCacheKey(`tags:${key}`));

        await redisClient.del([...cacheKeys, ...tagKeys]);
        cacheStats.keys = Math.max(0, cacheStats.keys - uniqueKeys.length);
      }

      logger.info(`Cache invalidated by tags: ${tags.join(', ')}`);
    } catch (error) {
      logger.error(
        `Cache invalidateByTags error for tags ${tags.join(', ')}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get cache keys by tag
   */
  async getKeysByTag(tag: string): Promise<string[]> {
    try {
      const tagKeysKey = this.getCacheKey(`tag:${tag}`);
      const tagKeys = await redisClient.get(tagKeysKey);

      if (!tagKeys) {
        return [];
      }

      const keys = JSON.parse(tagKeys);
      return keys;
    } catch (error) {
      logger.error(`Cache getKeysByTag error for tag ${tag}:`, error);
      return [];
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup<T>(
    dataProvider: () => Promise<
      Array<{ key: string; data: T; tags?: string[] }>
    >
  ): Promise<void> {
    try {
      const data = await dataProvider();

      for (const item of data) {
        if (item.tags) {
          await this.setWithTags(item.key, item.data, item.tags);
        } else {
          await this.set(item.key, item.data);
        }
      }

      logger.info(`Cache warmed up with ${data.length} items`);
    } catch (error) {
      logger.error('Cache warmup error:', error);
      throw error;
    }
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Cache configuration updated');
  }

  // Private helper methods
  private getCacheKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp > entry.ttl * 1000;
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Export utility functions for common cache operations
export const cacheUtils = {
  // User permissions cache
  userPermissions: {
    async get(userId: string) {
      return cacheService.get(`user_permissions:${userId}`);
    },
    async set(userId: string, permissions: any) {
      return cacheService.setWithTags(
        `user_permissions:${userId}`,
        permissions,
        [`user:${userId}`, 'permissions'],
        900
      ); // 15 minutes
    },
    async invalidate(userId: string) {
      return cacheService.invalidateByTags([`user:${userId}`, 'permissions']);
    },
  },

  // Menu cache
  menu: {
    async get(userId: string) {
      return cacheService.get(`menu:${userId}`);
    },
    async set(userId: string, menu: any) {
      return cacheService.setWithTags(
        `menu:${userId}`,
        menu,
        [`user:${userId}`, 'menu'],
        1800
      ); // 30 minutes
    },
    async invalidate(userId: string) {
      return cacheService.invalidateByTags([`user:${userId}`, 'menu']);
    },
  },

  // File metadata cache
  fileMetadata: {
    async get(fileId: string) {
      return cacheService.get(`file_metadata:${fileId}`);
    },
    async set(fileId: string, metadata: any) {
      return cacheService.setWithTags(
        `file_metadata:${fileId}`,
        metadata,
        [`file:${fileId}`, 'metadata'],
        3600
      ); // 1 hour
    },
    async invalidate(fileId: string) {
      return cacheService.invalidateByTags([`file:${fileId}`, 'metadata']);
    },
  },

  // Session cache
  session: {
    async get(sessionId: string) {
      return cacheService.get(`session:${sessionId}`);
    },
    async set(sessionId: string, sessionData: any) {
      return cacheService.set(`session:${sessionId}`, sessionData, 86400); // 24 hours
    },
    async delete(sessionId: string) {
      return cacheService.delete(`session:${sessionId}`);
    },
  },

  // Analytics cache
  analytics: {
    async get(key: string) {
      return cacheService.get(`analytics:${key}`);
    },
    async set(key: string, data: any) {
      return cacheService.setWithTags(
        `analytics:${key}`,
        data,
        ['analytics'],
        1800
      ); // 30 minutes
    },
    async invalidate() {
      return cacheService.invalidateByTags(['analytics']);
    },
  },
};
