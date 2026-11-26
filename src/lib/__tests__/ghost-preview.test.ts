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
  it("provides complete bilingual ghost preview bundles for id and en", () => {
    const idGhost = getGhostPreviewData("id");
    const enGhost = getGhostPreviewData("en");

    expect(idGhost.fullName).toBeTruthy();
    expect(idGhost.summary).toBeTruthy();
    expect(idGhost.experience.length).toBeGreaterThan(0);
    expect(idGhost.education.length).toBeGreaterThan(0);
    expect(idGhost.skills.length).toBeGreaterThan(0);

    expect(enGhost.fullName).toBeTruthy();
    expect(enGhost.summary).toBeTruthy();
    expect(enGhost.experience.length).toBeGreaterThan(0);
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
    // Empty CV should report contact-completeness fix, not treat ghost data as real
    expect(lint.summary.fix).toBeGreaterThan(0);
  });

  it("toggles showGhostPreview without polluting zundo undo history", () => {
    useResumeStore.temporal.getState().clear();
    expect(useResumeStore.getState().showGhostPreview).toBe(true);

    useResumeStore.getState().toggleGhostPreview(false);
    expect(useResumeStore.getState().showGhostPreview).toBe(false);

    useResumeStore.getState().toggleGhostPreview();
    expect(useResumeStore.getState().showGhostPreview).toBe(true);

    expect(useResumeStore.temporal.getState().pastStates).toHaveLength(0);
  });
});
