import zlib from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractTextFromDocxBuffer } from "@/lib/cv-file-extractor";
import {
  buildResumeDocumentFromParsed,
  handleParseCvPost,
  type ParsedCvPayload,
} from "@/lib/ai/cv-importer";
import { resetAiQuotaStoreForTests } from "@/lib/ai/quota";
import { ResumeDocumentSchema } from "@/lib/schemas/resume";

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
});
