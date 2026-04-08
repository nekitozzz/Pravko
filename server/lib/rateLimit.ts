import Redis from "ioredis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export async function checkRateLimit(
  redis: Redis,
  key: string,
  config: RateLimitConfig,
): Promise<{ ok: boolean; remaining: number }> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.pexpire(redisKey, config.windowMs);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) || 0;

  return {
    ok: count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
  };
}
