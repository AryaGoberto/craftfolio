import { NextResponse } from "next/server";
import {
  authenticateAiRequest,
  type VerifyFirebaseIdTokenFn,
} from "@/lib/ai/auth-guard";
import { getAiQuotaSnapshot } from "@/lib/ai/quota";

export interface AiUsageDeps {
  verifyIdToken?: VerifyFirebaseIdTokenFn;
}

export async function handleAiUsageGet(
  request: Request,
  deps?: AiUsageDeps
): Promise<NextResponse> {
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
