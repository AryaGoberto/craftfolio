"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { ResumeDocument } from "@/lib/schemas/resume";
import { downloadResumePdf } from "@/lib/pdf-download";

export function PdfExportButton({ doc }: { doc: ResumeDocument }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await downloadResumePdf(doc);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Gagal membuat file PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#18181B] text-white text-[12px] font-medium hover:bg-[#27272A] disabled:opacity-60 transition-colors shrink-0"
    >
      {isGenerating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>{isGenerating ? "Menyiapkan..." : "Download PDF"}</span>
    </button>
  );
}
