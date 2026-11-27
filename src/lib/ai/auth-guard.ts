import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export interface AuthenticatedAiUser {
  uid: string;
  email: string | null;
}

export type VerifyFirebaseIdTokenFn = (
  idToken: string
) => Promise<AuthenticatedAiUser | null>;

export type AuthGuardResult =
  | { ok: true; user: AuthenticatedAiUser }
  | { ok: false; response: NextResponse };

interface CachedVerifiedToken {
  user: AuthenticatedAiUser;
  expiresAtMs: number;
}

const TOKEN_CACHE_MAX_ENTRIES = 500;
const TOKEN_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes max TTL
const TOKEN_EXPIRY_SAFETY_BUFFER_MS = 5_000;

const globalTokenCache = globalThis as typeof globalThis & {
  __craftfolioVerifiedTokenCache?: Map<string, CachedVerifiedToken>;
};

function getTokenCache(): Map<string, CachedVerifiedToken> {
  if (!globalTokenCache.__craftfolioVerifiedTokenCache) {
    globalTokenCache.__craftfolioVerifiedTokenCache = new Map();
  }
  return globalTokenCache.__craftfolioVerifiedTokenCache;
}

function hashTokenKey(idToken: string): string {
  return createHash("sha256").update(idToken).digest("hex");
}

/**
 * Extracts the numeric `exp` claim (ms) from a JWT payload without trusting its
 * signature — used strictly to cap the local cache TTL AFTER server verification succeeds.
 */
function readJwtExpMs(idToken: string): number | null {
  const parts = idToken.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

function getCachedVerifiedUser(
  tokenHash: string,
  nowMs: number
): AuthenticatedAiUser | null {
  const cache = getTokenCache();
  const entry = cache.get(tokenHash);
  if (!entry) return null;
  if (nowMs >= entry.expiresAtMs) {
    cache.delete(tokenHash);
    return null;
  }
  return entry.user;
}

function setCachedVerifiedUser(
  tokenHash: string,
  idToken: string,
  user: AuthenticatedAiUser,
  nowMs: number
): void {
  const cache = getTokenCache();
  const jwtExpMs = readJwtExpMs(idToken);
  const maxAllowedExpMs = nowMs + TOKEN_CACHE_TTL_MS;
  const expiresAtMs =
    jwtExpMs !== null
      ? Math.min(maxAllowedExpMs, jwtExpMs - TOKEN_EXPIRY_SAFETY_BUFFER_MS)
      : maxAllowedExpMs;

  if (expiresAtMs <= nowMs) return;

  // Prune expired or oldest entries to keep memory strictly bounded
  if (cache.size >= TOKEN_CACHE_MAX_ENTRIES) {
    for (const [k, v] of cache.entries()) {
      if (nowMs >= v.expiresAtMs) {
        cache.delete(k);
      }
    }
    while (cache.size >= TOKEN_CACHE_MAX_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey === undefined) break;
      cache.delete(oldestKey);
    }
  }

  cache.set(tokenHash, { user, expiresAtMs });
}

export function resetTokenVerificationCacheForTests(): void {
  getTokenCache().clear();
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/**
 * Verifies a Firebase ID Token on the server via Google Identity Toolkit's
 * official `accounts:lookup` endpoint using `NEXT_PUBLIC_FIREBASE_API_KEY`,
 * with a short-lived SHA-256 keyed in-memory cache to avoid repeated network hops.
 */
export async function verifyFirebaseIdTokenWithLookup(
  idToken: string,
  fetchFn: typeof fetch = fetch
): Promise<AuthenticatedAiUser | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("FIREBASE_NOT_CONFIGURED");
  }

  const nowMs = Date.now();
  const tokenHash = hashTokenKey(idToken);
  const cached = getCachedVerifiedUser(tokenHash, nowMs);
  if (cached) {
    return cached;
  }

  const res = await fetchFn(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(8_000),
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const firstUser = data.users?.[0];
  if (!firstUser?.localId) {
    return null;
  }

  const verified: AuthenticatedAiUser = {
    uid: firstUser.localId,
    email: firstUser.email ?? null,
  };
  setCachedVerifiedUser(tokenHash, idToken, verified, nowMs);

  return verified;
}

export async function authenticateAiRequest(
  request: Request,
  verifyIdToken?: VerifyFirebaseIdTokenFn
): Promise<AuthGuardResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "AI_AUTH_REQUIRED",
          error:
            "Silakan masuk ke akun Craftfolio terlebih dahulu untuk menggunakan fitur AI.",
        },
        { status: 401 }
      ),
    };
  }

  try {
    const verifier = verifyIdToken ?? verifyFirebaseIdTokenWithLookup;
    const user = await verifier(token);
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            code: "AI_AUTH_INVALID",
            error:
              "Sesi login Anda tidak valid atau kedaluwarsa. Silakan masuk ulang untuk melanjutkan.",
          },
          { status: 401 }
        ),
      };
    }

    return { ok: true, user };
  } catch (err) {
    if (err instanceof Error && err.message === "FIREBASE_NOT_CONFIGURED") {
      return {
        ok: false,
        response: NextResponse.json(
          {
            code: "AUTH_UNAVAILABLE",
            error:
              "Verifikasi login server belum aktif karena NEXT_PUBLIC_FIREBASE_API_KEY belum diisi.",
          },
          { status: 503 }
        ),
      };
    }

    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "AI_AUTH_VERIFY_FAILED",
          error:
            "Gagal memverifikasi sesi login ke server Firebase. Silakan coba lagi.",
        },
        { status: 502 }
      ),
    };
  }
}
