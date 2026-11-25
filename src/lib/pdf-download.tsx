import type { ResumeDocument } from "@/lib/schemas/resume";
import { generateLatexDocument } from "@/lib/latex-generator";

export type PdfExportEngine = "pdflatex" | "react-pdf-fallback";

export interface PdfDownloadResult {
  engine: PdfExportEngine;
}

function getSafeBaseFilename(doc: ResumeDocument): string {
  const safeName = (doc.basics.fullName.trim() || doc.title.trim() || "CV")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safeName || "CV";
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads an Overleaf-grade PDF for the given ResumeDocument.
 *
 * 1. Tries `POST /api/pdf/latex` (real `pdflatex` compilation for 100% Overleaf parity).
 * 2. Automatically falls back to client-side `@react-pdf/renderer` if `pdflatex` is not
 *    installed on the current host (`503 LATEX_COMPILER_UNAVAILABLE`) or unreachable.
 */
export async function downloadResumePdf(
  doc: ResumeDocument
): Promise<PdfDownloadResult> {
  const filename = `${getSafeBaseFilename(doc)}_CV.pdf`;

  try {
    const res = await fetch("/api/pdf/latex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });

    if (
      res.ok &&
      res.headers.get("Content-Type")?.toLowerCase().includes("application/pdf")
    ) {
      const pdfBlob = await res.blob();
      triggerBrowserDownload(pdfBlob, filename);
      return { engine: "pdflatex" };
    }
  } catch {
    // Network / offline environment -> proceed cleanly to client-side fallback
  }

  const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/PdfDocument"),
  ]);

  const fallbackBlob = await pdf(<ResumePdfDocument doc={doc} />).toBlob();
  triggerBrowserDownload(fallbackBlob, filename);
  return { engine: "react-pdf-fallback" };
}

/**
 * Generates and downloads a standalone Overleaf-ready `.tex` source file
 * directly in the browser without requiring any server dependencies.
 */
export function downloadResumeTex(doc: ResumeDocument): void {
  const texSource = generateLatexDocument(doc);
  const blob = new Blob([texSource], { type: "text/plain;charset=utf-8" });
  triggerBrowserDownload(blob, `${getSafeBaseFilename(doc)}_CV.tex`);
}
