import crypto from "node:crypto";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  distributed: boolean;
};

type LocalBucket = { count: number; resetAt: number };

const localBuckets = new Map<string, LocalBucket>();
const WINDOW_SECONDS = 60;
const MAX_LOCAL_BUCKETS = 10_000;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function distributedLimit(key: string, limit: number): Promise<RateLimitResult | null> {
  const config = redisConfig();
  if (!config) return null;
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + WINDOW_SECONDS;
  const redisKey = `zanora:ratelimit:${crypto.createHash("sha256").update(key).digest("hex")}`;
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", redisKey], ["EXPIRE", redisKey, WINDOW_SECONDS]]),
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) throw new Error(`Redis returned ${response.status}`);
    const result = (await response.json()) as Array<{ result?: number }>;
    const count = Number(result[0]?.result);
    if (!Number.isFinite(count)) throw new Error("Redis returned an invalid counter");
    return { allowed: count <= limit, limit, remaining: Math.max(0, limit - count), resetAt, distributed: true };
  } catch (error) {
    console.warn(JSON.stringify({ level: "warn", event: "rate_limit.redis_unavailable", error: error instanceof Error ? error.message : "unknown" }));
    return null;
  }
}

function localLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  let bucket = localBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
    if (localBuckets.size >= MAX_LOCAL_BUCKETS) {
      const first = localBuckets.keys().next().value;
      if (first) localBuckets.delete(first);
    }
    localBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, limit, remaining: Math.max(0, limit - bucket.count), resetAt: Math.ceil(bucket.resetAt / 1000), distributed: false };
}

export async function checkRateLimit(key: string, limit = 120): Promise<RateLimitResult> {
  return (await distributedLimit(key, limit)) ?? localLimit(key, limit);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.resetAt),
    "X-RateLimit-Backend": result.distributed ? "redis" : "memory-fallback",
  };
}
