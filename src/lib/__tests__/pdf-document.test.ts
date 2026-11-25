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
});
