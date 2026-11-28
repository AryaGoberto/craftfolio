import type { AtsLintReport } from "@/lib/ats-linter";
import { getCvCompletionStatus } from "@/lib/dashboard-utils";
import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";

export type FoldyMood =
  | "idle"
  | "cursor"
  | "happy"
  | "ai"
  | "wink"
  | "eureka"
  | "crafty"
  | "sleepy";

export type FoldyVisibilityMode = "full" | "quiet" | "hidden";

export type FoldyMaturityStage = "onboarding" | "guided" | "quiet-pro";

export type FoldyMilestoneId =
  | "ats-80"
  | "ats-clean"
  | "pdf-export"
  | "ai-enhance"
  | "cv-import"
  | "jd-high-match";

export interface FoldyPrefs {
  visibility: FoldyVisibilityMode;
  hasExportedPdf: boolean;
  achievedMilestones: Record<string, string[]>;
}

export interface FoldyCoachTip {
  id: string;
  mood: FoldyMood;
  title: string;
  description: string;
  actionLabel: string;
  targetSection?: SectionKey | "basics";
  actionKind: "jump-section" | "open-ats" | "open-jd" | "export-pdf";
}

export interface FoldyDashboardGreeting {
  mood: FoldyMood;
  headline: string;
  subtext: string;
}

export const FOLDY_TYPING_LOCK_MS = 1200;
export const FOLDY_CELEBRATION_COOLDOWN_MS = 45_000;

export function isSampleStarterResume(doc?: ResumeDocument | null): boolean {
  if (!doc) return false;
  return (
    doc.basics.fullName.trim() === "Raka Pratama" &&
    doc.basics.email.trim().toLowerCase() === "raka.pratama@email.com"
  );
}

function hasAnyCoreContent(doc?: ResumeDocument | null): boolean {
  if (!doc) return false;
  const hasVisibleExp = doc.sections.experience.items.some(
    (item) => item.isVisible && (item.company.trim() || item.position.trim())
  );
  const hasVisibleEdu = doc.sections.education.items.some(
    (item) => item.isVisible && (item.institution.trim() || item.degree.trim())
  );
  const hasVisibleProj = doc.sections.projects.items.some(
    (item) => item.isVisible && item.name.trim()
  );
  const hasVisibleSkills = doc.sections.skills.items.some(
    (item) => item.isVisible && item.skills.trim()
  );
  return hasVisibleExp || hasVisibleEdu || hasVisibleProj || hasVisibleSkills;
}

/**
 * Deterministic 0-100 ATS readiness score derived from `AtsLintReport` and document content.
 */
export function computeAtsReadinessScore(
  report?: AtsLintReport | null,
  doc?: ResumeDocument | null
): number {
  if (!report) return 0;

  let score = 100 - report.summary.fix * 25 - report.summary.review * 10;

  if (doc) {
    if (isSampleStarterResume(doc)) {
      score = Math.min(score, 45);
    } else if (!hasAnyCoreContent(doc)) {
      score = Math.min(score, 35);
    }
  }

  return Math.max(0, Math.min(100, score));
}

export interface DeriveFoldyMoodInput {
  report?: AtsLintReport | null;
  doc?: ResumeDocument | null;
  isAiBusy?: boolean;
  isSyncing?: boolean;
  overrideMood?: FoldyMood | null;
}

export function deriveFoldyMood(input: DeriveFoldyMoodInput): FoldyMood {
  if (input.overrideMood) return input.overrideMood;
  if (input.isAiBusy || input.isSyncing) return "ai";

  const score = computeAtsReadinessScore(input.report, input.doc);
  if (score < 50) return "sleepy";
  if (score < 80) return "crafty";
  return "happy";
}

export function getNextBestCoachTip(
  report: AtsLintReport,
  doc?: ResumeDocument | null
): FoldyCoachTip {
  const firstFix = report.items.find((item) => item.status === "fix");
  if (firstFix) {
    return {
      id: firstFix.id,
      mood: "eureka",
      title: firstFix.title,
      description: firstFix.description,
      actionLabel: firstFix.targetSection
        ? "Perbaiki Sekarang"
        : "Buka Laporan ATS",
      targetSection: firstFix.targetSection,
      actionKind: firstFix.targetSection ? "jump-section" : "open-ats",
    };
  }

  if (isSampleStarterResume(doc)) {
    return {
      id: "replace-sample-profile",
      mood: "wink",
      title: "Ganti data contoh dengan profil aslimu",
      description:
        "CV ini masih memakai profil contoh 'Raka Pratama'. Mulai dari Informasi Dasar agar langsung siap dikirim.",
      actionLabel: "Edit Informasi Dasar",
      targetSection: "basics",
      actionKind: "jump-section",
    };
  }

  if (doc && !hasAnyCoreContent(doc)) {
    return {
      id: "add-first-experience",
      mood: "sleepy",
      title: "Tambahkan pengalaman atau pendidikan pertamamu",
      description:
        "Mulai dari 1 pengalaman kerja, proyek, atau pendidikan agar struktur CV ATS langsung terbentuk rapi.",
      actionLabel: "Isi Pengalaman",
      targetSection: "experience",
      actionKind: "jump-section",
    };
  }

  const firstReview = report.items.find((item) => item.status === "review");
  if (firstReview) {
    return {
      id: firstReview.id,
      mood: "crafty",
      title: firstReview.title,
      description: firstReview.description,
      actionLabel: firstReview.targetSection
        ? "Perbaiki Bagian Ini"
        : "Lihat Detail ATS",
      targetSection: firstReview.targetSection,
      actionKind: firstReview.targetSection ? "jump-section" : "open-ats",
    };
  }

  return {
    id: "ats-all-clear",
    mood: "happy",
    title: "CV-mu sudah rapi & ramah ATS!",
    description:
      "Struktur satu kolom, kontak, dan format tanggal sudah bersih. Kamu bisa uji kecocokan dengan Job Description atau langsung unduh PDF.",
    actionLabel: "Uji dengan JD Match",
    actionKind: "open-jd",
  };
}

