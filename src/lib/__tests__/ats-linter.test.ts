import { describe, expect, it } from "vitest";
import { runAtsLint } from "@/lib/ats-linter";
import { createSampleResume } from "@/lib/default-resume";
import { extractLinearResumeText } from "@/components/preview/AtsXRayView";
import type { ResumeDocument } from "@/lib/schemas/resume";

function makeCleanResume(): ResumeDocument {
  const doc = createSampleResume("2026-01-01T00:00:00.000Z");
  doc.sections.education.items[0].startDate = "Aug 2018";
  doc.sections.education.items[0].endDate = "Jul 2022";
  return doc;
}

describe("runAtsLint", () => {
  it("returns core-structure-ok (good) with 0 fix and 0 review for a clean resume", () => {
    const report = runAtsLint(makeCleanResume(), 1, 0.85);
    expect(report.summary).toEqual({ good: 1, review: 0, fix: 0 });
    expect(report.items.map((i) => i.id)).toEqual(["core-structure-ok"]);
  });

  describe("contact-completeness (fix)", () => {
    it("flags missing fullName and omits core-structure-ok", () => {
      const doc = makeCleanResume();
      doc.basics.fullName = "   ";
      const report = runAtsLint(doc);
      expect(report.summary).toEqual({ good: 0, review: 0, fix: 1 });
      expect(report.items[0]).toMatchObject({
        id: "contact-completeness",
        status: "fix",
        targetSection: "basics",
      });
    });

    it("flags invalid email format", () => {
      const doc = makeCleanResume();
      doc.basics.email = "not-an-email";
      const report = runAtsLint(doc);
      expect(report.summary.fix).toBe(1);
      expect(report.summary.good).toBe(0);
      expect(report.items.some((i) => i.id === "contact-completeness")).toBe(
        true
      );
    });

    it("flags missing phone number", () => {
      const doc = makeCleanResume();
      doc.basics.phone = "";
      const report = runAtsLint(doc);
      expect(report.summary.fix).toBe(1);
      expect(report.items.some((i) => i.id === "contact-completeness")).toBe(
        true
      );
    });
  });

  describe("placeholder-text (fix)", () => {
    it("detects 'lorem ipsum' case-insensitively in summary", () => {
      const doc = makeCleanResume();
      doc.basics.summary.text =
        "Lorem Ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore.";
      const report = runAtsLint(doc);
      expect(report.summary.good).toBe(0);
      expect(
        report.items.find((i) => i.id === "placeholder-text")
      ).toMatchObject({
        status: "fix",
        targetSection: "basics",
      });
    });

    it("detects '[isi di sini]' in experience bullet", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].bullets[0].text =
        "Mengerjakan proyek [Isi di sini] untuk klien.";
      const report = runAtsLint(doc);
      expect(report.summary.good).toBe(0);
      expect(report.items.some((i) => i.id === "placeholder-text")).toBe(true);
    });
  });

  describe("summary-word-count (review)", () => {
    it("flags summary shorter than 15 words when visible", () => {
      const doc = makeCleanResume();
      doc.basics.summary.text = "Experienced frontend engineer.";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "summary-word-count")).toBe(
        true
      );
    });

    it("flags summary longer than 80 words when visible", () => {
      const doc = makeCleanResume();
      doc.basics.summary.text = Array.from({ length: 85 }, () => "word").join(
        " "
      );
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "summary-word-count")).toBe(
        true
      );
    });

    it("ignores short summary when summary isVisible is false", () => {
      const doc = makeCleanResume();
      doc.basics.summary.isVisible = false;
      doc.basics.summary.text = "Short.";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "summary-word-count")).toBe(
        false
      );
    });
  });

  describe("empty-section-<key> (review)", () => {
    it("flags visible section when all its items have isVisible=false", () => {
      const doc = makeCleanResume();
      doc.sections.projects.items[0].isVisible = false;
      const report = runAtsLint(doc);
      expect(
        report.items.find((i) => i.id === "empty-section-projects")
      ).toMatchObject({
        status: "review",
        targetSection: "projects",
      });
    });

    it("does not flag section with no visible items when section isVisible=false", () => {
      const doc = makeCleanResume();
      doc.sections.projects.isVisible = false;
      doc.sections.projects.items[0].isVisible = false;
      const report = runAtsLint(doc);
      expect(
        report.items.some((i) => i.id === "empty-section-projects")
      ).toBe(false);
    });
  });

  describe("non-standard-heading-<key> (review)", () => {
    it("flags custom non-standard section title", () => {
      const doc = makeCleanResume();
      doc.sections.experience.title = "Petualangan Karier";
      const report = runAtsLint(doc);
      expect(
        report.items.find((i) => i.id === "non-standard-heading-experience")
      ).toMatchObject({
        status: "review",
        targetSection: "experience",
      });
    });

    it("accepts standard Indonesian and English headings", () => {
      const doc = makeCleanResume();
      doc.sections.experience.title = "Pengalaman Kerja";
      doc.sections.education.title = "Education";
      const report = runAtsLint(doc);
      expect(
        report.items.some((i) => i.id.startsWith("non-standard-heading-"))
      ).toBe(false);
    });
  });

  describe("missing-dates and inconsistent-dates (review)", () => {
    it("flags missing startDate or endDate on visible experience/education item", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].endDate = "";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "missing-dates")).toBe(true);
    });

    it("ignores missing dates when item isVisible=false", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[1].isVisible = false;
      doc.sections.experience.items[1].startDate = "";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "missing-dates")).toBe(false);
    });

    it("flags inconsistent date formats across experience and education", () => {
      const doc = makeCleanResume();
      doc.sections.education.items[0].startDate = "2018";
      doc.sections.education.items[0].endDate = "2022";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "inconsistent-dates")).toBe(
        true
      );
    });

    it("ignores 'Present', 'Sekarang', and 'Current' when checking consistency", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].endDate = "Sekarang";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "inconsistent-dates")).toBe(
        false
      );
    });
  });

  describe("long-bullet (review)", () => {
    it("allows bullet with exact length of 220 characters", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].bullets[0].text = "a".repeat(220);
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "long-bullet")).toBe(false);
    });

    it("flags visible bullet longer than 220 characters (221 chars)", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].bullets[0].text = "a".repeat(221);
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "long-bullet")).toBe(true);
    });

    it("ignores long bullet when bullet isVisible=false", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].bullets[0].isVisible = false;
      doc.sections.experience.items[0].bullets[0].text = "a".repeat(260);
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "long-bullet")).toBe(false);
    });
  });

  describe("first-person-pronoun (review)", () => {
    it("flags Indonesian first-person pronouns like 'Saya'", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].bullets[0].text =
        "Saya mengembangkan dashboard analitik real-time.";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "first-person-pronoun")).toBe(
        true
      );
    });

    it("flags English first-person pronouns like 'my'", () => {
      const doc = makeCleanResume();
      doc.sections.projects.items[0].bullets[0].text =
        "Built my own parser for ATS testing.";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "first-person-pronoun")).toBe(
        true
      );
    });

    it("respects word boundaries for words containing pronoun substrings", () => {
      const doc = makeCleanResume();
      doc.sections.experience.items[0].bullets[0].text =
        "Implemented real-time API system optimizing memory usage.";
      const report = runAtsLint(doc);
      expect(report.items.some((i) => i.id === "first-person-pronoun")).toBe(
        false
      );
    });
  });

  describe("page-overflow (review)", () => {
    it("flags when pageCount exceeds targetPages", () => {
      const doc = makeCleanResume();
      doc.config.targetPages = 1;
      const report = runAtsLint(doc, 2, 0.7);
      expect(report.items.some((i) => i.id === "page-overflow")).toBe(true);
    });

    it("flags when multi-page CV has last page filled below 15%", () => {
      const doc = makeCleanResume();
      doc.config.targetPages = 2;
      const report = runAtsLint(doc, 2, 0.1);
      expect(report.items.some((i) => i.id === "page-overflow")).toBe(true);
    });

    it("does not flag when within targetPages and last page fill >= 15%", () => {
      const doc = makeCleanResume();
      doc.config.targetPages = 2;
      const report = runAtsLint(doc, 2, 0.5);
      expect(report.items.some((i) => i.id === "page-overflow")).toBe(false);
    });
  });
});

