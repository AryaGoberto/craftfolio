import { createEmptyResume } from "@/lib/default-resume";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { syncFileOrder, syncOpenTabs } from "../store-helpers";
import type {
  ResumeStoreState,
  UiSliceActions,
  UiSliceState,
} from "../types";

const CLOUD_SESSION_FLAG = "craftfolio-cloud-session";
const STORAGE_KEY = "craftfolio-storage";

function syncStorageAuthFlag(
  isAuthenticated: boolean,
  state?: ResumeStoreState
) {
  if (typeof globalThis === "undefined") return;
  try {
    const ls =
      typeof globalThis.localStorage !== "undefined"
        ? globalThis.localStorage
        : null;
    if (!ls) return;

    if (isAuthenticated) {
      ls.setItem(CLOUD_SESSION_FLAG, "1");
      if (state) {
        ls.setItem(
          STORAGE_KEY,
          JSON.stringify({
            state: {
              documents: state.documents,
              activeDocumentId: state.activeDocumentId,
              openTabIds: state.openTabIds,
              fileOrder: state.fileOrder,
            },
            version: 3,
          })
        );
      }
    } else {
      ls.removeItem(CLOUD_SESSION_FLAG);
      ls.removeItem(STORAGE_KEY);
      ls.removeItem("formacv-storage");
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

export function createUiSlice(
  set: (
    partial:
      | ResumeStoreState
      | Partial<ResumeStoreState>
      | ((state: ResumeStoreState) => ResumeStoreState | Partial<ResumeStoreState>)
  ) => void,
  get: () => ResumeStoreState
): UiSliceState & UiSliceActions {
  return {
    saveStatus: "saved",
    activeSection: "basics",
    mobileTab: "edit",
    previewZoom: 0.9,
    previewMode: "visual",
    showGhostPreview: true,
    isFileTreeOpen: true,
    hasHydrated: false,

    authUser: null,
    authLoading: isFirebaseConfigured(),
    authModalOpen: false,
    authModalMode: "signin",
    authModalReason: null,
    aiQuota: null,
    cloudSyncStatus: "idle",
    cloudSyncError: null,
    lastSyncedAt: null,
    manualSyncNonce: 0,

    setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    setActiveSection: (section) => set({ activeSection: section }),
    setMobileTab: (tab) => set({ mobileTab: tab }),
    setPreviewZoom: (zoom) =>
      set({ previewZoom: Math.min(1.5, Math.max(0.45, zoom)) }),
    setPreviewMode: (mode) => set({ previewMode: mode }),
    toggleGhostPreview: (show) =>
      set((state) => ({
        showGhostPreview: show ?? !state.showGhostPreview,
      })),
    toggleFileTree: (open) =>
      set((state) => ({
        isFileTreeOpen: open ?? !state.isFileTreeOpen,
      })),

    openAuthModal: (reason, mode = "signin") =>
      set({
        authModalOpen: true,
        authModalMode: mode,
        authModalReason: reason ?? null,
      }),
    closeAuthModal: () =>
      set({ authModalOpen: false, authModalReason: null }),

    setAuthUser: (user) => {
      syncStorageAuthFlag(Boolean(user), user ? get() : undefined);
      set({
        authUser: user,
        aiQuota: user ? get().aiQuota : null,
        cloudSyncStatus: user ? "syncing" : "idle",
        cloudSyncError: null,
        lastSyncedAt: user ? get().lastSyncedAt : null,
      });
    },
    setAuthLoading: (loading) => set({ authLoading: loading }),
    setAiQuota: (quota) => set({ aiQuota: quota }),
    setCloudSyncStatus: (status, error = null) =>
      set((state) => ({
        cloudSyncStatus: status,
        cloudSyncError: error,
        lastSyncedAt:
          status === "synced"
            ? new Date().toISOString()
            : state.lastSyncedAt,
      })),
    triggerManualSync: () =>
      set((state) => ({ manualSyncNonce: state.manualSyncNonce + 1 })),
    applyCloudWorkspace: (payload) => {
      if (Object.keys(payload.documents).length === 0) {
        set({
          documents: {},
          activeDocumentId: "",
          openTabIds: [],
          fileOrder: [],
        });
        return;
      }
      const nextOrder = syncFileOrder(payload.fileOrder, payload.documents);
      const nextActive = payload.documents[payload.activeDocumentId]
        ? payload.activeDocumentId
        : nextOrder[0];
      const nextTabs = syncOpenTabs(
        payload.openTabIds,
        payload.documents,
        nextActive
      );
      set({
        documents: payload.documents,
        activeDocumentId: nextActive,
        openTabIds: nextTabs,
        fileOrder: nextOrder,
      });
    },
    resetGuestWorkspace: () => {
      syncStorageAuthFlag(false);
      try {
        if (typeof globalThis.sessionStorage !== "undefined") {
          globalThis.sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }
      const freshEmpty = createEmptyResume("resume-default-1", "CV Saya");
      set({
        documents: { [freshEmpty.id]: freshEmpty },
        activeDocumentId: freshEmpty.id,
        openTabIds: [freshEmpty.id],
        fileOrder: [freshEmpty.id],
        activeSection: "basics",
        saveStatus: "saved",
      });
    },
  };
}
