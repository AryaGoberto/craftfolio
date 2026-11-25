import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyResume, createSampleResume } from "@/lib/default-resume";
import {
  escapeLatex,
  formatLatexHref,
  generateLatexDocument,
} from "@/lib/latex-generator";
import { handleLatexPdfPost } from "@/lib/latex-compiler";
import {
  normalizeParagraphText,
  normalizeSmallCapsTitle,
} from "@/lib/resume-item-utils";
import { POST } from "@/app/api/pdf/latex/route";

describe("resume typography & language helpers", () => {
  it("normalizes single copy-paste newlines into spaces while preserving double-newline paragraphs", () => {
    const pasted =
      "Final-year Informatics Engineering student at Hasanuddin University,\nparticularly Natural Language Processing (NLP).\n\nSecond paragraph\ncontinues here.";
    expect(normalizeParagraphText(pasted)).toBe(
      "Final-year Informatics Engineering student at Hasanuddin University, particularly Natural Language Processing (NLP).\n\nSecond paragraph continues here."
    );
  });

  it("converts all-uppercase headings to Title Case for Small Caps while preserving mixed-case acronyms", () => {
    expect(normalizeSmallCapsTitle("EXPERIENCE")).toBe("Experience");
    expect(normalizeSmallCapsTitle("TECHNICAL SKILLS")).toBe("Technical Skills");
    expect(normalizeSmallCapsTitle("UI/UX Experience")).toBe("UI/UX Experience");
  });

  it("defaults newly created empty CVs to English section headings", () => {
    const empty = createEmptyResume("cv-new", "New CV");
    expect(empty.language).toBe("en");
    expect(empty.sections.experience.title).toBe("Experience");
    expect(empty.sections.education.title).toBe("Education");
    expect(empty.sections.projects.title).toBe("Projects");
    expect(empty.sections.skills.title).toBe("Technical Skills");
  });
});

describe("escapeLatex", () => {
  it("escapes all 10 LaTeX special characters without double-escaping backslash braces", () => {
    const raw = String.raw`\ { } & % $ # _ ~ ^`;
    const escaped = escapeLatex(raw);

    expect(escaped).toBe(
      String.raw`\textbackslash{} \{ \} \& \% \$ \# \_ \textasciitilde{} \textasciicircum{}`
    );
  });

  it("neutralizes LaTeX command injection payloads such as \\input{/etc/passwd} and \\write18{ls}", () => {
    expect(escapeLatex(String.raw`\input{/etc/passwd}`)).toBe(
      String.raw`\textbackslash{}input\{/etc/passwd\}`
    );
    expect(escapeLatex(String.raw`\write18{rm -rf /}`)).toBe(
      String.raw`\textbackslash{}write18\{rm -rf /\}`
    );
  });

  it("converts typographic en-dash and em-dash into TeX ligatures and handles realistic CV metrics", () => {
    expect(
      escapeLatex("Jan 2023 – Present — Improved R&D margin by 40% ($120k) in C#")
    ).toBe(
      String.raw`Jan 2023 -- Present --- Improved R\&D margin by 40\% (\$120k) in C\#`
    );
  });
});

describe("formatLatexHref", () => {
  it("normalizes bare domains and escapes special TeX characters in both URL and label", () => {
    const out = formatLatexHref(
      "github.com/arya_goberto?tab=repositories&q=100%#top",
      "github.com/arya_goberto"
    );
    expect(out).toBe(
      String.raw`\href{https://github.com/arya\_goberto?tab=repositories\&q=100\%\#top}{\underline{github.com/arya\_goberto}}`
    );
  });

  it("formats email links with mailto: protocol", () => {
    expect(
      formatLatexHref("arya.goberto@email.com", "arya.goberto@email.com", {
        isEmail: true,
      })
    ).toBe(
      String.raw`\href{mailto:arya.goberto@email.com}{\underline{arya.goberto@email.com}}`
    );
  });

  it("falls back to plain escaped text for empty or dangerous javascript:/data: URLs", () => {
    expect(formatLatexHref("javascript:alert(1)", "Portfolio & Blog")).toBe(
      String.raw`Portfolio \& Blog`
    );
    expect(formatLatexHref("   ", "No Link #1")).toBe(String.raw`No Link \#1`);
  });
});

