import { describe, expect, it } from "vitest";
import {
  extractJdKeywords,
  matchJobDescription,
} from "@/lib/jd-matcher";
import { createSampleResume } from "@/lib/default-resume";

describe("extractJdKeywords", () => {
  it("returns empty array for blank input", () => {
    expect(extractJdKeywords("")).toEqual([]);
    expect(extractJdKeywords("   \n\t  ")).toEqual([]);
  });

  it("extracts multi-word skills, aliases, and technical tokens without duplicates", () => {
    const jd = `
      Looking for a Frontend Engineer experienced in NextJS, React, TypeScript, Tailwind CSS,
      Postgres, CI/CD, C++, Nuxt.js, and RESTful APIs. Strong TDD habits and AWS experience.
    `;
    const keywords = extractJdKeywords(jd);
    expect(keywords).toContain("Next.js");
    expect(keywords).toContain("React");
    expect(keywords).toContain("TypeScript");
    expect(keywords).toContain("Tailwind CSS");
    expect(keywords).toContain("PostgreSQL");
    expect(keywords).toContain("CI/CD");
    expect(keywords).toContain("C++");
    expect(keywords).toContain("Nuxt.js");
    expect(keywords).toContain("REST API");
    expect(keywords).toContain("TDD");
    expect(keywords).toContain("AWS");

    // No case-insensitive duplicates
    const lowerSet = new Set(keywords.map((k) => k.toLowerCase()));
    expect(lowerSet.size).toBe(keywords.length);
  });

  it("does not falsely match 'Java' inside 'JavaScript' or lowercase 'go' in prose", () => {
    const jd = "We want someone who can go fast with JavaScript and HTML.";
    const keywords = extractJdKeywords(jd);
    expect(keywords).toContain("JavaScript");
    expect(keywords).toContain("HTML");
    expect(keywords).not.toContain("Java");
    expect(keywords).not.toContain("Go");
  });

  it("filters ignored non-skill acronyms and does not duplicate catalog aliases", () => {
    const jd =
      "PT Example Tbk HR team (WFH / WFO, GPA min 3.0, send CV) seeks TypeScript (TS) and Natural Language Processing (NLP) with SQL.";
    const keywords = extractJdKeywords(jd);

    expect(keywords).toContain("TypeScript");
    expect(keywords).toContain("Natural Language Processing");
    expect(keywords).toContain("SQL");

    expect(keywords).not.toContain("TS");
    expect(keywords).not.toContain("NLP");
    expect(keywords).not.toContain("PT");
    expect(keywords).not.toContain("HR");
    expect(keywords).not.toContain("WFH");
    expect(keywords).not.toContain("WFO");
    expect(keywords).not.toContain("GPA");
    expect(keywords).not.toContain("CV");
  });
});

describe("matchJobDescription", () => {
  it("classifies active, hidden-in-master (item/bullet/section), and missing keywords", () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");

    // Hide the Tools skill category that contains "Docker"
    const toolsSkill = doc.sections.skills.items.find((s) =>
      s.skills.includes("Docker")
    );
    expect(toolsSkill).toBeDefined();
    toolsSkill!.isVisible = false;

    // Hide one specific bullet containing "Playwright"
    const playwrightBullet = doc.sections.experience.items[0].bullets.find((b) =>
      b.text.includes("Playwright")
    );
    expect(playwrightBullet).toBeDefined();
    playwrightBullet!.isVisible = false;

    // Add a hidden section containing "AWS"
    doc.sections.certifications.isVisible = false;
    doc.sections.certifications.items.push({
      id: "cert-1",
      isVisible: true,
      name: "AWS Certified Developer",
      issuer: "Amazon",
      date: "2025",
    });

    const jd =
      "Required: React, Next.js, TypeScript, Docker, Playwright, AWS, and Kubernetes.";
    const res = matchJobDescription(doc, jd);

    expect(res.matchedActive).toEqual(
      expect.arrayContaining(["React", "Next.js", "TypeScript"])
    );

    const hiddenMap = new Map(
      res.matchedHiddenInMaster.map((m) => [m.keyword, m.sources])
    );

    expect(hiddenMap.get("Docker")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: "item",
          sectionKey: "skills",
          itemId: toolsSkill!.id,
        }),
      ])
    );

    expect(hiddenMap.get("Playwright")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: "bullet",
          sectionKey: "experience",
          itemId: doc.sections.experience.items[0].id,
          bulletId: playwrightBullet!.id,
        }),
      ])
    );

    expect(hiddenMap.get("AWS")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: "section",
          sectionKey: "certifications",
        }),
      ])
    );

    expect(res.missing).toContain("Kubernetes");
  });

  it("treats visible sections omitted from config.sectionOrder and hidden customSections as hidden", () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");

    // certifications has isVisible=true, but is NOT in doc.config.sectionOrder
    doc.sections.certifications.isVisible = true;
    doc.sections.certifications.items.push({
      id: "cert-aws",
      isVisible: true,
      name: "AWS Solutions Architect",
      issuer: "Amazon",
      date: "2025",
    });

    // custom section is hidden
    doc.sections.customSections.push({
      id: "pub-1",
      title: "Publications",
      isVisible: false,
      items: [
        {
          id: "pub-item-1",
          isVisible: true,
          title: "Applied PyTorch Systems",
          bullets: [],
        },
      ],
    });
    doc.config.sectionOrder.push("custom:pub-1");

    const res = matchJobDescription(doc, "Looking for AWS and PyTorch skills.");

    expect(res.matchedActive).not.toContain("AWS");
    expect(res.matchedActive).not.toContain("PyTorch");
    expect(res.matchedHiddenInMaster).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: "AWS",
          sources: expect.arrayContaining([
            expect.objectContaining({
              targetType: "section",
              sectionKey: "certifications",
            }),
          ]),
        }),
        expect.objectContaining({
          keyword: "PyTorch",
          sources: expect.arrayContaining([
            expect.objectContaining({
              targetType: "section",
              sectionKey: "custom:pub-1",
            }),
          ]),
        }),
      ])
    );
  });

  it("handles empty JD text gracefully", () => {
    const doc = createSampleResume("2026-01-01T00:00:00.000Z");
    const res = matchJobDescription(doc, "   ");
    expect(res).toEqual({
      keywords: [],
      matchedActive: [],
      matchedHiddenInMaster: [],
      missing: [],
    });
  });
});
