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

export type SaveStatus = "saved" | "saving" | "unsaved";

interface PersistedResumeState {
  documents: Record<string, ResumeDocument>;
  activeDocumentId: string;
}

type ItemSectionKey = BuiltinSectionKey | `custom:${string}`;
type GenericItem = { id: string; isVisible: boolean; bullets?: BulletPoint[] };

export interface ResumeStoreState extends PersistedResumeState {
  saveStatus: SaveStatus;
  activeSection: SectionKey | "basics";
  mobileTab: "edit" | "preview";
  previewZoom: number;
  previewMode: "visual" | "xray";
  hasHydrated: boolean;

  setHasHydrated: (hydrated: boolean) => void;
  setActiveSection: (section: SectionKey | "basics") => void;
  setMobileTab: (tab: "edit" | "preview") => void;
  setPreviewZoom: (zoom: number) => void;
  setPreviewMode: (mode: "visual" | "xray") => void;

  createDocument: (title?: string) => void;
  duplicateDocument: (id: string) => void;
  renameDocument: (id: string, title: string) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  loadSampleResume: () => void;
  clearActiveResume: () => void;
  importResumeJson: (rawJson: string) => { ok: boolean; error?: string };
  exportResumeJson: () => string;

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
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
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
          saveStatus: "saved",
          activeSection: "basics",
          mobileTab: "edit",
          previewZoom: 0.9,
          previewMode: "visual",
          hasHydrated: false,

          setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
          setActiveSection: (section) => set({ activeSection: section }),
          setMobileTab: (tab) => set({ mobileTab: tab }),
          setPreviewZoom: (zoom) =>
            set({ previewZoom: Math.min(1.5, Math.max(0.45, zoom)) }),
          setPreviewMode: (mode) => set({ previewMode: mode }),

          createDocument: (title) => {
            const id = generateId("cv");
            const doc = createEmptyResume(id, title || "CV Baru");
            set((state) => ({
              documents: { ...state.documents, [id]: doc },
              activeDocumentId: id,
              activeSection: "basics",
            }));
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
            set((state) => ({
              documents: { ...state.documents, [newId]: copy },
              activeDocumentId: newId,
            }));
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
            const { documents, activeDocumentId } = get();
            if (Object.keys(documents).length <= 1) return;
            const nextDocs = { ...documents };
            delete nextDocs[id];
            const nextActive =
              activeDocumentId === id
                ? Object.keys(nextDocs)[0]
                : activeDocumentId;
            set({ documents: nextDocs, activeDocumentId: nextActive });
            scheduleSaved();
          },

          setActiveDocument: (id) => {
            if (get().documents[id]) set({ activeDocumentId: id });
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
              }));
              scheduleSaved();
              return { ok: true };
            } catch {
              return { ok: false, error: "File bukan JSON yang valid." };
            }
          },

          exportResumeJson: () => {
            const { documents, activeDocumentId } = get();
            return JSON.stringify(documents[activeDocumentId], null, 2);
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
        partialize: (state): PersistedResumeState => ({
          documents: state.documents,
          activeDocumentId: state.activeDocumentId,
        }),
      }
    ),
    {
      name: "formacv-storage",
      version: 2,
      partialize: (state): PersistedResumeState => ({
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<PersistedResumeState> | undefined;
        if (!state || !state.documents || !state.activeDocumentId) {
          const sample = createSampleResume();
          return {
            documents: { [sample.id]: sample },
            activeDocumentId: sample.id,
          };
        }
        if (version < 2) {
          const updatedDocs: Record<string, ResumeDocument> = {};
          for (const [id, doc] of Object.entries(state.documents)) {
            updatedDocs[id] =
              doc.config.templateId === "classic-latex" &&
              doc.config.fontFamily === "inter"
                ? { ...doc, config: { ...doc.config, fontFamily: "serif" } }
                : doc;
          }
          return {
            documents: updatedDocs,
            activeDocumentId: state.activeDocumentId,
          };
        }
        return state as PersistedResumeState;
      },
    }
  )
);
