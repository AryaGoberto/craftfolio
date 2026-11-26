"use client";

import type { AiQuotaSnapshot } from "@/lib/ai/quota";
import { getCurrentUserIdToken } from "@/lib/firebase/auth";
import { useResumeStore } from "@/store/use-resume-store";

export interface AuthenticatedAiFetchResult<T> {
  ok: boolean;
  status: number;
  data: T & { code?: string; error?: string; quota?: AiQuotaSnapshot };
}

/**
 * Calls a protected `/api/ai/*` endpoint with the current Firebase user's
 * ID Token and automatically syncs any returned `quota` snapshot into Zustand.
 */
export async function postAuthenticatedAiJson<T>(
  url: string,
  payload: unknown
): Promise<AuthenticatedAiFetchResult<T>> {
  const token = await getCurrentUserIdToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      data: {
        code: "AI_AUTH_REQUIRED",
        error:
          "Sesi login tidak ditemukan. Silakan masuk terlebih dahulu untuk memakai fitur AI.",
      } as T & { code?: string; error?: string; quota?: AiQuotaSnapshot },
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as T & {
    code?: string;
    error?: string;
    quota?: AiQuotaSnapshot;
  };

  if (data.quota) {
    useResumeStore.getState().setAiQuota(data.quota);
  }

  return { ok: res.ok, status: res.status, data };
}

export async function refreshAiQuotaFromServer(): Promise<void> {
  try {
    const token = await getCurrentUserIdToken();
    if (!token) return;
    const res = await fetch("/api/ai/usage", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { quota?: AiQuotaSnapshot };
    if (data.quota) {
      useResumeStore.getState().setAiQuota(data.quota);
    }
  } catch {
    // Non-critical status badge refresh; ignore transient failures
  }
}
