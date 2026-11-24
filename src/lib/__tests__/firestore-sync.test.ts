import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyResume, createSampleResume } from "@/lib/default-resume";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { mapFirebaseAuthError } from "@/lib/firebase/auth";
import {
  buildMergedWorkspaceState,
  isUntouchedDefaultSample,
  mergeLocalAndCloudDocuments,
  stripUndefined,
} from "@/lib/firebase/firestore-sync";

describe("Firebase Config & Auth Error Mapping", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false from isFirebaseConfigured when required env vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "");
    expect(isFirebaseConfigured()).toBe(false);
  });

  it("returns true from isFirebaseConfigured when API key and project ID are present", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-api-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "formacv-f6e3c");
    expect(isFirebaseConfigured()).toBe(true);
  });

  it("maps Firebase Auth error codes to user-friendly Indonesian messages", () => {
    expect(mapFirebaseAuthError({ code: "auth/invalid-credential" })).toContain(
      "Email atau kata sandi"
    );
    expect(mapFirebaseAuthError({ code: "auth/email-already-in-use" })).toContain(
      "sudah terdaftar"
    );
    expect(mapFirebaseAuthError({ code: "auth/weak-password" })).toContain(
      "minimal 6 karakter"
    );
    expect(mapFirebaseAuthError({ code: "auth/popup-closed-by-user" })).toContain(
      "ditutup"
    );
    expect(mapFirebaseAuthError({ code: "auth/operation-not-allowed" })).toContain(
      "Sign-in method"
    );
    expect(mapFirebaseAuthError(new Error("Custom error"))).toBe("Custom error");
  });
});

describe("Firestore Two-Way Timestamp Merge & Helpers", () => {
  it("strips nested undefined fields before writing to Firestore", () => {
    const input = {
      id: "cv-1",
      targetRole: undefined,
      nested: {
        a: "ok",
        b: undefined,
        list: [{ x: 1, y: undefined }],
      },
    };
    expect(stripUndefined(input)).toEqual({
      id: "cv-1",
      nested: {
        a: "ok",
        list: [{ x: 1 }],
      },
    });
  });

  it("keeps and uploads local Guest drafts when Cloud is empty", () => {
    const draft = createEmptyResume("cv-local-1", "CV Guest Draft");
    const result = mergeLocalAndCloudDocuments({ [draft.id]: draft }, {});

    expect(Object.keys(result.mergedDocs)).toEqual(["cv-local-1"]);
    expect(result.toUploadIds).toEqual(["cv-local-1"]);
  });

  it("skips uploading untouched default sample if Cloud already has user CVs", () => {
    const untouchedSample = createSampleResume("2026-01-01T00:00:00.000Z");
    const cloudDoc = createEmptyResume("cv-cloud-1", "CV Asli User");

    expect(isUntouchedDefaultSample(untouchedSample)).toBe(true);

    const result = mergeLocalAndCloudDocuments(
      { [untouchedSample.id]: untouchedSample },
      { [cloudDoc.id]: cloudDoc }
    );

    expect(Object.keys(result.mergedDocs)).toEqual(["cv-cloud-1"]);
    expect(result.toUploadIds).toEqual([]);
  });

  it("uploads default sample if the user edited it in Guest Mode", () => {
    const editedSample = {
      ...createSampleResume("2026-01-01T00:00:00.000Z"),
      updatedAt: "2026-01-02T10:00:00.000Z",
    };
    const cloudDoc = createEmptyResume("cv-cloud-1", "CV Cloud");

    expect(isUntouchedDefaultSample(editedSample)).toBe(false);

    const result = mergeLocalAndCloudDocuments(
      { [editedSample.id]: editedSample },
      { [cloudDoc.id]: cloudDoc }
    );

    expect(Object.keys(result.mergedDocs).sort()).toEqual([
      "cv-cloud-1",
      "resume-default-1",
    ]);
    expect(result.toUploadIds).toEqual(["resume-default-1"]);
  });

  it("resolves same-ID conflicts by keeping the newer updatedAt timestamp", () => {
    const olderLocal = {
      ...createEmptyResume("cv-shared", "Versi Lama Lokal"),
      updatedAt: "2026-02-01T08:00:00.000Z",
    };
    const newerCloud = {
      ...createEmptyResume("cv-shared", "Versi Baru Cloud"),
      updatedAt: "2026-02-05T12:00:00.000Z",
    };

    const resCloudWins = mergeLocalAndCloudDocuments(
      { "cv-shared": olderLocal },
      { "cv-shared": newerCloud }
    );
    expect(resCloudWins.mergedDocs["cv-shared"].title).toBe("Versi Baru Cloud");
    expect(resCloudWins.toUploadIds).toEqual([]);

    const newerLocal = {
      ...createEmptyResume("cv-shared", "Versi Baru Lokal"),
      updatedAt: "2026-02-10T15:00:00.000Z",
    };
    const resLocalWins = mergeLocalAndCloudDocuments(
      { "cv-shared": newerLocal },
      { "cv-shared": newerCloud }
    );
    expect(resLocalWins.mergedDocs["cv-shared"].title).toBe("Versi Baru Lokal");
    expect(resLocalWins.toUploadIds).toEqual(["cv-shared"]);
  });

  it("merges workspace metadata (fileOrder, openTabIds, activeDocumentId) cleanly", () => {
    const localDoc = createEmptyResume("cv-local", "Local Tailored");
    const cloudDoc = createEmptyResume("cv-cloud", "Cloud Master");

    const { workspace, toUploadIds } = buildMergedWorkspaceState(
      {
        documents: { "cv-local": localDoc },
        activeDocumentId: "cv-local",
        openTabIds: ["cv-local"],
        fileOrder: ["cv-local"],
      },
      {
        meta: {
          activeDocumentId: "cv-cloud",
          openTabIds: ["cv-cloud"],
          fileOrder: ["cv-cloud"],
        },
        documents: { "cv-cloud": cloudDoc },
      }
    );

    expect(toUploadIds).toEqual(["cv-local"]);
    expect(workspace.activeDocumentId).toBe("cv-cloud");
    expect(workspace.fileOrder).toEqual(["cv-cloud", "cv-local"]);
    expect(workspace.openTabIds).toEqual(["cv-cloud", "cv-local"]);
  });
});
