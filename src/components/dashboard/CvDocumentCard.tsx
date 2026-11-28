"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileJson,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ResumeDocument } from "@/lib/schemas/resume";
import {
  TEMPLATE_DISPLAY_NAMES,
  formatDashboardDate,
  getCvCompletionStatus,
} from "@/lib/dashboard-utils";
import { ResumeHtmlRenderer } from "@/components/preview/ResumeHtmlRenderer";

interface CvDocumentCardProps {
  doc: ResumeDocument;
  canDelete: boolean;
  onOpenEditor: () => void;
  onRename: (newTitle: string) => void;
  onDuplicate: () => void;
  onExportJson: () => void;
  onDelete: () => void;
}

export const CvDocumentCard = memo(function CvDocumentCard({
  doc,
  canDelete,
  onOpenEditor,
  onRename,
  onDuplicate,
  onExportJson,
  onDelete,
}: CvDocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(doc.title);
  const [isDownloading, setIsDownloading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const status = useMemo(() => getCvCompletionStatus(doc), [doc]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (isRenaming) {
      cancelledRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
    setDraftTitle(doc.title);
    setIsRenaming(true);
  };

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    onRename(trimmed || "Tanpa Judul");
    setIsRenaming(false);
  };

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setMenuOpen(false);
    setIsDownloading(true);
    try {
      const { downloadResumePdf } = await import("@/lib/pdf-download");
      await downloadResumePdf(doc);
    } catch (err) {
      console.error("Failed to download PDF from dashboard:", err);
      alert("Gagal mengunduh file PDF. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "auto 380px",
      }}
      className="bg-ui-card border border-ui-border hover:border-ui-border-strong rounded-lg flex flex-col justify-between transition-colors"
    >
      {/* Top Miniature A4 Paper Preview */}
      <button
        type="button"
        onClick={onOpenEditor}
        aria-label={`Buka ${doc.title || "CV"} di Editor`}
        className="group relative w-full bg-ui-panel border-b border-ui-border p-4 flex justify-center overflow-hidden rounded-t-lg cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
      >
        <div className="w-[216px] h-[272px] bg-white border border-[#E4E4E7] shadow-xs rounded-xs overflow-hidden relative pointer-events-none select-none">
          <div
            style={{
              width: "794px",
              transform: "scale(0.272)",
              transformOrigin: "top left",
            }}
          >
            <ResumeHtmlRenderer doc={doc} />
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10.5px] font-medium border ${
            status === "ready"
              ? "bg-ui-success-bg text-ui-success-text border-ui-success-border"
              : "bg-ui-warning-bg text-ui-warning-text border-ui-warning-border"
          }`}
        >
          {status === "ready" ? "Siap" : "Draf"}
        </span>

        {/* Subtle Hover Hint */}
        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-ui-primary/90 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Buka Editor →
        </span>
      </button>

      {/* Bottom Metadata & Actions */}
      <div className="p-4 space-y-3">
        <div>
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelledRef.current = true;
                  setIsRenaming(false);
                }
              }}
              onBlur={() => {
                if (!cancelledRef.current) commitRename();
              }}
              aria-label="Ubah judul CV"
              className="w-full h-7 px-2 text-[13.5px] font-semibold text-ui-text bg-ui-card border border-ui-primary rounded focus:outline-none"
            />
          ) : (
            <h2
              onDoubleClick={startRename}
              title="Klik ganda untuk ubah judul"
              className="text-[14px] font-semibold text-ui-text truncate"
            >
              {doc.title || "Tanpa Judul"}
            </h2>
          )}

          <p className="mt-0.5 text-[12px] text-ui-text-secondary truncate">
            {doc.targetRole || doc.basics.fullName || "Belum ada target posisi"}
          </p>
          <p className="mt-1 text-[11px] font-mono text-ui-text-muted truncate">
            {TEMPLATE_DISPLAY_NAMES[doc.config.templateId]} ·{" "}
            {formatDashboardDate(doc.updatedAt)}
          </p>
        </div>

        {/* Action Strip: Direct PDF Download + Edit + ⋮ Context Menu */}
        <div className="pt-3 border-t border-ui-divider flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ui-primary hover:bg-ui-primary-hover disabled:opacity-60 text-white text-[12px] font-medium transition-colors"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? "Menyiapkan..." : "Download PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex items-center h-8 px-2.5 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle text-[12px] font-medium text-ui-text transition-colors"
            >
              Edit
            </button>
          </div>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setConfirmDelete(false);
              }}
              aria-label={`Menu aksi untuk ${doc.title || "CV"}`}
              aria-expanded={menuOpen}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${
                menuOpen
                  ? "bg-ui-subtle text-ui-text"
                  : "text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle"
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 bottom-full mb-1.5 w-52 bg-ui-card border border-ui-border rounded-lg shadow-xl py-1 z-40 text-[12px]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenEditor();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Buka di Editor
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={startRename}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <Pencil className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Ubah Nama
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <Copy className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Duplikasi CV
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDownloadPdf}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <Download className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Download PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void import("@/lib/pdf-download").then(({ downloadResumeTex }) =>
                      downloadResumeTex(doc)
                    );
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Export LaTeX (.tex)
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onExportJson();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <FileJson className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Export Backup .json
                </button>

                <div className="my-1 border-t border-ui-divider" />

                <button
                  type="button"
                  role="menuitem"
                  disabled={!canDelete}
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                      return;
                    }
                    setMenuOpen(false);
                    setConfirmDelete(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-ui-error-bg disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-2 text-ui-error"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {confirmDelete ? "Klik lagi untuk hapus" : "Hapus CV"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});
