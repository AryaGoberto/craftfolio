import { NextResponse } from "next/server";
import {
  authenticateAiRequest,
  type VerifyFirebaseIdTokenFn,
} from "@/lib/ai/auth-guard";
import { getAiQuotaSnapshot } from "@/lib/ai/quota";
import {
  createSlidingWindowRateLimiter,
  extractClientIp,
} from "@/lib/security/request-guard";

const usagePollLimiter = createSlidingWindowRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
});

export interface AiUsageDeps {
  verifyIdToken?: VerifyFirebaseIdTokenFn;
}

export async function handleAiUsageGet(
  request: Request,
  deps?: AiUsageDeps
): Promise<NextResponse> {
  const rate = usagePollLimiter.consume(extractClientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        error: "Terlalu banyak permintaan cek kuota. Coba lagi sebentar lagi.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  const auth = await authenticateAiRequest(request, deps?.verifyIdToken);
  if (!auth.ok) {
    return auth.response;
  }

  const quota = getAiQuotaSnapshot(auth.user.uid);
  return NextResponse.json({ quota }, { status: 200 });
}

export async function GET(request: Request) {
  return handleAiUsageGet(request);
}
