"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";
import {
  DENSITY_TOKENS,
  PDF_FONT_FAMILIES,
} from "@/lib/template-tokens";

export function ResumePdfDocument({ doc }: { doc: ResumeDocument }) {
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
      fontSize: density.nameSizePt,
      fontWeight: "bold",
      textTransform: isClassic ? "none" : "uppercase",
      marginBottom: 3,
    },
    headline: {
      fontSize: bodySize + 0.5,
      color: "#52525B",
      marginBottom: 2,
    },
    contact: {
      fontSize: bodySize - 0.5,
      color: "#18181B",
    },
    section: {
      marginBottom: density.sectionGapPt,
    },
    sectionHeading: {
      fontSize: density.headingSizePt,
      fontWeight: isClassic ? "normal" : "bold",
      textTransform: "uppercase",
      borderBottomWidth: 0.75,
      borderBottomColor: isModern ? "#D4D4D8" : "#18181B",
      paddingBottom: 2,
      marginBottom: 5,
    },
    itemBlock: {
      marginBottom: density.itemGapPt,
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
  const contactParts = [
    basics.phone?.trim(),
    basics.email?.trim(),
    ...visibleLinks.map((l) => l.url.trim()),
    ...(isClassic ? [] : [basics.location?.trim()]),
  ].filter(Boolean);

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
      if (!custom || !custom.isVisible) return null;
      const items = custom.items.filter((i) => i.isVisible);
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
              {item.bullets
                .filter((b) => b.isVisible && b.text.trim())
                .map((b) => (
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
        const items = g.items.filter((i) => i.isVisible);
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
                {item.bullets
                  .filter((b) => b.isVisible && b.text.trim())
                  .map((b) => (
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
        const items = g.items.filter((i) => i.isVisible);
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
              </View>
            ))}
          </View>
        );
      }

      case "projects": {
        const g = sections.projects;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionHeading}>{g.title}</Text>
            {items.map((item) => (
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
                {item.url ? (
                  <Text style={styles.italicSubText}>{item.url}</Text>
                ) : null}
                {item.bullets
                  .filter((b) => b.isVisible && b.text.trim())
                  .map((b) => (
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

      case "skills": {
        const g = sections.skills;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionHeading}>{g.title}</Text>
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
        );
      }

      case "certifications": {
        const g = sections.certifications;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionHeading}>{g.title}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.rowBetween}>
                <Text>
                  <Text style={styles.boldTitle}>{item.name}</Text>
                  {item.issuer ? ` — ${item.issuer}` : ""}
                </Text>
                {item.date ? <Text style={styles.dateText}>{item.date}</Text> : null}
              </View>
            ))}
          </View>
        );
      }

      case "awards": {
        const g = sections.awards;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionHeading}>{g.title}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.rowBetween}>
                <Text>
                  <Text style={styles.boldTitle}>{item.title}</Text>
                  {item.issuer ? ` — ${item.issuer}` : ""}
                </Text>
                {item.date ? <Text style={styles.dateText}>{item.date}</Text> : null}
              </View>
            ))}
          </View>
        );
      }

      case "languages": {
        const g = sections.languages;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return null;
        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionHeading}>{g.title}</Text>
            <Text>
              {items
                .map((i) =>
                  i.proficiency ? `${i.language} (${i.proficiency})` : i.language
                )
                .join(" · ")}
            </Text>
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
          {contactParts.length > 0 ? (
            <Text style={styles.contact}>
              {contactParts.join(isClassic ? "  |  " : "  •  ")}
            </Text>
          ) : null}
        </View>
        {config.sectionOrder.map((key) => renderSection(key))}
      </Page>
    </Document>
  );
}
