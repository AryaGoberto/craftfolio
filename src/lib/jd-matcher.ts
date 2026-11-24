import type {
  BuiltinSectionKey,
  ResumeDocument,
  SectionKey,
} from "@/lib/schemas/resume";

export interface HiddenMatchSource {
  targetType: "section" | "item" | "bullet";
  sectionKey: SectionKey;
  itemId?: string;
  bulletId?: string;
  label: string;
}

export interface HiddenKeywordMatch {
  keyword: string;
  sources: HiddenMatchSource[];
}

export interface JdMatchResult {
  keywords: string[];
  matchedActive: string[];
  matchedHiddenInMaster: HiddenKeywordMatch[];
  missing: string[];
}

interface SkillDefinition {
  canonical: string;
  aliases?: string[];
  caseSensitive?: boolean;
}

const SKILL_CATALOG: SkillDefinition[] = [
  { canonical: "Next.js", aliases: ["nextjs", "next js"] },
  { canonical: "React", aliases: ["reactjs", "react.js"] },
  { canonical: "TypeScript", aliases: ["ts"] },
  { canonical: "JavaScript", aliases: ["js", "es6"] },
  { canonical: "Tailwind CSS", aliases: ["tailwindcss"] },
  { canonical: "Node.js", aliases: ["nodejs", "node js"] },
  { canonical: "Express.js", aliases: ["expressjs"] },
  { canonical: "Vue.js", aliases: ["vuejs", "vue"] },
  { canonical: "Angular" },
  { canonical: "Svelte" },
  { canonical: "HTML", aliases: ["html5"] },
  { canonical: "CSS", aliases: ["css3"] },
  { canonical: "SCSS", aliases: ["sass"] },
  { canonical: "Python" },
  { canonical: "Java" },
  { canonical: "Go", aliases: ["golang"], caseSensitive: true },
  { canonical: "Rust" },
  { canonical: "PHP" },
  { canonical: "Laravel" },
  { canonical: "Flutter" },
  { canonical: "Dart" },
  { canonical: "Kotlin" },
  { canonical: "Swift" },
  { canonical: "C++" },
  { canonical: "C#" },
  { canonical: "SQL" },
  { canonical: "PostgreSQL", aliases: ["postgres"] },
  { canonical: "MySQL" },
  { canonical: "MongoDB" },
  { canonical: "Redis" },
  { canonical: "Supabase" },
  { canonical: "Firebase" },
  { canonical: "Prisma" },
  { canonical: "GraphQL" },
  { canonical: "REST API", aliases: ["restful api", "rest apis", "restful"] },
  { canonical: "Docker" },
  { canonical: "Kubernetes", aliases: ["k8s"] },
  { canonical: "AWS", aliases: ["amazon web services"] },
  { canonical: "GCP", aliases: ["google cloud"] },
  { canonical: "Azure" },
  { canonical: "Vercel" },
  { canonical: "Linux" },
  { canonical: "Git" },
  { canonical: "GitHub" },
  { canonical: "CI/CD", aliases: ["cicd"] },
  { canonical: "Playwright" },
  { canonical: "Vitest" },
  { canonical: "Jest" },
  { canonical: "Cypress" },
  { canonical: "Zustand" },
  { canonical: "Redux" },
  { canonical: "Zod" },
  { canonical: "Machine Learning" },
  { canonical: "Deep Learning" },
  { canonical: "Data Science" },
  { canonical: "Natural Language Processing", aliases: ["nlp"] },
  { canonical: "LLM", aliases: ["large language models", "large language model"] },
  { canonical: "RAG", aliases: ["retrieval-augmented generation"] },
  { canonical: "Computer Vision" },
  { canonical: "TensorFlow" },
  { canonical: "PyTorch" },
  { canonical: "Pandas" },
  { canonical: "Streamlit" },
  { canonical: "HuggingFace", aliases: ["hugging face"] },
  { canonical: "ETL" },
  { canonical: "EDA" },
  { canonical: "Figma" },
  { canonical: "UI/UX", aliases: ["ux/ui"] },
  { canonical: "Design System", aliases: ["design systems"] },
  { canonical: "Core Web Vitals" },
  { canonical: "Accessibility", aliases: ["wcag", "a11y"] },
  { canonical: "Agile" },
  { canonical: "Scrum" },
  { canonical: "Jira" },
  { canonical: "SEO" },
  { canonical: "Excel" },
  { canonical: "Power BI" },
  { canonical: "Tableau" },
  { canonical: "Project Management" },
];

const IGNORED_ACRONYMS = new Set([
  "THE",
  "AND",
  "FOR",
  "YOU",
  "OUR",
  "ARE",
  "NOT",
  "ALL",
  "HAS",
  "WITH",
  "WILL",
  "THAT",
  "THIS",
  "FROM",
  "YOUR",
  "HAVE",
  "WHO",
  "WHY",
  "HOW",
  "JOB",
  "CV",
  "HR",
  "PT",
  "TBK",
  "ID",
  "EN",
  "S1",
  "D3",
  "MIN",
  "MAX",
  "GPA",
  "IPK",
  "WFO",
  "WFH",
  "WFA",
  "YRS",
  "ETC",
  "DAN",
  "YANG",
  "ATAU",
  "DARI",
  "UNTUK",
  "DENGAN",
]);

