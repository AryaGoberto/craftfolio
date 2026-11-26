import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleEnhanceSummaryPost,
  sanitizeSummaryText,
  serializeSummaryCvContext,
} from "@/lib/ai/summary-enhancer";
import { resetAiQuotaStoreForTests } from "@/lib/ai/quota";

const mockAuthOk = async () => ({
  uid: "uid-test-summary",
  email: "user@example.com",
});

describe("AI Professional Summary Enhancer & Generator (/api/ai/enhance-summary)", () => {
  beforeEach(() => {
    resetAiQuotaStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetAiQuotaStoreForTests();
  });

  it("sanitizes newlines, surrounding quotes, and redundant whitespace", () => {
    expect(
      sanitizeSummaryText('  "Software Engineer\n\tfocused on   Next.js."  ')
    ).toBe("Software Engineer focused on Next.js.");
  });

  it("serializes structured CV context into a compact plain-text fact sheet", () => {
    const text = serializeSummaryCvContext({
      headline: "Frontend Engineer",
      experience: [
        {
          company: "PT Nusantara",
          position: "Frontend Engineer",
          startDate: "2023",
          endDate: "Present",
          bullets: ["Built dashboards in Next.js"],
        },
      ],
      skills: [{ category: "Frontend", skills: "TypeScript, React" }],
    });
    expect(text).toContain("Headline: Frontend Engineer");
    expect(text).toContain("Frontend Engineer at PT Nusantara");
    expect(text).toContain("TypeScript, React");
  });

  it("returns 401 AI_AUTH_REQUIRED when Authorization header is missing", async () => {
    const req = new Request("http://localhost:3000/api/ai/enhance-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "polish",
        summaryText: "Software engineer focused on React and TypeScript.",
        language: "en",
      }),
    });
    const res = await handleEnhanceSummaryPost(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when polish mode receives too-short summaryText", async () => {
    const req = new Request("http://localhost:3000/api/ai/enhance-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ mode: "polish", summaryText: "short", language: "en" }),
    });
    const res = await handleEnhanceSummaryPost(req, {
      verifyIdToken: mockAuthOk,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 INSUFFICIENT_CONTEXT when generate mode has empty CV context", async () => {
    const req = new Request("http://localhost:3000/api/ai/enhance-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        mode: "generate",
        summaryText: "",
        language: "id",
        cvContext: {},
      }),
    });
    const res = await handleEnhanceSummaryPost(req, {
      verifyIdToken: mockAuthOk,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("INSUFFICIENT_CONTEXT");
  });

  it("returns 503 AI_UNAVAILABLE when GOOGLE_GENERATIVE_AI_API_KEY is missing", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const req = new Request("http://localhost:3000/api/ai/enhance-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        mode: "polish",
        summaryText: "Saya adalah software engineer yang suka membuat web dengan React.",
        language: "id",
      }),
    });
    const res = await handleEnhanceSummaryPost(req, {
      verifyIdToken: mockAuthOk,
    });
    expect(res.status).toBe(503);
    expect(((await res.json()) as { code: string }).code).toBe("AI_UNAVAILABLE");
  });

  it("returns faithful summary in generate mode and flags hallucinated numbers if invented", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");

    const reqFaithful = new Request("http://localhost:3000/api/ai/enhance-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        mode: "generate",
        summaryText: "",
        language: "id",
        cvContext: {
          headline: "Frontend Engineer",
          experience: [
            { company: "PT Nusantara", position: "Frontend Engineer" },
          ],
          skills: [{ category: "Web", skills: "Next.js, TypeScript" }],
        },
      }),
    });

    const resFaithful = await handleEnhanceSummaryPost(reqFaithful, {
      verifyIdToken: mockAuthOk,
      generateSummary: async () => ({
        improvedSummary:
          "Frontend Engineer berpengalaman di PT Nusantara dengan keahlian pada Next.js dan TypeScript untuk membangun antarmuka web modern.",
        reasoning: "Menyusun ringkasan profesional berdasarkan pengalaman dan keahlian CV.",
        missingMetricsHint: "Tambahkan metrik dampak nyata bila tersedia.",
      }),
    });
    expect(resFaithful.status).toBe(200);
    const dataFaithful = (await resFaithful.json()) as {
      improvedSummary: string;
      inventedMetricsDetected: string[];
      quota: { enhance: { used: number; remaining: number } };
    };
    expect(dataFaithful.inventedMetricsDetected).toEqual([]);
    expect(dataFaithful.improvedSummary).toContain("PT Nusantara");
    expect(dataFaithful.quota.enhance.used).toBe(1);
    expect(dataFaithful.quota.enhance.remaining).toBe(9);

    // Hallucinated years/percentage detection
    const reqHallucinated = new Request(
      "http://localhost:3000/api/ai/enhance-summary",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          mode: "polish",
          summaryText:
            "Frontend Engineer yang membangun aplikasi web dengan React dan Next.js.",
          language: "id",
        }),
      }
    );

    const resHallucinated = await handleEnhanceSummaryPost(reqHallucinated, {
      verifyIdToken: mockAuthOk,
      generateSummary: async () => ({
        improvedSummary:
          "Frontend Engineer dengan 5 tahun pengalaman yang meningkatkan konversi 40% menggunakan React dan Next.js.",
        reasoning: "Memperkuat struktur kalimat.",
        missingMetricsHint: null,
      }),
    });
    expect(resHallucinated.status).toBe(200);
    const dataHallucinated = (await resHallucinated.json()) as {
      inventedMetricsDetected: string[];
    };
    expect(dataHallucinated.inventedMetricsDetected).toEqual(["5", "40%"]);
  });
});
