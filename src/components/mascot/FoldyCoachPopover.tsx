"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, Sparkles, VolumeX } from "lucide-react";
import type { AtsLintReport } from "@/lib/ats-linter";
import {
  computeAtsReadinessScore,
  getNextBestCoachTip,
  MATURITY_LABELS,
  type FoldyMaturityStage,
  type FoldyMood,
  type FoldyVisibilityMode,
} from "@/lib/foldy-coach";
import { setFoldyVisibility } from "@/lib/foldy-prefs";
import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";
import { FoldyMascot } from "./FoldyMascot";

interface FoldyCoachPopoverProps {
  doc: ResumeDocument;
  report: AtsLintReport;
  mood: FoldyMood;
  maturity: FoldyMaturityStage;
  visibility: FoldyVisibilityMode;
  onJumpToSection: (section: SectionKey | "basics") => void;
  onOpenAtsModal: () => void;
  onOpenJdModal: () => void;
  onClose: () => void;
}

const VISIBILITY_OPTIONS: Array<{
  id: FoldyVisibilityMode;
  label: string;
  icon: typeof Eye;
}> = [
  { id: "full", label: "Aktif", icon: Eye },
  { id: "quiet", label: "Tenang", icon: VolumeX },
  { id: "hidden", label: "Sembunyi", icon: EyeOff },
];

export function FoldyCoachPopover({
  doc,
  report,
  mood,
  maturity,
  visibility,
  onJumpToSection,
  onOpenAtsModal,
  onOpenJdModal,
  onClose,
}: FoldyCoachPopoverProps) {
  const score = computeAtsReadinessScore(report, doc);
  const tip = getNextBestCoachTip(report, doc);

  const scoreTone =
    score >= 80
      ? "bg-ui-success-bg text-ui-success-text border-ui-success-border"
      : score >= 50
        ? "bg-ui-warning-bg text-ui-warning-text border-ui-warning-border"
        : "bg-ui-error-bg text-ui-error-text border-ui-error-border";

  const handlePrimaryAction = () => {
    if (tip.actionKind === "jump-section" && tip.targetSection) {
      onJumpToSection(tip.targetSection);
      onClose();
    } else if (tip.actionKind === "open-jd") {
      onClose();
      onOpenJdModal();
    } else {
      onClose();
      onOpenAtsModal();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Foldy ATS Coach"
      className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-ui-card border border-ui-border rounded-lg shadow-xl overflow-hidden z-50 text-left"
    >
      {/* Header with Live Foldy & Readiness Score */}
      <div className="px-3.5 py-3 bg-ui-panel border-b border-ui-border flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-ui-card border border-ui-border flex items-center justify-center shrink-0">
          <FoldyMascot
            mood={mood === "ai" ? "ai" : tip.mood}
            size="sm"
            engine="ambient"
            interactiveClick
            ariaLabel="Foldy ATS Coach"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-ui-text truncate">
              Foldy Coach
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10.5px] font-semibold font-mono ${scoreTone}`}
            >
              {score}/100
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-ui-text-secondary">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ui-primary-soft text-ui-primary-soft-text font-medium">
              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
              {MATURITY_LABELS[maturity]}
            </span>
            <span>·</span>
            <span>
              {report.summary.fix > 0
                ? `${report.summary.fix} wajib diperbaiki`
                : report.summary.review > 0
                  ? `${report.summary.review} saran polesan`
                  : "Siap kirim"}
            </span>
          </div>
        </div>
      </div>

      {/* Single Highest-Impact Next Action */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ui-text-muted">
          {tip.id === "ats-all-clear" ? (
            <CheckCircle2 className="w-3 h-3 text-ui-success" aria-hidden="true" />
          ) : null}
          <span>
            {tip.id === "ats-all-clear"
              ? "Status Kesiapan CV"
              : "1 Prioritas Berikutnya"}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-[12.5px] font-semibold text-ui-text leading-snug">
            {tip.title}
          </p>
          <p className="text-[11.5px] text-ui-text-secondary leading-relaxed">
            {tip.description}
          </p>
        </div>

        <div className="pt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-ui-primary hover:bg-ui-primary-hover text-white text-[11.5px] font-medium transition-colors"
          >
            {tip.actionLabel}
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAtsModal();
            }}
            className="text-[11px] font-medium text-ui-link hover:text-ui-link-hover hover:underline"
          >
            Laporan lengkap
          </button>
        </div>
      </div>

      {/* Footer: Adaptive Visibility Control */}
      <div className="px-3.5 py-2.5 bg-ui-panel border-t border-ui-border flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-medium text-ui-text-secondary">
          Mode Foldy
        </span>
        <div
          role="group"
          aria-label="Pengaturan tampilan maskot Foldy"
          className="inline-flex items-center bg-ui-subtle p-0.5 rounded-md border border-ui-border"
        >
          {VISIBILITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = visibility === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setFoldyVisibility(opt.id);
                  if (opt.id === "hidden") onClose();
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors ${
                  active
                    ? "bg-ui-card text-ui-text shadow-2xs"
                    : "text-ui-text-secondary hover:text-ui-text"
                }`}
              >
                <Icon className="w-2.5 h-2.5" aria-hidden="true" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
