import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

// Retrieve credentials from Vite environment variables
const redisUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client conditionally to handle missing credentials gracefully
export const redisClient = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

/**
 * Valid caching TTLs in seconds as requested:
 * - Properties/Listings: 5 minutes (300s)
 * - User Profiles: 10 minutes (600s)
 * - Location Data: 1 hour (3600s)
 * - Search Results: 2 minutes (120s)
 */
export const CACHE_TTL = {
  LISTINGS: 300,
  PROFILES: 600,
  LOCATION: 3600,
  SEARCH: 120,
};

/**
 * Generates a consistent cache key based on a prefix and parameters
 */
export const cacheKey = (prefix: string, params?: Record<string, any> | string): string => {
  if (!params) return prefix;
  if (typeof params === 'string') return `${prefix}:${params}`;
  
  // Sort keys to ensure consistent JSON stringification
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);
    
  return `${prefix}:${JSON.stringify(sortedParams)}`;
};

/**
 * Gets a value from the cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get<T>(key);
    if (data) {
      logger.info(`[CACHE HIT] ${key}`);
      return data;
    }
    logger.info(`[CACHE MISS] ${key}`);
    return null;
  } catch (error) {
    logger.error(`Error reading from redis cache (key: ${key}):`, { error });
    return null;
  }
}

/**
 * Sets a value in the cache with a TTL (in seconds)
 */
export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (!redisClient) return;
  
  try {
    if (ttlSeconds) {
      await redisClient.set(key, value, { ex: ttlSeconds });
    } else {
      await redisClient.set(key, value);
    }
    logger.info(`[CACHE SET] ${key}`);
  } catch (error) {
    logger.error(`Error writing to redis cache (key: ${key}):`, { error });
  }
}

/**
 * Deletes a specific key from the cache
 */
export async function delCache(key: string): Promise<void> {
  if (!redisClient) return;
  
  try {
    await redisClient.del(key);
    logger.info(`[CACHE DEL] ${key}`);
  } catch (error) {
    logger.error(`Error deleting from redis cache (key: ${key}):`, { error });
  }
}

/**
 * Invalidates cache by pattern or multiple keys
 * Note: Upstash Redis over REST has limited support for pattern deletion via SCAN.
 * For multiple specific keys, we can delete them.
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  if (!redisClient) return;
  
  try {
    // A simplified scan & delete approach for wiping namespace prefixes
    let cursor: number | string = 0;
    do {
      const result = await redisClient.scan(cursor, { match: `${prefix}*`, count: 100 });
      cursor = result[0];
      const keys = result[1];
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== 0 && cursor !== '0');
    logger.info(`[CACHE INVALIDATE PREFIX] ${prefix}*`);
  } catch (error) {
    logger.error(`Error invalidating redis cache prefix (prefix: ${prefix}):`, { error });
  }
}

/**
 * Wrapper to fetch data from cache, or fallback to a promise and set cache if missed.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.LISTINGS
): Promise<T> {
  if (!redisClient) {
    return await fetcher();
  }

  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  
  // Only cache if there's actual data (don't cache nulls indefinitely, though sometimes useful)
  if (data !== undefined && data !== null) {
    await setCache(key, data, ttlSeconds);
  }
  
  return data;
}
