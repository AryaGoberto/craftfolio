"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { temporal } from "zundo";
import type { ResumeDocument } from "@/lib/schemas/resume";
import { createEmptyResume } from "@/lib/default-resume";
import { migratePersistedResumeState } from "./store-helpers";
import { createDocumentSlice } from "./slices/document-slice";
import { createSectionSlice } from "./slices/section-slice";
import { createUiSlice } from "./slices/ui-slice";
import type {
  PersistedResumeState,
  ResumeStoreState,
  StoreMutators,
  TemporalResumeState,
} from "./types";

// Re-export all types and helper functions for 100% backward compatibility
export * from "./types";
export * from "./store-helpers";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const CRAFTFOLIO_STORAGE_KEY = "craftfolio-storage";
export const CRAFTFOLIO_CLOUD_SESSION_FLAG = "craftfolio-cloud-session";
export const STORAGE_WRITE_DEBOUNCE_MS = 350;
export const TEMPORAL_THROTTLE_MS = 500;

export interface DebouncedStorageWriter {
  schedule: (name: string, value: string) => void;
  flush: () => void;
  cancel: (name?: string) => void;
}

/**
 * Coalesces rapid storage writes (e.g., per-keystroke Zustand persist updates)
 * so JSON writes happen once after a brief typing pause instead of blocking every keystroke.
 */
export function createDebouncedStorageWriter(
  writeNow: (name: string, value: string) => void,
  delayMs: number = STORAGE_WRITE_DEBOUNCE_MS
): DebouncedStorageWriter {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const pending = new Map<string, string>();

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending.size === 0) return;
    const entries = Array.from(pending.entries());
    pending.clear();
    for (const [k, v] of entries) {
      writeNow(k, v);
    }
  };

  const schedule = (name: string, value: string) => {
    pending.set(name, value);
    if (delayMs <= 0) {
      flush();
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, delayMs);
  };

  const cancel = (name?: string) => {
    if (name !== undefined) {
      pending.delete(name);
      if (pending.size === 0 && timer) {
        clearTimeout(timer);
        timer = null;
      }
      return;
    }
    pending.clear();
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { schedule, flush, cancel };
}

function writeResumeStorageNow(name: string, value: string): void {
  const ss = getSafeSessionStorage();
  ss?.setItem(name, value);

  const ls = getSafeLocalStorage();
  if (ls) {
    if (ls.getItem(CRAFTFOLIO_CLOUD_SESSION_FLAG) === "1") {
      ls.setItem(name, value);
    } else {
      ls.removeItem(name);
    }
  }
}

const debouncedResumeStorageWriter = createDebouncedStorageWriter(
  writeResumeStorageNow,
  STORAGE_WRITE_DEBOUNCE_MS
);

let unloadFlushRegistered = false;
function ensureBrowserUnloadFlushRegistered(): void {
  if (unloadFlushRegistered || typeof window === "undefined") return;
  unloadFlushRegistered = true;

  const flushSafe = () => {
    debouncedResumeStorageWriter.flush();
  };
  window.addEventListener("pagehide", flushSafe);
  window.addEventListener("beforeunload", flushSafe);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushSafe();
      }
    });
  }
}

export function flushPendingResumeStorage(): void {
  debouncedResumeStorageWriter.flush();
}

function getSafeSessionStorage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  try {
    return typeof globalThis.sessionStorage !== "undefined"
      ? globalThis.sessionStorage
      : null;
  } catch {
    return null;
  }
}

function getSafeLocalStorage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  try {
    return typeof globalThis.localStorage !== "undefined"
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}

export function isCloudSessionPersisted(): boolean {
  const ls = getSafeLocalStorage();
  return ls?.getItem(CRAFTFOLIO_CLOUD_SESSION_FLAG) === "1";
}

