import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateAiRequest } from "@/lib/ai/auth-guard";
import { handleEnhanceBulletPost } from "@/lib/ai/bullet-enhancer";
import {
  commitAiQuota,
  getAiQuotaSnapshot,
  getWibDayKey,
  refundAiQuota,
  reserveAiQuota,
  resetAiQuotaStoreForTests,
} from "@/lib/ai/quota";
import { handleAiUsageGet } from "@/app/api/ai/usage/route";

describe("AI Server Auth Guard & Free-Tier Daily Quota Limiter", () => {
  beforeEach(() => {
    resetAiQuotaStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetAiQuotaStoreForTests();
  });

  it("rejects missing or invalid Bearer tokens with 401", async () => {
    const noHeaderReq = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
    });
    const noHeaderRes = await authenticateAiRequest(noHeaderReq);
    expect(noHeaderRes.ok).toBe(false);
    if (!noHeaderRes.ok) {
      expect(noHeaderRes.response.status).toBe(401);
    }

    const badTokenReq = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: { Authorization: "Bearer invalid-jwt" },
    });
    const badTokenRes = await authenticateAiRequest(badTokenReq, async () => null);
    expect(badTokenRes.ok).toBe(false);
    if (!badTokenRes.ok) {
      expect(badTokenRes.response.status).toBe(401);
      expect(((await badTokenRes.response.json()) as { code: string }).code).toBe(
        "AI_AUTH_INVALID"
      );
    }
  });

  it("enforces daily limits (10 enhance/day, 2 import/day) and resets at 00:00 WIB", () => {
    const day1MorningUtc = Date.UTC(2026, 10, 26, 2, 0, 0); // 09:00 WIB
    expect(getWibDayKey(day1MorningUtc)).toBe("2026-11-26");

    // Import allows 2/day
    const imp1 = reserveAiQuota("uid-1", "import", day1MorningUtc);
    const imp2 = reserveAiQuota("uid-1", "import", day1MorningUtc + 1000);
    const imp3 = reserveAiQuota("uid-1", "import", day1MorningUtc + 2000);
    expect(imp1.allowed).toBe(true);
    expect(imp2.allowed).toBe(true);
    expect(imp3.allowed).toBe(false);
    if (!imp3.allowed) {
      expect(imp3.code).toBe("AI_QUOTA_EXCEEDED");
    }

    // Enhance allows 10/day across separate minutes (avoiding 4/min burst cap)
    for (let i = 0; i < 10; i++) {
      const minuteOffset = Math.floor(i / 2) * 70_000 + (i % 2) * 1000;
      const r = reserveAiQuota("uid-2", "enhance", day1MorningUtc + minuteOffset);
      expect(r.allowed).toBe(true);
      if (r.allowed) commitAiQuota(r.reservation);
    }
    const eleventh = reserveAiQuota(
      "uid-2",
      "enhance",
      day1MorningUtc + 10 * 70_000
    );
    expect(eleventh.allowed).toBe(false);
    if (!eleventh.allowed) {
      expect(eleventh.code).toBe("AI_QUOTA_EXCEEDED");
      expect(eleventh.quota.enhance.remaining).toBe(0);
    }

    // Next WIB day (17:01 UTC = 00:01 WIB) resets quota cleanly
    const nextWibDayUtc = Date.UTC(2026, 10, 26, 17, 1, 0);
    expect(getWibDayKey(nextWibDayUtc)).toBe("2026-11-27");
    expect(getAiQuotaSnapshot("uid-2", nextWibDayUtc).enhance.used).toBe(0);
    expect(getAiQuotaSnapshot("uid-2", nextWibDayUtc).enhance.remaining).toBe(10);
  });

  it("enforces rolling 1-minute burst limit (4 req/min)", () => {
    const t0 = Date.UTC(2026, 10, 26, 5, 0, 0);
    for (let i = 0; i < 4; i++) {
      const res = reserveAiQuota("uid-burst", "enhance", t0 + i * 1000);
      expect(res.allowed).toBe(true);
    }
    const fifth = reserveAiQuota("uid-burst", "enhance", t0 + 5000);
    expect(fifth.allowed).toBe(false);
    if (!fifth.allowed) {
      expect(fifth.code).toBe("AI_BURST_LIMITED");
      expect(fifth.retryAfterSeconds).toBeGreaterThan(0);
    }

    // After 61 seconds, burst window clears
    const afterCooldown = reserveAiQuota("uid-burst", "enhance", t0 + 61_000);
    expect(afterCooldown.allowed).toBe(true);
  });

  it("refunds reserved quota automatically when Gemini throws an error", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");

    const req = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        bulletText: "Membuat sistem manajemen inventaris dengan React.",
        language: "id",
      }),
    });

    const failedRes = await handleEnhanceBulletPost(req, {
      verifyIdToken: async () => ({ uid: "uid-refund", email: "a@b.com" }),
      generateEnhancement: async () => {
        throw new DOMException("Timed out", "TimeoutError");
      },
    });
    expect(failedRes.status).toBe(504);

    // Usage must remain 0 after upstream failure
    const snapshot = getAiQuotaSnapshot("uid-refund");
    expect(snapshot.enhance.used).toBe(0);
    expect(snapshot.enhance.remaining).toBe(10);

    // Also verify manual refund helper
    const r = reserveAiQuota("uid-refund", "import");
    expect(r.allowed).toBe(true);
    if (r.allowed) {
      refundAiQuota(r.reservation);
    }
    expect(getAiQuotaSnapshot("uid-refund").import.used).toBe(0);
  });

  it("returns current quota snapshot via GET /api/ai/usage", async () => {
    reserveAiQuota("uid-usage", "enhance");
    const req = new Request("http://localhost:3000/api/ai/usage", {
      method: "GET",
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await handleAiUsageGet(req, {
      verifyIdToken: async () => ({ uid: "uid-usage", email: "u@e.com" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      quota: {
        enhance: { used: number; limit: number; remaining: number };
        import: { used: number; limit: number; remaining: number };
      };
    };
    expect(body.quota.enhance).toEqual({ used: 1, limit: 10, remaining: 9 });
    expect(body.quota.import).toEqual({ used: 0, limit: 2, remaining: 2 });
  });
});
