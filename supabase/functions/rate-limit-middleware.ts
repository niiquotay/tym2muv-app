import { Redis } from 'https://esm.sh/@upstash/redis';

const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || '';
const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '';

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// Fallback in-memory store if Redis is unavailable or for extreme fallbacks
const localCache = new Map<string, { count: number; expiresAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  errorMessage?: string;
}

export async function rateLimit(
  req: Request, 
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60000, errorMessage: 'Too Many Requests' }
): Promise<Response | null> {
  // Try to get identifier (User ID or IP)
  let identifier = 'anonymous';

  // 1. Try to get Auth token user
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    try {
       // In a real scenario we might verify the JWT here, or rely on a passed context
       // For this middleware, we just extract the token as an identifier
       identifier = authHeader.replace('Bearer ', '').substring(0, 15);
    } catch (e) {
       // ignore
    }
  } else {
    // 2. Try to get IP address
    identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
  }

  const endpoint = new URL(req.url).pathname;
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Date.now();

  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        // Set expiry on first request
        await redis.expire(key, Math.ceil(config.windowMs / 1000));
      }
      if (current > config.maxRequests) {
        return new Response(
          JSON.stringify({ error: config.errorMessage || "Too Many Requests" }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error("Redis rate limit error:", e);
      // Fallback to local cache if redis fails
      return localRateLimit(key, config, now);
    }
  } else {
    return localRateLimit(key, config, now);
  }

  return null; // Null means proceed
}

function localRateLimit(key: string, config: RateLimitConfig, now: number): Response | null {
  const record = localCache.get(key);
  if (!record || record.expiresAt < now) {
    localCache.set(key, { count: 1, expiresAt: now + config.windowMs });
    return null;
  }

  record.count += 1;
  if (record.count > config.maxRequests) {
    return new Response(
      JSON.stringify({ error: config.errorMessage || "Too Many Requests" }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}
