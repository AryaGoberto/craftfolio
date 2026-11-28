"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Cloud,
  Eraser,
  Eye,
  EyeOff,
  FileCode2,
  FileJson,
  FileUp,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
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
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";
import { FoldyCoachPopover } from "@/components/mascot/FoldyCoachPopover";
import type { AtsLintReport } from "@/lib/ats-linter";
import type { FoldyMaturityStage, FoldyMood } from "@/lib/foldy-coach";
import { setFoldyVisibility, useFoldyPrefs } from "@/lib/foldy-prefs";
import type {
  DensityPreset,
  FontFamilyPreset,
  SectionKey,
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
      <span className="inline-flex items-center h-8 px-3 rounded-md bg-ui-primary text-white text-[12px] font-medium opacity-70">
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
  serif: "Computer Modern (LaTeX)",
  georgia: "Merriweather",
};

const DENSITY_LABELS: Record<DensityPreset, string> = {
  compact: "Compact",
  normal: "Normal",
  relaxed: "Relaxed",
};

type OpenMenu = "layout" | "foldy" | "more" | "user" | null;

interface EditorTopBarProps {
  lintReport: AtsLintReport;
  foldyMood: FoldyMood;
  foldyMaturity: FoldyMaturityStage;
  onJumpToSection: (section: SectionKey | "basics") => void;
  onOpenAtsModal: () => void;
  onOpenJdModal: () => void;
  onOpenAuthModal: () => void;
  onOpenImportCvModal?: () => void;
}

