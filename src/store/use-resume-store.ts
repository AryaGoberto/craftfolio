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

const craftfolioStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return null;
    const current = globalThis.localStorage.getItem(name);
    if (current !== null) return current;
    if (name === "craftfolio-storage") {
      const legacy = globalThis.localStorage.getItem("formacv-storage");
      if (legacy !== null) {
        globalThis.localStorage.setItem(name, legacy);
        return legacy;
      }
    }
    return null;
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return;
    globalThis.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined" && !process.env.VITEST) return;
    globalThis.localStorage.removeItem(name);
    if (name === "craftfolio-storage") {
      globalThis.localStorage.removeItem("formacv-storage");
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
