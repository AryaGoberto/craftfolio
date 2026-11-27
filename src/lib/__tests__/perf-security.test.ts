import fs from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config";
import {
  resetTokenVerificationCacheForTests,
  verifyFirebaseIdTokenWithLookup,
} from "@/lib/ai/auth-guard";
import {
  getAiQuotaStoreSizeForTests,
  refundAiQuota,
  reserveAiQuota,
  resetAiQuotaStoreForTests,
} from "@/lib/ai/quota";
import {
  extractResumeFileText,
  extractTextFromDocxBuffer,
  MAX_CV_UPLOAD_BYTES,
} from "@/lib/cv-file-extractor";
import { createSampleResume } from "@/lib/default-resume";
import {
  buildSanitizedLatexEnv,
  handleLatexPdfPost,
  resetLatexCompilerGuardsForTests,
} from "@/lib/latex-compiler";
import { RESUME_LIMITS, ResumeDocumentSchema } from "@/lib/schemas/resume";
import { normalizeUrl, toMailtoHref } from "@/lib/url-utils";
import { createDebouncedStorageWriter } from "@/store/use-resume-store";

/** Builds a minimal single-entry ZIP buffer (method 8 raw DEFLATE) for testing DOCX extraction. */
function buildSingleEntryZip(
  entryName: string,
  plainContent: string,
  overrideDeclaredUncompressedSize?: number
): Uint8Array {
  const nameBytes = Buffer.from(entryName, "utf8");
  const plainBytes = Buffer.from(plainContent, "utf8");
  const compressed = deflateRawSync(plainBytes);
  const declaredUncompressed =
    overrideDeclaredUncompressedSize ?? plainBytes.length;

  // Local File Header (30 bytes + name + compressed payload)
  const localHeader = Buffer.alloc(30 + nameBytes.length);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4); // version needed
  localHeader.writeUInt16LE(0, 6); // flags
  localHeader.writeUInt16LE(8, 8); // deflate
  localHeader.writeUInt32LE(compressed.length, 18);
  localHeader.writeUInt32LE(declaredUncompressed, 22);
  localHeader.writeUInt16LE(nameBytes.length, 26);
  localHeader.writeUInt16LE(0, 28);
  nameBytes.copy(localHeader, 30);

  const centralDirOffset = localHeader.length + compressed.length;

  // Central Directory Header (46 bytes + name)
  const centralHeader = Buffer.alloc(46 + nameBytes.length);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(8, 10); // deflate
  centralHeader.writeUInt32LE(compressed.length, 20);
  centralHeader.writeUInt32LE(declaredUncompressed, 24);
  centralHeader.writeUInt16LE(nameBytes.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt32LE(0, 42); // localHeaderOffset
  nameBytes.copy(centralHeader, 46);

  // End of Central Directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralHeader.length, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return new Uint8Array(
    Buffer.concat([localHeader, compressed, centralHeader, eocd])
  );
}

