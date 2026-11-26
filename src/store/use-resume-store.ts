"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { temporal } from "zundo";
import type { ResumeDocument } from "@/lib/schemas/resume";
import { createSampleResume } from "@/lib/default-resume";
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
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return;
    getSafeSessionStorage()?.removeItem(name);
    const ls = getSafeLocalStorage();
    ls?.removeItem(name);
    if (name === CRAFTFOLIO_STORAGE_KEY) {
      ls?.removeItem("formacv-storage");
    }
  },
}));

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

        const initialSample = createSampleResume();

        return {
          ...createDocumentSlice(set, get, mutators, initialSample),
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
