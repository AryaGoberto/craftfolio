"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Eye, FileSearch, Minus, Plus, Sparkles } from "lucide-react";
import { useResumeStore } from "@/store/use-resume-store";
import { PAPER_DIMENSIONS } from "@/lib/template-tokens";
import { ResumeHtmlRenderer } from "@/components/preview/ResumeHtmlRenderer";
import { AtsXRayView } from "@/components/preview/AtsXRayView";

interface PreviewPanelProps {
  onPageStatsChange?: (pageCount: number, lastPageFillRatio: number) => void;
}

export function PreviewPanel({ onPageStatsChange }: PreviewPanelProps) {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const previewZoom = useResumeStore((s) => s.previewZoom);
  const previewMode = useResumeStore((s) => s.previewMode);
  const showGhostPreview = useResumeStore((s) => s.showGhostPreview);
  const setPreviewZoom = useResumeStore((s) => s.setPreviewZoom);
  const setPreviewMode = useResumeStore((s) => s.setPreviewMode);
  const toggleGhostPreview = useResumeStore((s) => s.toggleGhostPreview);
  const updateConfig = useResumeStore((s) => s.updateConfig);

  const doc = documents[activeDocumentId];
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [pageCount, setPageCount] = useState(1);
  const [lastPageFillRatio, setLastPageFillRatio] = useState(1);

  const paper = doc ? PAPER_DIMENSIONS[doc.config.paperSize] : PAPER_DIMENSIONS.A4;

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !doc) return;

    const measure = () => {
      const scrollH = el.scrollHeight;
      const pages = Math.max(1, Math.ceil(scrollH / paper.heightPx));
      const remainder = scrollH % paper.heightPx;
      const fill = pages === 1 ? scrollH / paper.heightPx : remainder === 0 ? 1 : remainder / paper.heightPx;
      setPageCount(pages);
      setLastPageFillRatio(fill);
      onPageStatsChange?.(pages, fill);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc, paper.heightPx, onPageStatsChange]);

  const handleFit = () => {
    const wrapper = containerRef.current;
    if (!wrapper) return;
    const availableWidth = wrapper.clientWidth - 48;
    const fitScale = Math.min(1, Math.max(0.45, availableWidth / paper.widthPx));
    setPreviewZoom(Number(fitScale.toFixed(2)));
  };

  if (!doc) return null;

  const isOverflow =
    pageCount > doc.config.targetPages ||
    (pageCount > 1 && lastPageFillRatio > 0 && lastPageFillRatio < 0.15);

  return (
    <section className="flex-1 flex flex-col bg-[#F8F9FA] h-full overflow-hidden">
      {/* Preview Top Strip */}
      <div className="h-11 px-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between gap-3 shrink-0">
        {/* Segmented Mode Switch */}
        <div className="inline-flex items-center bg-[#F4F4F5] p-0.5 rounded-md border border-[#E4E4E7]">
          <button
            type="button"
            onClick={() => setPreviewMode("visual")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
              previewMode === "visual"
                ? "bg-white text-[#09090B] shadow-sm"
                : "text-[#52525B] hover:text-[#09090B]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual Preview
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("xray")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
              previewMode === "xray"
                ? "bg-white text-[#09090B] shadow-sm"
                : "text-[#52525B] hover:text-[#09090B]"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            ATS X-Ray Mode
          </button>
        </div>

        {/* Right Controls: Ghost Guide, Paper, Zoom, Page Counter */}
        <div className="flex items-center gap-2 text-[12px]">
          {previewMode === "visual" && (
            <button
              type="button"
              onClick={() => toggleGhostPreview()}
              aria-pressed={showGhostPreview}
              title="Tampilkan/sembunyikan teks contoh panduan (abu-abu) pada bagian kosong. Teks panduan tidak pernah ikut terekspor ke PDF."
              className={`hidden md:inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
                showGhostPreview
                  ? "bg-white border-[#18181B] text-[#09090B]"
                  : "bg-[#F4F4F5] border-[#E4E4E7] text-[#52525B] hover:text-[#09090B]"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Panduan: {showGhostPreview ? "ON" : "OFF"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              updateConfig({
                paperSize: doc.config.paperSize === "A4" ? "LETTER" : "A4",
              })
            }
            title="Klik untuk ganti ukuran kertas (A4 / Letter)"
            className="px-2 py-1 rounded bg-white border border-[#E4E4E7] font-medium text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
          >
            {paper.label}
          </button>

          <div className="hidden sm:inline-flex items-center bg-[#F4F4F5] p-0.5 rounded-md border border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setPreviewZoom(Number((previewZoom - 0.1).toFixed(2)))}
              className="p-1 text-[#52525B] hover:text-[#09090B]"
              aria-label="Perkecil preview"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono tabular-nums text-[#09090B]">
              {Math.round(previewZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setPreviewZoom(Number((previewZoom + 0.1).toFixed(2)))}
              className="p-1 text-[#52525B] hover:text-[#09090B]"
              aria-label="Perbesar preview"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="h-4 w-px bg-[#E4E4E7] mx-0.5" />
            <button
              type="button"
              onClick={handleFit}
              className="px-2 py-0.5 text-[11px] font-medium text-[#52525B] hover:text-[#09090B]"
            >
              Fit
            </button>
          </div>

          <span className="text-[11px] font-mono tabular-nums text-[#52525B] whitespace-nowrap">
            Halaman {pageCount} / {doc.config.targetPages}
          </span>
        </div>
      </div>

      {/* Overflow Banner */}
      {isOverflow && previewMode === "visual" && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-3 text-[12px] text-[#92400E] shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>
              Konten meluber ke {pageCount} halaman (target {doc.config.targetPages} halaman).
            </span>
          </div>
          {doc.config.density !== "compact" && (
            <button
              type="button"
              onClick={() => updateConfig({ density: "compact" })}
              className="px-2.5 py-1 rounded bg-[#18181B] text-white text-[11px] font-medium hover:bg-[#27272A] shrink-0"
            >
              Ubah ke Compact
            </button>
          )}
        </div>
      )}

      {/* Scrollable Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex justify-center items-start"
      >
        {previewMode === "xray" ? (
          <AtsXRayView doc={doc} />
        ) : (
          <div
            style={{
              width: `${paper.widthPx * previewZoom}px`,
              minHeight: `${paper.heightPx * previewZoom}px`,
            }}
            className="relative shrink-0"
          >
            <div
              ref={contentRef}
              style={{
                width: `${paper.widthPx}px`,
                transform: `scale(${previewZoom})`,
                transformOrigin: "top left",
              }}
              className="relative shadow-xl border border-[#E4E4E7] bg-white"
            >
              <ResumeHtmlRenderer
                doc={doc}
                showGhostPlaceholders={showGhostPreview}
              />

              {/* Page Break Indicators */}
              {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, idx) => (
                <div
                  key={idx}
                  style={{ top: `${paper.heightPx * (idx + 1)}px` }}
                  className="absolute left-0 right-0 border-t border-dashed border-[#A1A1AA] pointer-events-none flex justify-end"
                >
                  <span className="bg-[#F4F4F5] text-[#52525B] text-[10px] px-1.5 py-0.5 rounded-b border border-t-0 border-[#E4E4E7]">
                    Batas Halaman {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
