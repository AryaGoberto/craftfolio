import type {
  BulletPoint,
  CustomSectionItem,
  ResumeDocument,
} from "@/lib/schemas/resume";
import { createSampleResume } from "@/lib/default-resume";
import type {
  GenericItem,
  ItemSectionKey,
  PersistedResumeState,
} from "./types";

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
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
export function updateSectionItems(
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

  const builtinKey = key as Exclude<ItemSectionKey, `custom:${string}`>;
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
export function updateItemBullets(
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
