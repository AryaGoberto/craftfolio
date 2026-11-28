"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Eraser,
  Files,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useResumeStore } from "@/store/use-resume-store";

export function DocumentSwitcher() {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const setActiveDocument = useResumeStore((s) => s.setActiveDocument);
  const createDocument = useResumeStore((s) => s.createDocument);
  const duplicateDocument = useResumeStore((s) => s.duplicateDocument);
  const deleteDocument = useResumeStore((s) => s.deleteDocument);
  const renameDocument = useResumeStore((s) => s.renameDocument);
  const loadSampleResume = useResumeStore((s) => s.loadSampleResume);
  const clearActiveResume = useResumeStore((s) => s.clearActiveResume);
  const authUser = useResumeStore((s) => s.authUser);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const activeDoc = documents[activeDocumentId];
  if (!activeDoc) return null;

  const docList = Object.values(documents).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 min-w-0">
      <input
        type="text"
        value={activeDoc.title}
        onChange={(e) => renameDocument(activeDoc.id, e.target.value)}
        aria-label="Judul Dokumen CV"
        className="h-7 px-2 text-[12.5px] font-medium text-ui-text bg-ui-panel border border-ui-border rounded-md w-32 sm:w-44 truncate focus:outline-none focus:ring-1 focus:ring-ui-focus"
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Kelola & ganti dokumen CV"
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-ui-card border border-ui-border text-[11.5px] font-medium text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle shrink-0 transition-colors"
      >
        <Files className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{docList.length}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-72 bg-ui-card border border-ui-border rounded-lg shadow-xl p-2 z-50">
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ui-text-secondary">
              Dokumen CV ({docList.length})
            </span>
            <button
              type="button"
              onClick={() => {
                if (!authUser && docList.length >= 1) {
                  openAuthModal(
                    "Mode Guest dibatasi maksimal 1 file CV. Masuk atau buat akun gratis untuk membuat file CV tanpa batas dan tersimpan di cloud."
                  );
                  return;
                }
                createDocument(`CV Baru ${docList.length + 1}`);
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-ui-text hover:underline"
            >
              <Plus className="w-3 h-3" />
              Baru
            </button>
          </div>

          {/* Document List */}
          <div className="mt-1 max-h-52 overflow-y-auto space-y-1">
            {docList.map((item) => {
              const isActive = item.id === activeDocumentId;
              return (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md text-[12px] transition-colors ${
                    isActive
                      ? "bg-ui-subtle text-ui-text font-medium"
                      : "text-ui-text-secondary hover:bg-ui-panel hover:text-ui-text"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDocument(item.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-ui-success" : "opacity-0"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.title || "Tanpa Judul"}</div>
                      <div className="text-[10.5px] text-ui-text-placeholder truncate">
                        {item.basics.fullName || "Belum ada nama"}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        duplicateDocument(item.id);
                        setOpen(false);
                      }}
                      title="Duplikasi CV ini"
                      className="p-1 text-ui-text-placeholder hover:text-ui-text rounded hover:bg-ui-card"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {docList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteDocument(item.id)}
                        title="Hapus CV ini"
                        className="p-1 text-ui-text-placeholder hover:text-ui-error rounded hover:bg-ui-card"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="my-2 border-t border-ui-divider" />

          {/* Quick Actions for Active Document */}
          <div className="space-y-1 text-[12px]">
            <button
              type="button"
              onClick={() => {
                duplicateDocument(activeDoc.id);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
            >
              <Copy className="w-3.5 h-3.5 text-ui-text-secondary" />
              Duplikasi CV Aktif
            </button>
            <button
              type="button"
              onClick={() => {
                loadSampleResume();
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
            >
              <Sparkles className="w-3.5 h-3.5 text-ui-text-secondary" />
              Isi dengan Data Contoh
            </button>
            <button
              type="button"
              onClick={() => {
                clearActiveResume();
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-ui-error-bg flex items-center gap-2 text-ui-error"
            >
              <Eraser className="w-3.5 h-3.5" />
              Kosongkan Form Aktif
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
