"use client";

import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { isCloudSessionPersisted, useResumeStore } from "@/store/use-resume-store";
import { runAtsLint } from "@/lib/ats-linter";
import {
  computeAtsReadinessScore,
  deriveFoldyMood,
  FOLDY_TYPING_LOCK_MS,
  resolveMaturityStage,
  shouldTriggerMilestone,
  type FoldyMilestoneId,
  type FoldyMood,
} from "@/lib/foldy-coach";
import {
  readFoldyPrefsSnapshot,
  recordFoldyMilestone,
  useFoldyPrefs,
} from "@/lib/foldy-prefs";
import { subscribeFoldyEvents } from "@/lib/foldy-events";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { WorkspaceTabBar } from "@/components/editor/WorkspaceTabBar";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import {
  FoldyCelebrationToast,
  type FoldyCelebrationState,
} from "@/components/mascot/FoldyCelebrationToast";

const CloudSyncManager = dynamic(
  () =>
    import("@/components/auth/CloudSyncManager").then(
      (mod) => mod.CloudSyncManager
    ),
  { ssr: false }
);

const FileTreeSidebar = dynamic(
  () =>
    import("@/components/editor/FileTreeSidebar").then(
      (mod) => mod.FileTreeSidebar
    ),
  {
    ssr: false,
    loading: () => (
      <div className="hidden lg:block w-60 shrink-0 bg-ui-subtle border-r border-ui-border h-full" />
    ),
  }
);

