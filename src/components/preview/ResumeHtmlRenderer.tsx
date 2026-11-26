"use client";

import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";
import { getGhostPreviewData } from "@/lib/ghost-preview-data";
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
import {
  DENSITY_TOKENS,
  HTML_FONT_FAMILIES,
  PAPER_DIMENSIONS,
} from "@/lib/template-tokens";

interface ResumeHtmlRendererProps {
  doc: ResumeDocument;
  /** When true, displays muted display-only placeholder examples for empty fields/sections. Never exported to PDF/LaTeX. */
  showGhostPlaceholders?: boolean;
}

export function ResumeHtmlRenderer({
  doc,
  showGhostPlaceholders = false,
}: ResumeHtmlRendererProps) {
  const { basics, sections, config } = doc;
  const ghost = showGhostPlaceholders ? getGhostPreviewData(doc.language) : null;
  const density = DENSITY_TOKENS[config.density];
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const fontFamily = HTML_FONT_FAMILIES[config.fontFamily];

  const isClassic = config.templateId === "classic-latex";
  const isExecutive = config.templateId === "executive";
  const isModern = config.templateId === "modern-minimal";
  const isCompact = config.templateId === "compact";

  const effectiveBodyPt = isCompact
    ? Math.max(9.5, Number((density.bodySizePt - 0.8).toFixed(2)))
    : density.bodySizePt;
  const subBodyPt = Math.max(9, Number((effectiveBodyPt - 0.9).toFixed(2)));

  const visibleLinks = basics.links.filter(
    (l) => l.isVisible && l.url.trim().length > 0
  );

  const contactItems = [
    basics.phone?.trim(),
    basics.email?.trim(),
    ...visibleLinks.map((l) => l.url.trim()),
    ...(isClassic ? [] : [basics.location?.trim()]),
  ].filter((v): v is string => Boolean(v));

  const renderSectionHeading = (title: string, isGhost = false) => (
    <h2
      style={{
        fontSize: `${density.headingSizePt}pt`,
        fontVariant: isClassic ? "small-caps" : "normal",
        letterSpacing: isClassic ? "0.02em" : isModern ? "0.04em" : "0.06em",
        borderBottom: isGhost
          ? "0.6pt solid #D4D4D8"
          : isModern
            ? "1px solid #D4D4D8"
            : "0.6pt solid #000000",
        paddingBottom: "1.5pt",
        marginBottom: "4.5pt",
      }}
      className={`${isClassic ? "font-normal" : "font-bold uppercase"} ${
        isGhost ? "text-[#A1A1AA] select-none" : "text-[#000000]"
      }`}
    >
      {isClassic ? normalizeSmallCapsTitle(title) : title}
    </h2>
  );

  const listIndentClass = isClassic ? "pl-[11pt]" : "";

  const renderSection = (key: SectionKey) => {
    if (key === "summary") {
      const normalizedSummary = normalizeParagraphText(basics.summary.text);
      if (!basics.summary.isVisible) return null;
      const isGhostSummary = !normalizedSummary && Boolean(ghost);
      const textToRender = normalizedSummary || (ghost ? ghost.summary : "");
      if (!textToRender) return null;
      const paragraphs = textToRender.split("\n\n");
      return (
        <section
          key={key}
          style={{ marginBottom: `${density.sectionGapPt}pt` }}
          className={isGhostSummary ? "select-none" : undefined}
        >
          {!isClassic &&
            renderSectionHeading(
              doc.language === "id" ? "Ringkasan Profesional" : "Summary",
              isGhostSummary
            )}
          <div className="space-y-1.5 w-full">
            {paragraphs.map((para, idx) => (
              <p
                key={idx}
                className={`w-full text-justify ${
                  isGhostSummary ? "text-[#A1A1AA]" : "text-[#09090B]"
                }`}
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      );
    }

    if (key.startsWith("custom:")) {
      const customId = key.replace("custom:", "");
      const custom = sections.customSections.find((cs) => cs.id === customId);
      if (!custom || !custom.isVisible || !custom.title.trim()) return null;
      const visibleItems = custom.items.filter(
        (it) => it.isVisible && isNonEmptyCustomItem(it)
      );
      if (visibleItems.length === 0) return null;

      return (
        <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
          {renderSectionHeading(custom.title)}
          <div
            className={`flex flex-col ${listIndentClass}`}
            style={{ gap: `${density.itemGapPt}pt` }}
          >
            {visibleItems.map((item) => {
              const bullets = getVisibleNonEmptyBullets(item.bullets);
              return (
                <div key={item.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-bold text-[#09090B]">{item.title}</div>
                    {item.date ? (
                      <span
                        className="shrink-0 text-[#18181B]"
                        style={{
                          fontSize: `${isClassic ? effectiveBodyPt : subBodyPt}pt`,
                        }}
                      >
                        {item.date}
                      </span>
                    ) : null}
                  </div>
                  {item.subtitle ? (
                    <div
                      className="italic text-[#18181B]"
                      style={{ fontSize: `${subBodyPt}pt` }}
                    >
                      {item.subtitle}
                    </div>
                  ) : null}
                  {bullets.length > 0 && (
                    <ul
                      className="list-disc pl-5 mt-1 flex flex-col"
                      style={{
                        gap: `${density.bulletGapPt}pt`,
                        fontSize: `${isClassic ? subBodyPt : effectiveBodyPt}pt`,
                      }}
                    >
                      {bullets.map((b) => (
                        <li key={b.id} className="text-[#18181B]">
                          {normalizeParagraphText(b.text)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    switch (key) {
      case "experience":
      case "volunteering": {
        const group = sections[key];
        const realItems = group.items.filter(
          (it) => it.isVisible && isNonEmptyExperienceItem(it)
        );
        const isGhostSection =
          key === "experience" && realItems.length === 0 && Boolean(ghost);
        const visibleItems = isGhostSection && ghost ? ghost.experience : realItems;
        if (!group.isVisible || visibleItems.length === 0) return null;
        const primaryText = isGhostSection ? "text-[#A1A1AA]" : "text-[#09090B]";
        const secondaryText = isGhostSection ? "text-[#A1A1AA]" : "text-[#18181B]";
        return (
          <section
            key={key}
            style={{ marginBottom: `${density.sectionGapPt}pt` }}
            className={isGhostSection ? "select-none" : undefined}
          >
            {renderSectionHeading(group.title, isGhostSection)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.itemGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id}>
                  {/* Line 1: Bold Role/Position (left) + Dates (right) */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className={`font-bold ${primaryText}`}>
                      {isClassic
                        ? item.position || item.company
                        : [item.company, item.position].filter(Boolean).join(" — ")}
                    </div>
                    {(item.startDate || item.endDate) && (
                      <span
                        className={`shrink-0 ${secondaryText}`}
                        style={{
                          fontSize: `${isClassic ? effectiveBodyPt : subBodyPt}pt`,
                        }}
                      >
                        {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                      </span>
                    )}
                  </div>
                  {/* Line 2: Italic Company - Location */}
                  {(isClassic ? item.company || item.location : item.location) && (
                    <div
                      className={`${secondaryText} italic`}
                      style={{ fontSize: `${subBodyPt}pt` }}
                    >
                      {isClassic
                        ? [item.company, item.location].filter(Boolean).join(" - ")
                        : item.location}
                    </div>
                  )}
                  {item.bullets.filter((b) => b.isVisible && b.text.trim()).length > 0 && (
                    <ul
                      className="list-disc pl-5 mt-1 flex flex-col"
                      style={{
                        gap: `${density.bulletGapPt}pt`,
                        fontSize: `${isClassic ? subBodyPt : effectiveBodyPt}pt`,
                      }}
                    >
                      {item.bullets
                        .filter((b) => b.isVisible && b.text.trim())
                        .map((b) => (
                          <li key={b.id} className={secondaryText}>
                            {normalizeParagraphText(b.text)}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "education": {
        const group = sections.education;
        const realItems = group.items.filter(
          (it) => it.isVisible && isNonEmptyEducationItem(it)
        );
        const isGhostSection = realItems.length === 0 && Boolean(ghost);
        const visibleItems = isGhostSection && ghost ? ghost.education : realItems;
        if (!group.isVisible || visibleItems.length === 0) return null;
        const primaryText = isGhostSection ? "text-[#A1A1AA]" : "text-[#09090B]";
        const secondaryText = isGhostSection ? "text-[#A1A1AA]" : "text-[#18181B]";
        return (
          <section
            key={key}
            style={{ marginBottom: `${density.sectionGapPt}pt` }}
            className={isGhostSection ? "select-none" : undefined}
          >
            {renderSectionHeading(group.title, isGhostSection)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.itemGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id}>
                  {/* Line 1: Bold Institution (left) + Location (right) */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className={`font-bold ${primaryText}`}>
                      {item.institution}
                    </div>
                    {item.location && (
                      <span
                        className={`shrink-0 ${secondaryText}`}
                        style={{
                          fontSize: `${isClassic ? effectiveBodyPt : subBodyPt}pt`,
                        }}
                      >
                        {item.location}
                      </span>
                    )}
                  </div>
                  {/* Line 2: Italic Degree + GPA (left) + Italic Dates (right) */}
                  <div
                    className={`flex items-baseline justify-between gap-4 italic ${secondaryText}`}
                    style={{ fontSize: `${subBodyPt}pt` }}
                  >
                    <div>
                      {[item.degree, item.gpa ? `GPA: ${item.gpa}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {(item.startDate || item.endDate) && (
                      <span className="shrink-0">
                        {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "projects": {
        const group = sections.projects;
        const realItems = group.items.filter(
          (it) => it.isVisible && isNonEmptyProjectItem(it)
        );
        const isGhostSection = realItems.length === 0 && Boolean(ghost);
        const visibleItems = isGhostSection && ghost ? ghost.projects : realItems;
        if (!group.isVisible || visibleItems.length === 0) return null;
        const primaryText = isGhostSection ? "text-[#A1A1AA]" : "text-[#09090B]";
        const secondaryText = isGhostSection ? "text-[#A1A1AA]" : "text-[#18181B]";
        return (
          <section
            key={key}
            style={{ marginBottom: `${density.sectionGapPt}pt` }}
            className={isGhostSection ? "select-none" : undefined}
          >
            {renderSectionHeading(group.title, isGhostSection)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.itemGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div className={primaryText}>
                      <span className="font-bold">{item.name}</span>
                      {item.techStack ? (
                        <span className={`italic ${secondaryText}`}>
                          {" "}
                          | {item.techStack}
                        </span>
                      ) : null}
                    </div>
                    {item.date && (
                      <span
                        className={`shrink-0 ${secondaryText}`}
                        style={{
                          fontSize: `${isClassic ? effectiveBodyPt : subBodyPt}pt`,
                        }}
                      >
                        {item.date}
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <div
                      className={`${isGhostSection ? "text-[#A1A1AA]" : "text-[#3F3F46]"} italic underline underline-offset-[3px] decoration-[0.75px]`}
                      style={{ fontSize: `${subBodyPt}pt` }}
                    >
                      {item.url}
                    </div>
                  )}
                  {item.bullets.filter((b) => b.isVisible && b.text.trim()).length > 0 && (
                    <ul
                      className="list-disc pl-5 mt-1 flex flex-col"
                      style={{
                        gap: `${density.bulletGapPt}pt`,
                        fontSize: `${isClassic ? subBodyPt : effectiveBodyPt}pt`,
                      }}
                    >
                      {item.bullets
                        .filter((b) => b.isVisible && b.text.trim())
                        .map((b) => (
                          <li key={b.id} className={secondaryText}>
                            {normalizeParagraphText(b.text)}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "skills": {
        const group = sections.skills;
        const realItems = group.items.filter(
          (it) => it.isVisible && isNonEmptySkillItem(it)
        );
        const isGhostSection = realItems.length === 0 && Boolean(ghost);
        const visibleItems = isGhostSection && ghost ? ghost.skills : realItems;
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section
            key={key}
            style={{ marginBottom: `${density.sectionGapPt}pt` }}
            className={isGhostSection ? "select-none" : undefined}
          >
            {renderSectionHeading(group.title, isGhostSection)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.bulletGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={isGhostSection ? "text-[#A1A1AA]" : "text-[#18181B]"}
                >
                  {item.category ? (
                    <span className="font-bold">{item.category}: </span>
                  ) : null}
                  <span>{item.skills}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "certifications": {
        const group = sections.certifications;
        const visibleItems = group.items.filter(
          (it) => it.isVisible && isNonEmptyCertificationItem(it)
        );
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.bulletGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between gap-4">
                  <span>
                    <span className="font-bold">{item.name}</span>
                    {item.issuer ? ` — ${item.issuer}` : ""}
                  </span>
                  {item.date && (
                    <span
                      className="shrink-0 text-[#18181B]"
                      style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                    >
                      {item.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "awards": {
        const group = sections.awards;
        const visibleItems = group.items.filter(
          (it) => it.isVisible && isNonEmptyAwardItem(it)
        );
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.bulletGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between gap-4">
                  <span>
                    <span className="font-bold">{item.title}</span>
                    {item.issuer ? ` — ${item.issuer}` : ""}
                  </span>
                  {item.date && (
                    <span
                      className="shrink-0 text-[#18181B]"
                      style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                    >
                      {item.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "languages": {
        const group = sections.languages;
        const visibleItems = group.items.filter(
          (it) => it.isVisible && isNonEmptyLanguageItem(it)
        );
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div className={`text-[#18181B] ${listIndentClass}`}>
              {visibleItems
                .map((item) =>
                  item.proficiency
                    ? `${item.language} (${item.proficiency})`
                    : item.language
                )
                .join(" · ")}
            </div>
          </section>
        );
      }
    }
  };

  return (
    <article
      style={{
        width: `${paper.widthPx}px`,
        minHeight: `${paper.heightPx}px`,
        padding: `${density.paddingYPt}pt ${density.paddingXPt}pt`,
        fontFamily,
        fontSize: `${effectiveBodyPt}pt`,
        lineHeight: density.lineHeight,
      }}
      className={`bg-white box-border ${
        isClassic ? "text-[#000000] subpixel-antialiased" : "text-[#09090B]"
      }`}
    >
      {/* Header */}
      <header
        style={{ marginBottom: `${density.sectionGapPt}pt` }}
        className={isModern || isExecutive ? "text-left" : "text-center"}
      >
        <h1
          style={{
            fontSize: `${density.nameSizePt + (isClassic ? 2 : 0)}pt`,
            lineHeight: 1.18,
          }}
          className={`font-bold ${
            basics.fullName.trim()
              ? "text-[#000000]"
              : "text-[#A1A1AA] select-none"
          } ${isClassic ? "tracking-normal" : "tracking-wide uppercase"}`}
        >
          {basics.fullName.trim() || ghost?.fullName || "Nama Lengkap"}
        </h1>
        {isExecutive && (basics.headline?.trim() || ghost?.headline) && (
          <p
            style={{ fontSize: `${subBodyPt + 0.5}pt` }}
            className={`mt-0.5 font-medium ${
              basics.headline?.trim()
                ? "text-[#52525B]"
                : "text-[#A1A1AA] select-none"
            }`}
          >
            {basics.headline?.trim() || ghost?.headline}
          </p>
        )}
        {(contactItems.length > 0 || Boolean(ghost)) && (
          <p
            style={{ fontSize: `${subBodyPt}pt` }}
            className={`mt-1 leading-relaxed ${
              contactItems.length > 0
                ? "text-[#18181B]"
                : "text-[#A1A1AA] select-none"
            }`}
          >
            {(contactItems.length > 0
              ? contactItems
              : ghost?.contactItems ?? []
            ).map((part, idx) => (
              <span key={idx}>
                {idx > 0 ? (isClassic ? "  |  " : "  •  ") : ""}
                <span
                  className={
                    isClassic && (part.includes("@") || part.includes("."))
                      ? "underline underline-offset-[3px] decoration-[0.75px]"
                      : ""
                  }
                >
                  {part}
                </span>
              </span>
            ))}
          </p>
        )}
      </header>

      {/* Sections in user-defined order */}
      <div>{config.sectionOrder.map((key) => renderSection(key))}</div>
    </article>
  );
}
