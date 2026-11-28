"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Cloud,
  Eye,
  EyeOff,
  LayoutGrid,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";
import { CvDocumentCard } from "@/components/dashboard/CvDocumentCard";
import {
  DashboardAuthPrompt,
  DashboardEmptyFilterState,
  DashboardEmptyState,
  DashboardSkeletonGrid,
} from "@/components/dashboard/DashboardStates";
import {
  filterAndSortDashboardDocs,
  getCvCompletionStatus,
  type DashboardSortBy,
  type DashboardStatusFilter,
} from "@/lib/dashboard-utils";
import {
  buildDashboardGreeting,
  MATURITY_LABELS,
  resolveMaturityStage,
} from "@/lib/foldy-coach";
import { setFoldyVisibility, useFoldyPrefs } from "@/lib/foldy-prefs";
import { syncFileOrder, useResumeStore } from "@/store/use-resume-store";

const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false }
);

const CloudSyncManager = dynamic(
  () =>
    import("@/components/auth/CloudSyncManager").then(
      (mod) => mod.CloudSyncManager
    ),
  { ssr: false }
);

const CvImportModal = dynamic(
  () =>
    import("@/components/editor/CvImportModal").then(
      (mod) => mod.CvImportModal
    ),
  { ssr: false }
);

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
  const authModalOpen = useResumeStore((s) => s.authModalOpen);
  const authModalMode = useResumeStore((s) => s.authModalMode);
  const authModalReason = useResumeStore((s) => s.authModalReason);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);
  const closeAuthModal = useResumeStore((s) => s.closeAuthModal);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DashboardStatusFilter>("all");
  const [sortBy, setSortBy] = useState<DashboardSortBy>("updatedAt");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const foldyPrefs = useFoldyPrefs();

  const allDocs = useMemo(() => {
    const orderedIds = syncFileOrder(fileOrder, documents);
    return orderedIds.map((id) => documents[id]).filter(Boolean);
  }, [fileOrder, documents]);

  const foldyMaturity = useMemo(
    () => resolveMaturityStage(foldyPrefs, allDocs),
    [foldyPrefs, allDocs]
  );

  const foldyGreeting = useMemo(
    () =>
      buildDashboardGreeting(
        allDocs,
        foldyMaturity,
        cloudSyncStatus === "syncing"
      ),
    [allDocs, foldyMaturity, cloudSyncStatus]
  );

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

  return (
    <div className="min-h-screen flex flex-col bg-ui-canvas text-ui-text">
      {/* Always mount CloudSyncManager so Firebase session & Firestore stay synced */}
      <CloudSyncManager />

      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 bg-ui-card border-b border-ui-border">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <BrandLogo className="h-7 w-auto shrink-0" />
              <span className="text-[14px] font-semibold tracking-[-0.01em]">
                Craftfolio
              </span>
            </Link>

            {authUser && (
              <button
                type="button"
                onClick={triggerManualSync}
                title="Klik untuk sinkronkan ulang ke Cloud Firestore"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ui-panel border border-ui-border hover:bg-ui-subtle text-[11px] text-ui-text-secondary transition-colors"
              >
                <Cloud className="w-3.5 h-3.5 text-ui-link" />
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/templates"
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle text-[12px] font-medium transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Galeri Template
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-[12px] font-medium text-white transition-colors"
            >
              Buka Editor
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="h-4 w-px bg-ui-border mx-0.5" aria-hidden="true" />
            {authUser && (
              <button
                type="button"
                onClick={() => {
                  void import("@/lib/firebase/auth").then(({ logOut }) =>
                    logOut()
                  );
                }}
                title="Keluar (Sign Out)"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-ui-text-secondary hover:text-ui-error hover:bg-ui-error-bg text-[12px] font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
            <ColorSchemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {!hasHydrated || authLoading ? (
          <DashboardSkeletonGrid />
        ) : !authUser ? (
          <DashboardAuthPrompt
            onOpenAuth={(mode) => openAuthModal(undefined, mode)}
          />
        ) : (
          <div className="space-y-6">
            {/* Dashboard Title & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11.5px] font-medium text-ui-text-secondary">
                  Halo, {authUser.displayName || authUser.email}
                </p>
                <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-ui-text">
                  Dokumen CV Saya
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle text-[12.5px] font-medium text-ui-text transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-ui-text-secondary" />
                  Import File
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewCv}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-white text-[12.5px] font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Buat CV Baru
                </button>
              </div>
            </div>

            {allDocs.length === 0 ? (
              <DashboardEmptyState
                onCreateNew={handleCreateNewCv}
                onOpenImport={() => setImportModalOpen(true)}
              />
            ) : (
              <>
                {/* Contextual Foldy Progress Greeting Strip */}
                {foldyPrefs.visibility === "hidden" ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFoldyVisibility("full")}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-ui-border bg-ui-card text-[11px] text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors"
                    >
                      <Eye className="w-3 h-3" aria-hidden="true" />
                      Tampilkan Foldy
                    </button>
                  </div>
                ) : (
                  <div className="bg-ui-card border border-ui-border rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-ui-panel border border-ui-divider flex items-center justify-center shrink-0">
                        <FoldyMascot
                          mood={foldyGreeting.mood}
                          size="sm"
                          engine="ambient"
                          interactiveClick
                          ariaLabel="Ringkasan progres CV dari Foldy"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-semibold text-ui-text">
                            {foldyGreeting.headline}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ui-primary-soft text-ui-primary-soft-text text-[10px] font-medium">
                            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                            {MATURITY_LABELS[foldyMaturity]}
                          </span>
                        </div>
                        <p className="text-[12px] text-ui-text-secondary mt-0.5 leading-snug">
                          {foldyGreeting.subtext}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFoldyVisibility("hidden")}
                      title="Sembunyikan maskot Foldy"
                      className="self-end sm:self-center inline-flex items-center gap-1 h-7 px-2 rounded text-[11px] text-ui-text-muted hover:text-ui-text hover:bg-ui-subtle transition-colors shrink-0"
                    >
                      <EyeOff className="w-3 h-3" aria-hidden="true" />
                      <span>Sembunyikan</span>
                    </button>
                  </div>
                )}

                {/* Filter, Search & Sort Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-ui-card border border-ui-border rounded-lg p-2.5">
                  <div className="inline-flex items-center bg-ui-subtle p-0.5 rounded-md border border-ui-border self-start">
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
                            ? "bg-ui-card text-ui-text shadow-2xs"
                            : "text-ui-text-secondary hover:text-ui-text"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-1 md:max-w-md">
                    <div className="relative flex-1">
                      <Search
                        className="w-3.5 h-3.5 text-ui-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari judul CV atau posisi..."
                        aria-label="Cari dokumen CV"
                        className="w-full h-8 pl-8 pr-3 text-[12.5px] bg-ui-panel border border-ui-border rounded-md focus:bg-ui-card focus:outline-none focus:ring-1 focus:ring-ui-focus"
                      />
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as DashboardSortBy)
                      }
                      aria-label="Urutkan dokumen CV"
                      className="h-8 px-2.5 text-[12px] font-medium text-ui-text bg-ui-panel border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus"
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
                        canDelete={Boolean(authUser) || allDocs.length > 1}
                        onOpenEditor={() => handleOpenInEditor(item.id)}
                        onRename={(newTitle) => renameDocument(item.id, newTitle)}
                        onDuplicate={() => duplicateDocument(item.id)}
                        onExportJson={() => handleExportJson(item.id, item.title)}
                        onDelete={() => deleteDocument(item.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {authModalOpen && (
        <AuthModal
          open={authModalOpen}
          initialMode={authModalMode}
          onClose={closeAuthModal}
          reason={authModalReason ?? undefined}
        />
      )}

      {importModalOpen && (
        <CvImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImported={() => router.push("/editor")}
        />
      )}
    </div>
  );
}
