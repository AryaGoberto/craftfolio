"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { AtsLintReport } from "@/lib/ats-linter";
import { deriveFoldyMood } from "@/lib/foldy-coach";
import { useFoldyPrefs } from "@/lib/foldy-prefs";
import type { SectionKey } from "@/lib/schemas/resume";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

interface AtsCheckerModalProps {
  open: boolean;
  onClose: () => void;
  report: AtsLintReport;
  onJumpToSection: (section: SectionKey | "basics") => void;
}

export function AtsCheckerModal({
  open,
  onClose,
  report,
  onJumpToSection,
}: AtsCheckerModalProps) {
  const foldyPrefs = useFoldyPrefs();
  if (!open) return null;

  const modalMood = deriveFoldyMood({ report });

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-ui-card border border-ui-border rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-ui-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {foldyPrefs.visibility !== "hidden" && (
              <div className="w-9 h-9 rounded-lg bg-ui-panel border border-ui-divider flex items-center justify-center shrink-0">
                <FoldyMascot
                  mood={modalMood}
                  size="xs"
                  engine="ambient"
                  interactiveClick
                  ariaLabel="Status ATS menurut Foldy"
                />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-ui-text">
                ATS Readability Checker
              </h2>
              <p className="text-[11px] text-ui-text-secondary">
                Pemeriksaan berbasis aturan deterministik (bukan jaminan mutlak kelulusan ATS).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ui-text-secondary hover:text-ui-text rounded hover:bg-ui-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-ui-panel border-b border-ui-border flex items-center gap-3 text-[12px]">
          <span className="inline-flex items-center gap-1 text-ui-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {report.summary.good} Good
          </span>
          <span className="inline-flex items-center gap-1 text-ui-warning font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {report.summary.review} Review
          </span>
          <span className="inline-flex items-center gap-1 text-ui-error font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {report.summary.fix} Fix
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2.5">
          {report.items.map((item) => {
            const badgeStyle =
              item.status === "good"
                ? "bg-ui-success-bg text-ui-success"
                : item.status === "review"
                ? "bg-ui-warning-bg text-ui-warning"
                : "bg-ui-error-bg text-ui-error";

            return (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-ui-border bg-ui-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[12.5px] font-semibold text-ui-text">
                    {item.title}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${badgeStyle}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[12px] text-ui-text-secondary mt-1">
                  {item.description}
                </p>
                {item.targetSection && (
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToSection(item.targetSection!);
                      onClose();
                    }}
                    className="mt-2 text-[11px] font-medium text-ui-link underline hover:text-ui-link-hover"
                  >
                    Buka bagian terkait →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
