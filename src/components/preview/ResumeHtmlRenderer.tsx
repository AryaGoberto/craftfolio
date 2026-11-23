"use client";

import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";
import {
  DENSITY_TOKENS,
  HTML_FONT_FAMILIES,
  PAPER_DIMENSIONS,
} from "@/lib/template-tokens";

interface ResumeHtmlRendererProps {
  doc: ResumeDocument;
}

export function ResumeHtmlRenderer({ doc }: ResumeHtmlRendererProps) {
  const { basics, sections, config } = doc;
  const density = DENSITY_TOKENS[config.density];
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const fontFamily = HTML_FONT_FAMILIES[config.fontFamily];

  const isClassic = config.templateId === "classic-latex";
  const isExecutive = config.templateId === "executive";
  const isModern = config.templateId === "modern-minimal";
  const isCompact = config.templateId === "compact";

  const effectiveBodyPt = isCompact
    ? Math.max(9, density.bodySizePt - 0.5)
    : density.bodySizePt;

  const visibleLinks = basics.links.filter(
    (l) => l.isVisible && l.url.trim().length > 0
  );

  const contactItems = [
    basics.phone?.trim(),
    basics.email?.trim(),
    ...visibleLinks.map((l) => l.url.trim()),
    ...(isClassic ? [] : [basics.location?.trim()]),
  ].filter((v): v is string => Boolean(v));

  const renderSectionHeading = (title: string) => (
    <h2
      style={{
        fontSize: `${density.headingSizePt + (isClassic ? 1 : 0)}pt`,
        fontVariant: isClassic ? "small-caps" : "normal",
        letterSpacing: isClassic ? "0.02em" : isModern ? "0.04em" : "0.06em",
        borderBottom: isModern ? "1px solid #D4D4D8" : "0.75pt solid #000000",
        paddingBottom: "1pt",
        marginBottom: "4pt",
      }}
      className={`${
        isClassic ? "font-normal capitalize" : "font-bold uppercase"
      } text-[#000000]`}
    >
      {isClassic ? title.toLowerCase() : title}
    </h2>
  );

  const listIndentClass = isClassic ? "pl-[11pt]" : "";

  const renderSection = (key: SectionKey) => {
    if (key === "summary") {
      if (!basics.summary.isVisible || !basics.summary.text.trim()) return null;
      return (
        <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
          {!isClassic &&
            renderSectionHeading(
              doc.language === "id" ? "Ringkasan Profesional" : "Summary"
            )}
          <p className="text-[#18181B] whitespace-pre-line text-justify">
            {basics.summary.text}
          </p>
        </section>
      );
    }

    if (key.startsWith("custom:")) {
      const customId = key.replace("custom:", "");
      const custom = sections.customSections.find((cs) => cs.id === customId);
      if (!custom || !custom.isVisible) return null;
      const visibleItems = custom.items.filter((it) => it.isVisible);
      if (visibleItems.length === 0) return null;

      return (
        <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
          {renderSectionHeading(custom.title)}
          <div className="flex flex-col" style={{ gap: `${density.itemGapPt}pt` }}>
            {visibleItems.map((item) => (
              <div key={item.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-bold text-[#09090B]">{item.title}</div>
                  {item.date ? (
                    <span
                      className="shrink-0 text-[#18181B]"
                      style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                    >
                      {item.date}
                    </span>
                  ) : null}
                </div>
                {item.subtitle ? (
                  <div
                    className="italic text-[#18181B]"
                    style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                  >
                    {item.subtitle}
                  </div>
                ) : null}
                {item.bullets.filter((b) => b.isVisible && b.text.trim()).length > 0 && (
                  <ul
                    className="list-disc pl-5 mt-1 flex flex-col"
                    style={{ gap: `${density.bulletGapPt}pt` }}
                  >
                    {item.bullets
                      .filter((b) => b.isVisible && b.text.trim())
                      .map((b) => (
                        <li key={b.id} className="text-[#18181B]">
                          {b.text}
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

    switch (key) {
      case "experience":
      case "volunteering": {
        const group = sections[key];
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.itemGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id}>
                  {/* Line 1: Bold Role/Position (left) + Dates (right) */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-bold text-[#09090B]">
                      {isClassic
                        ? item.position || item.company
                        : [item.company, item.position].filter(Boolean).join(" — ")}
                    </div>
                    {(item.startDate || item.endDate) && (
                      <span
                        className="shrink-0 text-[#18181B]"
                        style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                      >
                        {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                      </span>
                    )}
                  </div>
                  {/* Line 2: Italic Company - Location */}
                  {(isClassic ? item.company || item.location : item.location) && (
                    <div
                      className="text-[#18181B] italic"
                      style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                    >
                      {isClassic
                        ? [item.company, item.location].filter(Boolean).join(" - ")
                        : item.location}
                    </div>
                  )}
                  {item.bullets.filter((b) => b.isVisible && b.text.trim()).length > 0 && (
                    <ul
                      className="list-disc pl-5 mt-1 flex flex-col"
                      style={{ gap: `${density.bulletGapPt}pt` }}
                    >
                      {item.bullets
                        .filter((b) => b.isVisible && b.text.trim())
                        .map((b) => (
                          <li key={b.id} className="text-[#18181B]">
                            {b.text}
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
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.itemGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id}>
                  {/* Line 1: Bold Institution (left) + Location (right) */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-bold text-[#09090B]">
                      {item.institution}
                    </div>
                    {item.location && (
                      <span
                        className="shrink-0 text-[#18181B]"
                        style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                      >
                        {item.location}
                      </span>
                    )}
                  </div>
                  {/* Line 2: Italic Degree + GPA (left) + Italic Dates (right) */}
                  <div
                    className="flex items-baseline justify-between gap-4 italic text-[#18181B]"
                    style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
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
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.itemGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-[#09090B]">
                      <span className="font-bold">{item.name}</span>
                      {item.techStack ? (
                        <span className="italic text-[#18181B]">
                          {" "}
                          | {item.techStack}
                        </span>
                      ) : null}
                    </div>
                    {item.date && (
                      <span
                        className="shrink-0 text-[#18181B]"
                        style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                      >
                        {item.date}
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <div
                      className="text-[#3F3F46] italic"
                      style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
                    >
                      {item.url}
                    </div>
                  )}
                  {item.bullets.filter((b) => b.isVisible && b.text.trim()).length > 0 && (
                    <ul
                      className="list-disc pl-5 mt-1 flex flex-col"
                      style={{ gap: `${density.bulletGapPt}pt` }}
                    >
                      {item.bullets
                        .filter((b) => b.isVisible && b.text.trim())
                        .map((b) => (
                          <li key={b.id} className="text-[#18181B]">
                            {b.text}
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
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div
              className={`flex flex-col ${listIndentClass}`}
              style={{ gap: `${density.bulletGapPt}pt` }}
            >
              {visibleItems.map((item) => (
                <div key={item.id} className="text-[#18181B]">
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
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div className="flex flex-col" style={{ gap: `${density.bulletGapPt}pt` }}>
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
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div className="flex flex-col" style={{ gap: `${density.bulletGapPt}pt` }}>
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
        const visibleItems = group.items.filter((it) => it.isVisible);
        if (!group.isVisible || visibleItems.length === 0) return null;
        return (
          <section key={key} style={{ marginBottom: `${density.sectionGapPt}pt` }}>
            {renderSectionHeading(group.title)}
            <div className="text-[#18181B]">
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
      className="bg-white text-[#09090B] box-border"
    >
      {/* Header */}
      <header
        style={{ marginBottom: `${density.sectionGapPt}pt` }}
        className={isModern || isExecutive ? "text-left" : "text-center"}
      >
        <h1
          style={{
            fontSize: `${density.nameSizePt + (isClassic ? 2 : 0)}pt`,
            fontVariant: isClassic ? "small-caps" : "normal",
            lineHeight: 1.15,
          }}
          className={`font-bold text-[#000000] ${
            isClassic ? "tracking-normal" : "tracking-wide uppercase"
          }`}
        >
          {basics.fullName.trim() || "Nama Lengkap"}
        </h1>
        {basics.headline?.trim() && isExecutive && (
          <p
            style={{ fontSize: `${effectiveBodyPt + 0.5}pt` }}
            className="text-[#52525B] mt-0.5 font-medium"
          >
            {basics.headline}
          </p>
        )}
        {contactItems.length > 0 && (
          <p
            style={{ fontSize: `${effectiveBodyPt - 0.5}pt` }}
            className="text-[#18181B] mt-1"
          >
            {contactItems.map((part, idx) => (
              <span key={idx}>
                {idx > 0 ? (isClassic ? "  |  " : "  •  ") : ""}
                <span
                  className={
                    isClassic && (part.includes("@") || part.includes("."))
                      ? "underline underline-offset-2"
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
