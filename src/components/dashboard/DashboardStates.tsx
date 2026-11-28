"use client";

import Link from "next/link";
import { ArrowRight, Cloud, FilePlus2, LogIn, Plus, SearchX, Upload } from "lucide-react";
import { useFoldyPrefs } from "@/lib/foldy-prefs";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

export function DashboardSkeletonGrid() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat daftar dokumen CV"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-ui-card border border-ui-border rounded-lg overflow-hidden"
        >
          <div className="h-[304px] bg-ui-subtle animate-pulse border-b border-ui-border" />
          <div className="p-4 space-y-2.5">
            <div className="h-4 w-2/3 bg-ui-subtle rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-ui-subtle rounded animate-pulse" />
            <div className="pt-3 flex items-center justify-between">
              <div className="h-8 w-28 bg-ui-subtle rounded animate-pulse" />
              <div className="h-8 w-8 bg-ui-subtle rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardAuthPrompt({
  onOpenAuth,
}: {
  onOpenAuth: (mode: "signin" | "signup") => void;
}) {
  const foldyPrefs = useFoldyPrefs();

  return (
    <div className="max-w-lg mx-auto my-12 bg-ui-card border border-ui-border rounded-lg p-7 text-center space-y-4">
      {foldyPrefs.visibility !== "hidden" ? (
        <div className="flex justify-center">
          <FoldyMascot
            mood="wink"
            size="lg"
            engine="ambient"
            interactiveClick
            showShadow
            ariaLabel="Foldy menyapa sebelum masuk Dashboard"
          />
        </div>
      ) : (
        <div className="w-10 h-10 mx-auto rounded-lg bg-ui-primary-soft border border-ui-border text-ui-link-soft-text flex items-center justify-center">
          <Cloud className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1.5">
        <h2 className="text-[17px] font-semibold text-ui-text">
          Masuk untuk mengakses Dashboard CV
        </h2>
        <p className="text-[13px] text-ui-text-secondary leading-relaxed">
          Kelola seluruh versi CV dan draf Anda di satu tempat, tersinkronisasi otomatis ke Cloud Firestore, dan unduh PDF kapan saja tanpa harus membuka editor.
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => onOpenAuth("signin")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-white text-[12.5px] font-medium transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          Masuk / Daftar Akun
        </button>
        <Link
          href="/editor"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle text-[12.5px] font-medium text-ui-text transition-colors"
        >
          Lanjut Guest Editor
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function DashboardEmptyFilterState({
  onReset,
}: {
  onReset: () => void;
}) {
  const foldyPrefs = useFoldyPrefs();

  return (
    <div
      role="status"
      className="bg-ui-card border border-ui-border rounded-lg py-12 px-6 text-center space-y-3"
    >
      {foldyPrefs.visibility !== "hidden" ? (
        <div className="flex justify-center">
          <FoldyMascot
            mood="eureka"
            size="md"
            engine="ambient"
            interactiveClick
            ariaLabel="Foldy tidak menemukan CV yang cocok"
          />
        </div>
      ) : (
        <SearchX className="w-6 h-6 mx-auto text-ui-text-muted" aria-hidden="true" />
      )}
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold text-ui-text">
          Tidak ada dokumen CV yang cocok
        </h3>
        <p className="text-[12.5px] text-ui-text-secondary">
          Coba ubah kata kunci pencarian atau tampilkan semua status dokumen.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center h-8 px-3 rounded-md bg-ui-subtle hover:bg-ui-border text-[12px] font-medium text-ui-text transition-colors"
      >
        Reset Filter
      </button>
    </div>
  );
}

export function DashboardEmptyState({
  onCreateNew,
  onOpenImport,
}: {
  onCreateNew: () => void;
  onOpenImport: () => void;
}) {
  const foldyPrefs = useFoldyPrefs();

  return (
    <div
      role="status"
      className="bg-ui-card border border-dashed border-ui-border-strong rounded-lg py-16 px-6 text-center space-y-4"
    >
      {foldyPrefs.visibility !== "hidden" ? (
        <div className="flex justify-center">
          <FoldyMascot
            mood="sleepy"
            size="lg"
            engine="ambient"
            interactiveClick
            showShadow
            ariaLabel="Foldy menunggu CV pertamamu"
          />
        </div>
      ) : (
        <div className="w-11 h-11 mx-auto rounded-lg bg-ui-primary-soft border border-ui-border text-ui-link-soft-text flex items-center justify-center">
          <FilePlus2 className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
      <div className="max-w-md mx-auto space-y-1.5">
        <h2 className="text-[16px] font-semibold text-ui-text">
          Belum ada dokumen CV
        </h2>
        <p className="text-[13px] text-ui-text-secondary leading-relaxed">
          Mulai buat CV ATS pertamamu dari nol atau impor CV lama (PDF, Word, Teks, atau Backup JSON).
        </p>
      </div>
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-white text-[12.5px] font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat CV Baru
        </button>
        <button
          type="button"
          onClick={onOpenImport}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle text-[12.5px] font-medium text-ui-text transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-ui-text-secondary" />
          Import File
        </button>
      </div>
    </div>
  );
}
