import { execFile } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { generateLatexDocument } from "@/lib/latex-generator";
import { ResumeDocumentSchema } from "@/lib/schemas/resume";
import {
  createSlidingWindowRateLimiter,
  extractClientIp,
  verifySameOriginRequest,
} from "@/lib/security/request-guard";

const execFileAsync = promisify(execFile);

const MAX_BODY_BYTES = 512 * 1024; // 512 KB cap against DoS payloads
const PDFLATEX_TIMEOUT_MS = 15_000;
const PDFLATEX_MAX_BUFFER = 2 * 1024 * 1024;
const DEFAULT_MAX_CONCURRENT_PDFLATEX = 2;
const DEFAULT_MAX_PDFLATEX_QUEUE = 6;
const DEFAULT_LATEX_RATE_LIMIT_PER_MIN = 10;

const COMMON_PDFLATEX_PATHS = [
  "/Library/TeX/texbin/pdflatex",
  "/opt/homebrew/bin/pdflatex",
  "/usr/local/bin/pdflatex",
  "/usr/bin/pdflatex",
];

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const latexIpLimiter = createSlidingWindowRateLimiter({
  maxRequests: parsePositiveIntEnv(
    "LATEX_RATE_LIMIT_PER_MINUTE",
    DEFAULT_LATEX_RATE_LIMIT_PER_MIN
  ),
  windowMs: 60_000,
});

interface ConcurrencyState {
  active: number;
  waiters: Array<() => void>;
}

const globalLatexConcurrency = globalThis as typeof globalThis & {
  __craftfolioLatexConcurrency?: ConcurrencyState;
};

function getConcurrencyState(): ConcurrencyState {
  if (!globalLatexConcurrency.__craftfolioLatexConcurrency) {
    globalLatexConcurrency.__craftfolioLatexConcurrency = {
      active: 0,
      waiters: [],
    };
  }
  return globalLatexConcurrency.__craftfolioLatexConcurrency;
}

async function acquireLatexSlot(
  maxConcurrent: number,
  maxQueue: number
): Promise<(() => void) | null> {
  const state = getConcurrencyState();

  if (state.active < maxConcurrent) {
    state.active += 1;
    return () => releaseLatexSlot();
  }

  if (state.waiters.length >= maxQueue) {
    return null;
  }

  await new Promise<void>((resolve) => {
    state.waiters.push(resolve);
  });
  return () => releaseLatexSlot();
}

function releaseLatexSlot(): void {
  const state = getConcurrencyState();
  const next = state.waiters.shift();
  if (next) {
    // Hand active slot directly to next waiter without decrementing active count
    next();
  } else {
    state.active = Math.max(0, state.active - 1);
  }
}

export function resetLatexCompilerGuardsForTests(): void {
  latexIpLimiter.reset();
  const state = getConcurrencyState();
  state.active = 0;
  state.waiters.length = 0;
}

/**
 * Builds a minimal least-privilege environment for `pdflatex` so application secrets
 * (such as `GOOGLE_GENERATIVE_AI_API_KEY`) are never exposed to the child process.
 */
export function buildSanitizedLatexEnv(tmpDir: string): NodeJS.ProcessEnv {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    PATH:
      process.env.PATH ||
      "/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
    HOME: tmpDir,
    TMPDIR: tmpDir,
    TEXMFVAR: process.env.TEXMFVAR || "/tmp/texmf-var",
    LANG: "C.UTF-8",
    // Web2C paranoid file I/O mode: blocks parent-dir / arbitrary path access
    openout_any: "p",
    openin_any: "p",
  };
}

export type RunPdflatexFn = (
  binary: string,
  args: string[],
  tmpDir: string
) => Promise<void>;

export interface LatexPdfHandlerDeps {
  runPdflatex?: RunPdflatexFn;
  maxConcurrent?: number;
  maxQueue?: number;
  bypassRateLimit?: boolean;
}

async function resolvePdflatexBinary(): Promise<string> {
  const configured = process.env.PDFLATEX_BIN?.trim();
  if (configured) return configured;

  for (const candidate of COMMON_PDFLATEX_PATHS) {
    try {
      await fs.access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Try next candidate
    }
  }

  return "pdflatex";
}

const defaultRunPdflatex: RunPdflatexFn = async (binary, args, tmpDir) => {
  await execFileAsync(binary, args, {
    cwd: tmpDir,
    timeout: PDFLATEX_TIMEOUT_MS,
    maxBuffer: PDFLATEX_MAX_BUFFER,
    env: buildSanitizedLatexEnv(tmpDir),
  });
};

