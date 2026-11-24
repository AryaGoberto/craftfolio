"use client";

import { useEffect, useMemo, useState } from "react";
import { useResumeStore } from "@/store/use-resume-store";
import { runAtsLint } from "@/lib/ats-linter";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { FileTreeSidebar } from "@/components/editor/FileTreeSidebar";
import { WorkspaceTabBar } from "@/components/editor/WorkspaceTabBar";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { AtsCheckerModal } from "@/components/editor/AtsCheckerModal";
import { JdMatcherModal } from "@/components/editor/JdMatcherModal";

export default function EditorPage() {
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const mobileTab = useResumeStore((s) => s.mobileTab);
  const setMobileTab = useResumeStore((s) => s.setMobileTab);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const toggleFileTree = useResumeStore((s) => s.toggleFileTree);

  const [pageCount, setPageCount] = useState(1);
  const [lastPageFillRatio, setLastPageFillRatio] = useState(1);
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [jdModalOpen, setJdModalOpen] = useState(false);

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

  const doc = documents[activeDocumentId];

  const lintReport = useMemo(() => {
    if (!doc) {
      return { summary: { good: 0, review: 0, fix: 0 }, items: [] };
    }
    return runAtsLint(doc, pageCount, lastPageFillRatio);
  }, [doc, pageCount, lastPageFillRatio]);

  if (!hasHydrated || !doc) {
    return (
      <div className="h-screen flex flex-col bg-[#F8F9FA]">
        <div className="h-12 bg-white border-b border-[#E4E4E7] px-4 flex items-center justify-between">
          <div className="h-5 w-40 bg-[#F4F4F5] rounded animate-pulse" />
          <div className="h-7 w-32 bg-[#F4F4F5] rounded animate-pulse" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full lg:w-[480px] bg-[#FAFAFA] border-r border-[#E4E4E7] p-5 space-y-3">
            <div className="h-32 bg-white border border-[#E4E4E7] rounded-lg animate-pulse" />
            <div className="h-20 bg-white border border-[#E4E4E7] rounded-lg animate-pulse" />
            <div className="h-44 bg-white border border-[#E4E4E7] rounded-lg animate-pulse" />
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center p-8">
            <div className="w-[580px] h-[760px] bg-white border border-[#E4E4E7] rounded shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden">
      <EditorTopBar
        lintReport={lintReport}
        onOpenAtsModal={() => setAtsModalOpen(true)}
        onOpenJdModal={() => setJdModalOpen(true)}
      />

      {/* Outer Workspace: File Tree Sidebar + Tabbed Split-Screen Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        <FileTreeSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <WorkspaceTabBar />

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden px-4 py-2 bg-white border-b border-[#E4E4E7] flex justify-center shrink-0">
            <div className="inline-flex w-full max-w-xs bg-[#F4F4F5] p-0.5 rounded-md border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setMobileTab("edit")}
                className={`flex-1 py-1 text-[12px] font-medium rounded transition-colors ${
                  mobileTab === "edit"
                    ? "bg-white text-[#09090B] shadow-sm"
                    : "text-[#52525B]"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`flex-1 py-1 text-[12px] font-medium rounded transition-colors ${
                  mobileTab === "preview"
                    ? "bg-white text-[#09090B] shadow-sm"
                    : "text-[#52525B]"
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
              <PreviewPanel
                onPageStatsChange={(count, fill) => {
                  setPageCount(count);
                  setLastPageFillRatio(fill);
                }}
              />
            </div>
          </main>
        </div>
      </div>

      <AtsCheckerModal
        open={atsModalOpen}
        onClose={() => setAtsModalOpen(false)}
        report={lintReport}
        onJumpToSection={(section) => {
          setActiveSection(section);
          setMobileTab("edit");
        }}
      />

      <JdMatcherModal
        open={jdModalOpen}
        onClose={() => setJdModalOpen(false)}
        doc={doc}
      />
    </div>
  );
}
