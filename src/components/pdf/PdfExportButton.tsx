"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import type { ResumeDocument } from "@/lib/schemas/resume";
import { downloadResumePdf, downloadResumeTex } from "@/lib/pdf-download";
import { markFoldyPdfExported } from "@/lib/foldy-prefs";
import { emitFoldyEvent } from "@/lib/foldy-events";

export function PdfExportButton({ doc }: { doc: ResumeDocument }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);

  useEffect(() => {
    if (!showFallbackNotice) return;
    const timer = setTimeout(() => setShowFallbackNotice(false), 6000);
    return () => clearTimeout(timer);
  }, [showFallbackNotice]);

  const handleDownload = async () => {
    setIsGenerating(true);
    setShowFallbackNotice(false);
    try {
      const result = await downloadResumePdf(doc);
      if (result.engine === "react-pdf-fallback") {
        setShowFallbackNotice(true);
      }
      markFoldyPdfExported(doc.id);
      emitFoldyEvent({ type: "pdf-exported", docId: doc.id });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Gagal membuat file PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        title="Download PDF (Overleaf LaTeX)"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ui-primary text-white text-[12px] font-medium hover:bg-ui-primary-hover disabled:opacity-60 transition-colors shrink-0"
      >
        {isGenerating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{isGenerating ? "Menyiapkan..." : "Download PDF"}</span>
      </button>

      {showFallbackNotice && (
        <div
          role="status"
          className="absolute right-0 mt-2 w-72 bg-ui-card border border-ui-border rounded-lg shadow-xl p-3 z-50 text-[11.5px] text-ui-text-secondary leading-relaxed"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-ui-text">
              PDF diunduh (Mode Browser Fallback)
            </p>
            <button
              type="button"
              onClick={() => setShowFallbackNotice(false)}
              aria-label="Tutup info"
              className="text-ui-text-muted hover:text-ui-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-1">
            Compiler <code className="font-mono text-[11px]">pdflatex</code>{" "}
            belum aktif di mesin lokal ini. Untuk hasil 100% Overleaf, jalankan
            via Docker atau unduh file{" "}
            <button
              type="button"
              onClick={() => {
                downloadResumeTex(doc);
                setShowFallbackNotice(false);
              }}
              className="font-medium text-ui-link underline underline-offset-2 hover:text-ui-link-hover"
            >
              .tex (Overleaf)
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}
