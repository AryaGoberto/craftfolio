"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import {
  ResumeDocumentSchema,
  type BulletPoint,
  type BuiltinSectionKey,
  type CustomSectionItem,
  type ResumeDocument,
  type SectionKey,
} from "@/lib/schemas/resume";
import {
  createEmptyItemForSection,
  createEmptyResume,
  createSampleResume,
  generateId,
} from "@/lib/default-resume";
import { DEFAULT_SECTION_TITLES, type AppLanguage } from "@/lib/i18n";
import type { AuthUserProfile } from "@/lib/firebase/auth";

export type SaveStatus = "saved" | "saving" | "unsaved";

export type CloudSyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

export type FileSortBy = "title" | "updatedAt";

interface TemporalResumeState {
  documents: Record<string, ResumeDocument>;
  activeDocumentId: string;
}

export interface PersistedResumeState extends TemporalResumeState {
  openTabIds: string[];
  fileOrder: string[];
}

type ItemSectionKey = BuiltinSectionKey | `custom:${string}`;
type GenericItem = { id: string; isVisible: boolean; bullets?: BulletPoint[] };

export interface ResumeStoreState extends PersistedResumeState {
  saveStatus: SaveStatus;
  activeSection: SectionKey | "basics";
  mobileTab: "edit" | "preview";
  previewZoom: number;
  previewMode: "visual" | "xray";
  isFileTreeOpen: boolean;
  hasHydrated: boolean;

  authUser: AuthUserProfile | null;
  authLoading: boolean;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncError: string | null;
  lastSyncedAt: string | null;
  manualSyncNonce: number;

  setHasHydrated: (hydrated: boolean) => void;
  setActiveSection: (section: SectionKey | "basics") => void;
  setMobileTab: (tab: "edit" | "preview") => void;
  setPreviewZoom: (zoom: number) => void;
  setPreviewMode: (mode: "visual" | "xray") => void;
  toggleFileTree: (open?: boolean) => void;

  setAuthUser: (user: AuthUserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setCloudSyncStatus: (status: CloudSyncStatus, error?: string | null) => void;
  triggerManualSync: () => void;
  applyCloudWorkspace: (payload: PersistedResumeState) => void;

  createDocument: (title?: string) => void;
  duplicateDocument: (id: string) => void;
  renameDocument: (id: string, title: string) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  reorderTabs: (oldIndex: number, newIndex: number) => void;
  reorderFiles: (oldIndex: number, newIndex: number) => void;
  sortFiles: (by: FileSortBy) => void;
  loadSampleResume: () => void;
  clearActiveResume: () => void;
  importResumeJson: (rawJson: string) => { ok: boolean; error?: string };
  exportResumeJson: (id?: string) => string;

  updateConfig: (patch: Partial<ResumeDocument["config"]>) => void;
  setLanguage: (lang: AppLanguage) => void;

  updateBasics: (
    patch: Partial<
      Pick<
        ResumeDocument["basics"],
        "fullName" | "headline" | "email" | "phone" | "location"
      >
    >
  ) => void;
  addLink: () => void;
  updateLink: (
    id: string,
    patch: Partial<{ label: string; url: string; isVisible: boolean }>
  ) => void;
  removeLink: (id: string) => void;
  updateSummary: (patch: Partial<{ text: string; isVisible: boolean }>) => void;

  reorderSections: (newOrder: SectionKey[]) => void;
  moveSection: (key: SectionKey, direction: "up" | "down") => void;
  toggleSectionVisibility: (key: SectionKey) => void;
  updateSectionTitle: (key: SectionKey, title: string) => void;

  addSectionItem: (key: ItemSectionKey) => void;
  updateSectionItem: (
    key: ItemSectionKey,
    itemId: string,
    patch: Record<string, unknown>
  ) => void;
  removeSectionItem: (key: ItemSectionKey, itemId: string) => void;
  toggleItemVisibility: (key: ItemSectionKey, itemId: string) => void;
  reorderSectionItems: (
    key: ItemSectionKey,
    oldIndex: number,
    newIndex: number
  ) => void;

  addBullet: (key: ItemSectionKey, itemId: string) => void;
  updateBullet: (
    key: ItemSectionKey,
    itemId: string,
    bulletId: string,
    text: string
  ) => void;
  removeBullet: (key: ItemSectionKey, itemId: string, bulletId: string) => void;
  toggleBulletVisibility: (
    key: ItemSectionKey,
    itemId: string,
    bulletId: string
  ) => void;

  addCustomSection: (title?: string) => void;
  removeCustomSection: (customId: string) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= arr.length ||
    to >= arr.length
  ) {
    return arr;
  }
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
}