export function EditorTopBar({
  lintReport,
  foldyMood,
  foldyMaturity,
  onJumpToSection,
  onOpenAtsModal,
  onOpenJdModal,
  onOpenAuthModal,
  onOpenImportCvModal,
}: EditorTopBarProps) {
  const foldyPrefs = useFoldyPrefs();
  const doc = useResumeStore((s) => s.documents[s.activeDocumentId]);
  const saveStatus = useResumeStore((s) => s.saveStatus);
  const authUser = useResumeStore((s) => s.authUser);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);
  const cloudSyncStatus = useResumeStore((s) => s.cloudSyncStatus);
  const cloudSyncError = useResumeStore((s) => s.cloudSyncError);
  const triggerManualSync = useResumeStore((s) => s.triggerManualSync);
  const loadSampleResume = useResumeStore((s) => s.loadSampleResume);
  const clearActiveResume = useResumeStore((s) => s.clearActiveResume);
  const updateConfig = useResumeStore((s) => s.updateConfig);
  const setLanguage = useResumeStore((s) => s.setLanguage);
  const exportResumeJson = useResumeStore((s) => s.exportResumeJson);
  const importResumeJson = useResumeStore((s) => s.importResumeJson);

  const canUndo = useStore(useResumeStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useResumeStore.temporal, (s) => s.futureStates.length > 0);
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
      ? "bg-ui-error"
      : lintReport.summary.review > 0
        ? "bg-ui-warning"
        : "bg-ui-success";

  const atsBadgeLabel =
    lintReport.summary.fix > 0
      ? `${lintReport.summary.fix} Fix`
      : lintReport.summary.review > 0
        ? `${lintReport.summary.review} Review`
        : "ATS OK";

  return (
    <header
      ref={headerRef}
      className="h-12 px-3 sm:px-4 bg-ui-card border-b border-ui-border grid grid-cols-[1fr_auto_1fr] items-center gap-2 shrink-0 z-30"
    >
      {/* Left: Brand + Quiet Save Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <BrandLogo className="h-6 w-auto shrink-0" />
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-ui-text hidden sm:inline">
            Craftfolio
          </span>
        </Link>

        <span
          className="hidden md:inline-flex items-center gap-1.5 pl-1 text-[11px] text-ui-text-muted shrink-0"
          title={
            authUser
              ? cloudSyncError || "Tersinkron otomatis ke Cloud Firestore"
              : "Mode Guest: data hanya sementara di tab ini dan akan terhapus saat tab ditutup"
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              authUser
                ? cloudSyncStatus === "error"
                  ? "bg-ui-error"
                  : cloudSyncStatus === "syncing"
                    ? "bg-ui-warning"
                    : "bg-ui-success"
                : "bg-ui-warning"
            }`}
          />
          {authUser
            ? cloudSyncStatus === "error"
              ? "Sync gagal"
              : cloudSyncStatus === "syncing"
                ? "Menyinkronkan..."
                : "Cloud"
            : saveStatus === "saving"
              ? "Memproses..."
              : "Sesi Sementara"}
        </span>
      </div>

      {/* Center: Single Unified Tool Strip (Tampilan | ATS | JD Match) */}
      <div className="inline-flex items-center bg-ui-subtle p-0.5 rounded-lg border border-ui-border">
        {/* Tampilan / Layout Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("layout")}
            title="Atur Template, Font, Spasi, dan Bahasa CV"
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
              openMenu === "layout"
                ? "bg-ui-card text-ui-text shadow-2xs"
                : "text-ui-text-secondary hover:text-ui-text hover:bg-ui-card/60"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tampilan</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {openMenu === "layout" && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-ui-card border border-ui-border rounded-lg shadow-xl p-3 space-y-3 z-50">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-ui-text-secondary">
                    Template ATS
                  </label>
                  <Link
                    href="/templates"
                    onClick={() => setOpenMenu(null)}
                    className="text-[11px] font-medium text-ui-link hover:underline"
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
                  className="w-full h-8 px-2 text-[12px] border border-ui-border rounded-md bg-ui-card focus:outline-none focus:ring-1 focus:ring-ui-focus"
                >
                  {Object.entries(TEMPLATE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ui-text-secondary mb-1">
                  Kerapatan Spasi
                </label>
                <div className="grid grid-cols-3 gap-1 bg-ui-subtle p-0.5 rounded-md">
                  {(["compact", "normal", "relaxed"] as DensityPreset[]).map(
                    (d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateConfig({ density: d })}
                        className={`py-1 text-[11px] font-medium rounded transition-colors ${
                          doc.config.density === d
                            ? "bg-ui-card text-ui-text shadow-2xs"
                            : "text-ui-text-secondary hover:text-ui-text"
                        }`}
                      >
                        {DENSITY_LABELS[d]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ui-text-secondary mb-1">
                  Font Dokumen
                </label>
                <select
                  value={doc.config.fontFamily}
                  onChange={(e) =>
                    updateConfig({
                      fontFamily: e.target.value as FontFamilyPreset,
                    })
                  }
                  className="w-full h-8 px-2 text-[12px] border border-ui-border rounded-md bg-ui-card focus:outline-none focus:ring-1 focus:ring-ui-focus"
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
                  <label className="block text-[11px] font-medium text-ui-text-secondary mb-1">
                    Target Halaman
                  </label>
                  <select
                    value={doc.config.targetPages}
                    onChange={(e) =>
                      updateConfig({
                        targetPages: Number(e.target.value) as 1 | 2,
                      })
                    }
                    className="w-full h-8 px-2 text-[12px] border border-ui-border rounded-md bg-ui-card focus:outline-none focus:ring-1 focus:ring-ui-focus"
                  >
                    <option value={1}>1 Halaman</option>
                    <option value={2}>2 Halaman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-ui-text-secondary mb-1">
                    Bahasa CV
                  </label>
                  <select
                    value={doc.language}
                    onChange={(e) =>
                      setLanguage(e.target.value as "id" | "en")
                    }
                    className="w-full h-8 px-2 text-[12px] border border-ui-border rounded-md bg-ui-card focus:outline-none focus:ring-1 focus:ring-ui-focus"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="w-full h-7 rounded-md bg-ui-primary text-white text-[11.5px] font-medium inline-flex items-center justify-center gap-1 hover:bg-ui-primary-hover"
              >
                <Check className="w-3 h-3" /> Selesai
              </button>
            </div>
          )}
        </div>

        <span className="h-3.5 w-px bg-ui-border mx-0.5" />

        {/* ATS Checker */}
        <button
          type="button"
          onClick={onOpenAtsModal}
          title="Periksa Keterbacaan ATS"
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium text-ui-text-secondary hover:text-ui-text hover:bg-ui-card/60 transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${atsDotColor}`} />
          <span className="hidden sm:inline">{atsBadgeLabel}</span>
          <span className="sm:hidden">ATS</span>
        </button>

        <span className="h-3.5 w-px bg-ui-border mx-0.5" />

        {/* JD Matcher */}
        <button
          type="button"
          onClick={onOpenJdModal}
          title="Cocokkan CV dengan Job Description"
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium text-ui-text-secondary hover:text-ui-text hover:bg-ui-card/60 transition-colors"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">JD Match</span>
        </button>

        {/* Living Foldy Coach Avatar (Zero Floating Widget — Anchored in Unified Strip) */}
        {foldyPrefs.visibility !== "hidden" && (
          <>
            <span className="h-3.5 w-px bg-ui-border mx-0.5" />
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("foldy")}
                title="Buka Foldy ATS Coach (1 prioritas perbaikan berikutnya)"
                aria-label="Buka Foldy ATS Coach"
                aria-expanded={openMenu === "foldy"}
                className={`inline-flex items-center justify-center gap-1 h-7 px-1.5 sm:px-2 rounded-md text-[12px] font-medium transition-colors ${
                  openMenu === "foldy"
                    ? "bg-ui-card text-ui-text shadow-2xs"
                    : "text-ui-text-secondary hover:text-ui-text hover:bg-ui-card/60"
                }`}
              >
                <FoldyMascot
                  mood={foldyMood}
                  size="xs"
                  engine="ambient"
                  ariaLabel="Foldy ATS Coach"
                />
                <span className="hidden md:inline text-[11.5px]">Coach</span>
              </button>

              {openMenu === "foldy" && (
                <FoldyCoachPopover
                  doc={doc}
                  report={lintReport}
                  mood={foldyMood}
                  maturity={foldyMaturity}
                  visibility={foldyPrefs.visibility}
                  onJumpToSection={onJumpToSection}
                  onOpenAtsModal={onOpenAtsModal}
                  onOpenJdModal={onOpenJdModal}
                  onClose={() => setOpenMenu(null)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Overflow Menu + Auth + Primary Download CTA */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <ColorSchemeToggle size="sm" />
        {/* Overflow Menu (Undo/Redo, Galeri, Backup JSON, Sample, Reset) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("more")}
            title="Opsi lainnya"
            aria-label="Opsi dokumen lainnya"
            className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              openMenu === "more"
                ? "bg-ui-subtle text-ui-text"
                : "text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle"
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {openMenu === "more" && (
            <div className="absolute right-0 mt-1.5 w-56 bg-ui-card border border-ui-border rounded-lg shadow-xl p-1.5 z-50 text-[12px]">
              <button
                type="button"
                disabled={!canUndo}
                onClick={() => {
                  undo();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle disabled:opacity-40 flex items-center justify-between text-ui-text"
              >
                <span className="inline-flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Undo
                </span>
                <span className="text-[10.5px] text-ui-text-placeholder font-mono">
                  Ctrl+Z
                </span>
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={() => {
                  redo();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle disabled:opacity-40 flex items-center justify-between text-ui-text"
              >
                <span className="inline-flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Redo
                </span>
                <span className="text-[10.5px] text-ui-text-placeholder font-mono">
                  Ctrl+Y
                </span>
              </button>

              <div className="my-1 border-t border-ui-divider" />

              <Link
                href="/dashboard"
                onClick={() => setOpenMenu(null)}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-ui-text-secondary" />
                Dashboard CV Saya
              </Link>
              <Link
                href="/templates"
                onClick={() => setOpenMenu(null)}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-ui-text-secondary" />
                Galeri Template ATS
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  void import("@/lib/pdf-download").then(({ downloadResumeTex }) =>
                    downloadResumeTex(doc)
                  );
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                <FileCode2 className="w-3.5 h-3.5 text-ui-text-secondary" />
                Export LaTeX (.tex)
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                <FileJson className="w-3.5 h-3.5 text-ui-text-secondary" />
                Export Backup .json
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                <Upload className="w-3.5 h-3.5 text-ui-text-secondary" />
                Import File .json
              </button>
              {onOpenImportCvModal && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenImportCvModal();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                >
                  <FileUp className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Import File CV
                </button>
              )}

              <div className="my-1 border-t border-ui-divider" />

              <button
                type="button"
                onClick={() => {
                  setFoldyVisibility(
                    foldyPrefs.visibility === "hidden" ? "full" : "hidden"
                  );
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                {foldyPrefs.visibility === "hidden" ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-ui-text-secondary" />
                    Tampilkan Maskot Foldy
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-ui-text-secondary" />
                    Sembunyikan Maskot Foldy
                  </>
                )}
              </button>

              <div className="my-1 border-t border-ui-divider" />

              <button
                type="button"
                onClick={() => {
                  loadSampleResume();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
              >
                <Sparkles className="w-3.5 h-3.5 text-ui-text-secondary" />
                Isi dengan Data Contoh
              </button>
              <button
                type="button"
                onClick={() => {
                  clearActiveResume();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-error-bg flex items-center gap-2 text-ui-error"
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
                  ? "ring-2 ring-ui-focus/35"
                  : "hover:ring-2 hover:ring-ui-border"
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-ui-primary text-white text-[11px] font-semibold inline-flex items-center justify-center uppercase">
                {(authUser.displayName || authUser.email || "U").slice(0, 1)}
              </span>
            </button>

            {openMenu === "user" && (
              <div className="absolute right-0 mt-1.5 w-60 bg-ui-card border border-ui-border rounded-lg shadow-xl p-2 z-50 text-[12px]">
                <div className="px-2 py-1.5 border-b border-ui-divider">
                  <p className="font-medium text-ui-text truncate">
                    {authUser.displayName || "Pengguna Craftfolio"}
                  </p>
                  <p className="text-[11px] text-ui-text-secondary truncate">
                    {authUser.email}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10.5px] text-ui-text-secondary">
                    <Cloud className="w-3 h-3 text-ui-link" />
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
                  <Link
                    href="/dashboard"
                    onClick={() => setOpenMenu(null)}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-ui-text-secondary" />
                    Dashboard CV Saya
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      triggerManualSync();
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-subtle flex items-center gap-2 text-ui-text"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-ui-text-secondary" />
                    Sinkronkan Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      void import("@/lib/firebase/auth").then(({ logOut }) =>
                        logOut()
                      );
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-ui-error-bg flex items-center gap-2 text-ui-error"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar (Sign Out)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenAuthModal}
              title="Masuk untuk simpan ke Cloud"
              className="inline-flex items-center h-8 px-2.5 sm:px-3 rounded-md text-[12px] font-medium text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => openAuthModal(undefined, "signup")}
              title="Buat akun gratis untuk simpan ke Cloud & fitur AI"
              className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-md bg-ui-card border border-ui-border text-[12px] font-medium text-ui-text hover:bg-ui-subtle transition-colors"
            >
              Daftar
            </button>
          </div>
        )}

        {/* Primary CTA */}
        <PdfExportButton doc={doc} />
      </div>
    </header>
  );
}