export function clearAllResumeStorages(): void {
  debouncedResumeStorageWriter.cancel();
  const ss = getSafeSessionStorage();
  const ls = getSafeLocalStorage();
  ss?.removeItem(CRAFTFOLIO_STORAGE_KEY);
  ls?.removeItem(CRAFTFOLIO_STORAGE_KEY);
  ls?.removeItem("formacv-storage");
  ls?.removeItem(CRAFTFOLIO_CLOUD_SESSION_FLAG);
}

const craftfolioStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return null;

    // 1. Tab-scoped sessionStorage preserves Guest edits within the open tab
    const ss = getSafeSessionStorage();
    const sessionValue = ss?.getItem(name) ?? null;
    if (sessionValue !== null) return sessionValue;

    // 2. Permanent localStorage cache is only restored for authenticated cloud sessions
    const ls = getSafeLocalStorage();
    if (ls && ls.getItem(CRAFTFOLIO_CLOUD_SESSION_FLAG) === "1") {
      const cloudCached = ls.getItem(name);
      if (cloudCached !== null) return cloudCached;
    } else if (ls && name === CRAFTFOLIO_STORAGE_KEY) {
      // Wipe stale unauthenticated guest data from localStorage so closed tabs start fresh
      ls.removeItem(name);
      ls.removeItem("formacv-storage");
    }

    return null;
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return;
    if (process.env.VITEST) {
      writeResumeStorageNow(name, value);
      return;
    }
    ensureBrowserUnloadFlushRegistered();
    debouncedResumeStorageWriter.schedule(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return;
    debouncedResumeStorageWriter.cancel(name);
    getSafeSessionStorage()?.removeItem(name);
    const ls = getSafeLocalStorage();
    ls?.removeItem(name);
    if (name === CRAFTFOLIO_STORAGE_KEY) {
      ls?.removeItem("formacv-storage");
    }
  },
}));

let lastTemporalSnapshotAt = 0;

export const useResumeStore = create<ResumeStoreState>()(
  persist(
    temporal(
      (set, get) => {
        const scheduleSaved = () => {
          set({ saveStatus: "saving" });
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(() => set({ saveStatus: "saved" }), 300);
        };

        const mutateActiveDoc = (
          updater: (doc: ResumeDocument) => ResumeDocument
        ) => {
          const { documents, activeDocumentId } = get();
          const current = documents[activeDocumentId];
          if (!current) return;
          set({
            documents: {
              ...documents,
              [activeDocumentId]: {
                ...updater(current),
                updatedAt: new Date().toISOString(),
              },
            },
          });
          scheduleSaved();
        };

        const mutators: StoreMutators = {
          scheduleSaved,
          mutateActiveDoc,
        };

        const initialResume = createEmptyResume("resume-default-1", "CV Saya");

        return {
          ...createDocumentSlice(set, get, mutators, initialResume),
          ...createSectionSlice(set, get, mutators),
          ...createUiSlice(set, get),
        };
      },
      {
        limit: 50,
        partialize: (state): TemporalResumeState => ({
          documents: state.documents,
          activeDocumentId: state.activeDocumentId,
        }),
        equality: (pastState, currentState) =>
          pastState.documents === currentState.documents,
        handleSet: (handleSet) => (pastState, replace, currentState, deltaState) => {
          const now = Date.now();
          const hasExistingHistory =
            useResumeStore?.temporal?.getState().pastStates.length > 0;
          if (
            !hasExistingHistory ||
            now - lastTemporalSnapshotAt >= TEMPORAL_THROTTLE_MS
          ) {
            lastTemporalSnapshotAt = now;
            (handleSet as unknown as (
              past: typeof pastState,
              rep: typeof replace,
              curr: typeof currentState,
              delta: typeof deltaState
            ) => void)(pastState, replace, currentState, deltaState);
          }
        },
      }
    ),
    {
      name: "craftfolio-storage",
      storage: craftfolioStorage,
      version: 3,
      partialize: (state): PersistedResumeState => ({
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        openTabIds: state.openTabIds,
        fileOrder: state.fileOrder,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: migratePersistedResumeState,
    }
  )
);
