import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ResumePdfDocument } from "@/components/pdf/PdfDocument";
import { createSampleResume } from "@/lib/default-resume";
import { extractTextFromPdfBuffer } from "@/lib/pdf-text-extractor";

describe("ResumePdfDocument (@react-pdf/renderer fallback)", () => {
  it("separates header fullName and contact row vertically without overlap", async () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    doc.config.templateId = "modern-minimal";
    doc.config.density = "relaxed";
    doc.basics.fullName = "Fajri Farid";
    doc.basics.email = "fajrifarid@email.com";

    const buffer = await renderToBuffer(ResumePdfDocument({ doc }));
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    try {
      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const content = await page.getTextContent();

      let nameY: number | null = null;
      let emailY: number | null = null;

      for (const item of content.items) {
        if (!("str" in item)) continue;
        if (item.str.toUpperCase().includes("FAJRI FARID")) {
          nameY = Number(item.transform[5]);
        }
        if (item.str.includes("fajrifarid@email.com")) {
          emailY = Number(item.transform[5]);
        }
      }

      expect(nameY).not.toBeNull();
      expect(emailY).not.toBeNull();
      expect((nameY as number) - (emailY as number)).toBeGreaterThanOrEqual(12);
    } finally {
      await loadingTask.destroy();
    }
  });

  it("omits section headings when visible items contain only empty fields", async () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    doc.sections.customSections = [
      {
        id: "empty-custom",
        title: "Sertifikasi / Kustom",
        isVisible: true,
        items: [
          {
            id: "item-blank",
            isVisible: true,
            title: "   ",
            subtitle: "",
            date: "",
            bullets: [{ id: "b-blank", isVisible: true, text: "   " }],
          },
        ],
      },
    ];
    doc.config.sectionOrder = [
      ...doc.config.sectionOrder,
      "custom:empty-custom",
    ];

    const buffer = await renderToBuffer(ResumePdfDocument({ doc }));
    const extracted = await extractTextFromPdfBuffer(new Uint8Array(buffer));

    expect(extracted.fullText.toUpperCase()).not.toContain(
      "SERTIFIKASI / KUSTOM"
    );
  });

  it("reflows pasted multi-line summary across full page width and renders Small Caps section headings", async () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    doc.config.templateId = "classic-latex";
    doc.config.paperSize = "A4";
    doc.config.density = "normal";
    doc.config.fontFamily = "serif";
    // Simulate hard single-newlines pasted from an external PDF
    doc.basics.summary.text =
      "Final-year Informatics Engineering student at Hasanuddin University with a strong passion for data science,\n" +
      "particularly Natural Language Processing (NLP) and Large Language Models (LLMs). I bring a versatile\n" +
      "technical skill set that bridges AI and software engineering, featuring hands-on experience in LLM performance\n" +
      "evaluation, responsive web development, and multiplatform application engineering. I am eager to contribute to\n" +
      "impactful tech projects and grow within a collaborative, fast-paced environment.";
    doc.sections.experience.title = "Experience";

    const buffer = await renderToBuffer(ResumePdfDocument({ doc }));
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    try {
      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const content = await page.getTextContent();

      let maxSummaryRightX = 0;
      let summaryFontSize = 0;
      let expInitialSize: number | null = null;
      let expRestSize: number | null = null;

      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const rightX = Number(item.transform[4]) + Number(item.width || 0);
        const fontSize = Math.hypot(
          Number(item.transform[0]),
          Number(item.transform[1])
        );

        if (item.str.includes("Final-year Informatics")) {
          summaryFontSize = fontSize;
        }
        if (
          item.str.includes("Informatics") ||
          item.str.includes("Natural Language") ||
          item.str.includes("software engineering")
        ) {
          maxSummaryRightX = Math.max(maxSummaryRightX, rightX);
        }
        if (item.str === "E") {
          expInitialSize = fontSize;
        }
        if (item.str === "XPERIENCE") {
          expRestSize = fontSize;
        }
      }

      // Printable right edge on A4 (595.28pt - 36pt margin = 559.28pt); justified line should reach >= 520pt
      expect(maxSummaryRightX).toBeGreaterThanOrEqual(520);
      // Summary body size should match 11pt LaTeX (~10.9-11pt)
      expect(summaryFontSize).toBeGreaterThanOrEqual(10.8);
      // True Small Caps contrast: initial 'E' (~12pt) strictly larger than 'XPERIENCE' (~9.3pt)
      expect(expInitialSize).not.toBeNull();
      expect(expRestSize).not.toBeNull();
      expect(expInitialSize as number).toBeGreaterThan((expRestSize as number) + 1.5);
    } finally {
      await loadingTask.destroy();
    }

    // Ensure ATS text extraction still reads EXPERIENCE intact without broken spaces
    const extracted = await extractTextFromPdfBuffer(new Uint8Array(buffer));
    expect(extracted.fullText.toUpperCase()).toContain("EXPERIENCE");
  });
});
