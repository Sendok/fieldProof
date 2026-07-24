import { createRedisConnection } from "@/server/queue/connection";

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const redis = createRedisConnection();
  try {
    await redis.connect();
    const count = await redis.incr(`rate-limit:${key}`);
    if (count === 1) await redis.expire(`rate-limit:${key}`, windowSeconds);
    return count <= limit;
  } catch {
    // Authentication remains available during a Redis incident; upstream/WAF limits remain applicable.
    return true;
  } finally {
    redis.disconnect();
  }
}
