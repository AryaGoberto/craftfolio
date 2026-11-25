import type {
  BulletPoint,
  ResumeDocument,
  SectionKey,
} from "@/lib/schemas/resume";
import {
  getVisibleNonEmptyBullets,
  isNonEmptyAwardItem,
  isNonEmptyCertificationItem,
  isNonEmptyCustomItem,
  isNonEmptyEducationItem,
  isNonEmptyExperienceItem,
  isNonEmptyLanguageItem,
  isNonEmptyProjectItem,
  isNonEmptySkillItem,
  normalizeParagraphText,
  normalizeSmallCapsTitle,
} from "@/lib/resume-item-utils";
import { normalizeUrl, toMailtoHref } from "@/lib/url-utils";

const LATEX_ESCAPE_MAP: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "&": "\\&",
  "%": "\\%",
  $: "\\$",
  "#": "\\#",
  _: "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

/**
 * Escapes all 10 LaTeX special characters in a single pass so user input can never
 * break compilation, double-escape braces, or execute arbitrary TeX primitives.
 */
export function escapeLatex(input: string): string {
  if (!input) return "";

  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\\{}&%$#_~^]/g, (ch) => LATEX_ESCAPE_MAP[ch] ?? ch)
    .replace(/\u2014/g, "---")
    .replace(/\u2013/g, "--");
}

/**
 * Escapes a normalized URL for safe embedding inside `\href{...}{...}` even when
 * nested inside macro arguments or `tabular*` environments.
 */
export function escapeLatexUrl(url: string): string {
  const percentEncoded = url
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/%/g, "%")
    .replace(/\\/g, "%5C")
    .replace(/\{/g, "%7B")
    .replace(/\}/g, "%7D")
    .replace(/ /g, "%20")
    .replace(/~/g, "%7E")
    .replace(/\^/g, "%5E")
    .replace(/\$/g, "%24");

  return percentEncoded
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/&/g, "\\&")
    .replace(/_/g, "\\_");
}

export interface FormatLatexHrefOptions {
  isEmail?: boolean;
  underline?: boolean;
}

/**
 * Formats a clickable `\href{url}{\underline{label}}` command, or returns plain
 * escaped text if the URL is empty or uses a blocked protocol (`javascript:`, `data:`).
 */
export function formatLatexHref(
  rawUrl: string,
  label: string,
  options?: FormatLatexHrefOptions
): string {
  const normalized = options?.isEmail
    ? toMailtoHref(rawUrl)
    : normalizeUrl(rawUrl);

  const safeLabel = escapeLatex(label);
  if (!normalized) {
    return safeLabel;
  }

  const safeUrl = escapeLatexUrl(normalized);
  const underline = options?.underline ?? true;
  const formattedLabel = underline ? `\\underline{${safeLabel}}` : safeLabel;

  return `\\href{${safeUrl}}{${formattedLabel}}`;
}

function renderBulletsBlock(bullets: BulletPoint[]): string {
  const visible = getVisibleNonEmptyBullets(bullets);
  if (visible.length === 0) return "";

  const lines = visible.map(
    (b) => `        \\resumeItem{${escapeLatex(normalizeParagraphText(b.text))}}`
  );
  return [
    "      \\resumeItemListStart",
    ...lines,
    "      \\resumeItemListEnd",
  ].join("\n");
}

function formatSectionCommand(rawTitle: string): string {
  return `\\section{${escapeLatex(normalizeSmallCapsTitle(rawTitle))}}`;
}

function getFontPreamble(fontFamily: ResumeDocument["config"]["fontFamily"]): string {
  switch (fontFamily) {
    case "inter":
    case "roboto":
      return "\\IfFileExists{roboto.sty}{\\usepackage[sfdefault]{roboto}}{\\usepackage[sfdefault]{helvet}}";
    case "georgia":
      return "\\IfFileExists{charter.sty}{\\usepackage{charter}}{}";
    case "serif":
    default:
      // Default Computer Modern Roman (matches Overleaf / Jake's Resume 100%)
      return "% Default Computer Modern Roman (Overleaf Classic)";
  }
}

/**
 * Generates a complete, self-contained Overleaf-compatible `.tex` document
 * modeled after Jake's Resume (`pdfTeX` + `titlesec` Small Caps + `\titlerule`).
 */
