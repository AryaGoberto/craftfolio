import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyResume, createSampleResume } from "@/lib/default-resume";
import {
  CRAFTFOLIO_CLOUD_SESSION_FLAG,
  CRAFTFOLIO_STORAGE_KEY,
  isCloudSessionPersisted,
  migratePersistedResumeState,
  syncFileOrder,
  syncOpenTabs,
  useResumeStore,
} from "@/store/use-resume-store";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function resetStore() {
  const base = createSampleResume("2026-01-01T00:00:00.000Z");
  useResumeStore.setState({
    documents: { [base.id]: base },
    activeDocumentId: base.id,
    openTabIds: [base.id],
    fileOrder: [base.id],
    isFileTreeOpen: true,
    activeSection: "basics",
  });
  useResumeStore.temporal.getState().clear();
  return base;
}

describe("Workspace Tabs & File Tree Store", () => {
  beforeAll(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    resetStore();
  });

  it("initializes openTabIds and fileOrder with the active document", () => {
    const state = useResumeStore.getState();
    expect(state.isFileTreeOpen).toBe(true);
    expect(state.openTabIds).toEqual([state.activeDocumentId]);
    expect(state.fileOrder).toEqual([state.activeDocumentId]);
  });

  it("adds newly created and duplicated documents to fileOrder and openTabIds", () => {
    const base = useResumeStore.getState().activeDocumentId;

    useResumeStore.getState().createDocument("CV Frontend");
    const createdId = useResumeStore.getState().activeDocumentId;
    expect(createdId).not.toBe(base);
    expect(useResumeStore.getState().fileOrder).toEqual([base, createdId]);
    expect(useResumeStore.getState().openTabIds).toEqual([base, createdId]);

    useResumeStore.getState().duplicateDocument(base);
    const duplicatedId = useResumeStore.getState().activeDocumentId;
    expect(duplicatedId).not.toBe(base);
    expect(duplicatedId).not.toBe(createdId);
    // Duplicate is inserted immediately after its source in File Tree
    expect(useResumeStore.getState().fileOrder).toEqual([
      base,
      duplicatedId,
      createdId,
    ]);
    expect(useResumeStore.getState().openTabIds).toEqual([
      base,
      createdId,
      duplicatedId,
    ]);
  });

  it("closes a tab without deleting the document from File Tree and shifts active tab", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().createDocument("CV Backend");
    const secondId = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().createDocument("CV Fullstack");
    const thirdId = useResumeStore.getState().activeDocumentId;

    // Close currently active middle tab
    useResumeStore.getState().setActiveDocument(secondId);
    useResumeStore.getState().closeTab(secondId);

    const state = useResumeStore.getState();
    expect(state.openTabIds).toEqual([base, thirdId]);
    expect(state.activeDocumentId).toBe(thirdId);
    // Still exists in documents and fileOrder
    expect(state.documents[secondId]).toBeDefined();
    expect(state.fileOrder).toEqual([base, secondId, thirdId]);
  });

  it("refuses to close the last remaining open tab", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().closeTab(base);

    const state = useResumeStore.getState();
    expect(state.openTabIds).toEqual([base]);
    expect(state.activeDocumentId).toBe(base);
  });

  it("reopens a closed file from File Tree without duplicating already-open tabs", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().createDocument("CV Data");
    const secondId = useResumeStore.getState().activeDocumentId;

    useResumeStore.getState().closeTab(secondId);
    expect(useResumeStore.getState().openTabIds).toEqual([base]);

    useResumeStore.getState().openTab(secondId);
    expect(useResumeStore.getState().openTabIds).toEqual([base, secondId]);
    expect(useResumeStore.getState().activeDocumentId).toBe(secondId);

    // Calling openTab again does not duplicate tab ID
    useResumeStore.getState().openTab(base);
    expect(useResumeStore.getState().openTabIds).toEqual([base, secondId]);
    expect(useResumeStore.getState().activeDocumentId).toBe(base);
  });

  it("reorders tabs and files accurately and sorts files by title or updatedAt", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().renameDocument(base, "Zebra CV");
    useResumeStore.getState().createDocument("Alpha CV");
    const alphaId = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().createDocument("Middle CV");
    const middleId = useResumeStore.getState().activeDocumentId;

    // Reorder tabs: move index 2 -> 0
    useResumeStore.getState().reorderTabs(2, 0);
    expect(useResumeStore.getState().openTabIds).toEqual([
      middleId,
      base,
      alphaId,
    ]);

    // Out-of-bounds reorder is a safe no-op
    useResumeStore.getState().reorderTabs(-1, 10);
    expect(useResumeStore.getState().openTabIds).toEqual([
      middleId,
      base,
      alphaId,
    ]);

    // Reorder files: move index 0 -> 2
    useResumeStore.getState().reorderFiles(0, 2);
    expect(useResumeStore.getState().fileOrder).toEqual([
      alphaId,
      middleId,
      base,
    ]);

    // Sort files alphabetically by title
    useResumeStore.getState().sortFiles("title");
    expect(useResumeStore.getState().fileOrder).toEqual([
      alphaId,
      middleId,
      base,
    ]);

    // Sort files by updatedAt descending
    const docs = useResumeStore.getState().documents;
    useResumeStore.setState({
      documents: {
        ...docs,
        [base]: { ...docs[base], updatedAt: "2026-05-01T10:00:00.000Z" },
        [alphaId]: { ...docs[alphaId], updatedAt: "2026-03-01T10:00:00.000Z" },
        [middleId]: {
          ...docs[middleId],
          updatedAt: "2026-04-01T10:00:00.000Z",
        },
      },
    });
    useResumeStore.getState().sortFiles("updatedAt");
    expect(useResumeStore.getState().fileOrder).toEqual([
      base,
      middleId,
      alphaId,
    ]);
  });

  it("deletes documents cleanly while keeping at least one document and one open tab", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().createDocument("CV Temporary");
    const tempId = useResumeStore.getState().activeDocumentId;

    // Close base tab so only tempId is open, then delete tempId
    useResumeStore.getState().closeTab(base);
    expect(useResumeStore.getState().openTabIds).toEqual([tempId]);

    useResumeStore.getState().deleteDocument(tempId);

    const state = useResumeStore.getState();
    expect(state.documents[tempId]).toBeUndefined();
    expect(state.fileOrder).toEqual([base]);
    expect(state.openTabIds).toEqual([base]);
    expect(state.activeDocumentId).toBe(base);

    // Refuses to delete the last document
    useResumeStore.getState().deleteDocument(base);
    expect(Object.keys(useResumeStore.getState().documents)).toEqual([base]);
  });

  it("exports JSON for a specific non-active document ID and imports JSON into tabs & File Tree", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().renameDocument(base, "Master Profile");
    useResumeStore.getState().createDocument("Active Draft");

    // Export non-active base document directly by ID
    const exportedJson = useResumeStore.getState().exportResumeJson(base);
    const parsed = JSON.parse(exportedJson);
    expect(parsed.id).toBe(base);
    expect(parsed.title).toBe("Master Profile");

    // Import that JSON as a new document
    const importRes = useResumeStore.getState().importResumeJson(exportedJson);
    expect(importRes.ok).toBe(true);

    const state = useResumeStore.getState();
    const importedId = state.activeDocumentId;
    expect(importedId).not.toBe(base);
    expect(state.fileOrder).toContain(importedId);
    expect(state.openTabIds).toContain(importedId);
  });

  it("does not pollute zundo undo history when toggling sidebar or manipulating tabs/files", () => {
    const base = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().createDocument("Second CV");
    const secondId = useResumeStore.getState().activeDocumentId;

    // Clear history after setup
    useResumeStore.temporal.getState().clear();
    expect(useResumeStore.temporal.getState().pastStates).toHaveLength(0);

    // Perform UI / workspace navigation actions only
    useResumeStore.getState().toggleFileTree(false);
    useResumeStore.getState().toggleFileTree(true);
    useResumeStore.getState().reorderTabs(0, 1);
    useResumeStore.getState().reorderFiles(0, 1);
    useResumeStore.getState().sortFiles("title");
    useResumeStore.getState().closeTab(secondId);
    useResumeStore.getState().openTab(secondId);
    useResumeStore.getState().setActiveDocument(base);

    expect(useResumeStore.temporal.getState().pastStates).toHaveLength(0);

    // Editing document content MUST record into undo history
    useResumeStore.getState().renameDocument(base, "Renamed Master");
    expect(useResumeStore.temporal.getState().pastStates).toHaveLength(1);
  });

  it("migrates legacy v2 persisted state to v3 and sanitizes stale IDs", () => {
    const docA = createEmptyResume("cv-a", "Doc A");
    const docB = createEmptyResume("cv-b", "Doc B");
    const legacyV2 = {
      documents: { "cv-a": docA, "cv-b": docB },
      activeDocumentId: "cv-b",
    };

    const migrated = migratePersistedResumeState(legacyV2, 2);
    expect(migrated.activeDocumentId).toBe("cv-b");
    expect(migrated.fileOrder).toEqual(["cv-a", "cv-b"]);
    expect(migrated.openTabIds).toEqual(["cv-b"]);

    // Helper sanitization strips deleted/duplicate IDs and keeps active doc open
    expect(
      syncFileOrder(["stale-id", "cv-b", "cv-b"], migrated.documents)
    ).toEqual(["cv-b", "cv-a"]);
    expect(
      syncOpenTabs(["stale-id"], migrated.documents, "cv-a")
    ).toEqual(["cv-a"]);
  });

  it("controls auth modal open state and contextual reason without polluting undo history", () => {
    expect(useResumeStore.getState().authModalOpen).toBe(false);
    expect(useResumeStore.getState().authModalReason).toBeNull();

    useResumeStore
      .getState()
      .openAuthModal("Masuk untuk menggunakan asisten AI Gemini.", "signup");
    expect(useResumeStore.getState().authModalOpen).toBe(true);
    expect(useResumeStore.getState().authModalMode).toBe("signup");
    expect(useResumeStore.getState().authModalReason).toBe(
      "Masuk untuk menggunakan asisten AI Gemini."
    );

    useResumeStore.getState().closeAuthModal();
    expect(useResumeStore.getState().authModalOpen).toBe(false);
    expect(useResumeStore.getState().authModalReason).toBeNull();

    expect(useResumeStore.temporal.getState().pastStates).toHaveLength(0);
  });

  it("keeps Guest edits strictly in sessionStorage and clears all storages on resetGuestWorkspace", () => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();

    // Guest edit should write to sessionStorage, never localStorage
    useResumeStore.getState().setAuthUser(null);
    const activeId = useResumeStore.getState().activeDocumentId;
    useResumeStore.getState().renameDocument(activeId, "Guest Temp CV");

    expect(isCloudSessionPersisted()).toBe(false);
    expect(globalThis.localStorage.getItem(CRAFTFOLIO_STORAGE_KEY)).toBeNull();
    expect(globalThis.sessionStorage.getItem(CRAFTFOLIO_STORAGE_KEY)).toContain(
      "Guest Temp CV"
    );

    // Authenticated session enables localStorage cloud cache
    useResumeStore.getState().setAuthUser({
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    });
    expect(isCloudSessionPersisted()).toBe(true);
    expect(globalThis.localStorage.getItem(CRAFTFOLIO_STORAGE_KEY)).toContain(
      "Guest Temp CV"
    );

    // Sign-out / reset wipes both localStorage and sessionStorage
    useResumeStore.getState().setAuthUser(null);
    useResumeStore.getState().resetGuestWorkspace();
    expect(isCloudSessionPersisted()).toBe(false);
    expect(globalThis.localStorage.getItem(CRAFTFOLIO_STORAGE_KEY)).toBeNull();
    expect(globalThis.localStorage.getItem(CRAFTFOLIO_CLOUD_SESSION_FLAG)).toBeNull();
    expect(
      globalThis.sessionStorage.getItem(CRAFTFOLIO_STORAGE_KEY)
    ).not.toContain("Guest Temp CV");
  });
});
