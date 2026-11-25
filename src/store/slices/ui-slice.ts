import { isFirebaseConfigured } from "@/lib/firebase/config";
import { syncFileOrder, syncOpenTabs } from "../store-helpers";
import type {
  ResumeStoreState,
  UiSliceActions,
  UiSliceState,
} from "../types";

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
    isFileTreeOpen: true,
    hasHydrated: false,

    authUser: null,
    authLoading: isFirebaseConfigured(),
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
    toggleFileTree: (open) =>
      set((state) => ({
        isFileTreeOpen: open ?? !state.isFileTreeOpen,
      })),

    setAuthUser: (user) =>
      set({
        authUser: user,
        cloudSyncStatus: user ? "syncing" : "idle",
        cloudSyncError: null,
        lastSyncedAt: user ? get().lastSyncedAt : null,
      }),
    setAuthLoading: (loading) => set({ authLoading: loading }),
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
      if (Object.keys(payload.documents).length === 0) return;
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
  };
}
