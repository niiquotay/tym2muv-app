import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withCache, setCache, getCache, invalidateCachePrefix, delCache, cacheKey, CACHE_TTL } from './cacheService';
import { redisClient } from './cacheService';

// Mock the Redis client methods
if (redisClient) {
  redisClient.get = vi.fn();
  redisClient.set = vi.fn();
  redisClient.del = vi.fn();
  redisClient.scan = vi.fn().mockResolvedValue([0, []]);
}

describe('Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates consistent cache keys', () => {
    const key1 = cacheKey('listings', { a: 1, b: 2 });
    const key2 = cacheKey('listings', { b: 2, a: 1 }); // different order
    expect(key1).toBe(key2);
    expect(key1).toBe('listings:{\"a\":1,\"b\":2}');
  });

  // These tests assume Redis client is active. If it is null in test environments without env vars, they should adapt.
  if (redisClient) {
    it('uses cache for repeated queries with withCache', async () => {
      const fetcher = vi.fn().mockResolvedValue('DB_DATA');
      
      // Simulate cache miss
      (redisClient.get as any).mockResolvedValueOnce(null);
      const res1 = await withCache('test_key', fetcher, 100);
      
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(res1).toBe('DB_DATA');
      expect(redisClient.set).toHaveBeenCalledWith('test_key', 'DB_DATA', { ex: 100 });
  
      // Simulate cache hit
      (redisClient.get as any).mockResolvedValueOnce('DB_DATA');
      const res2 = await withCache('test_key', fetcher, 100);
      
      expect(fetcher).toHaveBeenCalledTimes(1); // not called again
      expect(res2).toBe('DB_DATA');
    });
  
    it('invalidates cache correctly', async () => {
      await delCache('test_key');
      expect(redisClient.del).toHaveBeenCalledWith('test_key');
      
      (redisClient.scan as any).mockResolvedValueOnce([0, ['prefix:1', 'prefix:2']]);
      await invalidateCachePrefix('prefix:');
      expect(redisClient.del).toHaveBeenCalledWith('prefix:1', 'prefix:2');
    });
  } else {
    it('bypasses cache when redisClient is not initialized', async () => {
      const fetcher = vi.fn().mockResolvedValue('DB_DATA');
      const res = await withCache('test_key', fetcher, 100);
      expect(res).toBe('DB_DATA');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  }
});
