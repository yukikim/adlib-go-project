type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

const DEFAULT_MAX_REQUESTS = 3;
const DEFAULT_WINDOW_MS = 10 * 60 * 1_000;
const MAX_TRACKED_CLIENTS = 10_000;

const globalForContactRateLimit = globalThis as typeof globalThis & {
  contactRateLimitStore?: Map<string, RateLimitEntry>;
};

const contactRateLimitStore =
  globalForContactRateLimit.contactRateLimitStore ?? new Map<string, RateLimitEntry>();

globalForContactRateLimit.contactRateLimitStore = contactRateLimitStore;

function getPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of contactRateLimitStore) {
    if (entry.resetAt <= now) {
      contactRateLimitStore.delete(key);
    }
  }
}

export function getContactClientKey(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for');
  const forwardedAddress = forwardedFor?.split(',')[0]?.trim();
  return forwardedAddress || headers.get('x-real-ip')?.trim() || 'unknown-client';
}

export function consumeContactRateLimit(clientKey: string, now = Date.now()): RateLimitResult {
  const maxRequests = getPositiveInteger(
    process.env.CONTACT_RATE_LIMIT_MAX,
    DEFAULT_MAX_REQUESTS,
  );
  const windowMs = getPositiveInteger(
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WINDOW_MS,
  );

  const current = contactRateLimitStore.get(clientKey);
  if (!current || current.resetAt <= now) {
    if (contactRateLimitStore.size >= MAX_TRACKED_CLIENTS) {
      pruneExpiredEntries(now);
    }

    if (contactRateLimitStore.size >= MAX_TRACKED_CLIENTS) {
      const oldestKey = contactRateLimitStore.keys().next().value;
      if (oldestKey) {
        contactRateLimitStore.delete(oldestKey);
      }
    }

    contactRateLimitStore.set(clientKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}
