"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { toAuthUserProfile } from "@/lib/firebase/auth";
import { refreshAiQuotaFromServer } from "@/lib/ai/client-fetch";
import {
  isCloudSessionPersisted,
  useResumeStore,
} from "@/store/use-resume-store";

const CLOUD_SYNC_DEBOUNCE_MS = 1500;

export function CloudSyncManager() {
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const authUser = useResumeStore((s) => s.authUser);
  const manualSyncNonce = useResumeStore((s) => s.manualSyncNonce);
  const setAuthUser = useResumeStore((s) => s.setAuthUser);
  const setAuthLoading = useResumeStore((s) => s.setAuthLoading);
  const setCloudSyncStatus = useResumeStore((s) => s.setCloudSyncStatus);
  const applyCloudWorkspace = useResumeStore((s) => s.applyCloudWorkspace);
  const resetGuestWorkspace = useResumeStore((s) => s.resetGuestWorkspace);

  const hydratedUidRef = useRef<string | null>(null);
  const isApplyingCloudRef = useRef(false);
  const dirtyDocIdsRef = useRef<Set<string>>(new Set());
  const deletedDocIdsRef = useRef<Set<string>>(new Set());
  const lastSyncedUpdatedAtRef = useRef<Map<string, string>>(new Map());
  const metaDirtyRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Subscribe to Firebase Auth state after localStorage rehydration completes
  useEffect(() => {
    if (!hasHydrated || !isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;

    let cancelled = false;
    setAuthLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;

      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      dirtyDocIdsRef.current.clear();
      deletedDocIdsRef.current.clear();
      lastSyncedUpdatedAtRef.current.clear();
      metaDirtyRef.current = false;

      if (!fbUser) {
        const wasCloudSession =
          hydratedUidRef.current !== null || isCloudSessionPersisted();
        hydratedUidRef.current = null;
        setAuthUser(null);
        if (wasCloudSession) {
          useResumeStore.temporal.getState().clear();
          resetGuestWorkspace();
        }
        setAuthLoading(false);
        return;
      }

      const profile = toAuthUserProfile(fbUser);
      setAuthUser(profile);
      setAuthLoading(false);
      setCloudSyncStatus("syncing");
      void refreshAiQuotaFromServer();

      try {
        const {
          buildMergedWorkspaceState,
          fetchUserCloudWorkspace,
          saveUserWorkspaceToCloud,
        } = await import("@/lib/firebase/firestore-sync");
        const cloudSnapshot = await fetchUserCloudWorkspace(profile.uid);
        if (cancelled) return;

        const current = useResumeStore.getState();
        const { workspace, toUploadIds } = buildMergedWorkspaceState(
          {
            documents: current.documents,
            activeDocumentId: current.activeDocumentId,
            openTabIds: current.openTabIds,
            fileOrder: current.fileOrder,
          },
          cloudSnapshot
        );

        isApplyingCloudRef.current = true;
        useResumeStore.temporal.getState().pause();
        try {
          applyCloudWorkspace(workspace);
        } finally {
          useResumeStore.temporal.getState().resume();
          isApplyingCloudRef.current = false;
        }

        // Persist merged workspace metadata + any newer/local-only documents to Firestore
        if (toUploadIds.length > 0 || !cloudSnapshot.meta) {
          await saveUserWorkspaceToCloud(profile, workspace, toUploadIds);
        }

        if (!cancelled) {
          hydratedUidRef.current = profile.uid;
          lastSyncedUpdatedAtRef.current.clear();
          for (const [id, resume] of Object.entries(workspace.documents)) {
            lastSyncedUpdatedAtRef.current.set(id, resume.updatedAt);
          }
          setCloudSyncStatus("synced");
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Gagal menyinkronkan data dengan Cloud Firestore.";
        setCloudSyncStatus("error", message);
        // Allow future edits/manual retry to attempt syncing
        hydratedUidRef.current = profile.uid;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [
    hasHydrated,
    setAuthUser,
    setAuthLoading,
    setCloudSyncStatus,
    applyCloudWorkspace,
    resetGuestWorkspace,
  ]);

  // 2. Debounced Firestore auto-sync on local workspace changes while authenticated
  useEffect(() => {
    if (!authUser) return;

    const flushPendingSync = async () => {
      const currentUser = useResumeStore.getState().authUser;
      if (!currentUser || hydratedUidRef.current !== currentUser.uid) return;

      const dirtyIds = Array.from(dirtyDocIdsRef.current);
      const deletedIds = Array.from(deletedDocIdsRef.current);
      const shouldWriteMeta = metaDirtyRef.current;

      if (dirtyIds.length === 0 && deletedIds.length === 0 && !shouldWriteMeta) {
        return;
      }

      dirtyDocIdsRef.current.clear();
      deletedDocIdsRef.current.clear();
      metaDirtyRef.current = false;

      setCloudSyncStatus("syncing");
      try {
        const { deleteResumeFromCloud, saveUserWorkspaceToCloud } =
          await import("@/lib/firebase/firestore-sync");
        const state = useResumeStore.getState();
        await saveUserWorkspaceToCloud(
          currentUser,
          {
            documents: state.documents,
            activeDocumentId: state.activeDocumentId,
            openTabIds: state.openTabIds,
            fileOrder: state.fileOrder,
          },
          dirtyIds
        );

        if (deletedIds.length > 0) {
          await Promise.all(
            deletedIds.map((id) => deleteResumeFromCloud(currentUser.uid, id))
          );
        }

        for (const id of dirtyIds) {
          const syncedDoc = state.documents[id];
          if (syncedDoc) {
            lastSyncedUpdatedAtRef.current.set(id, syncedDoc.updatedAt);
          }
        }
        for (const id of deletedIds) {
          lastSyncedUpdatedAtRef.current.delete(id);
        }

        setCloudSyncStatus("synced");
      } catch (err) {
        // Re-queue failed IDs so next edit or manual sync retries safely
        for (const id of dirtyIds) dirtyDocIdsRef.current.add(id);
        for (const id of deletedIds) deletedDocIdsRef.current.add(id);
        metaDirtyRef.current = true;

        const message =
          err instanceof Error
            ? err.message
            : "Gagal menyimpan perubahan ke Cloud Firestore.";
        setCloudSyncStatus("error", message);
      }
    };

    const unsubscribe = useResumeStore.subscribe((state, prevState) => {
      if (isApplyingCloudRef.current) return;
      if (!state.authUser || hydratedUidRef.current !== state.authUser.uid) {
        return;
      }

      let hasChanges = false;

      if (state.documents !== prevState.documents) {
        for (const id of Object.keys(state.documents)) {
          if (state.documents[id] !== prevState.documents[id]) {
            dirtyDocIdsRef.current.add(id);
            deletedDocIdsRef.current.delete(id);
            hasChanges = true;
          }
        }
        for (const id of Object.keys(prevState.documents)) {
          if (!state.documents[id]) {
            deletedDocIdsRef.current.add(id);
            dirtyDocIdsRef.current.delete(id);
            hasChanges = true;
          }
        }
      }

      if (
        state.activeDocumentId !== prevState.activeDocumentId ||
        state.openTabIds !== prevState.openTabIds ||
        state.fileOrder !== prevState.fileOrder
      ) {
        metaDirtyRef.current = true;
        hasChanges = true;
      }

      if (!hasChanges) return;

      if (state.cloudSyncStatus !== "syncing") {
        setCloudSyncStatus("syncing");
      }
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        void flushPendingSync();
      }, CLOUD_SYNC_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [authUser, setCloudSyncStatus]);

  // 3. Immediate sync when user clicks "Sinkronkan Sekarang"
  useEffect(() => {
    if (manualSyncNonce === 0) return;
    const currentUser = useResumeStore.getState().authUser;
    if (!currentUser) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    let cancelled = false;
    const runManualSync = async () => {
      setCloudSyncStatus("syncing");
      try {
        const { deleteResumeFromCloud, saveUserWorkspaceToCloud } =
          await import("@/lib/firebase/firestore-sync");
        const state = useResumeStore.getState();
        const pendingDeletes = Array.from(deletedDocIdsRef.current);
        const changedIds = new Set<string>(dirtyDocIdsRef.current);
        for (const [id, resume] of Object.entries(state.documents)) {
          if (lastSyncedUpdatedAtRef.current.get(id) !== resume.updatedAt) {
            changedIds.add(id);
          }
        }
        const idsToUpload = Array.from(changedIds);
        dirtyDocIdsRef.current.clear();
        deletedDocIdsRef.current.clear();
        metaDirtyRef.current = false;

        await saveUserWorkspaceToCloud(
          currentUser,
          {
            documents: state.documents,
            activeDocumentId: state.activeDocumentId,
            openTabIds: state.openTabIds,
            fileOrder: state.fileOrder,
          },
          idsToUpload
        );

        for (const id of idsToUpload) {
          const syncedDoc = state.documents[id];
          if (syncedDoc) {
            lastSyncedUpdatedAtRef.current.set(id, syncedDoc.updatedAt);
          }
        }
        for (const id of pendingDeletes) {
          lastSyncedUpdatedAtRef.current.delete(id);
        }

        if (pendingDeletes.length > 0) {
          await Promise.all(
            pendingDeletes.map((id) =>
              deleteResumeFromCloud(currentUser.uid, id)
            )
          );
        }

        if (!cancelled) {
          hydratedUidRef.current = currentUser.uid;
          setCloudSyncStatus("synced");
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Sinkronisasi manual ke Cloud Firestore gagal.";
        setCloudSyncStatus("error", message);
      }
    };

    void runManualSync();
    return () => {
      cancelled = true;
    };
  }, [manualSyncNonce, setCloudSyncStatus]);

  return null;
}
