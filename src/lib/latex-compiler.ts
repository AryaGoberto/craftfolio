import { execFile } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { generateLatexDocument } from "@/lib/latex-generator";
import { ResumeDocumentSchema } from "@/lib/schemas/resume";

const execFileAsync = promisify(execFile);

const MAX_BODY_BYTES = 512 * 1024; // 512 KB cap against DoS payloads
const PDFLATEX_TIMEOUT_MS = 15_000;
const PDFLATEX_MAX_BUFFER = 2 * 1024 * 1024;

const COMMON_PDFLATEX_PATHS = [
  "/Library/TeX/texbin/pdflatex",
  "/opt/homebrew/bin/pdflatex",
  "/usr/local/bin/pdflatex",
  "/usr/bin/pdflatex",
];

export type RunPdflatexFn = (
  binary: string,
  args: string[],
  tmpDir: string
) => Promise<void>;

export interface LatexPdfHandlerDeps {
  runPdflatex?: RunPdflatexFn;
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
    env: {
      ...process.env,
      // Web2C paranoid file I/O mode: blocks parent-dir / arbitrary path access
      openout_any: "p",
      openin_any: "p",
    },
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

  const runPdflatex = deps?.runPdflatex ?? defaultRunPdflatex;
  const pdflatexBin = await resolvePdflatexBinary();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "craftfolio-tex-"));

  try {
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
  }
}
