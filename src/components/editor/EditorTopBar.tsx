"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Cloud,
  Eraser,
  FileJson,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  Redo2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Target,
  Undo2,
  Upload,
} from "lucide-react";
import { useStore } from "zustand";
import { useResumeStore } from "@/store/use-resume-store";
import { BrandLogo } from "@/components/BrandLogo";
import { logOut } from "@/lib/firebase/auth";
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

type OpenMenu = "layout" | "more" | "user" | null;

interface EditorTopBarProps {
  lintReport: AtsLintReport;
  onOpenAtsModal: () => void;
  onOpenJdModal: () => void;
  onOpenAuthModal: () => void;
}

export function EditorTopBar({
  lintReport,
  onOpenAtsModal,
  onOpenJdModal,
  onOpenAuthModal,
}: EditorTopBarProps) {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const saveStatus = useResumeStore((s) => s.saveStatus);
  const authUser = useResumeStore((s) => s.authUser);
  const cloudSyncStatus = useResumeStore((s) => s.cloudSyncStatus);
  const cloudSyncError = useResumeStore((s) => s.cloudSyncError);
  const triggerManualSync = useResumeStore((s) => s.triggerManualSync);
  const isFileTreeOpen = useResumeStore((s) => s.isFileTreeOpen);
  const toggleFileTree = useResumeStore((s) => s.toggleFileTree);
  const loadSampleResume = useResumeStore((s) => s.loadSampleResume);
  const clearActiveResume = useResumeStore((s) => s.clearActiveResume);
  const updateConfig = useResumeStore((s) => s.updateConfig);
  const setLanguage = useResumeStore((s) => s.setLanguage);
  const exportResumeJson = useResumeStore((s) => s.exportResumeJson);
  const importResumeJson = useResumeStore((s) => s.importResumeJson);

  const pastStates = useStore(useResumeStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useResumeStore.temporal, (s) => s.futureStates);
  const undo = useStore(useResumeStore.temporal, (s) => s.undo);
  const redo = useStore(useResumeStore.temporal, (s) => s.redo);

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  const toggleMenu = (target: Exclude<OpenMenu, null>) => {
    setOpenMenu((prev) => (prev === target ? null : target));
  };

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
    setOpenMenu(null);
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
    setOpenMenu(null);
  };

  const atsDotColor =
    lintReport.summary.fix > 0
      ? "bg-[#EF4444]"
      : lintReport.summary.review > 0
        ? "bg-[#F59E0B]"
        : "bg-[#10B981]";

  const atsBadgeLabel =
    lintReport.summary.fix > 0
      ? `${lintReport.summary.fix} Fix`
      : lintReport.summary.review > 0
        ? `${lintReport.summary.review} Review`
        : "ATS OK";

  return (
    <header
      ref={headerRef}
      className="h-12 px-3 sm:px-4 bg-white border-b border-[#E4E4E7] grid grid-cols-[1fr_auto_1fr] items-center gap-2 shrink-0 z-30"
    >
      {/* Left: Sidebar Toggle + Brand + Quiet Save Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => toggleFileTree()}
          aria-label="Toggle File Tree Sidebar"
          aria-pressed={isFileTreeOpen}
          title={
            isFileTreeOpen
              ? "Sembunyikan File Tree (Ctrl+B)"
              : "Tampilkan File Tree (Ctrl+B)"
          }
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors ${
            isFileTreeOpen
              ? "bg-[#F4F4F5] text-[#09090B]"
              : "text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5]"
          }`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <BrandLogo className="h-6 w-auto shrink-0" />
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#09090B] hidden sm:inline">
            FormaCV
          </span>
        </Link>

        <span
          className="hidden md:inline-flex items-center gap-1.5 pl-1 text-[11px] text-[#71717A] shrink-0"
          title={
            authUser
              ? cloudSyncError || "Tersinkron otomatis ke Cloud Firestore"
              : "Tersimpan otomatis di browser (Guest Mode)"
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              authUser
                ? cloudSyncStatus === "error"
                  ? "bg-[#EF4444]"
                  : cloudSyncStatus === "syncing"
                    ? "bg-[#F59E0B]"
                    : "bg-[#10B981]"
                : saveStatus === "saving"
                  ? "bg-[#F59E0B]"
                  : "bg-[#10B981]"
            }`}
          />
          {authUser
            ? cloudSyncStatus === "error"
              ? "Sync gagal"
              : cloudSyncStatus === "syncing"
                ? "Menyinkronkan..."
                : "Cloud"
            : saveStatus === "saving"
              ? "Menyimpan..."
              : "Disimpan"}
        </span>
      </div>

      {/* Center: Single Unified Tool Strip (Tampilan | ATS | JD Match) */}
      <div className="inline-flex items-center bg-[#F4F4F5] p-0.5 rounded-lg border border-[#E4E4E7]">
        {/* Tampilan / Layout Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("layout")}
            title="Atur Template, Font, Spasi, dan Bahasa CV"
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
              openMenu === "layout"
                ? "bg-white text-[#09090B] shadow-2xs"
                : "text-[#52525B] hover:text-[#09090B] hover:bg-white/60"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tampilan</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {openMenu === "layout" && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-[#E4E4E7] rounded-lg shadow-xl p-3 space-y-3 z-50">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-[#52525B]">
                    Template ATS
                  </label>
                  <Link
                    href="/templates"
                    onClick={() => setOpenMenu(null)}
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
                  aria-label="Pilih Template ATS"
                  className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
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
                        className={`py-1 text-[11px] font-medium rounded transition-colors ${
                          doc.config.density === d
                            ? "bg-white text-[#09090B] shadow-2xs"
                            : "text-[#52525B] hover:text-[#09090B]"
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
                  className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
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
                    className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
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
                    className="w-full h-8 px-2 text-[12px] border border-[#E4E4E7] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="w-full h-7 rounded-md bg-[#18181B] text-white text-[11.5px] font-medium inline-flex items-center justify-center gap-1 hover:bg-[#27272A]"
              >
                <Check className="w-3 h-3" /> Selesai
              </button>
            </div>
          )}
        </div>

        <span className="h-3.5 w-px bg-[#E4E4E7] mx-0.5" />

        {/* ATS Checker */}
        <button
          type="button"
          onClick={onOpenAtsModal}
          title="Periksa Keterbacaan ATS"
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:bg-white/60 transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${atsDotColor}`} />
          <span className="hidden sm:inline">{atsBadgeLabel}</span>
          <span className="sm:hidden">ATS</span>
        </button>

        <span className="h-3.5 w-px bg-[#E4E4E7] mx-0.5" />

        {/* JD Matcher */}
        <button
          type="button"
          onClick={onOpenJdModal}
          title="Cocokkan CV dengan Job Description"
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:bg-white/60 transition-colors"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">JD Match</span>
        </button>
      </div>

      {/* Right: Overflow Menu + Auth + Primary Download CTA */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {/* Overflow Menu (Undo/Redo, Galeri, Backup JSON, Sample, Reset) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("more")}
            title="Opsi lainnya"
            aria-label="Opsi dokumen lainnya"
            className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              openMenu === "more"
                ? "bg-[#F4F4F5] text-[#09090B]"
                : "text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5]"
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {openMenu === "more" && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#E4E4E7] rounded-lg shadow-xl p-1.5 z-50 text-[12px]">
              <button
                type="button"
                disabled={pastStates.length === 0}
                onClick={() => {
                  undo();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] disabled:opacity-40 flex items-center justify-between text-[#09090B]"
              >
                <span className="inline-flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5 text-[#52525B]" />
                  Undo
                </span>
                <span className="text-[10.5px] text-[#A1A1AA] font-mono">
                  Ctrl+Z
                </span>
              </button>
              <button
                type="button"
                disabled={futureStates.length === 0}
                onClick={() => {
                  redo();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] disabled:opacity-40 flex items-center justify-between text-[#09090B]"
              >
                <span className="inline-flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5 text-[#52525B]" />
                  Redo
                </span>
                <span className="text-[10.5px] text-[#A1A1AA] font-mono">
                  Ctrl+Y
                </span>
              </button>

              <div className="my-1 border-t border-[#F4F4F5]" />

              <Link
                href="/templates"
                onClick={() => setOpenMenu(null)}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#52525B]" />
                Galeri Template ATS
              </Link>
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

              <div className="my-1 border-t border-[#F4F4F5]" />

              <button
                type="button"
                onClick={() => {
                  loadSampleResume();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#52525B]" />
                Isi dengan Data Contoh
              </button>
              <button
                type="button"
                onClick={() => {
                  clearActiveResume();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#FEF2F2] flex items-center gap-2 text-[#EF4444]"
              >
                <Eraser className="w-3.5 h-3.5" />
                Kosongkan Form Aktif
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {/* Auth / Cloud Profile */}
        {authUser ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu("user")}
              title={authUser.email || authUser.displayName || "Akun Cloud"}
              aria-label="Menu Akun Cloud"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                openMenu === "user"
                  ? "ring-2 ring-[#18181B]/20"
                  : "hover:ring-2 hover:ring-[#E4E4E7]"
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-[#18181B] text-white text-[11px] font-semibold inline-flex items-center justify-center uppercase">
                {(authUser.displayName || authUser.email || "U").slice(0, 1)}
              </span>
            </button>

            {openMenu === "user" && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E4E4E7] rounded-lg shadow-xl p-2 z-50 text-[12px]">
                <div className="px-2 py-1.5 border-b border-[#F4F4F5]">
                  <p className="font-medium text-[#09090B] truncate">
                    {authUser.displayName || "Pengguna FormaCV"}
                  </p>
                  <p className="text-[11px] text-[#52525B] truncate">
                    {authUser.email}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10.5px] text-[#52525B]">
                    <Cloud className="w-3 h-3 text-[#18181B]" />
                    <span>
                      {cloudSyncStatus === "syncing"
                        ? "Menyinkronkan ke Firestore..."
                        : cloudSyncStatus === "error"
                          ? "Sinkronisasi gagal"
                          : "Tersinkron ke Cloud Firestore"}
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerManualSync();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#52525B]" />
                    Sinkronkan Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      void logOut();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#FEF2F2] flex items-center gap-2 text-[#EF4444]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar (Sign Out)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            title="Masuk untuk simpan ke Cloud"
            className="inline-flex items-center h-8 px-3 rounded-md text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors"
          >
            Masuk
          </button>
        )}

        {/* Primary CTA */}
        <PdfExportButton doc={doc} />
      </div>
    </header>
  );
}
