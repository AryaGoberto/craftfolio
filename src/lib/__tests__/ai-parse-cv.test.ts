import zlib from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractTextFromDocxBuffer } from "@/lib/cv-file-extractor";
import {
  buildResumeDocumentFromParsed,
  handleParseCvPost,
  ParsedCvPayloadSchema,
  type ParsedCvPayload,
} from "@/lib/ai/cv-importer";
import { resetAiQuotaStoreForTests } from "@/lib/ai/quota";
import { RESUME_LIMITS, ResumeDocumentSchema } from "@/lib/schemas/resume";

const mockAuthOk = async () => ({
  uid: "uid-test-parse",
  email: "user@example.com",
});

/** Builds a minimal valid uncompressed/deflated DOCX ZIP container containing `word/document.xml`. */
function createSyntheticDocxBuffer(xmlText: string, compress = true): Uint8Array {
  const nameBuf = Buffer.from("word/document.xml", "utf8");
  const rawXml = Buffer.from(xmlText, "utf8");
  const dataBuf = compress ? zlib.deflateRawSync(rawXml) : rawXml;
  const method = compress ? 8 : 0;

  // Local file header (30 bytes + filename + payload)
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // signature PK\x03\x04
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0, 6); // general purpose bit flag
  header.writeUInt16LE(method, 8); // compression method
  header.writeUInt16LE(0, 10); // mod time
  header.writeUInt16LE(0, 12); // mod date
  header.writeUInt32LE(0, 14); // crc32 (unused in stream test)
  header.writeUInt32LE(dataBuf.length, 18); // compressed size
  header.writeUInt32LE(rawXml.length, 22); // uncompressed size
  header.writeUInt16LE(nameBuf.length, 26); // filename length
  header.writeUInt16LE(0, 28); // extra field length

  // Central directory header (46 bytes + filename)
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt32LE(dataBuf.length, 20);
  central.writeUInt32LE(rawXml.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42); // offset of local header

  const centralOffset = header.length + nameBuf.length + dataBuf.length;
  const centralSize = central.length + nameBuf.length;

  // End of central directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);

  return new Uint8Array(
    Buffer.concat([header, nameBuf, dataBuf, central, nameBuf, eocd])
  );
}

