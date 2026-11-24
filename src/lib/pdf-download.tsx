import type { ResumeDocument } from "@/lib/schemas/resume";

/**
 * Generates and downloads a vector PDF for the given ResumeDocument on demand.
 * Uses dynamic imports so pages like `/dashboard` load instantaneously without bundling
 * or executing `@react-pdf/renderer` until the user clicks Download.
 */
export async function downloadResumePdf(doc: ResumeDocument): Promise<void> {
  const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/PdfDocument"),
  ]);

  const blob = await pdf(<ResumePdfDocument doc={doc} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (doc.basics.fullName.trim() || doc.title || "CV")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  a.href = url;
  a.download = `${safeName || "CV"}_CV.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
