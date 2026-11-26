import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findInventedNumericTokens,
  handleEnhanceBulletPost,
  sanitizeImprovedBullet,
} from "@/lib/ai/bullet-enhancer";
import {
  DEFAULT_GEMINI_MODEL,
  getGeminiLanguageModel,
  mapAiErrorResponse,
} from "@/lib/ai/gemini";
import { resetAiQuotaStoreForTests } from "@/lib/ai/quota";

const mockAuthOk = async () => ({
  uid: "uid-test-enhance",
  email: "user@example.com",
});

describe("AI Bullet-Point Enhancer guardrails & route handler", () => {
  beforeEach(() => {
    resetAiQuotaStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetAiQuotaStoreForTests();
  });

  it("detects fabricated numeric metrics absent from original bullet input", () => {
    const original = "Membuat halaman dashboard admin untuk tim operasional.";
    const fabricated =
      "Mengembangkan dashboard admin yang mempercepat proses laporan hingga 45% untuk 120 pengguna.";

    expect(findInventedNumericTokens(original, fabricated)).toEqual([
      "45%",
      "120",
    ]);

    const faithful =
      "Mengembangkan halaman dashboard admin menggunakan Next.js guna mempermudah pemantauan tim operasional.";
    expect(findInventedNumericTokens(original, faithful)).toEqual([]);
  });

  it("normalizes bullet output formatting and removes leading bullet symbols", () => {
    expect(
      sanitizeImprovedBullet("  • Built scalable REST APIs using Node.js.  ")
    ).toBe("Built scalable REST APIs using Node.js.");
    expect(
      sanitizeImprovedBullet("- Mengembangkan fitur analitik real-time")
    ).toBe("Mengembangkan fitur analitik real-time");
  });

  it("returns 401 AI_AUTH_REQUIRED when Authorization header is missing", async () => {
    const req = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulletText: "Membuat halaman dashboard admin untuk klien.",
        language: "id",
      }),
    });

    const res = await handleEnhanceBulletPost(req);
    expect(res.status).toBe(401);
    expect(((await res.json()) as { code: string }).code).toBe("AI_AUTH_REQUIRED");
  });

  it("returns 400 when bulletText is empty or invalid", async () => {
    const req = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ bulletText: "  ", language: "id" }),
    });

    const res = await handleEnhanceBulletPost(req, {
      verifyIdToken: mockAuthOk,
    });
    expect(res.status).toBe(400);
  });

  it("returns 503 AI_UNAVAILABLE cleanly without crashing when GOOGLE_GENERATIVE_AI_API_KEY is missing", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");

    const req = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        bulletText: "Membuat halaman dashboard admin untuk klien.",
        language: "id",
      }),
    });

    const res = await handleEnhanceBulletPost(req, {
      verifyIdToken: mockAuthOk,
    });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AI_UNAVAILABLE");
  });

  it("rejects/flags unverified metrics if injected model invents numbers, and returns clean enhancement when faithful", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");

    const req = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        bulletText: "Membuat halaman dashboard admin untuk tim operasional.",
        language: "id",
        roleContext: {
          companyOrProject: "PT Nusantara",
          roleOrPosition: "Frontend Engineer",
        },
      }),
    });

    const res = await handleEnhanceBulletPost(req, {
      verifyIdToken: mockAuthOk,
      generateEnhancement: async () => ({
        improvedText:
          "- Mengembangkan dashboard admin operasional untuk menyajikan metrik harian secara terstruktur.",
        reasoning:
          "Mengubah kata kerja menjadi aktif dengan struktur Action -> Context -> Result.",
        missingMetricsHint:
          "Tambahkan angka dampak nyata Anda sendiri (mis. jumlah pengguna atau waktu yang dihemat) bila tersedia.",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      improvedText: string;
      reasoning: string;
      missingMetricsHint: string | null;
      inventedMetricsDetected: string[];
      quota: { enhance: { used: number; remaining: number } };
    };

    expect(data.improvedText).toBe(
      "Mengembangkan dashboard admin operasional untuk menyajikan metrik harian secara terstruktur."
    );
    expect(data.inventedMetricsDetected).toEqual([]);
    expect(data.missingMetricsHint).toContain("angka");
    expect(data.quota.enhance.used).toBe(1);
    expect(data.quota.enhance.remaining).toBe(9);
  });

  it("surfaces inventedMetricsDetected warning when mocked model hallucinates numbers", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");

    const req = new Request("http://localhost:3000/api/ai/enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        bulletText: "Membuat halaman dashboard admin.",
        language: "id",
      }),
    });

    const res = await handleEnhanceBulletPost(req, {
      verifyIdToken: mockAuthOk,
      generateEnhancement: async () => ({
        improvedText:
          "Membangun dashboard admin yang meningkatkan efisiensi sebesar 35%.",
        reasoning: "Memperkuat kata kerja aktif.",
        missingMetricsHint: null,
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { inventedMetricsDetected: string[] };
    expect(data.inventedMetricsDetected).toEqual(["35%"]);
  });

  it("maps TimeoutError, 503 overload, 404 model-not-found, and 429 rate-limit cleanly without returning generic 500", async () => {
    const timeoutErr = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    const timeoutRes = mapAiErrorResponse(timeoutErr);
    expect(timeoutRes.status).toBe(504);
    expect(((await timeoutRes.json()) as { code: string }).code).toBe("AI_TIMEOUT");

    const overloadedRes = mapAiErrorResponse({ statusCode: 503 });
    expect(overloadedRes.status).toBe(503);
    expect(((await overloadedRes.json()) as { code: string }).code).toBe("AI_MODEL_OVERLOADED");

    const notFoundRes = mapAiErrorResponse({ statusCode: 404 });
    expect(notFoundRes.status).toBe(502);
    expect(((await notFoundRes.json()) as { code: string }).code).toBe("AI_MODEL_NOT_FOUND");

    const rateLimitRes = mapAiErrorResponse({ statusCode: 429 });
    expect(rateLimitRes.status).toBe(429);
    expect(((await rateLimitRes.json()) as { code: string }).code).toBe("AI_RATE_LIMITED");
  });

  it("uses active non-deprecated default model and respects GEMINI_MODEL env override", () => {
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-flash-lite-latest");
    vi.stubEnv("GEMINI_MODEL", "");
    expect(getGeminiLanguageModel().modelId).toBe("gemini-flash-lite-latest");

    vi.stubEnv("GEMINI_MODEL", "gemini-2.5-pro");
    expect(getGeminiLanguageModel().modelId).toBe("gemini-2.5-pro");
  });
});