describe("generateLatexDocument", () => {
  it("generates an Overleaf-compatible Jake's Resume .tex document with Small Caps and titlerule", () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    doc.config.templateId = "classic-latex";
    doc.config.paperSize = "LETTER";
    doc.config.density = "normal";
    doc.config.fontFamily = "serif";
    doc.basics.fullName = "Arya Gunavaro Goberto";

    const tex = generateLatexDocument(doc);

    expect(tex).toContain(String.raw`\documentclass[letterpaper,11pt]{article}`);
    expect(tex).toContain(String.raw`\usepackage[margin=0.5in]{geometry}`);
    expect(tex).toContain(String.raw`\scshape\raggedright\large`);
    expect(tex).toContain(String.raw`\titlerule`);
    expect(tex).toContain(String.raw`\textbf{\Huge Arya Gunavaro Goberto}`);
    expect(tex).toContain("$|$");
    // Classic Academic prints full-size justified summary paragraph without a Summary section heading
    expect(tex).not.toContain(String.raw`\section{Summary}`);
    expect(tex).not.toContain(String.raw`\section{Ringkasan Profesional}`);
    expect(tex).not.toContain(String.raw`\small{Frontend Engineer`);
    expect(tex).toContain("Frontend Engineer with 3+ years of experience");
    expect(tex).toContain(String.raw`\end{document}`);
  });

  it("converts ALL-CAPS section titles to Title Case so LaTeX \\scshape renders true Small Caps", () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    doc.sections.experience.title = "EXPERIENCE";
    doc.sections.skills.title = "TECHNICAL SKILLS";

    const tex = generateLatexDocument(doc);
    expect(tex).toContain(String.raw`\section{Experience}`);
    expect(tex).toContain(String.raw`\section{Technical Skills}`);
  });

  it("respects paperSize=A4, density=compact, sectionOrder, and omits hidden or empty sections/items/bullets", () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    doc.config.paperSize = "A4";
    doc.config.density = "compact";
    doc.config.sectionOrder = [
      "skills",
      "experience",
      "projects",
      "education",
      "custom:blank-sec",
    ];

    // Hide projects section, second experience item, and second bullet of first experience
    doc.sections.projects.isVisible = false;
    doc.sections.experience.items[1].isVisible = false;
    doc.sections.experience.items[0].bullets[1].isVisible = false;

    // Add a visible custom section whose only item is completely blank
    doc.sections.customSections = [
      {
        id: "blank-sec",
        title: "Sertifikasi / Kustom",
        isVisible: true,
        items: [
          {
            id: "blank-1",
            isVisible: true,
            title: "   ",
            subtitle: "",
            date: "",
            bullets: [{ id: "bb-1", isVisible: true, text: "" }],
          },
        ],
      },
    ];

    const tex = generateLatexDocument(doc);

    expect(tex).toContain(String.raw`\documentclass[a4paper,10pt]{article}`);
    expect(tex).toContain(String.raw`\usepackage[margin=0.4in]{geometry}`);

    const skillsIdx = tex.indexOf(String.raw`\section{Skills}`);
    const expIdx = tex.indexOf(String.raw`\section{Experience}`);
    const eduIdx = tex.indexOf(String.raw`\section{Education}`);
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(skillsIdx);
    expect(eduIdx).toBeGreaterThan(expIdx);

    expect(tex).not.toContain(String.raw`\section{Projects}`);
    expect(tex).not.toContain("Craftfolio Builder");
    expect(tex).not.toContain("Startup Edukasi ID");
    expect(tex).not.toContain("Architected a modular design system");
    expect(tex).toContain("improving page render speed by 40\\%");
    expect(tex).not.toContain("Sertifikasi / Kustom");
  });
});

describe("POST /api/pdf/latex (handleLatexPdfPost)", () => {
  it("returns 400 when request body fails ResumeDocumentSchema validation", async () => {
    const req = new Request("http://localhost:3000/api/pdf/latex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 503 LATEX_COMPILER_UNAVAILABLE when pdflatex binary is missing (ENOENT)", async () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    const req = new Request("http://localhost:3000/api/pdf/latex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });

    const res = await handleLatexPdfPost(req, {
      runPdflatex: async () => {
        const err = Object.assign(new Error("spawn pdflatex ENOENT"), {
          code: "ENOENT",
        });
        throw err;
      },
    });

    expect(res.status).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("LATEX_COMPILER_UNAVAILABLE");
  });

  it("returns 200 application/pdf with X-Pdf-Engine=pdflatex and cleans up tmpDir in finally", async () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    const req = new Request("http://localhost:3000/api/pdf/latex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });

    let capturedTmpDir = "";
    let capturedArgs: string[] = [];

    const res = await handleLatexPdfPost(req, {
      runPdflatex: async (_bin, args, tmpDir) => {
        capturedTmpDir = tmpDir;
        capturedArgs = args;
        await fs.writeFile(
          path.join(tmpDir, "resume.pdf"),
          Buffer.from("%PDF-1.5 mock overleaf output")
        );
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("X-Pdf-Engine")).toBe("pdflatex");
    expect(capturedArgs).toContain("-no-shell-escape");
    expect(capturedArgs).toContain("-interaction=nonstopmode");
    expect(capturedArgs).toContain("-halt-on-error");

    const pdfBytes = Buffer.from(await res.arrayBuffer()).toString("utf8");
    expect(pdfBytes).toContain("%PDF-1.5 mock overleaf output");

    // Verify temporary directory was deleted
    await expect(fs.access(capturedTmpDir)).rejects.toThrow();
  });
});
