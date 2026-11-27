import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import type { AuthUserProfile } from "@/lib/firebase/auth";
import { ResumeDocumentSchema, type ResumeDocument } from "@/lib/schemas/resume";
import {
  syncFileOrder,
  syncOpenTabs,
  type PersistedResumeState,
} from "@/store/use-resume-store";

export interface UserWorkspaceMeta {
  uid: string;
  email: string | null;
  displayName: string | null;
  activeDocumentId: string;
  openTabIds: string[];
  fileOrder: string[];
  updatedAt: string;
}

export interface CloudWorkspaceSnapshot {
  meta: Partial<UserWorkspaceMeta> | null;
  documents: Record<string, ResumeDocument>;
}

export interface MergeDocumentsResult {
  mergedDocs: Record<string, ResumeDocument>;
  toUploadIds: string[];
}

/** Recursively strips keys with `undefined` values so Firestore never rejects optional fields. */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function hasAnyResumeContent(doc: ResumeDocument): boolean {
  if (
    doc.basics.fullName.trim() ||
    doc.basics.email.trim() ||
    (doc.basics.phone ?? "").trim() ||
    (doc.basics.headline ?? "").trim() ||
    (doc.basics.location ?? "").trim() ||
    doc.basics.links.length > 0 ||
    doc.basics.summary.text.trim()
  ) {
    return true;
  }

  return (
    doc.sections.experience.items.length > 0 ||
    doc.sections.education.items.length > 0 ||
    doc.sections.projects.items.length > 0 ||
    doc.sections.skills.items.length > 0 ||
    doc.sections.certifications.items.length > 0 ||
    doc.sections.awards.items.length > 0 ||
    doc.sections.volunteering.items.length > 0 ||
    doc.sections.languages.items.length > 0 ||
    doc.sections.customSections.length > 0
  );
}

/**
 * Detects untouched default local draft/sample (`resume-default-1`) so signing in or signing up
 * never uploads a blank starter template to Cloud Firestore.
 */
export function isUntouchedDefaultSample(doc: ResumeDocument): boolean {
  if (doc.id !== "resume-default-1" || doc.createdAt !== doc.updatedAt) {
    return false;
  }

  const isLegacySample =
    doc.basics.fullName === "Raka Pratama" &&
    doc.basics.email === "raka.pratama@email.com";

  return isLegacySample || !hasAnyResumeContent(doc);
}

export const isUntouchedDefaultDraft = isUntouchedDefaultSample;

function toTimestampMs(iso: string | undefined): number {
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Pure two-way timestamp merge between local Guest Mode documents and Cloud Firestore documents.
 * - Never wipes local drafts that don't exist in Cloud yet (unless it's the untouched default sample and Cloud already has user CVs).
 * - When the same ID exists in both, the newer `updatedAt` wins.
 */
export function mergeLocalAndCloudDocuments(
  localDocs: Record<string, ResumeDocument>,
  cloudDocs: Record<string, ResumeDocument>
): MergeDocumentsResult {
  const mergedDocs: Record<string, ResumeDocument> = {};
  const toUploadIds: string[] = [];

  const allIds = new Set([...Object.keys(localDocs), ...Object.keys(cloudDocs)]);

  for (const id of allIds) {
    const localDoc = localDocs[id];
    const cloudDoc = cloudDocs[id];

    if (localDoc && !cloudDoc) {
      // Never auto-upload an untouched default template, even when the account has 0 cloud CVs.
      if (isUntouchedDefaultSample(localDoc)) {
        continue;
      }
      mergedDocs[id] = localDoc;
      toUploadIds.push(id);
      continue;
    }

    if (!localDoc && cloudDoc) {
      mergedDocs[id] = cloudDoc;
      continue;
    }

    if (localDoc && cloudDoc) {
      const localMs = toTimestampMs(localDoc.updatedAt);
      const cloudMs = toTimestampMs(cloudDoc.updatedAt);
      if (localMs > cloudMs) {
        mergedDocs[id] = localDoc;
        toUploadIds.push(id);
      } else {
        mergedDocs[id] = cloudDoc;
      }
    }
  }

  return { mergedDocs, toUploadIds };
}