/** Ensures every existing document ID appears exactly once in File Tree order. */
export function syncFileOrder(
  fileOrder: string[] | undefined,
  documents: Record<string, ResumeDocument>
): string[] {
  const validIds = new Set(Object.keys(documents));
  const seen = new Set<string>();
  const next: string[] = [];

  for (const id of fileOrder ?? []) {
    if (validIds.has(id) && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }

  for (const id of Object.keys(documents)) {
    if (!seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }

  return next;
}

/** Keeps open tabs valid, deduplicated, and ensures the active document has an open tab. */
export function syncOpenTabs(
  openTabIds: string[] | undefined,
  documents: Record<string, ResumeDocument>,
  activeDocumentId: string
): string[] {
  const validIds = new Set(Object.keys(documents));
  const seen = new Set<string>();
  const next: string[] = [];

  for (const id of openTabIds ?? []) {
    if (validIds.has(id) && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }

  if (validIds.has(activeDocumentId) && !seen.has(activeDocumentId)) {
    next.push(activeDocumentId);
  }

  if (next.length === 0) {
    const firstId = Object.keys(documents)[0];
    if (firstId) next.push(firstId);
  }

  return next;
}

/** Pure migration helper for persisted Zustand state (v1/v2 -> v3). */
export function migratePersistedResumeState(
  persistedState: unknown,
  version: number
): PersistedResumeState {
  const state = persistedState as Partial<PersistedResumeState> | undefined;
  if (
    !state ||
    !state.documents ||
    Object.keys(state.documents).length === 0
  ) {
    const sample = createSampleResume();
    return {
      documents: { [sample.id]: sample },
      activeDocumentId: sample.id,
      openTabIds: [sample.id],
      fileOrder: [sample.id],
    };
  }

  let documents = state.documents;
  if (version < 2) {
    const updatedDocs: Record<string, ResumeDocument> = {};
    for (const [id, doc] of Object.entries(documents)) {
      updatedDocs[id] =
        doc.config.templateId === "classic-latex" &&
        doc.config.fontFamily === "inter"
          ? { ...doc, config: { ...doc.config, fontFamily: "serif" } }
          : doc;
    }
    documents = updatedDocs;
  }

  const activeDocumentId =
    state.activeDocumentId && documents[state.activeDocumentId]
      ? state.activeDocumentId
      : Object.keys(documents)[0];

  const fileOrder = syncFileOrder(state.fileOrder, documents);
  const openTabIds = syncOpenTabs(
    version < 3 ? [activeDocumentId] : state.openTabIds,
    documents,
    activeDocumentId
  );

  return {
    documents,
    activeDocumentId,
    openTabIds,
    fileOrder,
  };
}

/** Immutably updates items (and optionally visibility) of a built-in or custom section. */
function updateSectionItems(
  doc: ResumeDocument,
  key: ItemSectionKey,
  transform: (items: GenericItem[]) => GenericItem[],
  forceVisible?: boolean
): ResumeDocument {
  if (key.startsWith("custom:")) {
    const customId = key.replace("custom:", "");
    return {
      ...doc,
      sections: {
        ...doc.sections,
        customSections: doc.sections.customSections.map((cs) =>
          cs.id === customId
            ? {
                ...cs,
                isVisible: forceVisible ?? cs.isVisible,
                items: transform(cs.items) as CustomSectionItem[],
              }
            : cs
        ),
      },
    };
  }

  const builtinKey = key as BuiltinSectionKey;
  const current = doc.sections[builtinKey];
  return {
    ...doc,
    sections: {
      ...doc.sections,
      [builtinKey]: {
        ...current,
        isVisible: forceVisible ?? current.isVisible,
        items: transform(current.items as GenericItem[]),
      },
    },
  };
}

/** Immutably updates the bullets array of a specific item inside a section. */
function updateItemBullets(
  doc: ResumeDocument,
  key: ItemSectionKey,
  itemId: string,
  transformBullets: (bullets: BulletPoint[]) => BulletPoint[]
): ResumeDocument {
  return updateSectionItems(doc, key, (items) =>
    items.map((it) =>
      it.id === itemId
        ? { ...it, bullets: transformBullets(it.bullets ?? []) }
        : it
    )
  );
}

const initialSample = createSampleResume();

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

        return {
          documents: { [initialSample.id]: initialSample },
          activeDocumentId: initialSample.id,
          openTabIds: [initialSample.id],
          fileOrder: [initialSample.id],
          saveStatus: "saved",
          activeSection: "basics",
          mobileTab: "edit",
          previewZoom: 0.9,
          previewMode: "visual",
          isFileTreeOpen: true,
          hasHydrated: false,

          authUser: null,
          authLoading: false,
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
            scheduleSaved();
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
            scheduleSaved();
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
            scheduleSaved();
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
            scheduleSaved();
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
            mutateActiveDoc((doc) => ({
              ...createSampleResume(),
              id: doc.id,
              title: doc.title,
            }));
          },

          clearActiveResume: () => {
            mutateActiveDoc((doc) => createEmptyResume(doc.id, doc.title));
          },

          importResumeJson: (rawJson) => {
            try {
              const result = ResumeDocumentSchema.safeParse(JSON.parse(rawJson));
              if (!result.success) {
                return {
                  ok: false,
                  error:
                    "Struktur JSON tidak sesuai dengan skema CV FormaCV.",
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
              scheduleSaved();
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

          updateConfig: (patch) => {
            mutateActiveDoc((doc) => ({
              ...doc,
              config: { ...doc.config, ...patch },
            }));
          },

          setLanguage: (lang) => {
            mutateActiveDoc((doc) => {
              const prevDefaults = DEFAULT_SECTION_TITLES[doc.language];
              const nextDefaults = DEFAULT_SECTION_TITLES[lang];
              const nextSections = { ...doc.sections };
              const keys = [
                "experience",
                "education",
                "projects",
                "skills",
                "certifications",
                "awards",
                "volunteering",
                "languages",
              ] as const;

              for (const k of keys) {
                if (nextSections[k].title === prevDefaults[k]) {
                  nextSections[k] = {
                    ...nextSections[k],
                    title: nextDefaults[k],
                  } as never;
                }
              }
              return { ...doc, language: lang, sections: nextSections };
            });
          },

          updateBasics: (patch) => {
            mutateActiveDoc((doc) => ({
              ...doc,
              basics: { ...doc.basics, ...patch },
            }));
          },

          addLink: () => {
            mutateActiveDoc((doc) => ({
              ...doc,
              basics: {
                ...doc.basics,
                links: [
                  ...doc.basics.links,
                  {
                    id: generateId("link"),
                    label: "Portfolio",
                    url: "",
                    isVisible: true,
                  },
                ],
              },
            }));
          },

          updateLink: (id, patch) => {
            mutateActiveDoc((doc) => ({
              ...doc,
              basics: {
                ...doc.basics,
                links: doc.basics.links.map((l) =>
                  l.id === id ? { ...l, ...patch } : l
                ),
              },
            }));
          },

          removeLink: (id) => {
            mutateActiveDoc((doc) => ({
              ...doc,
              basics: {
                ...doc.basics,
                links: doc.basics.links.filter((l) => l.id !== id),
              },
            }));
          },

          updateSummary: (patch) => {
            mutateActiveDoc((doc) => ({
              ...doc,
              basics: {
                ...doc.basics,
                summary: { ...doc.basics.summary, ...patch },
              },
            }));
          },

          reorderSections: (newOrder) => {
            mutateActiveDoc((doc) => ({
              ...doc,
              config: { ...doc.config, sectionOrder: newOrder },
            }));
          },

          moveSection: (key, direction) => {
            mutateActiveDoc((doc) => {
              const order = doc.config.sectionOrder;
              const idx = order.indexOf(key);
              const target = direction === "up" ? idx - 1 : idx + 1;
              if (idx === -1 || target < 0 || target >= order.length) return doc;
              return {
                ...doc,
                config: {
                  ...doc.config,
                  sectionOrder: arrayMove(order, idx, target),
                },
              };
            });
          },

          toggleSectionVisibility: (key) => {
            mutateActiveDoc((doc) => {
              if (key === "summary") {
                return {
                  ...doc,
                  basics: {
                    ...doc.basics,
                    summary: {
                      ...doc.basics.summary,
                      isVisible: !doc.basics.summary.isVisible,
                    },
                  },
                };
              }
              if (key.startsWith("custom:")) {
                const customId = key.replace("custom:", "");
                return {
                  ...doc,
                  sections: {
                    ...doc.sections,
                    customSections: doc.sections.customSections.map((cs) =>
                      cs.id === customId
                        ? { ...cs, isVisible: !cs.isVisible }
                        : cs
                    ),
                  },
                };
              }
              const builtinKey = key as BuiltinSectionKey;
              return {
                ...doc,
                sections: {
                  ...doc.sections,
                  [builtinKey]: {
                    ...doc.sections[builtinKey],
                    isVisible: !doc.sections[builtinKey].isVisible,
                  },
                },
              };
            });
          },

          updateSectionTitle: (key, title) => {
            mutateActiveDoc((doc) => {
              if (key === "summary") return doc;
              if (key.startsWith("custom:")) {
                const customId = key.replace("custom:", "");
                return {
                  ...doc,
                  sections: {
                    ...doc.sections,
                    customSections: doc.sections.customSections.map((cs) =>
                      cs.id === customId ? { ...cs, title } : cs
                    ),
                  },
                };
              }
              const builtinKey = key as BuiltinSectionKey;
              return {
                ...doc,
                sections: {
                  ...doc.sections,
                  [builtinKey]: { ...doc.sections[builtinKey], title },
                },
              };
            });
          },

          addSectionItem: (key) => {
            const newItem = createEmptyItemForSection(key);
            mutateActiveDoc((doc) =>
              updateSectionItems(doc, key, (items) => [...items, newItem], true)
            );
          },

          updateSectionItem: (key, itemId, patch) => {
            mutateActiveDoc((doc) =>
              updateSectionItems(doc, key, (items) =>
                items.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
              )
            );
          },

          removeSectionItem: (key, itemId) => {
            mutateActiveDoc((doc) =>
              updateSectionItems(doc, key, (items) =>
                items.filter((it) => it.id !== itemId)
              )
            );
          },

          toggleItemVisibility: (key, itemId) => {
            mutateActiveDoc((doc) =>
              updateSectionItems(doc, key, (items) =>
                items.map((it) =>
                  it.id === itemId ? { ...it, isVisible: !it.isVisible } : it
                )
              )
            );
          },

          reorderSectionItems: (key, oldIndex, newIndex) => {
            mutateActiveDoc((doc) =>
              updateSectionItems(doc, key, (items) =>
                arrayMove(items, oldIndex, newIndex)
              )
            );
          },

          addBullet: (key, itemId) => {
            const newBullet: BulletPoint = {
              id: generateId("b"),
              text: "",
              isVisible: true,
            };
            mutateActiveDoc((doc) =>
              updateItemBullets(doc, key, itemId, (bullets) => [
                ...bullets,
                newBullet,
              ])
            );
          },

          updateBullet: (key, itemId, bulletId, text) => {
            mutateActiveDoc((doc) =>
              updateItemBullets(doc, key, itemId, (bullets) =>
                bullets.map((b) => (b.id === bulletId ? { ...b, text } : b))
              )
            );
          },

          removeBullet: (key, itemId, bulletId) => {
            mutateActiveDoc((doc) =>
              updateItemBullets(doc, key, itemId, (bullets) =>
                bullets.filter((b) => b.id !== bulletId)
              )
            );
          },

          toggleBulletVisibility: (key, itemId, bulletId) => {
            mutateActiveDoc((doc) =>
              updateItemBullets(doc, key, itemId, (bullets) =>
                bullets.map((b) =>
                  b.id === bulletId ? { ...b, isVisible: !b.isVisible } : b
                )
              )
            );
          },

          addCustomSection: (title = "Section Kustom") => {
            const id = generateId("sec");
            const sectionKey = `custom:${id}` as const;
            mutateActiveDoc((doc) => ({
              ...doc,
              config: {
                ...doc.config,
                sectionOrder: [...doc.config.sectionOrder, sectionKey],
              },
              sections: {
                ...doc.sections,
                customSections: [
                  ...doc.sections.customSections,
                  {
                    id,
                    title,
                    isVisible: true,
                    items: [
                      {
                        id: generateId("item"),
                        isVisible: true,
                        title: "",
                        subtitle: "",
                        date: "",
                        bullets: [],
                      },
                    ],
                  },
                ],
              },
            }));
          },

          removeCustomSection: (customId) => {
            const sectionKey = `custom:${customId}` as const;
            mutateActiveDoc((doc) => ({
              ...doc,
              config: {
                ...doc.config,
                sectionOrder: doc.config.sectionOrder.filter(
                  (k) => k !== sectionKey
                ),
              },
              sections: {
                ...doc.sections,
                customSections: doc.sections.customSections.filter(
                  (cs) => cs.id !== customId
                ),
              },
            }));
          },
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
      name: "formacv-storage",
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
