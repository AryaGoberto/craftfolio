"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  FileJson,
  LayoutGrid,
  Redo2,
  SlidersHorizontal,
  Undo2,
  Upload,
} from "lucide-react";
import { useStore } from "zustand";
import { useResumeStore } from "@/store/use-resume-store";
import { DocumentSwitcher } from "@/components/editor/DocumentSwitcher";
import type { AtsLintReport } from "@/lib/ats-linter";
import type {
  DensityPreset,
  FontFamilyPreset,
  TemplateId,
} from "@/lib/schemas/resume";

const PdfExportButton = dynamic(
  () =>
    import("@/components/pdf/PdfExportButton").then(
      (mod) => mod.PdfExportButton
    ),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center h-8 px-3 rounded-md bg-[#18181B] text-white text-[12px] font-medium opacity-70">
        Download PDF
      </span>
    ),
  }
);

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  "classic-latex": "Classic Academic",
  "modern-minimal": "Modern Minimalist",
  compact: "Compact",
  executive: "Executive Standard",
};

const FONT_LABELS: Record<FontFamilyPreset, string> = {
  inter: "Inter",
  roboto: "Roboto",
  serif: "EB Garamond",
  georgia: "Merriweather",
};

const DENSITY_LABELS: Record<DensityPreset, string> = {
  compact: "Compact",
  normal: "Normal",
  relaxed: "Relaxed",
};

interface EditorTopBarProps {
  lintReport: AtsLintReport;
  onOpenAtsModal: () => void;
}

