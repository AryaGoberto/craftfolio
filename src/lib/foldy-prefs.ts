"use client";

import { useSyncExternalStore } from "react";
import type {
  FoldyMilestoneId,
  FoldyPrefs,
  FoldyVisibilityMode,
} from "@/lib/foldy-coach";

export const FOLDY_PREFS_STORAGE_KEY = "craftfolio-foldy-prefs";
export const FOLDY_PREFS_CHANGE_EVENT = "craftfolio-foldy-prefs-change";

export const DEFAULT_FOLDY_PREFS: FoldyPrefs = Object.freeze({
  visibility: "full",
  hasExportedPdf: false,
  achievedMilestones: {},
});

let cachedRaw: string | null | undefined = undefined;
let cachedSnapshot: FoldyPrefs = DEFAULT_FOLDY_PREFS;

export function isValidFoldyVisibility(
  value: unknown
): value is FoldyVisibilityMode {
  return value === "full" || value === "quiet" || value === "hidden";
}

export function parseFoldyPrefs(raw: string | null): FoldyPrefs {
  if (!raw) return DEFAULT_FOLDY_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<FoldyPrefs>;
    const visibility = isValidFoldyVisibility(parsed.visibility)
      ? parsed.visibility
      : "full";
    const hasExportedPdf = Boolean(parsed.hasExportedPdf);
    const achievedMilestones: Record<string, string[]> = {};
    if (
      parsed.achievedMilestones &&
      typeof parsed.achievedMilestones === "object"
    ) {
      for (const [docId, list] of Object.entries(parsed.achievedMilestones)) {
        if (Array.isArray(list)) {
          achievedMilestones[docId] = list.filter(
            (item): item is string => typeof item === "string"
          );
        }
      }
    }
    return { visibility, hasExportedPdf, achievedMilestones };
  } catch {
    return DEFAULT_FOLDY_PREFS;
  }
}

export function readFoldyPrefsSnapshot(): FoldyPrefs {
  if (typeof window === "undefined") return DEFAULT_FOLDY_PREFS;
  try {
    const raw = window.localStorage.getItem(FOLDY_PREFS_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    cachedSnapshot = parseFoldyPrefs(raw);
    return cachedSnapshot;
  } catch {
    return DEFAULT_FOLDY_PREFS;
  }
}

function writeFoldyPrefs(next: FoldyPrefs): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(next);
    window.localStorage.setItem(FOLDY_PREFS_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedSnapshot = next;
    window.dispatchEvent(new Event(FOLDY_PREFS_CHANGE_EVENT));
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
}

export function setFoldyVisibility(visibility: FoldyVisibilityMode): void {
  const current = readFoldyPrefsSnapshot();
  if (current.visibility === visibility) return;
  writeFoldyPrefs({ ...current, visibility });
}

export function markFoldyPdfExported(docId?: string): void {
  const current = readFoldyPrefsSnapshot();
  const nextMilestones = { ...current.achievedMilestones };
  if (docId) {
    const existing = nextMilestones[docId] ?? [];
    if (!existing.includes("pdf-export")) {
      nextMilestones[docId] = [...existing, "pdf-export"];
    }
  }
  writeFoldyPrefs({
    ...current,
    hasExportedPdf: true,
    achievedMilestones: nextMilestones,
  });
}

export function recordFoldyMilestone(
  docId: string,
  milestoneId: FoldyMilestoneId
): void {
  const current = readFoldyPrefsSnapshot();
  const existing = current.achievedMilestones[docId] ?? [];
  if (existing.includes(milestoneId)) return;
  writeFoldyPrefs({
    ...current,
    achievedMilestones: {
      ...current.achievedMilestones,
      [docId]: [...existing, milestoneId],
    },
  });
}

function subscribeFoldyPrefs(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === FOLDY_PREFS_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(FOLDY_PREFS_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(FOLDY_PREFS_CHANGE_EVENT, callback);
  };
}

export function useFoldyPrefs(): FoldyPrefs {
  return useSyncExternalStore(
    subscribeFoldyPrefs,
    readFoldyPrefsSnapshot,
    () => DEFAULT_FOLDY_PREFS
  );
}