export function resolveMaturityStage(
  prefs: FoldyPrefs,
  docs: ResumeDocument[]
): FoldyMaturityStage {
  const readyCount = docs.filter(
    (doc) => getCvCompletionStatus(doc) === "ready"
  ).length;

  if (prefs.hasExportedPdf || readyCount >= 2) {
    return "quiet-pro";
  }

  if (docs.length === 0 || readyCount === 0) {
    return "onboarding";
  }

  return "guided";
}

export interface MilestoneGuardInput {
  milestoneId: FoldyMilestoneId;
  docId: string;
  achievedMilestones: Record<string, string[]>;
  lastCelebrationAt: number;
  lastTypingAt: number;
  now: number;
  visibility: FoldyVisibilityMode;
  maturity: FoldyMaturityStage;
  explicitUserAction?: boolean;
}

const PASSIVE_MILESTONES: ReadonlySet<FoldyMilestoneId> = new Set([
  "ats-80",
  "ats-clean",
]);

export function shouldTriggerMilestone(input: MilestoneGuardInput): boolean {
  if (input.visibility === "hidden") return false;

  const isExplicit = Boolean(input.explicitUserAction);

  if (
    (input.visibility === "quiet" || input.maturity === "quiet-pro") &&
    !isExplicit
  ) {
    return false;
  }

  const docMilestones = input.achievedMilestones[input.docId] ?? [];
  if (
    PASSIVE_MILESTONES.has(input.milestoneId) &&
    docMilestones.includes(input.milestoneId)
  ) {
    return false;
  }

  if (!isExplicit && input.now - input.lastTypingAt < FOLDY_TYPING_LOCK_MS) {
    return false;
  }

  if (
    !isExplicit &&
    input.lastCelebrationAt > 0 &&
    input.now - input.lastCelebrationAt < FOLDY_CELEBRATION_COOLDOWN_MS
  ) {
    return false;
  }

  return true;
}

export function buildDashboardGreeting(
  docs: ResumeDocument[],
  maturity: FoldyMaturityStage,
  isSyncing = false
): FoldyDashboardGreeting {
  if (isSyncing) {
    return {
      mood: "ai",
      headline: "Menyinkronkan dokumen CV ke Cloud...",
      subtext: "Semua versi CV dan progresmu sedang diamankan ke Firestore.",
    };
  }

  if (docs.length === 0) {
    return {
      mood: "sleepy",
      headline: "Siap menyusun CV pertamamu?",
      subtext:
        "Mulai dari nol atau impor CV lama (PDF/Word) — biar aku bantu rapikan strukturnya.",
    };
  }

  const readyCount = docs.filter(
    (doc) => getCvCompletionStatus(doc) === "ready"
  ).length;
  const draftCount = docs.length - readyCount;

  if (draftCount === 0) {
    return {
      mood: "happy",
      headline:
        readyCount === 1
          ? "1 CV sudah siap kirim!"
          : `Semua ${readyCount} CV sudah siap kirim!`,
      subtext:
        maturity === "quiet-pro"
          ? "Mode Quiet Pro aktif · Klik CV mana saja untuk tailoring cepat ke lowongan baru."
          : "Struktur ATS sudah bersih. Kamu bisa duplikasi untuk menyesuaikan tiap lamaran.",
    };
  }

  if (readyCount === 0) {
    return {
      mood: "crafty",
      headline:
        draftCount === 1
          ? "1 draf CV menunggu diselesaikan"
          : `${draftCount} draf CV menunggu diselesaikan`,
      subtext:
        "Lengkapi info kontak dan poin pengalaman agar statusnya berubah menjadi Siap Kirim.",
    };
  }

  return {
    mood: "wink",
    headline: `${readyCount} CV siap kirim, ${draftCount} draf tersisa`,
    subtext:
      maturity === "quiet-pro"
        ? "Koleksi CV rapi · Buka draf kapan saja untuk merapikan detail terakhir."
        : "Progres bagus! Selesaikan draf tersisa atau langsung unduh PDF dari CV yang sudah siap.",
  };
}

export const MATURITY_LABELS: Record<FoldyMaturityStage, string> = {
  onboarding: "Mode Pemula",
  guided: "ATS Coach",
  "quiet-pro": "Quiet Pro",
};