describe("Performance & Security Hardening (Issue #24)", () => {
  beforeEach(() => {
    resetAiQuotaStoreForTests();
    resetLatexCompilerGuardsForTests();
    resetTokenVerificationCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    resetAiQuotaStoreForTests();
    resetLatexCompilerGuardsForTests();
    resetTokenVerificationCacheForTests();
  });

  describe("PERF-01: Debounced Web Storage Writer", () => {
    it("coalesces rapid keystroke writes into a single write and supports immediate flush/cancel", () => {
      vi.useFakeTimers();
      const writes: Array<[string, string]> = [];
      const writer = createDebouncedStorageWriter((k, v) => {
        writes.push([k, v]);
      }, 300);

      writer.schedule("craftfolio-storage", '{"v":1}');
      writer.schedule("craftfolio-storage", '{"v":2}');
      writer.schedule("craftfolio-storage", '{"v":3}');
      expect(writes).toHaveLength(0);

      vi.advanceTimersByTime(300);
      expect(writes).toEqual([["craftfolio-storage", '{"v":3}']]);

      // Manual flush writes immediately before timer expires
      writer.schedule("craftfolio-storage", '{"v":4}');
      writer.flush();
      expect(writes).toHaveLength(2);
      expect(writes[1]).toEqual(["craftfolio-storage", '{"v":4}']);

      // Cancel drops pending write
      writer.schedule("craftfolio-storage", '{"v":5}');
      writer.cancel("craftfolio-storage");
      vi.advanceTimersByTime(500);
      expect(writes).toHaveLength(2);
    });
  });

  describe("PERF-06: Firebase ID Token Verification Cache", () => {
    it("caches verified token lookups by SHA-256 hash and skips caching invalid tokens", async () => {
      vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-firebase-key");

      let fetchCalls = 0;
      const mockFetch = (async () => {
        fetchCalls += 1;
        return new Response(
          JSON.stringify({
            users: [{ localId: "uid-cached", email: "user@craftfolio.app" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const first = await verifyFirebaseIdTokenWithLookup("token-abc", mockFetch);
      const second = await verifyFirebaseIdTokenWithLookup("token-abc", mockFetch);
      expect(first).toEqual({ uid: "uid-cached", email: "user@craftfolio.app" });
      expect(second).toEqual(first);
      expect(fetchCalls).toBe(1);

      // Invalid token responses must not be cached
      let failCalls = 0;
      const failFetch = (async () => {
        failCalls += 1;
        return new Response(JSON.stringify({ error: "INVALID_ID_TOKEN" }), {
          status: 400,
        });
      }) as typeof fetch;

      expect(await verifyFirebaseIdTokenWithLookup("bad-token", failFetch)).toBeNull();
      expect(await verifyFirebaseIdTokenWithLookup("bad-token", failFetch)).toBeNull();
      expect(failCalls).toBe(2);
    });
  });

  describe("SEC-01: LaTeX Compiler Least-Privilege Env, Origin Guard, Concurrency Cap & Rate Limit", () => {
    it("strips application secrets such as GOOGLE_GENERATIVE_AI_API_KEY from pdflatex child env", () => {
      vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "super-secret-gemini-key");
      const env = buildSanitizedLatexEnv("/tmp/craftfolio-tex-123");

      expect(env.GOOGLE_GENERATIVE_AI_API_KEY).toBeUndefined();
      expect(env.openin_any).toBe("p");
      expect(env.openout_any).toBe("p");
      expect(env.HOME).toBe("/tmp/craftfolio-tex-123");
      expect(env.TMPDIR).toBe("/tmp/craftfolio-tex-123");
    });

    it("rejects cross-origin POST requests with 403 FORBIDDEN_ORIGIN", async () => {
      const doc = createSampleResume("2026-01-01T00:00:00.000Z");
      const req = new Request("https://craftfolio.app/api/pdf/latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://evil.example",
        },
        body: JSON.stringify(doc),
      });

      const res = await handleLatexPdfPost(req);
      expect(res.status).toBe(403);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("FORBIDDEN_ORIGIN");
    });

    it("returns 503 LATEX_COMPILER_BUSY when concurrency & queue capacity are saturated", async () => {
      const doc = createSampleResume("2026-01-01T00:00:00.000Z");
      let releaseFirst!: () => void;
      const firstStarted = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      let finishFirst!: () => void;
      const firstGate = new Promise<void>((resolve) => {
        finishFirst = resolve;
      });

      const makeReq = () =>
        new Request("http://localhost:3000/api/pdf/latex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });

      const p1 = handleLatexPdfPost(makeReq(), {
        maxConcurrent: 1,
        maxQueue: 0,
        bypassRateLimit: true,
        runPdflatex: async (_bin, _args, tmpDir) => {
          releaseFirst();
          await firstGate;
          await fs.writeFile(
            path.join(tmpDir, "resume.pdf"),
            Buffer.from("%PDF-1.5 ok")
          );
        },
      });

      await firstStarted;

      const p2 = handleLatexPdfPost(makeReq(), {
        maxConcurrent: 1,
        maxQueue: 0,
        bypassRateLimit: true,
        runPdflatex: async () => {},
      });

      const res2 = await p2;
      expect(res2.status).toBe(503);
      expect(res2.headers.get("Retry-After")).toBe("5");
      expect(((await res2.json()) as { code: string }).code).toBe(
        "LATEX_COMPILER_BUSY"
      );

      finishFirst();
      const res1 = await p1;
      expect(res1.status).toBe(200);
    });

    it("enforces per-IP rate limiting on POST /api/pdf/latex", async () => {
      const doc = createSampleResume("2026-01-01T00:00:00.000Z");
      const mockRun = async (_bin: string, _args: string[], tmpDir: string) => {
        await fs.writeFile(
          path.join(tmpDir, "resume.pdf"),
          Buffer.from("%PDF-1.5 ok")
        );
      };

      for (let i = 0; i < 10; i++) {
        const res = await handleLatexPdfPost(
          new Request("http://localhost:3000/api/pdf/latex", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "203.0.113.42",
            },
            body: JSON.stringify(doc),
          }),
          { runPdflatex: mockRun }
        );
        expect(res.status).toBe(200);
      }

      const throttled = await handleLatexPdfPost(
        new Request("http://localhost:3000/api/pdf/latex", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "203.0.113.42",
          },
          body: JSON.stringify(doc),
        }),
        { runPdflatex: mockRun }
      );
      expect(throttled.status).toBe(429);
      expect(((await throttled.json()) as { code: string }).code).toBe(
        "LATEX_RATE_LIMITED"
      );
    });
  });

  describe("SEC-02: ResumeDocumentSchema Strict Array & String Bounds", () => {
    it("rejects oversized bullets, links, summary text, and section item counts", () => {
      const base = createSampleResume("2026-01-01T00:00:00.000Z");
      expect(ResumeDocumentSchema.safeParse(base).success).toBe(true);

      const tooManyLinks = structuredClone(base);
      tooManyLinks.basics.links = Array.from(
        { length: RESUME_LIMITS.MAX_LINKS + 1 },
        (_, i) => ({
          id: `l-${i}`,
          label: "Link",
          url: "https://example.com",
          isVisible: true,
        })
      );
      expect(ResumeDocumentSchema.safeParse(tooManyLinks).success).toBe(false);

      const tooLongSummary = structuredClone(base);
      tooLongSummary.basics.summary.text = "a".repeat(
        RESUME_LIMITS.MAX_SUMMARY_LEN + 1
      );
      expect(ResumeDocumentSchema.safeParse(tooLongSummary).success).toBe(false);

      const tooManyBullets = structuredClone(base);
      tooManyBullets.sections.experience.items[0].bullets = Array.from(
        { length: RESUME_LIMITS.MAX_BULLETS_PER_ITEM + 1 },
        (_, i) => ({ id: `b-${i}`, text: "Bullet", isVisible: true })
      );
      expect(ResumeDocumentSchema.safeParse(tooManyBullets).success).toBe(false);
    });
  });

  describe("SEC-03: DOCX Anti-Zip-Bomb & File Upload Size Cap", () => {
    it("extracts normal DOCX content and blocks decompression bombs exceeding XML budget", async () => {
      const normalXml =
        "<w:document><w:body><w:p><w:r><w:t>Budi Santoso - Backend Engineer</w:t></w:r></w:p></w:body></w:document>";
      const validZip = buildSingleEntryZip("word/document.xml", normalXml);
      const text = await extractTextFromDocxBuffer(validZip);
      expect(text).toContain("Budi Santoso - Backend Engineer");

      // Craft a highly compressible XML payload (~10 KB repeated A's) with spoofed header size 0
      // so the streaming DecompressionStream guard (not just header check) must catch and abort it
      const bombXml = `<w:document><w:body><w:p><w:t>${"A".repeat(12_000)}</w:t></w:p></w:body></w:document>`;
      const bombZip = buildSingleEntryZip("word/document.xml", bombXml, 0);

      await expect(
        extractTextFromDocxBuffer(bombZip, { maxUncompressedBytes: 2_048 })
      ).rejects.toThrow(/melebihi batas aman/i);
    });

    it("rejects uploaded files larger than MAX_CV_UPLOAD_BYTES (10 MB)", async () => {
      const fakeLargeFile = {
        name: "huge.pdf",
        type: "application/pdf",
        size: MAX_CV_UPLOAD_BYTES + 1,
      } as File;

      await expect(extractResumeFileText(fakeLargeFile)).rejects.toThrow(
        /terlalu besar/i
      );
    });
  });

  describe("SEC-04: HTTP Security Headers Configuration", () => {
    it("defines CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, and HSTS", async () => {
      expect(typeof nextConfig.headers).toBe("function");
      const rules = await nextConfig.headers!();
      const rootRule = rules.find((r) => r.source === "/(.*)");
      expect(rootRule).toBeDefined();

      const headerMap = new Map(
        (rootRule?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value])
      );
      expect(headerMap.get("x-content-type-options")).toBe("nosniff");
      expect(headerMap.get("x-frame-options")).toBe("DENY");
      expect(headerMap.get("referrer-policy")).toBe(
        "strict-origin-when-cross-origin"
      );
      expect(headerMap.get("permissions-policy")).toContain("camera=()");
      expect(headerMap.get("strict-transport-security")).toContain("max-age=");
      expect(headerMap.get("content-security-policy")).toContain(
        "frame-ancestors 'none'"
      );
      expect(headerMap.get("content-security-policy")).toContain(
        "object-src 'none'"
      );
    });
  });

  describe("SEC-05: Global AI Daily Circuit Breaker & Stale Bucket Pruning", () => {
    it("enforces global daily cap across multiple users, refunds cleanly, and prunes stale days", () => {
      vi.stubEnv("AI_GLOBAL_DAILY_LIMIT", "2");
      const day1 = Date.UTC(2026, 10, 26, 3, 0, 0); // 10:00 WIB

      const r1 = reserveAiQuota("uid-a", "enhance", day1);
      const r2 = reserveAiQuota("uid-b", "enhance", day1 + 1000);
      const r3 = reserveAiQuota("uid-c", "enhance", day1 + 2000);

      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
      expect(r3.allowed).toBe(false);
      if (!r3.allowed) {
        expect(r3.code).toBe("AI_SERVER_QUOTA_EXCEEDED");
      }

      // Refunding uid-b frees the global slot so uid-c succeeds
      if (r2.allowed) {
        refundAiQuota(r2.reservation);
      }
      const r3Retry = reserveAiQuota("uid-c", "enhance", day1 + 3000);
      expect(r3Retry.allowed).toBe(true);
      expect(getAiQuotaStoreSizeForTests()).toBe(3);

      // Next WIB day automatically prunes previous day's user buckets
      const day2 = Date.UTC(2026, 10, 26, 17, 5, 0); // 00:05 WIB next day
      const nextDayRes = reserveAiQuota("uid-new", "enhance", day2);
      expect(nextDayRes.allowed).toBe(true);
      expect(getAiQuotaStoreSizeForTests()).toBe(1);
    });
  });

  describe("SEC-06: Strict URL Protocol Allowlist & Mailto Hardening", () => {
    it("blocks non-allowlisted schemes and control-character obfuscated payloads", () => {
      expect(normalizeUrl("vbscript:msgbox(1)")).toBe("");
      expect(normalizeUrl("file:///etc/passwd")).toBe("");
      expect(normalizeUrl("blob:https://example.com/uuid")).toBe("");
      expect(normalizeUrl("java\tscript:alert(1)")).toBe("");
      expect(normalizeUrl("java\nscript:alert(1)")).toBe("");
    });

    it("blocks mailto header/query injection and malformed email addresses", () => {
      expect(
        toMailtoHref("victim@example.com?bcc=evil@attacker.com&body=hi")
      ).toBe("");
      expect(toMailtoHref("victim@example.com\r\nBcc:evil@attacker.com")).toBe(
        ""
      );
      expect(toMailtoHref("not-an-email")).toBe("");
      expect(normalizeUrl("mailto:raka@example.com?subject=hack")).toBe("");
      expect(toMailtoHref("raka.pratama@example.com")).toBe(
        "mailto:raka.pratama@example.com"
      );
    });
  });
});
