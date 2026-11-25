import type {
  BulletPoint,
  BuiltinSectionKey,
} from "@/lib/schemas/resume";
import {
  createEmptyItemForSection,
  generateId,
} from "@/lib/default-resume";
import { DEFAULT_SECTION_TITLES } from "@/lib/i18n";
import {
  arrayMove,
  updateItemBullets,
  updateSectionItems,
} from "../store-helpers";
import type {
  ResumeStoreState,
  SectionSliceActions,
  StoreMutators,
} from "../types";

export function createSectionSlice(
  _set: (
    partial:
      | ResumeStoreState
      | Partial<ResumeStoreState>
      | ((state: ResumeStoreState) => ResumeStoreState | Partial<ResumeStoreState>)
  ) => void,
  _get: () => ResumeStoreState,
  mutators: StoreMutators
): SectionSliceActions {
  return {
    updateConfig: (patch) => {
      mutators.mutateActiveDoc((doc) => ({
        ...doc,
        config: { ...doc.config, ...patch },
      }));
    },

    setLanguage: (lang) => {
      mutators.mutateActiveDoc((doc) => {
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
      mutators.mutateActiveDoc((doc) => ({
        ...doc,
        basics: { ...doc.basics, ...patch },
      }));
    },

    addLink: () => {
      mutators.mutateActiveDoc((doc) => ({
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
      mutators.mutateActiveDoc((doc) => ({
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
      mutators.mutateActiveDoc((doc) => ({
        ...doc,
        basics: {
          ...doc.basics,
          links: doc.basics.links.filter((l) => l.id !== id),
        },
      }));
    },

    updateSummary: (patch) => {
      mutators.mutateActiveDoc((doc) => ({
        ...doc,
        basics: {
          ...doc.basics,
          summary: { ...doc.basics.summary, ...patch },
        },
      }));
    },

    reorderSections: (newOrder) => {
      mutators.mutateActiveDoc((doc) => ({
        ...doc,
        config: { ...doc.config, sectionOrder: newOrder },
      }));
    },

    moveSection: (key, direction) => {
      mutators.mutateActiveDoc((doc) => {
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
      mutators.mutateActiveDoc((doc) => {
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
      mutators.mutateActiveDoc((doc) => {
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
      mutators.mutateActiveDoc((doc) =>
        updateSectionItems(doc, key, (items) => [...items, newItem], true)
      );
    },

    updateSectionItem: (key, itemId, patch) => {
      mutators.mutateActiveDoc((doc) =>
        updateSectionItems(doc, key, (items) =>
          items.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
        )
      );
    },

    removeSectionItem: (key, itemId) => {
      mutators.mutateActiveDoc((doc) =>
        updateSectionItems(doc, key, (items) =>
          items.filter((it) => it.id !== itemId)
        )
      );
    },

    toggleItemVisibility: (key, itemId) => {
      mutators.mutateActiveDoc((doc) =>
        updateSectionItems(doc, key, (items) =>
          items.map((it) =>
            it.id === itemId ? { ...it, isVisible: !it.isVisible } : it
          )
        )
      );
    },

    reorderSectionItems: (key, oldIndex, newIndex) => {
      mutators.mutateActiveDoc((doc) =>
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
      mutators.mutateActiveDoc((doc) =>
        updateItemBullets(doc, key, itemId, (bullets) => [
          ...bullets,
          newBullet,
        ])
      );
    },

    updateBullet: (key, itemId, bulletId, text) => {
      mutators.mutateActiveDoc((doc) =>
        updateItemBullets(doc, key, itemId, (bullets) =>
          bullets.map((b) => (b.id === bulletId ? { ...b, text } : b))
        )
      );
    },

    removeBullet: (key, itemId, bulletId) => {
      mutators.mutateActiveDoc((doc) =>
        updateItemBullets(doc, key, itemId, (bullets) =>
          bullets.filter((b) => b.id !== bulletId)
        )
      );
    },

    toggleBulletVisibility: (key, itemId, bulletId) => {
      mutators.mutateActiveDoc((doc) =>
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
      mutators.mutateActiveDoc((doc) => ({
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
      mutators.mutateActiveDoc((doc) => ({
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
}