async function safeRemoveTmpDir(tmpDir: string): Promise<void> {
  if (!tmpDir) return;
  const resolvedRoot = await fs.realpath(os.tmpdir()).catch(() => path.resolve(os.tmpdir()));
  const resolvedTarget = await fs.realpath(tmpDir).catch(() => path.resolve(tmpDir));

  if (
    path.dirname(resolvedTarget) === resolvedRoot &&
    path.basename(resolvedTarget).startsWith("craftfolio-tex-")
  ) {
    await fs.rm(resolvedTarget, { recursive: true, force: true });
  }
}

export async function handleLatexPdfPost(
  request: Request,
  deps?: LatexPdfHandlerDeps
): Promise<NextResponse> {
  const originError = verifySameOriginRequest(request);
  if (originError) {
    return originError;
  }

  if (!deps?.bypassRateLimit) {
    const clientIp = extractClientIp(request);
    const rate = latexIpLimiter.consume(clientIp);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          code: "LATEX_RATE_LIMITED",
          error:
            "Terlalu banyak permintaan ekspor PDF dalam waktu singkat. Coba lagi sebentar lagi.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", error: "Request body tidak dapat dibaca." },
      { status: 400 }
    );
  }

  if (Buffer.byteLength(rawText, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { code: "PAYLOAD_TOO_LARGE", error: "Ukuran dokumen CV melebihi batas." },
      { status: 413 }
    );
  }

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", error: "Format JSON tidak valid." },
      { status: 400 }
    );
  }

  const parsed = ResumeDocumentSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", error: "Skema dokumen CV tidak valid." },
      { status: 400 }
    );
  }

  const maxConcurrent =
    deps?.maxConcurrent ??
    parsePositiveIntEnv("LATEX_MAX_CONCURRENT", DEFAULT_MAX_CONCURRENT_PDFLATEX);
  const maxQueue =
    deps?.maxQueue ??
    parsePositiveIntEnv("LATEX_MAX_QUEUE", DEFAULT_MAX_PDFLATEX_QUEUE);

  const releaseSlot = await acquireLatexSlot(maxConcurrent, maxQueue);
  if (!releaseSlot) {
    return NextResponse.json(
      {
        code: "LATEX_COMPILER_BUSY",
        error:
          "Server kompilasi PDF sedang sibuk. Silakan coba beberapa detik lagi.",
      },
      {
        status: 503,
        headers: { "Retry-After": "5" },
      }
    );
  }

  const runPdflatex = deps?.runPdflatex ?? defaultRunPdflatex;
  const pdflatexBin = await resolvePdflatexBinary();
  let tmpDir = "";

  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "craftfolio-tex-"));
    const texSource = generateLatexDocument(parsed.data);
    const texFilePath = path.join(tmpDir, "resume.tex");
    const pdfFilePath = path.join(tmpDir, "resume.pdf");

    await fs.writeFile(texFilePath, texSource, "utf8");

    const args = [
      "-no-shell-escape",
      "-interaction=nonstopmode",
      "-halt-on-error",
      `-output-directory=${tmpDir}`,
      texFilePath,
    ];

    try {
      await runPdflatex(pdflatexBin, args, tmpDir);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code === "ENOENT") {
        return NextResponse.json(
          {
            code: "LATEX_COMPILER_UNAVAILABLE",
            error: "Compiler pdflatex belum tersedia di server ini.",
          },
          { status: 503 }
        );
      }

      const logPath = path.join(tmpDir, "resume.log");
      const logContent = await fs.readFile(logPath, "utf8").catch(() => "");
      const errorLines = logContent
        .split("\n")
        .filter((line) => line.startsWith("!"))
        .slice(0, 5)
        .join(" | ");
      if (errorLines) {
        console.error("[pdflatex] Compilation error:", errorLines);
      }

      return NextResponse.json(
        {
          code: "LATEX_COMPILATION_FAILED",
          error: "Gagal mengompilasi dokumen PDF LaTeX.",
        },
        { status: 500 }
      );
    }

    const pdfBuffer = await fs.readFile(pdfFilePath);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "X-Pdf-Engine": "pdflatex",
      },
    });
  } finally {
    await safeRemoveTmpDir(tmpDir);
    releaseSlot();
  }
}