const AtsCheckerModal = dynamic(
  () =>
    import("@/components/editor/AtsCheckerModal").then(
      (mod) => mod.AtsCheckerModal
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

const JdMatcherModal = dynamic(
  () =>
    import("@/components/editor/JdMatcherModal").then(
      (mod) => mod.JdMatcherModal
    ),
  { ssr: false }
);

const AuthModal = dynamic(
  () =>
    import("@/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false }
);

export default function EditorPage() {
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const doc = documents[activeDocumentId];
  const createDocument = useResumeStore((s) => s.createDocument);
  const setActiveDocument = useResumeStore((s) => s.setActiveDocument);
  const mobileTab = useResumeStore((s) => s.mobileTab);
  const setMobileTab = useResumeStore((s) => s.setMobileTab);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const toggleFileTree = useResumeStore((s) => s.toggleFileTree);
  const authUser = useResumeStore((s) => s.authUser);
  const authLoading = useResumeStore((s) => s.authLoading);
  const cloudSyncStatus = useResumeStore((s) => s.cloudSyncStatus);
  const authModalOpen = useResumeStore((s) => s.authModalOpen);
  const authModalMode = useResumeStore((s) => s.authModalMode);
  const authModalReason = useResumeStore((s) => s.authModalReason);
  const openAuthModal = useResumeStore((s) => s.openAuthModal);
  const closeAuthModal = useResumeStore((s) => s.closeAuthModal);

  const [pageCount, setPageCount] = useState(1);
  const [lastPageFillRatio, setLastPageFillRatio] = useState(1);
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [jdModalOpen, setJdModalOpen] = useState(false);
  const [importCvModalOpen, setImportCvModalOpen] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);

  const foldyPrefs = useFoldyPrefs();
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [celebration, setCelebration] = useState<FoldyCelebrationState | null>(
    null
  );
  const lastTypingAtRef = useRef<number>(0);
  const lastCelebrationAtRef = useRef<number>(0);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevScoreRef = useRef<{ docId: string; score: number } | null>(null);

  // Auto-create a clean starter resume when opening /editor from an empty (0-CV) Dashboard
  useEffect(() => {
    if (!hasHydrated) return;
    if (authLoading && isCloudSessionPersisted()) return;
    if (authUser && cloudSyncStatus === "syncing") return;

    const ids = Object.keys(documents);
    if (ids.length === 0) {
      createDocument("CV Saya");
    } else if (!documents[activeDocumentId]) {
      setActiveDocument(ids[0]);
    }
  }, [
    hasHydrated,
    authLoading,
    authUser,
    cloudSyncStatus,
    documents,
    activeDocumentId,
    createDocument,
    setActiveDocument,
  ]);

  // Warn unauthenticated guests (or syncing cloud sessions) before closing/reloading tab
  useEffect(() => {
    if (authLoading) return;
    const shouldWarnGuest = !authUser;
    const shouldWarnMidSync = Boolean(authUser && cloudSyncStatus === "syncing");
    if (!shouldWarnGuest && !shouldWarnMidSync) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Data CV Anda tidak tersimpan permanen dan akan terhapus saat tab ditutup.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [authLoading, authUser, cloudSyncStatus]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      toggleFileTree(false);
    }
  }, [toggleFileTree]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "b"
      ) {
        e.preventDefault();
        toggleFileTree();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFileTree]);

  const deferredDoc = useDeferredValue(doc);

  const handlePageStatsChange = useCallback(
    (count: number, fill: number) => {
      setPageCount(count);
      setLastPageFillRatio(fill);
    },
    []
  );

  const lintReport = useMemo(() => {
    if (!deferredDoc) {
      return { summary: { good: 0, review: 0, fix: 0 }, items: [] };
    }
    return runAtsLint(deferredDoc, pageCount, lastPageFillRatio);
  }, [deferredDoc, pageCount, lastPageFillRatio]);

  const allDocsList = useMemo(() => Object.values(documents), [documents]);

  const foldyMaturity = useMemo(
    () => resolveMaturityStage(foldyPrefs, allDocsList),
    [foldyPrefs, allDocsList]
  );

  const foldyMood = useMemo(
    () =>
      deriveFoldyMood({
        report: lintReport,
        doc: deferredDoc,
        isAiBusy,
        isSyncing: cloudSyncStatus === "syncing",
      }),
    [lintReport, deferredDoc, isAiBusy, cloudSyncStatus]
  );

  const triggerFoldyCelebration = useCallback(
    (params: {
      milestoneId: FoldyMilestoneId;
      docId: string;
      mood: FoldyMood;
      title: string;
      description: string;
      explicitUserAction?: boolean;
    }) => {
      const latestPrefs = readFoldyPrefsSnapshot();
      const now = Date.now();
      const allowed = shouldTriggerMilestone({
        milestoneId: params.milestoneId,
        docId: params.docId,
        achievedMilestones: latestPrefs.achievedMilestones,
        lastCelebrationAt: lastCelebrationAtRef.current,
        lastTypingAt: lastTypingAtRef.current,
        now,
        visibility: latestPrefs.visibility,
        maturity: foldyMaturity,
        explicitUserAction: params.explicitUserAction,
      });
      if (!allowed) return;

      lastCelebrationAtRef.current = now;
      recordFoldyMilestone(params.docId, params.milestoneId);
      setCelebration({
        id: now,
        mood: params.mood,
        title: params.title,
        description: params.description,
      });

      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
      celebrationTimerRef.current = setTimeout(() => {
        setCelebration(null);
      }, 4500);
    },
    [foldyMaturity]
  );

  // Track user typing timestamps in a ref (zero extra re-renders)
  useEffect(() => {
    if (!doc) return;
    lastTypingAtRef.current = Date.now();
  }, [doc]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  // Subscribe to explicit AI, PDF export, CV import, and JD match events
  useEffect(() => {
    return subscribeFoldyEvents((payload) => {
      if (payload.type === "ai-start") {
        setIsAiBusy(true);
        return;
      }
      if (payload.type === "ai-end") {
        setIsAiBusy(false);
        return;
      }
      const targetDocId = payload.docId || activeDocumentId || "active";
      if (payload.type === "pdf-exported") {
        triggerFoldyCelebration({
          milestoneId: "pdf-export",
          docId: targetDocId,
          mood: "happy",
          title: "PDF berhasil diunduh!",
          description: "CV ATS-mu siap dikirim ke perekrut. Semoga sukses melamar!",
          explicitUserAction: true,
        });
      } else if (payload.type === "cv-imported") {
        triggerFoldyCelebration({
          milestoneId: "cv-import",
          docId: targetDocId,
          mood: "eureka",
          title: "CV lama berhasil diimpor!",
          description: "Struktur CV sudah rapi di editor. Cek detail terakhir sebelum ekspor.",
          explicitUserAction: true,
        });
      } else if (payload.type === "ai-applied") {
        triggerFoldyCelebration({
          milestoneId: "ai-enhance",
          docId: targetDocId,
          mood: "crafty",
          title: "Kalimat makin tajam!",
          description: payload.detail || "Polesan AI berhasil diterapkan ke CV aktif.",
          explicitUserAction: true,
        });
      } else if (payload.type === "jd-high-match") {
        triggerFoldyCelebration({
          milestoneId: "jd-high-match",
          docId: targetDocId,
          mood: "happy",
          title: "Kecocokan JD tinggi!",
          description: payload.detail || "Kata kunci lowongan utama sudah tercermin di CV-mu.",
          explicitUserAction: true,
        });
      }
    });
  }, [activeDocumentId, triggerFoldyCelebration]);

  // Passive milestone: celebrate once when a document crosses ATS readiness >= 80 after user pauses typing
  useEffect(() => {
    if (!deferredDoc) return;
    const score = computeAtsReadinessScore(lintReport, deferredDoc);
    const prev = prevScoreRef.current;
    const crossedIntoReady =
      prev !== null &&
      prev.docId === deferredDoc.id &&
      prev.score < 80 &&
      score >= 80;

    prevScoreRef.current = { docId: deferredDoc.id, score };

    if (!crossedIntoReady) return;

    const timer = setTimeout(() => {
      triggerFoldyCelebration({
        milestoneId: "ats-80",
        docId: deferredDoc.id,
        mood: "eureka",
        title: `Skor Kesiapan ATS tembus ${score}/100!`,
        description: "Struktur dasar dan keterbacaan CV-mu sudah sangat solid.",
      });
    }, FOLDY_TYPING_LOCK_MS + 150);

    return () => clearTimeout(timer);
  }, [deferredDoc, lintReport, triggerFoldyCelebration]);

  if (!hasHydrated || !doc) {
    return (
      <div className="h-screen flex flex-col bg-ui-canvas">
        {hasHydrated && <CloudSyncManager />}
        <div className="h-12 bg-ui-card border-b border-ui-border px-4 flex items-center justify-between">
          <div className="h-5 w-40 bg-ui-subtle rounded animate-pulse" />
          <div className="h-7 w-32 bg-ui-subtle rounded animate-pulse" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full lg:w-[480px] bg-ui-panel border-r border-ui-border p-5 space-y-3">
            <div className="h-32 bg-ui-card border border-ui-border rounded-lg animate-pulse" />
            <div className="h-20 bg-ui-card border border-ui-border rounded-lg animate-pulse" />
            <div className="h-44 bg-ui-card border border-ui-border rounded-lg animate-pulse" />
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center p-8">
            <div className="w-[580px] h-[760px] bg-ui-card border border-ui-border rounded shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-ui-canvas overflow-hidden">
      <CloudSyncManager />

      <EditorTopBar
        lintReport={lintReport}
        foldyMood={foldyMood}
        foldyMaturity={foldyMaturity}
        onJumpToSection={(section) => {
          setActiveSection(section);
          setMobileTab("edit");
        }}
        onOpenAtsModal={() => setAtsModalOpen(true)}
        onOpenJdModal={() => setJdModalOpen(true)}
        onOpenAuthModal={() => openAuthModal()}
        onOpenImportCvModal={() => setImportCvModalOpen(true)}
      />

      {!authLoading && !authUser && !guestBannerDismissed && (
        <div
          role="status"
          className="px-3 sm:px-4 py-1.5 bg-ui-warning-bg border-b border-ui-warning-border text-ui-warning-text text-[11.5px] flex items-center justify-between gap-2 shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-ui-warning shrink-0" />
            <p className="truncate sm:whitespace-normal">
              <span className="font-semibold">Mode Guest:</span> Data CV ini tidak tersimpan permanen dan akan terhapus saat tab ditutup.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                openAuthModal(
                  "Masuk atau buat akun gratis agar CV Anda tersimpan permanen di Cloud dan tidak terhapus saat tab ditutup."
                )
              }
              className="px-2.5 py-0.5 rounded bg-ui-primary hover:bg-ui-primary-hover text-white text-[11px] font-medium transition-colors"
            >
              Masuk &amp; Simpan
            </button>
            <button
              type="button"
              onClick={() => setGuestBannerDismissed(true)}
              aria-label="Tutup peringatan mode guest"
              className="p-0.5 rounded text-ui-warning-text/75 hover:text-ui-warning-text hover:bg-ui-warning-border/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Outer Workspace: File Tree Sidebar + Tabbed Split-Screen Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        <FileTreeSidebar
          onOpenImportCvModal={() => setImportCvModalOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <WorkspaceTabBar />

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden px-4 py-2 bg-ui-card border-b border-ui-border flex justify-center shrink-0">
            <div className="inline-flex w-full max-w-xs bg-ui-subtle p-0.5 rounded-md border border-ui-border">
              <button
                type="button"
                onClick={() => setMobileTab("edit")}
                className={`flex-1 py-1 text-[12px] font-medium rounded transition-colors ${
                  mobileTab === "edit"
                    ? "bg-ui-card text-ui-text shadow-sm"
                    : "text-ui-text-secondary"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`flex-1 py-1 text-[12px] font-medium rounded transition-colors ${
                  mobileTab === "preview"
                    ? "bg-ui-card text-ui-text shadow-sm"
                    : "text-ui-text-secondary"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Split-Screen Workspace */}
          <main className="flex-1 flex overflow-hidden">
            <div
              className={`${
                mobileTab === "edit" ? "flex" : "hidden"
              } lg:flex w-full lg:w-auto h-full overflow-hidden`}
            >
              <EditorPanel />
            </div>

            <div
              className={`${
                mobileTab === "preview" ? "flex" : "hidden"
              } lg:flex flex-1 h-full overflow-hidden`}
            >
              <PreviewPanel onPageStatsChange={handlePageStatsChange} />
            </div>
          </main>
        </div>
      </div>

      {atsModalOpen && (
        <AtsCheckerModal
          open={atsModalOpen}
          onClose={() => setAtsModalOpen(false)}
          report={lintReport}
          onJumpToSection={(section) => {
            setActiveSection(section);
            setMobileTab("edit");
          }}
        />
      )}

      {jdModalOpen && (
        <JdMatcherModal
          open={jdModalOpen}
          onClose={() => setJdModalOpen(false)}
          doc={doc}
        />
      )}

      {authModalOpen && (
        <AuthModal
          open={authModalOpen}
          initialMode={authModalMode}
          onClose={closeAuthModal}
          reason={authModalReason ?? undefined}
        />
      )}

      {importCvModalOpen && (
        <CvImportModal
          open={importCvModalOpen}
          onClose={() => setImportCvModalOpen(false)}
        />
      )}

      {foldyPrefs.visibility !== "hidden" && (
        <FoldyCelebrationToast
          celebration={celebration}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
