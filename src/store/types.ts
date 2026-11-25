import type {
  BulletPoint,
  BuiltinSectionKey,
  ResumeDocument,
  SectionKey,
} from "@/lib/schemas/resume";
import type { AppLanguage } from "@/lib/i18n";
import type { AuthUserProfile } from "@/lib/firebase/auth";

export type SaveStatus = "saved" | "saving" | "unsaved";
export type CloudSyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";
export type FileSortBy = "title" | "updatedAt";

export interface TemporalResumeState {
  documents: Record<string, ResumeDocument>;
  activeDocumentId: string;
}

export interface PersistedResumeState extends TemporalResumeState {
  openTabIds: string[];
  fileOrder: string[];
}

export type ItemSectionKey = BuiltinSectionKey | `custom:${string}`;
export type GenericItem = { id: string; isVisible: boolean; bullets?: BulletPoint[] };

export type DocumentSliceState = PersistedResumeState;

export interface DocumentSliceActions {
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
}

export interface SectionSliceActions {
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

export interface UiSliceState {
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
}

export interface UiSliceActions {
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
}

export interface ResumeStoreState
  extends DocumentSliceState,
    DocumentSliceActions,
    SectionSliceActions,
    UiSliceState,
    UiSliceActions {}

export interface StoreMutators {
  scheduleSaved: () => void;
  mutateActiveDoc: (updater: (doc: ResumeDocument) => ResumeDocument) => void;
}