describe("extractTextFromDocxBuffer", () => {
  it("extracts readable text and paragraph breaks from a deflated DOCX archive", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>Budi Santoso</w:t></w:r></w:p>
          <w:p><w:r><w:t>Software Engineer &amp; Architect</w:t></w:r></w:p>
          <w:p><w:r><w:t>Built scalable systems using Next.js</w:t></w:r></w:p>
        </w:body>
      </w:document>`;

    const docxBytes = createSyntheticDocxBuffer(xml, true);
    const extracted = await extractTextFromDocxBuffer(docxBytes);

    expect(extracted).toContain("Budi Santoso");
    expect(extracted).toContain("Software Engineer & Architect");
    expect(extracted).toContain("Built scalable systems using Next.js");
  });

  it("rejects invalid non-DOCX byte buffers cleanly", async () => {
    await expect(
      extractTextFromDocxBuffer(new Uint8Array([1, 2, 3, 4]))
    ).rejects.toThrow();
  });
});

describe("buildResumeDocumentFromParsed & POST /api/ai/parse-cv", () => {
  beforeEach(() => {
    resetAiQuotaStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetAiQuotaStoreForTests();
  });

  it("hydrates parsed payload into a valid ResumeDocument, blocks unsafe URLs, and surfaces review warnings", () => {
    const parsed: ParsedCvPayload = {
      documentTitle: "CV Budi Santoso",
      language: "en",
      fullName: "Budi Santoso",
      headline: "Backend Engineer",
      email: "",
      phone: "+62 811-9988-7766",
      location: "Jakarta",
      links: [
        { label: "GitHub", url: "github.com/budisantoso" },
        { label: "BadLink", url: "javascript:alert(1)" },
      ],
      summary:
        "Backend Engineer experienced in Go, PostgreSQL, and distributed queues.",
      experience: [
        {
          company: "PT Solusi Digital",
          position: "Backend Engineer",
          location: "Jakarta",
          startDate: "",
          endDate: "Present",
          bullets: ["Designed REST APIs serving internal logistics teams."],
        },
      ],
      education: [
        {
          institution: "Universitas Indonesia",
          degree: "B.Sc. Computer Science",
          location: "Depok",
          startDate: "2018",
          endDate: "2022",
          gpa: "3.80",
        },
      ],
      projects: [],
      skills: [{ category: "Backend", skills: "Go, PostgreSQL, Redis" }],
      certifications: [],
      awards: [],
      volunteering: [],
      languages: [{ language: "English", proficiency: "Fluent" }],
      customSections: [],
    };

    const { document, warnings } = buildResumeDocumentFromParsed(parsed);
    const validation = ResumeDocumentSchema.safeParse(document);

    expect(validation.success).toBe(true);
    expect(document.basics.fullName).toBe("Budi Santoso");
    expect(document.basics.links).toHaveLength(1);
    expect(document.basics.links[0].url).toBe("github.com/budisantoso");
    expect(document.sections.experience.isVisible).toBe(true);
    expect(document.sections.projects.isVisible).toBe(false);
    expect(document.sections.languages.isVisible).toBe(true);
    expect(warnings.some((w) => w.toLowerCase().includes("email"))).toBe(true);
    expect(warnings.some((w) => w.toLowerCase().includes("tanggal"))).toBe(true);
  });

  it("returns 401 AI_AUTH_REQUIRED when Authorization header is missing", async () => {
    const req = new Request("http://localhost:3000/api/ai/parse-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText:
          "Budi Santoso\nBackend Engineer\nExperience: PT Solusi Digital (2022 - Present)",
      }),
    });

    const res = await handleParseCvPost(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when rawText is too short", async () => {
    const req = new Request("http://localhost:3000/api/ai/parse-cv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ rawText: "too short" }),
    });

    const res = await handleParseCvPost(req, { verifyIdToken: mockAuthOk });
    expect(res.status).toBe(400);
  });

  it("returns 503 AI_UNAVAILABLE when GOOGLE_GENERATIVE_AI_API_KEY is missing", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");

    const req = new Request("http://localhost:3000/api/ai/parse-cv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        rawText:
          "Budi Santoso\nBackend Engineer\nExperience: PT Solusi Digital (2022 - Present)\nEducation: Universitas Indonesia",
      }),
    });

    const res = await handleParseCvPost(req, { verifyIdToken: mockAuthOk });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AI_UNAVAILABLE");
  });

  it("extracts custom sections such as Organization and Course and registers them in sectionOrder", () => {
    const rawPayload = {
      documentTitle: "CV Arya Goberto",
      language: "en",
      fullName: "Arya Goberto",
      headline: "Software Engineering Student",
      email: "arya@example.com",
      phone: "+62 812-0000-1111",
      location: "Makassar, Indonesia",
      links: [],
      summary: "CS student building full-stack web applications.",
      experience: [
        {
          company: "Tech Corp",
          position: "Software Engineer Intern",
          startDate: "Jun 2025",
          endDate: "Sep 2025",
          bullets: ["Shipped React dashboard components."],
        },
      ],
      education: [
        {
          institution: "Universitas Hasanuddin",
          degree: "B.Sc. Informatics",
          startDate: "2022",
          endDate: "Present",
        },
      ],
      projects: [
        {
          name: "Craftfolio",
          techStack: "Next.js, TypeScript",
          bullets: ["Built ATS resume editor."],
        },
      ],
      skills: [{ category: "Languages", skills: "TypeScript, Python, Go" }],
      certifications: [],
      awards: [{ title: "Best Hackathon Project", issuer: "Compfest", date: "2024" }],
      volunteering: [],
      languages: [],
      customSections: [
        {
          title: "Organization",
          items: [
            {
              title: "Himpunan Mahasiswa Informatika",
              subtitle: "Head of Technology Division",
              date: "2023 - 2024",
              bullets: ["Led weekly web development workshops for 60 members."],
            },
          ],
        },
        {
          title: "Course",
          items: [
            {
              title: "Full-Stack Web Development Bootcamp",
              subtitle: "Dicoding Indonesia",
              date: "2024",
              bullets: [],
            },
            {
              title: "Machine Learning Specialization",
              subtitle: "Coursera",
              bullets: ["Completed Supervised & Unsupervised Learning tracks."],
            },
          ],
        },
        {
          title: "",
          items: [{ title: "Should be dropped", bullets: [] }],
        },
        {
          title: "EmptySection",
          items: [],
        },
      ],
      sectionTitles: {
        skills: "Technical Skills",
        awards: "Achievements",
      },
    };

    const schemaResult = ParsedCvPayloadSchema.safeParse(rawPayload);
    expect(schemaResult.success).toBe(true);
    if (!schemaResult.success) return;

    const { document, warnings } = buildResumeDocumentFromParsed(schemaResult.data);
    const docValidation = ResumeDocumentSchema.safeParse(document);

    expect(docValidation.success).toBe(true);
    expect(document.sections.skills.title).toBe("Technical Skills");
    expect(document.sections.awards.title).toBe("Achievements");
    expect(document.sections.customSections).toHaveLength(2);

    const orgSection = document.sections.customSections[0];
    const courseSection = document.sections.customSections[1];
    expect(orgSection.title).toBe("Organization");
    expect(orgSection.items[0].subtitle).toBe("Head of Technology Division");
    expect(orgSection.items[0].bullets).toHaveLength(1);

    expect(courseSection.title).toBe("Course");
    expect(courseSection.items).toHaveLength(2);
    expect(courseSection.items[1].date).toBeUndefined();

    expect(document.config.sectionOrder).toContain(`custom:${orgSection.id}`);
    expect(document.config.sectionOrder).toContain(`custom:${courseSection.id}`);
    expect(
      warnings.some((w) => w.includes("belum terdeteksi"))
    ).toBe(false);
  });

  it("defensively clamps oversized AI output fields to RESUME_LIMITS so Zod never throws", () => {
    const giantText = "X".repeat(10_000);
    const manyItems = Array.from({ length: 60 }, (_, idx) => ({
      title: `Course ${idx} ${giantText}`,
      subtitle: giantText,
      date: giantText,
      bullets: Array.from({ length: 40 }, () => giantText),
    }));

    const parsed = ParsedCvPayloadSchema.parse({
      documentTitle: giantText,
      language: "en",
      fullName: giantText,
      headline: giantText,
      email: giantText,
      phone: giantText,
      location: giantText,
      links: Array.from({ length: 30 }, (_, idx) => ({
        label: giantText,
        url: `https://example.com/${idx}`,
      })),
      summary: giantText,
      customSections: Array.from({ length: 30 }, (_, idx) => ({
        title: `Custom ${idx} ${giantText}`,
        items: idx === 0 ? manyItems : [{ title: "Item", bullets: [] }],
      })),
    });

    const { document } = buildResumeDocumentFromParsed(parsed);
    const docValidation = ResumeDocumentSchema.safeParse(document);

    expect(docValidation.success).toBe(true);
    expect(document.sections.customSections.length).toBeLessThanOrEqual(
      RESUME_LIMITS.MAX_CUSTOM_SECTIONS
    );
    expect(document.config.sectionOrder.length).toBeLessThanOrEqual(
      RESUME_LIMITS.MAX_SECTION_ORDER
    );
    expect(document.basics.links.length).toBeLessThanOrEqual(
      RESUME_LIMITS.MAX_LINKS
    );
    expect(document.sections.customSections[0].items.length).toBeLessThanOrEqual(
      RESUME_LIMITS.MAX_ITEMS_PER_SECTION
    );
  });
});
