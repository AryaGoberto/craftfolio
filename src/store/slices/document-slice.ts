import {
  ResumeDocumentSchema,
  type ResumeDocument,
} from "@/lib/schemas/resume";
import {
  createEmptyResume,
  createSampleResume,
  generateId,
} from "@/lib/default-resume";
import {
  arrayMove,
  syncFileOrder,
  syncOpenTabs,
} from "../store-helpers";
import type {
  DocumentSliceActions,
  DocumentSliceState,
  ResumeStoreState,
  StoreMutators,
} from "../types";

export function createDocumentSlice(
  set: (
    partial:
      | ResumeStoreState
      | Partial<ResumeStoreState>
      | ((state: ResumeStoreState) => ResumeStoreState | Partial<ResumeStoreState>)
  ) => void,
  get: () => ResumeStoreState,
  mutators: StoreMutators,
  initialSample: ResumeDocument = createSampleResume()
): DocumentSliceState & DocumentSliceActions {
  return {
    documents: { [initialSample.id]: initialSample },
    activeDocumentId: initialSample.id,
    openTabIds: [initialSample.id],
    fileOrder: [initialSample.id],

    createDocument: (title) => {
      const id = generateId("cv");
      const doc = createEmptyResume(id, title || "CV Baru");
      set((state) => {
        const nextDocs = { ...state.documents, [id]: doc };
        const nextOrder = [
          ...syncFileOrder(state.fileOrder, state.documents),
          id,
        ];
        const nextTabs = [
          ...syncOpenTabs(
            state.openTabIds,
            state.documents,
            state.activeDocumentId
          ),
          id,
        ];
        return {
          documents: nextDocs,
          activeDocumentId: id,
          fileOrder: nextOrder,
          openTabIds: nextTabs,
          activeSection: "basics",
        };
      });
      mutators.scheduleSaved();
    },

    duplicateDocument: (id) => {
      const source = get().documents[id];
      if (!source) return;
      const newId = generateId("cv");
      const now = new Date().toISOString();
      const copy: ResumeDocument = {
        ...structuredClone(source),
        id: newId,
        title: `${source.title} (Salinan)`,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        const nextDocs = { ...state.documents, [newId]: copy };
        const syncedOrder = syncFileOrder(state.fileOrder, state.documents);
        const sourceIdx = syncedOrder.indexOf(id);
        const nextOrder = [...syncedOrder];
        if (sourceIdx >= 0) {
          nextOrder.splice(sourceIdx + 1, 0, newId);
        } else {
          nextOrder.push(newId);
        }
        const nextTabs = [
          ...syncOpenTabs(
            state.openTabIds,
            state.documents,
            state.activeDocumentId
          ),
          newId,
        ];
        return {
          documents: nextDocs,
          activeDocumentId: newId,
          fileOrder: nextOrder,
          openTabIds: nextTabs,
        };
      });
      mutators.scheduleSaved();
    },

    renameDocument: (id, title) => {
      const target = get().documents[id];
      if (!target) return;
      set((state) => ({
        documents: {
          ...state.documents,
          [id]: { ...target, title, updatedAt: new Date().toISOString() },
        },
      }));
      mutators.scheduleSaved();
    },

    deleteDocument: (id) => {
      const { documents, activeDocumentId, openTabIds, fileOrder } = get();
      if (Object.keys(documents).length <= 1 || !documents[id]) return;

      const nextDocs = { ...documents };
      delete nextDocs[id];

      const nextOrder = syncFileOrder(
        fileOrder.filter((fid) => fid !== id),
        nextDocs
      );

      const currentSyncedTabs = syncOpenTabs(
        openTabIds,
        documents,
        activeDocumentId
      );
      const closedIdx = currentSyncedTabs.indexOf(id);
      const remainingTabs = currentSyncedTabs.filter(
        (tid) => tid !== id && Boolean(nextDocs[tid])
      );

      let nextActive = activeDocumentId;
      let nextTabs = remainingTabs;

      if (remainingTabs.length === 0) {
        const fallbackId = nextOrder[0] ?? Object.keys(nextDocs)[0];
        nextActive = fallbackId;
        nextTabs = [fallbackId];
      } else if (activeDocumentId === id) {
        const safeIdx =
          closedIdx >= 0
            ? Math.min(closedIdx, remainingTabs.length - 1)
            : 0;
        nextActive = remainingTabs[safeIdx];
      }

      set({
        documents: nextDocs,
        activeDocumentId: nextActive,
        openTabIds: nextTabs,
        fileOrder: nextOrder,
      });
      mutators.scheduleSaved();
    },

    setActiveDocument: (id) => {
      const { documents, openTabIds, activeDocumentId } = get();
      if (!documents[id]) return;
      const currentTabs = syncOpenTabs(
        openTabIds,
        documents,
        activeDocumentId
      );
      const nextTabs = currentTabs.includes(id)
        ? currentTabs
        : [...currentTabs, id];
      set({ activeDocumentId: id, openTabIds: nextTabs });
    },

    openTab: (id) => {
      const { documents, openTabIds, activeDocumentId } = get();
      if (!documents[id]) return;
      const currentTabs = syncOpenTabs(
        openTabIds,
        documents,
        activeDocumentId
      );
      const nextTabs = currentTabs.includes(id)
        ? currentTabs
        : [...currentTabs, id];
      set({ activeDocumentId: id, openTabIds: nextTabs });
    },

    closeTab: (id) => {
      const { documents, openTabIds, activeDocumentId } = get();
      const currentTabs = syncOpenTabs(
        openTabIds,
        documents,
        activeDocumentId
      );
      if (currentTabs.length <= 1 || !currentTabs.includes(id)) return;

      const closedIdx = currentTabs.indexOf(id);
      const nextTabs = currentTabs.filter((tid) => tid !== id);
      const nextActive =
        activeDocumentId === id
          ? nextTabs[Math.min(closedIdx, nextTabs.length - 1)]
          : activeDocumentId;

      set({
        openTabIds: nextTabs,
        activeDocumentId: nextActive,
      });
    },

    reorderTabs: (oldIndex, newIndex) => {
      const { documents, openTabIds, activeDocumentId } = get();
      const currentTabs = syncOpenTabs(
        openTabIds,
        documents,
        activeDocumentId
      );
      const nextTabs = arrayMove(currentTabs, oldIndex, newIndex);
      if (nextTabs === currentTabs) return;
      set({ openTabIds: nextTabs });
    },

    reorderFiles: (oldIndex, newIndex) => {
      const { documents, fileOrder } = get();
      const currentOrder = syncFileOrder(fileOrder, documents);
      const nextOrder = arrayMove(currentOrder, oldIndex, newIndex);
      if (nextOrder === currentOrder) return;
      set({ fileOrder: nextOrder });
    },

    sortFiles: (by) => {
      const { documents, fileOrder } = get();
      const currentOrder = syncFileOrder(fileOrder, documents);
      const nextOrder = [...currentOrder].sort((a, b) => {
        const docA = documents[a];
        const docB = documents[b];
        if (by === "title") {
          return (docA.title || "").localeCompare(
            docB.title || "",
            undefined,
            { sensitivity: "base" }
          );
        }
        return (
          new Date(docB.updatedAt).getTime() -
          new Date(docA.updatedAt).getTime()
        );
      });
      set({ fileOrder: nextOrder });
    },

    loadSampleResume: () => {
      mutators.mutateActiveDoc((doc) => ({
        ...createSampleResume(),
        id: doc.id,
        title: doc.title,
      }));
    },

    clearActiveResume: () => {
      mutators.mutateActiveDoc((doc) => createEmptyResume(doc.id, doc.title));
    },

    addParsedDocument: (parsedDoc) => {
      const newId = generateId("cv");
      const now = new Date().toISOString();
      const doc: ResumeDocument = {
        ...structuredClone(parsedDoc),
        id: newId,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        documents: { ...state.documents, [newId]: doc },
        activeDocumentId: newId,
        fileOrder: [
          ...syncFileOrder(state.fileOrder, state.documents),
          newId,
        ],
        openTabIds: [
          ...syncOpenTabs(
            state.openTabIds,
            state.documents,
            state.activeDocumentId
          ),
          newId,
        ],
        activeSection: "basics",
      }));
      mutators.scheduleSaved();
    },

    importResumeJson: (rawJson) => {
      try {
        const result = ResumeDocumentSchema.safeParse(JSON.parse(rawJson));
        if (!result.success) {
          return {
            ok: false,
            error:
              "Struktur JSON tidak sesuai dengan skema CV Craftfolio.",
          };
        }
        const newId = generateId("cv");
        const doc: ResumeDocument = {
          ...result.data,
          id: newId,
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          documents: { ...state.documents, [newId]: doc },
          activeDocumentId: newId,
          fileOrder: [
            ...syncFileOrder(state.fileOrder, state.documents),
            newId,
          ],
          openTabIds: [
            ...syncOpenTabs(
              state.openTabIds,
              state.documents,
              state.activeDocumentId
            ),
            newId,
          ],
        }));
        mutators.scheduleSaved();
        return { ok: true };
      } catch {
        return { ok: false, error: "File bukan JSON yang valid." };
      }
    },

    exportResumeJson: (id) => {
      const { documents, activeDocumentId } = get();
      const targetId = id ?? activeDocumentId;
      const target = documents[targetId];
      return target ? JSON.stringify(target, null, 2) : "{}";
    },
  };
}
