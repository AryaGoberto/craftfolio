"use client";

import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";
import { registerPdfFonts } from "@/lib/pdf-fonts";
import {
  DENSITY_TOKENS,
  PDF_FONT_FAMILIES,
} from "@/lib/template-tokens";
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

interface ContactEntry {
  text: string;
  href?: string;
}

interface SmallCapsRun {
  text: string;
  isSmall: boolean;
}

function splitIntoSmallCapsRuns(rawTitle: string): SmallCapsRun[] {
  const normalized = normalizeSmallCapsTitle(rawTitle);
  const runs: SmallCapsRun[] = [];
  const regex = /([a-zà-öø-ÿ]+)|([^a-zà-öø-ÿ]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match[1]) {
      runs.push({ text: match[1].toUpperCase(), isSmall: true });
    } else if (match[2]) {
      runs.push({ text: match[2], isSmall: false });
    }
  }
  return runs;
}

export function ResumePdfDocument({ doc }: { doc: ResumeDocument }) {
  registerPdfFonts(doc.config.fontFamily);

  const { basics, sections, config } = doc;
  const density = DENSITY_TOKENS[config.density];
  const fontFamily = PDF_FONT_FAMILIES[config.fontFamily];
  const isClassic = config.templateId === "classic-latex";
  const isCompact = config.templateId === "compact";
  const isModern = config.templateId === "modern-minimal";
  const isExecutive = config.templateId === "executive";

  const bodySize = isCompact
    ? Math.max(9.5, Number((density.bodySizePt - 0.8).toFixed(2)))
    : density.bodySizePt;
  const subSize = Math.max(9, Number((bodySize - 0.9).toFixed(2)));
  const smallCapsInnerSize = Number((density.headingSizePt * 0.78).toFixed(2));

  const inkColor = isClassic ? "#000000" : "#09090B";
  const subInkColor = isClassic ? "#000000" : "#18181B";

  const styles = StyleSheet.create({
    page: {
      paddingTop: density.paddingYPt,
      paddingBottom: density.paddingYPt,
      paddingLeft: density.paddingXPt,
      paddingRight: density.paddingXPt,
      fontFamily,
      fontSize: bodySize,
      lineHeight: density.lineHeight,
      color: inkColor,
      backgroundColor: "#FFFFFF",
    },
    header: {
      marginBottom: density.sectionGapPt,
      textAlign: isModern || isExecutive ? "left" : "center",
    },
    name: {
      fontSize: density.nameSizePt + (isClassic ? 2 : 0),
      lineHeight: 1.2,
      fontWeight: "bold",
      textTransform: isClassic ? "none" : "uppercase",
      color: inkColor,
      marginBottom: 3,
    },
    headline: {
      fontSize: subSize + 0.5,
      lineHeight: 1.3,
      color: "#52525B",
      marginBottom: 2,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: isModern || isExecutive ? "flex-start" : "center",
      alignItems: "center",
      rowGap: 2,
    },
    contactItemText: {
      fontSize: subSize,
      lineHeight: 1.25,
      color: subInkColor,
    },
    contactSeparator: {
      fontSize: subSize,
      lineHeight: 1.25,
      color: subInkColor,
      marginHorizontal: isClassic ? 4.5 : 5,
    },
    contactLinkWrap: isClassic
      ? {
          borderBottomWidth: 0.6,
          borderBottomColor: "#000000",
          paddingBottom: 1.6,
        }
      : {},
    link: {
      fontSize: subSize,
      lineHeight: 1.25,
      color: subInkColor,
      textDecoration: "none",
    },
    inlineLinkWrap: {
      alignSelf: "flex-start",
      borderBottomWidth: 0.6,
      borderBottomColor: subInkColor,
      paddingBottom: 1.2,
      marginBottom: 2,
    },
    inlineLink: {
      fontSize: subSize,
      fontStyle: "italic",
      color: subInkColor,
      textDecoration: "none",
    },
    summaryParagraph: {
      width: "100%",
      fontSize: bodySize,
      lineHeight: density.lineHeight,
      textAlign: "justify",
      color: inkColor,
    },
    section: {
      width: "100%",
      marginBottom: density.sectionGapPt,
    },
    sectionHeading: {
      fontSize: density.headingSizePt,
      lineHeight: 1.25,
      fontWeight: isClassic ? "normal" : "bold",
      textTransform: isClassic ? "none" : "uppercase",
      borderBottomWidth: 0.6,
      borderBottomColor: isModern ? "#D4D4D8" : "#000000",
      paddingBottom: 1.5,
      marginBottom: 5,
    },
    sectionHeadingSmallCaps: {
      fontSize: smallCapsInnerSize,
      letterSpacing: 0.3,
    },
    indentedList: {
      paddingLeft: isClassic ? 11 : 0,
    },
    itemBlock: {
      marginBottom: density.itemGapPt,
      paddingLeft: isClassic ? 11 : 0,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    boldTitle: {
      fontSize: bodySize,
      fontWeight: "bold",
    },
    primaryRightText: {
      fontSize: isClassic ? bodySize : subSize,
      color: subInkColor,
    },
    italicSubText: {
      fontSize: subSize,
      fontStyle: "italic",
      color: subInkColor,
      marginBottom: 2,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: density.bulletGapPt,
      paddingLeft: 10,
    },
    bulletDot: {
      width: 9,
      fontSize: isClassic ? 7 : subSize,
      paddingTop: isClassic ? 1.5 : 0,
    },
    bulletText: {
      flex: 1,
      fontSize: isClassic ? subSize : bodySize,
      lineHeight: density.lineHeight,
    },
    compactSkillText: {
      fontSize: isClassic ? subSize : bodySize,
      lineHeight: density.lineHeight,
    },
  });

  const renderHeading = (rawTitle: string) => {
    if (!isClassic) {
      return <Text style={styles.sectionHeading}>{rawTitle}</Text>;
    }
    const runs = splitIntoSmallCapsRuns(rawTitle);
    return (
      <Text style={styles.sectionHeading}>
        {runs.map((run, idx) =>
          run.isSmall ? (
            <Text key={idx} style={styles.sectionHeadingSmallCaps}>
              {run.text}
            </Text>
          ) : (
            <Text key={idx}>{run.text}</Text>
          )
        )}
      </Text>
    );
  };

  const visibleLinks = basics.links.filter((l) => l.isVisible && l.url.trim());
  const contactEntries: ContactEntry[] = [];
  if (basics.phone?.trim()) {
    contactEntries.push({ text: basics.phone.trim() });
  }
  if (basics.email?.trim()) {
    contactEntries.push({
      text: basics.email.trim(),
      href: toMailtoHref(basics.email),
    });
  }
  for (const link of visibleLinks) {
    const href = normalizeUrl(link.url);
    contactEntries.push({
      text: link.url.trim(),
      href: href || undefined,
    });
  }
  if (!isClassic && basics.location?.trim()) {
    contactEntries.push({ text: basics.location.trim() });
  }

  const renderSection = (key: SectionKey) => {
    if (key === "summary") {
      const normalizedSummary = normalizeParagraphText(basics.summary.text);
      if (!basics.summary.isVisible || !normalizedSummary) return null;
      const paragraphs = normalizedSummary.split("\n\n");
      return (
        <View key={key} style={styles.section}>
          {!isClassic
            ? renderHeading(
                doc.language === "id" ? "Ringkasan Profesional" : "Summary"
              )
            : null}
          {paragraphs.map((para, idx) => (
            <Text
              key={idx}
              style={[
                styles.summaryParagraph,
                idx < paragraphs.length - 1 ? { marginBottom: 4 } : {},
              ]}
            >
              {para}
            </Text>
          ))}
        </View>
      );
    }

    if (key.startsWith("custom:")) {
      const id = key.replace("custom:", "");
      const custom = sections.customSections.find((cs) => cs.id === id);
      if (!custom || !custom.isVisible || !custom.title.trim()) return null;
      const items = custom.items.filter(
        (i) => i.isVisible && isNonEmptyCustomItem(i)
      );
      if (items.length === 0) return null;
      return (
        <View key={key} style={styles.section}>
          {renderHeading(custom.title)}
          {items.map((item) => (
            <View key={item.id} style={styles.itemBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.boldTitle}>{item.title}</Text>
                {item.date ? (
                  <Text style={styles.primaryRightText}>{item.date}</Text>
                ) : null}
              </View>
              {item.subtitle ? (
                <Text style={styles.italicSubText}>{item.subtitle}</Text>
              ) : null}
              {getVisibleNonEmptyBullets(item.bullets).map((b) => (
                <View key={b.id} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    {normalizeParagraphText(b.text)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    switch (key) {
      case "experience":
      case "volunteering": {
        const g = sections[key];
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptyExperienceItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            {items.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <View style={styles.rowBetween}>
                  <Text style={styles.boldTitle}>
                    {isClassic
                      ? item.position || item.company
                      : [item.company, item.position].filter(Boolean).join(" — ")}
                  </Text>
                  <Text style={styles.primaryRightText}>
                    {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {(isClassic ? item.company || item.location : item.location) ? (
                  <Text style={styles.italicSubText}>
                    {isClassic
                      ? [item.company, item.location].filter(Boolean).join(" - ")
                      : item.location}
                  </Text>
                ) : null}
                {getVisibleNonEmptyBullets(item.bullets).map((b) => (
                  <View key={b.id} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>
                      {normalizeParagraphText(b.text)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      }

      case "education": {
        const g = sections.education;
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptyEducationItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            {items.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <View style={styles.rowBetween}>
                  <Text style={styles.boldTitle}>{item.institution}</Text>
                  {item.location ? (
                    <Text style={styles.primaryRightText}>{item.location}</Text>
                  ) : null}
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.italicSubText}>
                    {[item.degree, item.gpa ? `GPA: ${item.gpa}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Text style={styles.italicSubText}>
                    {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {getVisibleNonEmptyBullets(item.bullets).map((b) => (
                  <View key={b.id} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>
                      {normalizeParagraphText(b.text)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      }

      case "projects": {
        const g = sections.projects;
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptyProjectItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            {items.map((item) => {
              const projectHref = item.url ? normalizeUrl(item.url) : "";
              return (
                <View key={item.id} style={styles.itemBlock}>
                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: bodySize }}>
                      <Text style={styles.boldTitle}>{item.name}</Text>
                      {item.techStack ? (
                        <Text style={styles.italicSubText}>
                          {` | ${item.techStack}`}
                        </Text>
                      ) : null}
                    </Text>
                    {item.date ? (
                      <Text style={styles.primaryRightText}>{item.date}</Text>
                    ) : null}
                  </View>
                  {projectHref ? (
                    <View style={styles.inlineLinkWrap}>
                      <Link src={projectHref} style={styles.inlineLink}>
                        {item.url?.trim()}
                      </Link>
                    </View>
                  ) : null}
                  {getVisibleNonEmptyBullets(item.bullets).map((b) => (
                    <View key={b.id} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>
                        {normalizeParagraphText(b.text)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );
      }

      case "skills": {
        const g = sections.skills;
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptySkillItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            <View style={styles.indentedList}>
              {items.map((item) => (
                <View key={item.id} style={{ marginBottom: density.bulletGapPt }}>
                  <Text style={styles.compactSkillText}>
                    {item.category ? (
                      <Text style={[styles.boldTitle, { fontSize: isClassic ? subSize : bodySize }]}>
                        {item.category}:{" "}
                      </Text>
                    ) : null}
                    {item.skills}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      }

      case "certifications": {
        const g = sections.certifications;
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptyCertificationItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            <View style={styles.indentedList}>
              {items.map((item) => {
                const certHref = item.url ? normalizeUrl(item.url) : "";
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.rowBetween,
                      { marginBottom: density.bulletGapPt },
                    ]}
                  >
                    <Text style={styles.compactSkillText}>
                      {certHref ? (
                        <Link
                          src={certHref}
                          style={[
                            styles.boldTitle,
                            { fontSize: isClassic ? subSize : bodySize, textDecoration: "none" },
                          ]}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <Text
                          style={[
                            styles.boldTitle,
                            { fontSize: isClassic ? subSize : bodySize },
                          ]}
                        >
                          {item.name}
                        </Text>
                      )}
                      {item.issuer ? ` — ${item.issuer}` : ""}
                    </Text>
                    {item.date ? (
                      <Text style={styles.italicSubText}>{item.date}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        );
      }

      case "awards": {
        const g = sections.awards;
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptyAwardItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            <View style={styles.indentedList}>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.rowBetween,
                    { marginBottom: density.bulletGapPt },
                  ]}
                >
                  <Text style={styles.compactSkillText}>
                    <Text
                      style={[
                        styles.boldTitle,
                        { fontSize: isClassic ? subSize : bodySize },
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.issuer ? ` — ${item.issuer}` : ""}
                  </Text>
                  {item.date ? (
                    <Text style={styles.italicSubText}>{item.date}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        );
      }

      case "languages": {
        const g = sections.languages;
        const items = g.items.filter(
          (i) => i.isVisible && isNonEmptyLanguageItem(i)
        );
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            {renderHeading(g.title)}
            <View style={styles.indentedList}>
              <Text style={styles.compactSkillText}>
                {items
                  .map((i) =>
                    i.proficiency ? `${i.language} (${i.proficiency})` : i.language
                  )
                  .join(" · ")}
              </Text>
            </View>
          </View>
        );
      }
    }
  };

  return (
    <Document
      title={doc.title || `${basics.fullName || "CV"} - Craftfolio`}
      author={basics.fullName || "Craftfolio User"}
    >
      <Page size={config.paperSize} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {basics.fullName.trim() || "Nama Lengkap"}
          </Text>
          {basics.headline?.trim() && isExecutive ? (
            <Text style={styles.headline}>{basics.headline}</Text>
          ) : null}
          {contactEntries.length > 0 ? (
            <View style={styles.contactRow}>
              {contactEntries.map((entry, idx) => (
                <View
                  key={`${entry.text}-${idx}`}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  {idx > 0 ? (
                    <Text style={styles.contactSeparator}>
                      {isClassic ? "|" : "•"}
                    </Text>
                  ) : null}
                  {entry.href ? (
                    <View style={styles.contactLinkWrap}>
                      <Link src={entry.href} style={styles.link}>
                        {entry.text}
                      </Link>
                    </View>
                  ) : (
                    <Text style={styles.contactItemText}>{entry.text}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {config.sectionOrder.map((key) => renderSection(key))}
      </Page>
    </Document>
  );
}
