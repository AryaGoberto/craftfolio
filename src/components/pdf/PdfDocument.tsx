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
} from "@/lib/resume-item-utils";
import { normalizeUrl, toMailtoHref } from "@/lib/url-utils";

interface ContactEntry {
  text: string;
  href?: string;
}

export function ResumePdfDocument({ doc }: { doc: ResumeDocument }) {
  registerPdfFonts();

  const { basics, sections, config } = doc;
  const density = DENSITY_TOKENS[config.density];
  const fontFamily = PDF_FONT_FAMILIES[config.fontFamily];
  const isClassic = config.templateId === "classic-latex";
  const isCompact = config.templateId === "compact";
  const isModern = config.templateId === "modern-minimal";
  const isExecutive = config.templateId === "executive";

  const bodySize = isCompact
    ? Math.max(9, density.bodySizePt - 0.5)
    : density.bodySizePt;

  const styles = StyleSheet.create({
    page: {
      paddingTop: density.paddingYPt,
      paddingBottom: density.paddingYPt,
      paddingLeft: density.paddingXPt,
      paddingRight: density.paddingXPt,
      fontFamily,
      fontSize: bodySize,
      lineHeight: density.lineHeight,
      color: "#09090B",
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
      marginBottom: 2,
    },
    headline: {
      fontSize: bodySize + 0.5,
      lineHeight: 1.3,
      color: "#52525B",
      marginBottom: 2,
    },
    contact: {
      fontSize: bodySize - 0.5,
      lineHeight: 1.3,
      color: "#18181B",
    },
    link: {
      color: "#18181B",
      textDecoration: isClassic ? "underline" : "none",
    },
    inlineLink: {
      color: "#18181B",
      textDecoration: "underline",
    },
    section: {
      marginBottom: density.sectionGapPt,
    },
    sectionHeading: {
      fontSize: density.headingSizePt,
      lineHeight: 1.3,
      fontWeight: isClassic ? "normal" : "bold",
      textTransform: "uppercase",
      borderBottomWidth: 0.75,
      borderBottomColor: isModern ? "#D4D4D8" : "#18181B",
      paddingBottom: 2,
      marginBottom: 5,
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
      fontWeight: "bold",
    },
    dateText: {
      fontSize: bodySize - 0.5,
      color: "#18181B",
    },
    italicSubText: {
      fontSize: bodySize - 0.5,
      fontStyle: "italic",
      color: "#18181B",
      marginBottom: 2,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: density.bulletGapPt,
      paddingLeft: 10,
    },
    bulletDot: {
      width: 10,
    },
    bulletText: {
      flex: 1,
    },
  });

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
      if (!basics.summary.isVisible || !basics.summary.text.trim()) return null;
      return (
        <View key={key} style={styles.section}>
          {!isClassic ? (
            <Text style={styles.sectionHeading}>
              {doc.language === "id" ? "Ringkasan Profesional" : "Summary"}
            </Text>
          ) : null}
          <Text>{basics.summary.text}</Text>
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
          <Text style={styles.sectionHeading}>{custom.title}</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.boldTitle}>{item.title}</Text>
                {item.date ? <Text style={styles.dateText}>{item.date}</Text> : null}
              </View>
              {item.subtitle ? (
                <Text style={styles.italicSubText}>{item.subtitle}</Text>
              ) : null}
              {getVisibleNonEmptyBullets(item.bullets).map((b) => (
                <View key={b.id} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{b.text}</Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <View style={styles.rowBetween}>
                  <Text style={styles.boldTitle}>
                    {isClassic
                      ? item.position || item.company
                      : [item.company, item.position].filter(Boolean).join(" — ")}
                  </Text>
                  <Text style={styles.dateText}>
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
                    <Text style={styles.bulletText}>{b.text}</Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <View style={styles.rowBetween}>
                  <Text style={styles.boldTitle}>{item.institution}</Text>
                  {item.location ? (
                    <Text style={styles.dateText}>{item.location}</Text>
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
                    <Text style={styles.bulletText}>{b.text}</Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
            {items.map((item) => {
              const projectHref = item.url ? normalizeUrl(item.url) : "";
              return (
                <View key={item.id} style={styles.itemBlock}>
                  <View style={styles.rowBetween}>
                    <Text>
                      <Text style={styles.boldTitle}>{item.name}</Text>
                      {item.techStack ? ` | ${item.techStack}` : ""}
                    </Text>
                    {item.date ? (
                      <Text style={styles.dateText}>{item.date}</Text>
                    ) : null}
                  </View>
                  {projectHref ? (
                    <Link
                      src={projectHref}
                      style={[styles.italicSubText, styles.inlineLink]}
                    >
                      {item.url?.trim()}
                    </Link>
                  ) : null}
                  {getVisibleNonEmptyBullets(item.bullets).map((b) => (
                    <View key={b.id} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{b.text}</Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
            <View style={styles.indentedList}>
              {items.map((item) => (
                <View key={item.id} style={{ marginBottom: density.bulletGapPt }}>
                  <Text>
                    {item.category ? (
                      <Text style={styles.boldTitle}>{item.category}: </Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
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
                    <Text>
                      {certHref ? (
                        <Link
                          src={certHref}
                          style={[styles.boldTitle, styles.inlineLink]}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <Text style={styles.boldTitle}>{item.name}</Text>
                      )}
                      {item.issuer ? ` — ${item.issuer}` : ""}
                    </Text>
                    {item.date ? (
                      <Text style={styles.dateText}>{item.date}</Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
            <View style={styles.indentedList}>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.rowBetween,
                    { marginBottom: density.bulletGapPt },
                  ]}
                >
                  <Text>
                    <Text style={styles.boldTitle}>{item.title}</Text>
                    {item.issuer ? ` — ${item.issuer}` : ""}
                  </Text>
                  {item.date ? (
                    <Text style={styles.dateText}>{item.date}</Text>
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
            <Text style={styles.sectionHeading}>{g.title}</Text>
            <View style={styles.indentedList}>
              <Text>
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
      title={doc.title || `${basics.fullName || "CV"} - FormaCV`}
      author={basics.fullName || "FormaCV User"}
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
            <Text style={styles.contact}>
              {contactEntries.map((entry, idx) => (
                <Text key={`${entry.text}-${idx}`}>
                  {idx > 0 ? (isClassic ? "  |  " : "  •  ") : ""}
                  {entry.href ? (
                    <Link src={entry.href} style={styles.link}>
                      {entry.text}
                    </Link>
                  ) : (
                    entry.text
                  )}
                </Text>
              ))}
            </Text>
          ) : null}
        </View>
        {config.sectionOrder.map((key) => renderSection(key))}
      </Page>
    </Document>
  );
}
