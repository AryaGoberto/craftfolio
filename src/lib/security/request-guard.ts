import { NextResponse } from "next/server";

export interface SlidingWindowRateLimiter {
  consume: (key: string, nowMs?: number) => {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  };
  reset: () => void;
}

/**
 * Extracts best-effort client IP from reverse proxy headers (Cloudflare / Vercel / Nginx).
 */
export function extractClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Verifies same-origin posture for state-changing or compute-heavy internal API endpoints.
 * Rejects requests whose browser `Origin` or `Sec-Fetch-Site` header indicates a cross-site call.
 */
export function verifySameOriginRequest(request: Request): NextResponse | null {
  const secFetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (secFetchSite === "cross-site") {
    return NextResponse.json(
      {
        code: "FORBIDDEN_ORIGIN",
        error: "Permintaan lintas-domain tidak diizinkan.",
      },
      { status: 403 }
    );
  }

  const originHeader = request.headers.get("origin")?.trim();
  if (!originHeader) {
    return null;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(originHeader);
  } catch {
    return NextResponse.json(
      {
        code: "FORBIDDEN_ORIGIN",
        error: "Header Origin tidak valid.",
      },
      { status: 403 }
    );
  }

  const allowedHosts = new Set<string>();
  try {
    const reqUrl = new URL(request.url);
    if (reqUrl.host) allowedHosts.add(reqUrl.host.toLowerCase());
  } catch {
    // Ignore malformed request URL in synthetic runtimes
  }

  const hostHeader = request.headers.get("host")?.trim().toLowerCase();
  if (hostHeader) allowedHosts.add(hostHeader);

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedHost) allowedHosts.add(forwardedHost);

  if (allowedHosts.size > 0 && !allowedHosts.has(parsedOrigin.host.toLowerCase())) {
    return NextResponse.json(
      {
        code: "FORBIDDEN_ORIGIN",
        error: "Permintaan lintas-domain tidak diizinkan.",
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Creates a bounded in-memory sliding-window rate limiter with stale-entry pruning.
 */
export function createSlidingWindowRateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  maxKeys?: number;
}): SlidingWindowRateLimiter {
  const { maxRequests, windowMs, maxKeys = 2_000 } = options;
  const buckets = new Map<string, number[]>();

  const pruneStale = (nowMs: number) => {
    for (const [k, timestamps] of buckets.entries()) {
      const fresh = timestamps.filter((ts) => nowMs - ts < windowMs);
      if (fresh.length === 0) {
        buckets.delete(k);
      } else {
        buckets.set(k, fresh);
      }
    }
    while (buckets.size >= maxKeys) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey === undefined) break;
      buckets.delete(oldestKey);
    }
  };

  return {
    consume(key: string, nowMs: number = Date.now()) {
      if (maxRequests <= 0) {
        return { allowed: true, remaining: 0, retryAfterSeconds: 0 };
      }

      if (buckets.size >= maxKeys) {
        pruneStale(nowMs);
      }

      const existing = (buckets.get(key) ?? []).filter(
        (ts) => nowMs - ts < windowMs
      );

      if (existing.length >= maxRequests) {
        const oldest = existing[0] ?? nowMs;
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((windowMs - (nowMs - oldest)) / 1000)
        );
        buckets.set(key, existing);
        return { allowed: false, remaining: 0, retryAfterSeconds };
      }

      existing.push(nowMs);
      buckets.set(key, existing);
      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - existing.length),
        retryAfterSeconds: 0,
      };
    },
    reset() {
      buckets.clear();
    },
  };
}
