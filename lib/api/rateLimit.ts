import { LRUCache } from "lru-cache";
import { ApiError } from "@/lib/utils/errors";

// Lightweight in-memory token-bucket. Acceptable for a single Netlify
// instance / low-traffic deployments. For multi-region production scale
// swap for an Upstash Redis ratelimiter; the call sites won't change.
//
// Each bucket key (typically `${oid}::${action}`) gets `capacity` tokens
// that refill at `capacity / windowMs` tokens per ms. A request consumes
// one token; if the bucket is empty we throw 429.

interface Bucket {
  tokens: number;
  lastRefill: number; // epoch ms
}

interface Limit {
  capacity: number;
  windowMs: number;
}

const PRESETS = {
  // 5 nieuwe aanvragen per uur
  createRequest: { capacity: 5, windowMs: 60 * 60 * 1000 } as Limit,
  // 30 berichten per uur
  comment: { capacity: 30, windowMs: 60 * 60 * 1000 } as Limit,
  // 30 documenten per uur
  uploadDocument: { capacity: 30, windowMs: 60 * 60 * 1000 } as Limit,
  // 60 patches per uur
  updateRequest: { capacity: 60, windowMs: 60 * 60 * 1000 } as Limit,
  // 1 submit per minuut per aanvraag (anti double-submit)
  submitRequest: { capacity: 3, windowMs: 60 * 1000 } as Limit,
  // 1 sisa-grant per 10 sec
  sisaGrant: { capacity: 1, windowMs: 10 * 1000 } as Limit,
} satisfies Record<string, Limit>;

export type RateLimitAction = keyof typeof PRESETS;

const buckets = new LRUCache<string, Bucket>({
  max: 50_000,
  ttl: 60 * 60 * 1000, // 1 hour idle = drop
});

function refill(b: Bucket, limit: Limit, now: number) {
  const elapsed = now - b.lastRefill;
  if (elapsed <= 0) return;
  const refilled = (elapsed / limit.windowMs) * limit.capacity;
  b.tokens = Math.min(limit.capacity, b.tokens + refilled);
  b.lastRefill = now;
}

export function enforceRateLimit(action: RateLimitAction, who: string): void {
  const limit = PRESETS[action];
  const key = `${who}::${action}`;
  const now = Date.now();
  const bucket: Bucket = buckets.get(key) ?? { tokens: limit.capacity, lastRefill: now };
  refill(bucket, limit, now);
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    const retryAfter = Math.ceil((limit.windowMs * (1 - bucket.tokens)) / limit.capacity / 1000);
    throw new ApiError(429, "Rate limit exceeded", {
      code: "rate_limited",
      dutchMessage: `Te veel verzoeken. Probeer het opnieuw over ${retryAfter}s.`,
    });
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
}
