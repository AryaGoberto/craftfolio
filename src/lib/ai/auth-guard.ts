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

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/**
 * Verifies a Firebase ID Token on the server via Google Identity Toolkit's
 * official `accounts:lookup` endpoint using `NEXT_PUBLIC_FIREBASE_API_KEY`.
 */
export async function verifyFirebaseIdTokenWithLookup(
  idToken: string
): Promise<AuthenticatedAiUser | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("FIREBASE_NOT_CONFIGURED");
  }

  const res = await fetch(
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

  return {
    uid: firstUser.localId,
    email: firstUser.email ?? null,
  };
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
