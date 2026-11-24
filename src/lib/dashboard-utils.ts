import { runAtsLint } from "@/lib/ats-linter";
import type { ResumeDocument, TemplateId } from "@/lib/schemas/resume";

export type CvCompletionStatus = "ready" | "draft";
export type DashboardStatusFilter = "all" | CvCompletionStatus;
export type DashboardSortBy = "updatedAt" | "title";

export const TEMPLATE_DISPLAY_NAMES: Record<TemplateId, string> = {
  "classic-latex": "Classic Academic",
  "modern-minimal": "Modern Minimalist",
  compact: "Compact",
  executive: "Executive Standard",
};

/**
 * Classifies a CV document as `"draft"` when basic ATS `fix` rules fail
 * (missing required contact info or leftover sample placeholder text), or `"ready"` otherwise.
 */
export function getCvCompletionStatus(doc: ResumeDocument): CvCompletionStatus {
  if (
    doc.basics.fullName.trim() === "Raka Pratama" &&
    doc.basics.email.trim().toLowerCase() === "raka.pratama@email.com"
  ) {
    return "draft";
  }
  const report = runAtsLint(doc);
  return report.summary.fix > 0 ? "draft" : "ready";
}

export interface DashboardFilterOptions {
  query: string;
  statusFilter: DashboardStatusFilter;
  sortBy: DashboardSortBy;
}

export function filterAndSortDashboardDocs(
  docs: ResumeDocument[],
  options: DashboardFilterOptions
): ResumeDocument[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  const filtered = docs.filter((doc) => {
    if (options.statusFilter !== "all") {
      const status = getCvCompletionStatus(doc);
      if (status !== options.statusFilter) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [
      doc.title,
      doc.targetRole ?? "",
      doc.basics.fullName,
      doc.basics.headline ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  return [...filtered].sort((a, b) => {
    if (options.sortBy === "title") {
      return (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
      });
    }
    const timeA = Date.parse(a.updatedAt) || 0;
    const timeB = Date.parse(b.updatedAt) || 0;
    return timeB - timeA;
  });
}

/** Deterministic date formatter safe for Next.js static prerendering. */
export function formatDashboardDate(isoString: string): string {
  const ms = Date.parse(isoString);
  if (Number.isNaN(ms)) return "Baru saja";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(ms));
}