export function generateLatexDocument(doc: ResumeDocument): string {
  const { basics, sections, config } = doc;
  const isClassic = config.templateId === "classic-latex";
  const isCompact = config.templateId === "compact";
  const isModern = config.templateId === "modern-minimal";
  const isExecutive = config.templateId === "executive";

  const paperOption = config.paperSize === "LETTER" ? "letterpaper" : "a4paper";
  const fontSizeOption =
    isCompact || config.density === "compact" ? "10pt" : "11pt";

  const marginByDensity: Record<ResumeDocument["config"]["density"], string> = {
    compact: "0.4in",
    normal: "0.5in",
    relaxed: "0.6in",
  };
  const margin = marginByDensity[config.density];
  const fontPreamble = getFontPreamble(config.fontFamily);

  const visibleLinks = basics.links.filter(
    (l) => l.isVisible && l.url.trim().length > 0
  );

  const contactParts: string[] = [];
  if (basics.phone?.trim()) {
    contactParts.push(escapeLatex(basics.phone.trim()));
  }
  if (basics.email?.trim()) {
    contactParts.push(
      formatLatexHref(basics.email.trim(), basics.email.trim(), {
        isEmail: true,
      })
    );
  }
  for (const link of visibleLinks) {
    const cleanUrl = link.url.trim();
    contactParts.push(formatLatexHref(cleanUrl, cleanUrl));
  }
  if (!isClassic && basics.location?.trim()) {
    contactParts.push(escapeLatex(basics.location.trim()));
  }

  const displayName = escapeLatex(basics.fullName.trim() || "Nama Lengkap");
  const headerAlignEnv = isModern || isExecutive ? "flushleft" : "center";

  const headerLines: string[] = [
    `\\begin{${headerAlignEnv}}`,
    `    \\textbf{\\Huge ${displayName}} \\\\ \\vspace{2pt}`,
  ];
  if (isExecutive && basics.headline?.trim()) {
    headerLines.push(
      `    \\small{\\textit{${escapeLatex(basics.headline.trim())}}} \\\\ \\vspace{2pt}`
    );
  }
  if (contactParts.length > 0) {
    headerLines.push(`    \\small ${contactParts.join(" $|$ ")}`);
  }
  headerLines.push(`\\end{${headerAlignEnv}}`);

  const renderSection = (key: SectionKey): string => {
    if (key === "summary") {
      const normalizedSummary = normalizeParagraphText(basics.summary.text);
      if (!basics.summary.isVisible || !normalizedSummary) return "";
      const summaryParagraphs = normalizedSummary
        .split("\n\n")
        .map((para) => escapeLatex(para))
        .join("\n\n");

      if (isClassic) {
        return [
          "%-----------SUMMARY-----------",
          "{\\csname justifying\\endcsname\\noindent",
          summaryParagraphs,
          "\\par}\\vspace{-4pt}",
        ].join("\n");
      }
      const summaryHeading =
        doc.language === "id" ? "Ringkasan Profesional" : "Summary";
      return [
        "%-----------SUMMARY-----------",
        formatSectionCommand(summaryHeading),
        "{\\csname justifying\\endcsname\\noindent",
        summaryParagraphs,
        "\\par}",
      ].join("\n");
    }

    if (key.startsWith("custom:")) {
      const customId = key.replace("custom:", "");
      const custom = sections.customSections.find((cs) => cs.id === customId);
      if (!custom || !custom.isVisible || !custom.title.trim()) return "";
      const items = custom.items.filter(
        (i) => i.isVisible && isNonEmptyCustomItem(i)
      );
      if (items.length === 0) return "";

      const itemBlocks = items.map((item) => {
        const title = escapeLatex(item.title.trim());
        const date = escapeLatex(item.date?.trim() || "");
        const subtitle = escapeLatex(item.subtitle?.trim() || "");
        const bulletsBlock = renderBulletsBlock(item.bullets);

        const headingCmd = subtitle
          ? `    \\resumeSubheading\n      {${title}}{${date}}\n      {${subtitle}}{}`
          : `    \\resumeProjectHeading\n      {\\textbf{${title}}}{${date}}`;

        return [headingCmd, bulletsBlock].filter(Boolean).join("\n");
      });

      return [
        `%-----------CUSTOM: ${escapeLatex(custom.title.trim())}-----------`,
        formatSectionCommand(custom.title),
        "  \\resumeSubHeadingListStart",
        ...itemBlocks,
        "  \\resumeSubHeadingListEnd",
      ].join("\n");
    }

    switch (key) {
      case "experience":
      case "volunteering": {
        const group = sections[key];
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptyExperienceItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const itemBlocks = items.map((item) => {
          const primaryLeft = isClassic
            ? item.position.trim() || item.company.trim()
            : [item.company.trim(), item.position.trim()]
                .filter(Boolean)
                .join(" --- ");
          const primaryRight = [item.startDate.trim(), item.endDate.trim()]
            .filter(Boolean)
            .map(escapeLatex)
            .join(" -- ");
          const secondaryLeftRaw = isClassic
            ? item.position.trim()
              ? [item.company.trim(), item.location?.trim()]
                  .filter(Boolean)
                  .join(" - ")
              : item.location?.trim() || ""
            : item.location?.trim() || "";

          const bulletsBlock = renderBulletsBlock(item.bullets);
          const headingCmd = secondaryLeftRaw
            ? `    \\resumeSubheading\n      {${escapeLatex(primaryLeft)}}{${primaryRight}}\n      {${escapeLatex(secondaryLeftRaw)}}{}`
            : `    \\resumeProjectHeading\n      {\\textbf{${escapeLatex(primaryLeft)}}}{${primaryRight}}`;

          return [headingCmd, bulletsBlock].filter(Boolean).join("\n");
        });

        return [
          `%-----------${key.toUpperCase()}-----------`,
          formatSectionCommand(group.title),
          "  \\resumeSubHeadingListStart",
          ...itemBlocks,
          "  \\resumeSubHeadingListEnd",
        ].join("\n");
      }

      case "education": {
        const group = sections.education;
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptyEducationItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const itemBlocks = items.map((item) => {
          const institution = escapeLatex(item.institution.trim());
          const location = escapeLatex(item.location?.trim() || "");
          const degreeParts = [
            item.degree.trim(),
            item.field?.trim() || "",
            item.gpa?.trim() ? `GPA: ${item.gpa.trim()}` : "",
          ]
            .filter((part) => part.length > 0)
            .map(escapeLatex)
            .join(" -- ");
          const dateRange = [item.startDate.trim(), item.endDate.trim()]
            .filter(Boolean)
            .map(escapeLatex)
            .join(" -- ");
          const bulletsBlock = renderBulletsBlock(item.bullets);

          const headingCmd =
            degreeParts || dateRange
              ? `    \\resumeSubheading\n      {${institution}}{${location}}\n      {${degreeParts}}{${dateRange}}`
              : `    \\resumeProjectHeading\n      {\\textbf{${institution}}}{${location}}`;

          return [headingCmd, bulletsBlock].filter(Boolean).join("\n");
        });

        return [
          "%-----------EDUCATION-----------",
          formatSectionCommand(group.title),
          "  \\resumeSubHeadingListStart",
          ...itemBlocks,
          "  \\resumeSubHeadingListEnd",
        ].join("\n");
      }

      case "projects": {
        const group = sections.projects;
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptyProjectItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const itemBlocks = items.map((item) => {
          const titleParts: string[] = [];
          if (item.name.trim()) {
            titleParts.push(`\\textbf{${escapeLatex(item.name.trim())}}`);
          }
          if (item.techStack?.trim()) {
            titleParts.push(`\\emph{${escapeLatex(item.techStack.trim())}}`);
          }
          if (item.url?.trim()) {
            titleParts.push(formatLatexHref(item.url.trim(), item.url.trim()));
          }
          const leftHeader = titleParts.join(" $|$ ");
          const date = escapeLatex(item.date?.trim() || "");
          const bulletsBlock = renderBulletsBlock(item.bullets);

          return [
            `    \\resumeProjectHeading\n      {${leftHeader}}{${date}}`,
            bulletsBlock,
          ]
            .filter(Boolean)
            .join("\n");
        });

        return [
          "%-----------PROJECTS-----------",
          formatSectionCommand(group.title),
          "  \\resumeSubHeadingListStart",
          ...itemBlocks,
          "  \\resumeSubHeadingListEnd",
        ].join("\n");
      }

      case "skills": {
        const group = sections.skills;
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptySkillItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const skillLines = items.map((item) => {
          const cat = item.category.trim();
          const val = escapeLatex(item.skills.trim());
          return cat
            ? `     \\textbf{${escapeLatex(cat)}}{: ${val}}`
            : `     ${val}`;
        });

        return [
          "%-----------TECHNICAL SKILLS-----------",
          formatSectionCommand(group.title),
          " \\begin{itemize}[leftmargin=0.15in, label={}]",
          "    \\small{\\item{",
          skillLines.join(" \\\\\n"),
          "    }}",
          " \\end{itemize}",
        ].join("\n");
      }

      case "certifications": {
        const group = sections.certifications;
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptyCertificationItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const itemBlocks = items.map((item) => {
          const namePart = item.url?.trim()
            ? `\\textbf{${formatLatexHref(item.url.trim(), item.name.trim())}}`
            : `\\textbf{${escapeLatex(item.name.trim())}}`;
          const issuerPart = item.issuer.trim()
            ? ` --- ${escapeLatex(item.issuer.trim())}`
            : "";
          const datePart = escapeLatex(item.date.trim());

          return `    \\resumeProjectHeading\n      {${namePart}${issuerPart}}{${datePart}}`;
        });

        return [
          "%-----------CERTIFICATIONS-----------",
          formatSectionCommand(group.title),
          "  \\resumeSubHeadingListStart",
          ...itemBlocks,
          "  \\resumeSubHeadingListEnd",
        ].join("\n");
      }

      case "awards": {
        const group = sections.awards;
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptyAwardItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const itemBlocks = items.map((item) => {
          const titlePart = `\\textbf{${escapeLatex(item.title.trim())}}`;
          const issuerPart = item.issuer?.trim()
            ? ` --- ${escapeLatex(item.issuer.trim())}`
            : "";
          const datePart = escapeLatex(item.date?.trim() || "");
          const descPart = item.description?.trim()
            ? `\n      \\resumeItemListStart\n        \\resumeItem{${escapeLatex(item.description.trim())}}\n      \\resumeItemListEnd`
            : "";

          return `    \\resumeProjectHeading\n      {${titlePart}${issuerPart}}{${datePart}}${descPart}`;
        });

        return [
          "%-----------AWARDS-----------",
          formatSectionCommand(group.title),
          "  \\resumeSubHeadingListStart",
          ...itemBlocks,
          "  \\resumeSubHeadingListEnd",
        ].join("\n");
      }

      case "languages": {
        const group = sections.languages;
        const items = group.items.filter(
          (i) => i.isVisible && isNonEmptyLanguageItem(i)
        );
        if (!group.isVisible || items.length === 0) return "";

        const joined = items
          .map((i) =>
            i.proficiency.trim()
              ? `\\textbf{${escapeLatex(i.language.trim())}} (${escapeLatex(i.proficiency.trim())})`
              : `\\textbf{${escapeLatex(i.language.trim())}}`
          )
          .join(" $\\cdot$ ");

        return [
          "%-----------LANGUAGES-----------",
          formatSectionCommand(group.title),
          " \\begin{itemize}[leftmargin=0.15in, label={}]",
          `    \\small{\\item{${joined}}}`,
          " \\end{itemize}",
        ].join("\n");
      }

      default:
        return "";
    }
  };

  const renderedSections = config.sectionOrder
    .map((key) => renderSection(key))
    .filter((block) => block.trim().length > 0);

  return [
    "%-------------------------",
    "% Resume in LaTeX (Generated by Craftfolio — Overleaf / Jake's Resume Compatible)",
    "% License : MIT",
    "%------------------------",
    "",
    `\\documentclass[${paperOption},${fontSizeOption}]{article}`,
    "",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage{latexsym}",
    `\\usepackage[margin=${margin}]{geometry}`,
    "\\usepackage{titlesec}",
    "\\usepackage{marvosym}",
    "\\usepackage[usenames,dvipsnames]{color}",
    "\\usepackage{enumitem}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{fancyhdr}",
    "\\usepackage{tabularx}",
    "\\IfFileExists{ragged2e.sty}{\\usepackage{ragged2e}}{}",
    "\\IfFileExists{ulem.sty}{\\usepackage[normalem]{ulem}\\setlength{\\ULdepth}{2pt}\\let\\underline\\uline}{}",
    fontPreamble,
    "\\IfFileExists{glyphtounicode.tex}{\\input{glyphtounicode}\\pdfgentounicode=1}{}",
    "",
    "\\pagestyle{fancy}",
    "\\fancyhf{}",
    "\\fancyfoot{}",
    "\\renewcommand{\\headrulewidth}{0pt}",
    "\\renewcommand{\\footrulewidth}{0pt}",
    "",
    "\\urlstyle{same}",
    "\\raggedbottom",
    "\\raggedright",
    "\\setlength{\\tabcolsep}{0in}",
    "",
    "% Sections formatting (True Small Caps + hairline rule)",
    "\\titleformat{\\section}{",
    "  \\vspace{-4pt}\\scshape\\raggedright\\large",
    "}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]",
    "",
    "% Custom commands",
    "\\newcommand{\\resumeItem}[1]{",
    "  \\item\\small{",
    "    {#1 \\vspace{-2pt}}",
    "  }",
    "}",
    "",
    "\\newcommand{\\resumeSubheading}[4]{",
    "  \\vspace{-2pt}\\item",
    "    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}",
    "      \\textbf{#1} & #2 \\\\",
    "      \\textit{\\small#3} & \\textit{\\small #4} \\\\",
    "    \\end{tabular*}\\vspace{-7pt}",
    "}",
    "",
    "\\newcommand{\\resumeProjectHeading}[2]{",
    "    \\item",
    "    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}",
    "      \\small#1 & #2 \\\\",
    "    \\end{tabular*}\\vspace{-7pt}",
    "}",
    "",
    "\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}",
    "",
    "\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}",
    "\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}",
    "\\newcommand{\\resumeItemListStart}{\\begin{itemize}}",
    "\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}",
    "",
    "%-------------------------------------------",
    "%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%",
    "",
    "\\begin{document}",
    "",
    ...headerLines,
    "",
    ...renderedSections.flatMap((sec) => [sec, ""]),
    "\\end{document}",
    "",
  ].join("\n");
}
