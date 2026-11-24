"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Cloud,
  LayoutGrid,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { AuthModal } from "@/components/auth/AuthModal";
import { CloudSyncManager } from "@/components/auth/CloudSyncManager";
import { CvDocumentCard } from "@/components/dashboard/CvDocumentCard";
import {
  DashboardAuthPrompt,
  DashboardEmptyFilterState,
  DashboardSkeletonGrid,
} from "@/components/dashboard/DashboardStates";
import {
  filterAndSortDashboardDocs,
  getCvCompletionStatus,
  type DashboardSortBy,
  type DashboardStatusFilter,
} from "@/lib/dashboard-utils";
import { logOut } from "@/lib/firebase/auth";
import { syncFileOrder, useResumeStore } from "@/store/use-resume-store";

export default function DashboardPage() {
  const router = useRouter();
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const authUser = useResumeStore((s) => s.authUser);
  const authLoading = useResumeStore((s) => s.authLoading);
  const cloudSyncStatus = useResumeStore((s) => s.cloudSyncStatus);
  const triggerManualSync = useResumeStore((s) => s.triggerManualSync);
  const documents = useResumeStore((s) => s.documents);
  const fileOrder = useResumeStore((s) => s.fileOrder);
  const openTab = useResumeStore((s) => s.openTab);
  const createDocument = useResumeStore((s) => s.createDocument);
  const duplicateDocument = useResumeStore((s) => s.duplicateDocument);
  const renameDocument = useResumeStore((s) => s.renameDocument);
  const deleteDocument = useResumeStore((s) => s.deleteDocument);
  const exportResumeJson = useResumeStore((s) => s.exportResumeJson);
  const importResumeJson = useResumeStore((s) => s.importResumeJson);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DashboardStatusFilter>("all");
  const [sortBy, setSortBy] = useState<DashboardSortBy>("updatedAt");
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup" | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDocs = useMemo(() => {
    const orderedIds = syncFileOrder(fileOrder, documents);
    return orderedIds.map((id) => documents[id]).filter(Boolean);
  }, [fileOrder, documents]);

  const counts = useMemo(() => {
    let ready = 0;
    let draft = 0;
    for (const d of allDocs) {
      if (getCvCompletionStatus(d) === "ready") ready += 1;
      else draft += 1;
    }
    return { total: allDocs.length, ready, draft };
  }, [allDocs]);

  const visibleDocs = useMemo(
    () =>
      filterAndSortDashboardDocs(allDocs, {
        query,
        statusFilter,
        sortBy,
      }),
    [allDocs, query, statusFilter, sortBy]
  );

  const handleOpenInEditor = (id: string) => {
    openTab(id);
    router.push("/editor");
  };

  const handleCreateNewCv = () => {
    createDocument(`CV Baru ${allDocs.length + 1}`);
    router.push("/editor");
  };

  const handleExportJson = (id: string, title: string) => {
    const json = exportResumeJson(id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]+/g, "_") || "cv"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#09090B]">
      {/* Always mount CloudSyncManager so Firebase session & Firestore stay synced */}
      <CloudSyncManager />

      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <BrandLogo className="h-7 w-auto shrink-0" />
              <span className="text-[14px] font-semibold tracking-[-0.01em]">
                FormaCV
              </span>
            </Link>

            {authUser && (
              <button
                type="button"
                onClick={triggerManualSync}
                title="Klik untuk sinkronkan ulang ke Cloud Firestore"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAFA] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[11px] text-[#52525B] transition-colors"
              >
                <Cloud className="w-3.5 h-3.5 text-[#18181B]" />
                <span>
                  {cloudSyncStatus === "syncing"
                    ? "Menyinkronkan..."
                    : cloudSyncStatus === "error"
                      ? "Sync gagal · Coba lagi"
                      : "Tersinkron Cloud"}
                </span>
                <RefreshCw className="w-3 h-3 opacity-60" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Galeri Template
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[12px] font-medium text-[#09090B] transition-colors"
            >
              Buka Editor
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {authUser && (
              <button
                type="button"
                onClick={() => void logOut()}
                title="Keluar (Sign Out)"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[#52525B] hover:text-[#EF4444] hover:bg-[#FEF2F2] text-[12px] font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {!hasHydrated || authLoading ? (
          <DashboardSkeletonGrid />
        ) : !authUser ? (
          <DashboardAuthPrompt onOpenAuth={(mode) => setAuthModalMode(mode)} />
        ) : (
          <div className="space-y-6">
            {/* Dashboard Title & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11.5px] font-medium text-[#52525B]">
                  Halo, {authUser.displayName || authUser.email}
                </p>
                <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]">
                  Dokumen CV Saya
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[12.5px] font-medium text-[#09090B] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#52525B]" />
                  Import .json
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewCv}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-[12.5px] font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Buat CV Baru
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* Filter, Search & Sort Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-[#E4E4E7] rounded-lg p-2.5">
              <div className="inline-flex items-center bg-[#F4F4F5] p-0.5 rounded-md border border-[#E4E4E7] self-start">
                {(
                  [
                    { id: "all", label: `Semua (${counts.total})` },
                    { id: "ready", label: `Siap (${counts.ready})` },
                    { id: "draft", label: `Draf (${counts.draft})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                      statusFilter === tab.id
                        ? "bg-white text-[#09090B] shadow-2xs"
                        : "text-[#52525B] hover:text-[#09090B]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-1 md:max-w-md">
                <div className="relative flex-1">
                  <Search
                    className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari judul CV atau posisi..."
                    aria-label="Cari dokumen CV"
                    className="w-full h-8 pl-8 pr-3 text-[12.5px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as DashboardSortBy)
                  }
                  aria-label="Urutkan dokumen CV"
                  className="h-8 px-2.5 text-[12px] font-medium text-[#09090B] bg-[#FAFAFA] border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                >
                  <option value="updatedAt">Terbaru Diubah</option>
                  <option value="title">Nama (A–Z)</option>
                </select>
              </div>
            </div>

            {/* CV Cards Grid */}
            {visibleDocs.length === 0 ? (
              <DashboardEmptyFilterState
                onReset={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleDocs.map((item) => (
                  <CvDocumentCard
                    key={item.id}
                    doc={item}
                    canDelete={allDocs.length > 1}
                    onOpenEditor={() => handleOpenInEditor(item.id)}
                    onRename={(newTitle) => renameDocument(item.id, newTitle)}
                    onDuplicate={() => duplicateDocument(item.id)}
                    onExportJson={() => handleExportJson(item.id, item.title)}
                    onDelete={() => deleteDocument(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {authModalMode !== null && (
        <AuthModal
          key={authModalMode}
          open={true}
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
        />
      )}
    </div>
  );
}