const MAX_EXTRACTED_KEYWORDS = 30;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(
  text: string,
  term: string,
  caseSensitive = false
): boolean {
  if (!text || !term) return false;
  const escaped = escapeRegex(term);
  const flags = caseSensitive ? "" : "i";
  const pattern = new RegExp(
    `(?<![a-zA-Z0-9_+#.])${escaped}(?![a-zA-Z0-9_+#]|\\.[a-zA-Z])`,
    flags
  );
  return pattern.test(text);
}

function matchesSkillDefinition(text: string, def: SkillDefinition): boolean {
  if (containsTerm(text, def.canonical, def.caseSensitive)) {
    return true;
  }
  if (!def.aliases) return false;
  return def.aliases.some((alias) => {
    const aliasCaseSensitive = alias.length <= 2;
    return containsTerm(text, alias, aliasCaseSensitive);
  });
}

export function extractJdKeywords(jdText: string): string[] {
  const trimmed = jdText.trim();
  if (!trimmed) return [];

  const found: string[] = [];
  const seenLower = new Set<string>();

  const addKeyword = (kw: string) => {
    const clean = kw.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    if (seenLower.has(lower)) return;
    seenLower.add(lower);
    found.push(clean);
  };

  // 1. Match curated skill catalog & aliases
  for (const def of SKILL_CATALOG) {
    if (matchesSkillDefinition(trimmed, def)) {
      addKeyword(def.canonical);
      for (const alias of def.aliases ?? []) {
        seenLower.add(alias.toLowerCase());
      }
    }
  }

  // 2. Detect dotted/symbol technical tokens not already in catalog (e.g., Nuxt.js, Nest.js, ASP.NET)
  const techTokenRegex =
    /\b[A-Za-z][A-Za-z0-9]*(?:\.(?:js|ts|py|net)|\+\+|#)\b/gi;
  for (const match of trimmed.matchAll(techTokenRegex)) {
    addKeyword(match[0]);
  }

  // 3. Detect uppercase technical acronyms (2–6 chars, e.g., API, SDK, TDD, KPI)
  const acronymRegex = /\b[A-Z][A-Z0-9/+&-]{1,5}\b/g;
  for (const match of trimmed.matchAll(acronymRegex)) {
    const token = match[0];
    if (IGNORED_ACRONYMS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    addKeyword(token);
  }

  return found.slice(0, MAX_EXTRACTED_KEYWORDS);
}

interface HiddenSourceEntry extends HiddenMatchSource {
  text: string;
}

function collectResumeTextAndHiddenSources(doc: ResumeDocument): {
  activeText: string;
  hiddenSources: HiddenSourceEntry[];
} {
  const activeChunks: string[] = [];
  const hiddenSources: HiddenSourceEntry[] = [];
  const activeOrderSet = new Set<SectionKey>(doc.config.sectionOrder);

  // Basics
  activeChunks.push(
    doc.basics.fullName,
    doc.basics.headline ?? "",
    doc.basics.location ?? ""
  );

  // Summary
  if (doc.basics.summary.text.trim()) {
    if (doc.basics.summary.isVisible && activeOrderSet.has("summary")) {
      activeChunks.push(doc.basics.summary.text);
    } else {
      hiddenSources.push({
        targetType: "section",
        sectionKey: "summary",
        label: "Ringkasan Profesional",
        text: doc.basics.summary.text,
      });
    }
  }

  // Built-in sections
  const builtinKeys: BuiltinSectionKey[] = [
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "awards",
    "volunteering",
    "languages",
  ];

  for (const key of builtinKeys) {
    const group = doc.sections[key];
    if (!group.isVisible || !activeOrderSet.has(key)) {
      const allSectionText = group.items
        .map((rawItem) => {
          const it = rawItem as Record<string, unknown>;
          const bullets = Array.isArray(it.bullets)
            ? (it.bullets as Array<{ text?: string }>)
                .map((b) => b.text ?? "")
                .join(" ")
            : "";
          const fields = Object.entries(it)
            .filter(([k, v]) => k !== "id" && k !== "isVisible" && typeof v === "string")
            .map(([, v]) => v as string)
            .join(" ");
          return `${fields} ${bullets}`.trim();
        })
        .join(" ");
      if (allSectionText.trim()) {
        hiddenSources.push({
          targetType: "section",
          sectionKey: key,
          label: `Bagian: ${group.title}`,
          text: allSectionText,
        });
      }
      continue;
    }

    for (const rawItem of group.items) {
      const item = rawItem as {
        id: string;
        isVisible: boolean;
        company?: string;
        position?: string;
        institution?: string;
        degree?: string;
        name?: string;
        techStack?: string;
        category?: string;
        skills?: string;
        issuer?: string;
        title?: string;
        description?: string;
        language?: string;
        proficiency?: string;
        bullets?: Array<{ id: string; text: string; isVisible: boolean }>;
      };

      const itemLabel =
        item.position ||
        item.company ||
        item.name ||
        item.institution ||
        item.category ||
        item.title ||
        item.language ||
        group.title;

      const baseItemText = [
        item.company,
        item.position,
        item.institution,
        item.degree,
        item.name,
        item.techStack,
        item.category,
        item.skills,
        item.issuer,
        item.title,
        item.description,
        item.language,
        item.proficiency,
      ]
        .filter(Boolean)
        .join(" ");

      if (!item.isVisible) {
        const fullItemText = [
          baseItemText,
          ...(item.bullets ?? []).map((b) => b.text),
        ]
          .filter(Boolean)
          .join(" ");
        if (fullItemText.trim()) {
          hiddenSources.push({
            targetType: "item",
            sectionKey: key,
            itemId: item.id,
            label: `${group.title}: ${itemLabel}`,
            text: fullItemText,
          });
        }
        continue;
      }

      if (baseItemText) activeChunks.push(baseItemText);

      for (const bullet of item.bullets ?? []) {
        if (!bullet.text.trim()) continue;
        if (bullet.isVisible) {
          activeChunks.push(bullet.text);
        } else {
          hiddenSources.push({
            targetType: "bullet",
            sectionKey: key,
            itemId: item.id,
            bulletId: bullet.id,
            label: `Poin di ${itemLabel}`,
            text: bullet.text,
          });
        }
      }
    }
  }

  // Custom sections
  for (const custom of doc.sections.customSections) {
    const sectionKey = `custom:${custom.id}` as const;
    if (!custom.isVisible || !activeOrderSet.has(sectionKey)) {
      const allText = custom.items
        .flatMap((it) => [
          it.title,
          it.subtitle ?? "",
          ...it.bullets.map((b) => b.text),
        ])
        .join(" ");
      if (allText.trim()) {
        hiddenSources.push({
          targetType: "section",
          sectionKey,
          label: `Bagian: ${custom.title}`,
          text: allText,
        });
      }
      continue;
    }

    for (const item of custom.items) {
      const baseText = [item.title, item.subtitle ?? ""].join(" ");
      if (!item.isVisible) {
        const fullText = [baseText, ...item.bullets.map((b) => b.text)].join(
          " "
        );
        if (fullText.trim()) {
          hiddenSources.push({
            targetType: "item",
            sectionKey,
            itemId: item.id,
            label: `${custom.title}: ${item.title || "Item"}`,
            text: fullText,
          });
        }
        continue;
      }

      if (baseText.trim()) activeChunks.push(baseText);
      for (const bullet of item.bullets) {
        if (!bullet.text.trim()) continue;
        if (bullet.isVisible) {
          activeChunks.push(bullet.text);
        } else {
          hiddenSources.push({
            targetType: "bullet",
            sectionKey,
            itemId: item.id,
            bulletId: bullet.id,
            label: `Poin di ${item.title || custom.title}`,
            text: bullet.text,
          });
        }
      }
    }
  }

  return {
    activeText: activeChunks.filter(Boolean).join(" "),
    hiddenSources,
  };
}

function matchesKeywordInText(text: string, keyword: string): boolean {
  const catalogDef = SKILL_CATALOG.find(
    (d) => d.canonical.toLowerCase() === keyword.toLowerCase()
  );
  if (catalogDef) {
    return matchesSkillDefinition(text, catalogDef);
  }
  return containsTerm(text, keyword, false);
}

export function matchJobDescription(
  doc: ResumeDocument,
  jdText: string
): JdMatchResult {
  const keywords = extractJdKeywords(jdText);
  if (keywords.length === 0) {
    return {
      keywords: [],
      matchedActive: [],
      matchedHiddenInMaster: [],
      missing: [],
    };
  }

  const { activeText, hiddenSources } = collectResumeTextAndHiddenSources(doc);

  const matchedActive: string[] = [];
  const matchedHiddenInMaster: HiddenKeywordMatch[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    if (matchesKeywordInText(activeText, keyword)) {
      matchedActive.push(keyword);
      continue;
    }

    const matchingSources: HiddenMatchSource[] = hiddenSources
      .filter((src) => matchesKeywordInText(src.text, keyword))
      .map(({ targetType, sectionKey, itemId, bulletId, label }) => ({
        targetType,
        sectionKey,
        itemId,
        bulletId,
        label,
      }));

    if (matchingSources.length > 0) {
      matchedHiddenInMaster.push({ keyword, sources: matchingSources });
    } else {
      missing.push(keyword);
    }
  }

  return {
    keywords,
    matchedActive,
    matchedHiddenInMaster,
    missing,
  };
}
