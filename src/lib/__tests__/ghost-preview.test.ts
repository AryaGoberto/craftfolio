import { describe, expect, it } from "vitest";
import { createEmptyResume } from "@/lib/default-resume";
import {
  getGhostPreviewData,
  hasAnyRealResumeContent,
} from "@/lib/ghost-preview-data";
import { generateLatexDocument } from "@/lib/latex-generator";
import { runAtsLint } from "@/lib/ats-linter";
import { useResumeStore } from "@/store/use-resume-store";

describe("Ghost Placeholder Live Preview & Strict Export Isolation", () => {
  it("provides generic, neutral bilingual ghost preview bundles (no hardcoded universities or fake companies)", () => {
    const idGhost = getGhostPreviewData("id");
    const enGhost = getGhostPreviewData("en");

    expect(idGhost.fullName).toBe("Nama Lengkap Anda");
    expect(idGhost.summary).toBeTruthy();
    expect(idGhost.experience[0].company).toBe("Nama Perusahaan / Organisasi");
    expect(idGhost.education[0].institution).toBe("Nama Universitas / Institusi");
    expect(idGhost.skills.length).toBeGreaterThan(0);
    expect(idGhost.custom.length).toBeGreaterThan(0);

    expect(enGhost.fullName).toBe("Your Full Name");
    expect(enGhost.summary).toBeTruthy();
    expect(enGhost.experience[0].company).toBe("Company / Organization Name");
    expect(enGhost.education[0].institution).toBe("University / Institution Name");
    expect(enGhost.custom.length).toBeGreaterThan(0);
  });

  it("detects empty vs authored resume documents accurately", () => {
    const emptyDoc = createEmptyResume("cv-empty-test", "CV Kosong");
    expect(hasAnyRealResumeContent(emptyDoc)).toBe(false);

    const withName = {
      ...emptyDoc,
      basics: { ...emptyDoc.basics, fullName: "Budi Santoso" },
    };
    expect(hasAnyRealResumeContent(withName)).toBe(true);
  });

  it("never leaks ghost preview strings into LaTeX export or ATS lint on an empty CV", () => {
    const emptyDoc = createEmptyResume("cv-empty-export", "CV Kosong");
    const enGhost = getGhostPreviewData("en");
    const idGhost = getGhostPreviewData("id");

    const latex = generateLatexDocument(emptyDoc);
    expect(latex).not.toContain(enGhost.experience[0].company);
    expect(latex).not.toContain(idGhost.experience[0].company);
    expect(latex).not.toContain(enGhost.summary.slice(0, 30));

    const lint = runAtsLint(emptyDoc);
    expect(lint.summary.fix).toBeGreaterThan(0);
  });

  it("allows editing custom section header title and toggles showGhostPreview without polluting undo history", () => {
    useResumeStore.getState().resetGuestWorkspace();
    useResumeStore.getState().addCustomSection("Sertifikasi");

    const docAfterAdd =
      useResumeStore.getState().documents[
        useResumeStore.getState().activeDocumentId
      ];
    const customSec = docAfterAdd.sections.customSections[0];
    expect(customSec.title).toBe("Sertifikasi");

    useResumeStore
      .getState()
      .updateSectionTitle(`custom:${customSec.id}`, "Penghargaan & Lisensi");

    const docAfterRename =
      useResumeStore.getState().documents[
        useResumeStore.getState().activeDocumentId
      ];
    expect(docAfterRename.sections.customSections[0].title).toBe(
      "Penghargaan & Lisensi"
    );

    useResumeStore.temporal.getState().clear();
    expect(useResumeStore.getState().showGhostPreview).toBe(true);

    useResumeStore.getState().toggleGhostPreview(false);
    expect(useResumeStore.getState().showGhostPreview).toBe(false);

    useResumeStore.getState().toggleGhostPreview();
    expect(useResumeStore.getState().showGhostPreview).toBe(true);

    expect(useResumeStore.temporal.getState().pastStates).toHaveLength(0);
  });
});
