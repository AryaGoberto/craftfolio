"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { AtsLintReport } from "@/lib/ats-linter";
import type { SectionKey } from "@/lib/schemas/resume";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#E4E4E7] rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4E4E7] flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-[#09090B]">
              ATS Readability Checker
            </h2>
            <p className="text-[11px] text-[#52525B]">
              Pemeriksaan berbasis aturan deterministik (bukan jaminan mutlak kelulusan ATS).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-[#E4E4E7] flex items-center gap-3 text-[12px]">
          <span className="inline-flex items-center gap-1 text-[#10B981] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {report.summary.good} Good
          </span>
          <span className="inline-flex items-center gap-1 text-[#F59E0B] font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {report.summary.review} Review
          </span>
          <span className="inline-flex items-center gap-1 text-[#EF4444] font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {report.summary.fix} Fix
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2.5">
          {report.items.map((item) => {
            const badgeStyle =
              item.status === "good"
                ? "bg-[#ECFDF5] text-[#10B981]"
                : item.status === "review"
                ? "bg-[#FFFBEB] text-[#F59E0B]"
                : "bg-[#FEF2F2] text-[#EF4444]";

            return (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-[#E4E4E7] bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[12.5px] font-semibold text-[#09090B]">
                    {item.title}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${badgeStyle}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[12px] text-[#52525B] mt-1">
                  {item.description}
                </p>
                {item.targetSection && (
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToSection(item.targetSection!);
                      onClose();
                    }}
                    className="mt-2 text-[11px] font-medium text-[#18181B] underline hover:text-[#52525B]"
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