export function EditorTopBar({
  lintReport,
  onOpenAtsModal,
}: EditorTopBarProps) {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const saveStatus = useResumeStore((s) => s.saveStatus);
  const updateConfig = useResumeStore((s) => s.updateConfig);
  const setLanguage = useResumeStore((s) => s.setLanguage);
  const exportResumeJson = useResumeStore((s) => s.exportResumeJson);
  const importResumeJson = useResumeStore((s) => s.importResumeJson);

  const pastStates = useStore(useResumeStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useResumeStore.temporal, (s) => s.futureStates);
  const undo = useStore(useResumeStore.temporal, (s) => s.undo);
  const redo = useStore(useResumeStore.temporal, (s) => s.redo);

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showJsonMenu, setShowJsonMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  const handleExportJson = () => {
    const json = exportResumeJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]+/g, "_") || "cv"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowJsonMenu(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = importResumeJson(text);
    if (!res.ok) {
      alert(res.error || "Gagal mengimpor file JSON.");
    }
    e.target.value = "";
    setShowJsonMenu(false);
  };

  const atsDotColor =
    lintReport.summary.fix > 0
      ? "bg-[#EF4444]"
      : lintReport.summary.review > 0
      ? "bg-[#F59E0B]"
      : "bg-[#10B981]";

  const atsBadgeLabel =
    lintReport.summary.fix > 0
      ? `ATS: ${lintReport.summary.fix} Fix`
      : lintReport.summary.review > 0
      ? `ATS: ${lintReport.summary.review} Review`
      : "ATS: Good";

  return (
    <header className="h-12 px-3 sm:px-4 bg-white border-b border-[#E4E4E7] flex items-center justify-between gap-2 shrink-0 z-30">
      {/* Left: Brand + Document Title + Save status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center font-bold text-[13px] select-none">
            F
          </div>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#09090B] hidden sm:inline">
            FormaCV
          </span>
        </Link>

        <span className="h-4 w-px bg-[#E4E4E7] hidden sm:inline-block" />

        <DocumentSwitcher />

        <span
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[#52525B]"
          title="Status penyimpanan lokal"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === "saving" ? "bg-[#F59E0B]" : "bg-[#10B981]"
            }`}
          />
          {saveStatus === "saving" ? "Menyimpan..." : "Disimpan"}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Template Selector & Gallery Link */}
        <div className="hidden lg:flex items-center gap-1.5">
          <Link
            href="/templates"
            title="Lihat Galeri Template ATS"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white border border-[#E4E4E7] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Galeri</span>
          </Link>
          <select
            value={doc.config.templateId}
            onChange={(e) =>
              updateConfig({ templateId: e.target.value as TemplateId })
            }
            aria-label="Pilih Template ATS"
            className="h-8 px-2.5 text-[12px] font-medium text-[#18181B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B]"
          >
            {Object.entries(TEMPLATE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Layout / Density / Font Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLayoutMenu((v) => !v);
              setShowJsonMenu(false);
            }}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white border border-[#E4E4E7] text-[12px] font-medium text-[#18181B] hover:bg-[#F4F4F5]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#52525B]" />
            <span className="hidden md:inline">
              {DENSITY_LABELS[doc.config.density]} ·{" "}
              {FONT_LABELS[doc.config.fontFamily]}
            </span>
            <ChevronDown className="w-3 h-3 text-[#52525B]" />
          </button>

          {showLayoutMenu && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#E4E4E7] rounded-lg shadow-xl p-3 space-y-3 z-50">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-[#52525B]">
                    Template ATS
                  </label>
                  <Link
                    href="/templates"
                    onClick={() => setShowLayoutMenu(false)}
                    className="text-[11px] font-medium text-[#18181B] hover:underline"
                  >
                    Lihat galeri →
                  </Link>
                </div>
                <select
                  value={doc.config.templateId}
                  onChange={(e) =>
                    updateConfig({ templateId: e.target.value as TemplateId })
                  }
                  className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md"
                >
                  {Object.entries(TEMPLATE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                  Kerapatan Spasi
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#F4F4F5] p-0.5 rounded-md">
                  {(["compact", "normal", "relaxed"] as DensityPreset[]).map(
                    (d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateConfig({ density: d })}
                        className={`py-1 text-[11px] font-medium rounded ${
                          doc.config.density === d
                            ? "bg-white text-[#09090B] shadow-sm"
                            : "text-[#52525B]"
                        }`}
                      >
                        {DENSITY_LABELS[d]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                  Font Dokumen
                </label>
                <select
                  value={doc.config.fontFamily}
                  onChange={(e) =>
                    updateConfig({
                      fontFamily: e.target.value as FontFamilyPreset,
                    })
                  }
                  className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md"
                >
                  {Object.entries(FONT_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                    Target Halaman
                  </label>
                  <select
                    value={doc.config.targetPages}
                    onChange={(e) =>
                      updateConfig({
                        targetPages: Number(e.target.value) as 1 | 2,
                      })
                    }
                    className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md"
                  >
                    <option value={1}>1 Halaman</option>
                    <option value={2}>2 Halaman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                    Bahasa CV
                  </label>
                  <select
                    value={doc.language}
                    onChange={(e) =>
                      setLanguage(e.target.value as "id" | "en")
                    }
                    className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLayoutMenu(false)}
                className="w-full h-7 rounded bg-[#18181B] text-white text-[11px] font-medium inline-flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" /> Selesai
              </button>
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <div className="hidden sm:inline-flex items-center border border-[#E4E4E7] rounded-md bg-white">
          <button
            type="button"
            disabled={pastStates.length === 0}
            onClick={() => undo()}
            title="Undo"
            className="h-8 px-2 text-[#52525B] hover:text-[#09090B] disabled:opacity-30"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <span className="h-4 w-px bg-[#E4E4E7]" />
          <button
            type="button"
            disabled={futureStates.length === 0}
            onClick={() => redo()}
            title="Redo"
            className="h-8 px-2 text-[#52525B] hover:text-[#09090B] disabled:opacity-30"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ATS Checker Pill */}
        <button
          type="button"
          onClick={onOpenAtsModal}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-[#FAFAFA] border border-[#E4E4E7] text-[12px] font-medium text-[#09090B] hover:bg-[#F4F4F5]"
        >
          <span className={`w-2 h-2 rounded-full ${atsDotColor}`} />
          <span className="hidden md:inline">{atsBadgeLabel}</span>
          <span className="md:hidden">ATS</span>
        </button>

        {/* Export / Import JSON */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowJsonMenu((v) => !v);
              setShowLayoutMenu(false);
            }}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white border border-[#E4E4E7] text-[12px] font-medium text-[#18181B] hover:bg-[#F4F4F5]"
          >
            <FileJson className="w-3.5 h-3.5 text-[#52525B]" />
            <span className="hidden xl:inline">JSON</span>
          </button>

          {showJsonMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E4E4E7] rounded-lg shadow-xl p-1.5 z-50 text-[12px]">
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
              >
                <FileJson className="w-3.5 h-3.5 text-[#52525B]" />
                Export Backup .json
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
              >
                <Upload className="w-3.5 h-3.5 text-[#52525B]" />
                Import File .json
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Download PDF */}
        <PdfExportButton doc={doc} />
      </div>
    </header>
  );
}
