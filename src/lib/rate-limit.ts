/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Suitable for a single-instance deployment. For multi-instance production,
 * swap the store for Redis (see README "Rate limiting").
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    const entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;
  const success = existing.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getClientIp(headers: Headers | Record<string, unknown>): string {
  if (headers instanceof Headers) {
    const fwd = headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    return headers.get("x-real-ip") ?? "unknown";
  }
  const h = headers as Record<string, unknown>;
  const fwd = h["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  return "unknown";
}

/** Test helper. */
export function __resetRateLimit() {
  store.clear();
}