describe("extractLinearResumeText", () => {
  it("follows config.sectionOrder strictly", () => {
    const doc = makeCleanResume();
    doc.config.sectionOrder = ["skills", "experience", "education"];
    const text = extractLinearResumeText(doc);
    const skillsIdx = text.indexOf("SKILLS");
    const expIdx = text.indexOf("EXPERIENCE");
    const eduIdx = text.indexOf("EDUCATION");
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(skillsIdx);
    expect(eduIdx).toBeGreaterThan(expIdx);
  });

  it("omits hidden links, summary, sections, items, and bullets (isVisible=false)", () => {
    const doc = makeCleanResume();
    doc.basics.links[0].isVisible = false;
    doc.basics.summary.isVisible = false;
    doc.sections.projects.isVisible = false;
    doc.sections.experience.items[1].isVisible = false;
    doc.sections.experience.items[0].bullets[1].isVisible = false;

    const text = extractLinearResumeText(doc);

    expect(text).not.toContain("linkedin.com/in/rakapratama");
    expect(text).toContain("github.com/rakapratama");
    expect(text).not.toContain("SUMMARY");
    expect(text).not.toContain("Frontend Engineer with 3+ years");
    expect(text).not.toContain("PROJECTS");
    expect(text).not.toContain("FormaCV Builder");
    expect(text).not.toContain("Startup Edukasi ID");
    expect(text).not.toContain("Architected a modular design system");
    expect(text).toContain("Developed real-time analytics dashboards");
  });

  it("handles customSections visibility and document language heading labels", () => {
    const doc = makeCleanResume();
    doc.language = "id";
    doc.sections.customSections = [
      {
        id: "sec-hidden",
        title: "Secret Section",
        isVisible: false,
        items: [
          {
            id: "c-1",
            isVisible: true,
            title: "Hidden Item",
            bullets: [{ id: "cb-1", isVisible: true, text: "Hidden bullet" }],
          },
        ],
      },
      {
        id: "sec-visible",
        title: "Publikasi",
        isVisible: true,
        items: [
          {
            id: "c-2",
            isVisible: true,
            title: "Paper RAG 2026",
            subtitle: "IEEE",
            date: "2026",
            bullets: [
              { id: "cb-2", isVisible: true, text: "Visible custom bullet" },
              { id: "cb-3", isVisible: false, text: "Masked custom bullet" },
            ],
          },
        ],
      },
    ];
    doc.config.sectionOrder = [
      "summary",
      "custom:sec-hidden",
      "custom:sec-visible",
    ];

    const text = extractLinearResumeText(doc);

    expect(text).toContain("RINGKASAN PROFESIONAL");
    expect(text).not.toContain("SECRET SECTION");
    expect(text).not.toContain("Hidden Item");
    expect(text).toContain("PUBLIKASI");
    expect(text).toContain("Paper RAG 2026 | IEEE | 2026");
    expect(text).toContain("- Visible custom bullet");
    expect(text).not.toContain("Masked custom bullet");
  });
});