/** Combines local and cloud workspace metadata (fileOrder, openTabIds, activeDocumentId) cleanly. */
export function buildMergedWorkspaceState(
  localState: PersistedResumeState,
  cloudSnapshot: CloudWorkspaceSnapshot
): { workspace: PersistedResumeState; toUploadIds: string[] } {
  const { mergedDocs, toUploadIds } = mergeLocalAndCloudDocuments(
    localState.documents,
    cloudSnapshot.documents
  );

  const cloudMeta = cloudSnapshot.meta;
  const preferredOrder = [
    ...(cloudMeta?.fileOrder ?? []),
    ...localState.fileOrder,
  ];
  const fileOrder = syncFileOrder(preferredOrder, mergedDocs);

  const preferredActive =
    cloudMeta?.activeDocumentId && mergedDocs[cloudMeta.activeDocumentId]
      ? cloudMeta.activeDocumentId
      : mergedDocs[localState.activeDocumentId]
        ? localState.activeDocumentId
        : (fileOrder[0] ?? "");

  const preferredTabs =
    cloudMeta?.openTabIds && cloudMeta.openTabIds.length > 0
      ? [...cloudMeta.openTabIds, ...toUploadIds]
      : [...localState.openTabIds, ...Object.keys(cloudSnapshot.documents)];

  const openTabIds = syncOpenTabs(preferredTabs, mergedDocs, preferredActive);

  return {
    workspace: {
      documents: mergedDocs,
      activeDocumentId: preferredActive,
      openTabIds,
      fileOrder,
    },
    toUploadIds,
  };
}

export async function fetchUserCloudWorkspace(
  uid: string
): Promise<CloudWorkspaceSnapshot> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error("Cloud Firestore belum dikonfigurasi.");
  }

  const userRef = doc(db, "users", uid);
  const resumesCol = collection(db, "users", uid, "resumes");

  const [userSnap, resumesSnap] = await Promise.all([
    getDoc(userRef),
    getDocs(resumesCol),
  ]);

  const documents: Record<string, ResumeDocument> = {};
  for (const snap of resumesSnap.docs) {
    const parsed = ResumeDocumentSchema.safeParse(snap.data());
    if (parsed.success) {
      documents[parsed.data.id] = parsed.data;
    }
  }

  const meta = userSnap.exists()
    ? (userSnap.data() as Partial<UserWorkspaceMeta>)
    : null;

  return { meta, documents };
}

export async function saveUserWorkspaceToCloud(
  user: AuthUserProfile,
  state: PersistedResumeState,
  docIdsToSave?: string[]
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const batch = writeBatch(db);
  const userRef = doc(db, "users", user.uid);

  const metaPayload: UserWorkspaceMeta = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    activeDocumentId: state.activeDocumentId,
    openTabIds: syncOpenTabs(
      state.openTabIds,
      state.documents,
      state.activeDocumentId
    ),
    fileOrder: syncFileOrder(state.fileOrder, state.documents),
    updatedAt: new Date().toISOString(),
  };

  batch.set(userRef, stripUndefined(metaPayload), { merge: true });

  const targetIds = docIdsToSave ?? Object.keys(state.documents);
  for (const id of targetIds) {
    const resume = state.documents[id];
    if (!resume) continue;
    const resumeRef = doc(db, "users", user.uid, "resumes", id);
    batch.set(
      resumeRef,
      stripUndefined({
        ...resume,
        userId: user.uid,
      })
    );
  }

  await batch.commit();
}

export async function deleteResumeFromCloud(
  uid: string,
  docId: string
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const resumeRef = doc(db, "users", uid, "resumes", docId);
  await deleteDoc(resumeRef);
}
