"use client";

import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";

export function extractLinearResumeText(doc: ResumeDocument): string {
  const lines: string[] = [];
  const { basics, sections, config } = doc;

  lines.push(basics.fullName.trim() || "[NAMA LENGKAP]");
  if (basics.headline?.trim()) lines.push(basics.headline.trim());

  const contact = [
    basics.location,
    basics.email,
    basics.phone,
    ...basics.links.filter((l) => l.isVisible && l.url).map((l) => l.url),
  ]
    .filter(Boolean)
    .join(" | ");
  if (contact) lines.push(contact);
  lines.push("");

  const pushSection = (key: SectionKey) => {
    if (key === "summary") {
      if (basics.summary.isVisible && basics.summary.text.trim()) {
        lines.push(
          doc.language === "id" ? "RINGKASAN PROFESIONAL" : "SUMMARY"
        );
        lines.push(basics.summary.text.trim());
        lines.push("");
      }
      return;
    }

    if (key.startsWith("custom:")) {
      const id = key.replace("custom:", "");
      const custom = sections.customSections.find((cs) => cs.id === id);
      if (!custom || !custom.isVisible) return;
      const items = custom.items.filter((i) => i.isVisible);
      if (items.length === 0) return;
      lines.push(custom.title.toUpperCase());
      for (const item of items) {
        lines.push(
          [item.title, item.subtitle, item.date].filter(Boolean).join(" | ")
        );
        for (const b of item.bullets.filter((x) => x.isVisible && x.text)) {
          lines.push(`- ${b.text}`);
        }
      }
      lines.push("");
      return;
    }

    switch (key) {
      case "experience":
      case "volunteering": {
        const g = sections[key];
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        for (const item of items) {
          lines.push(
            `${item.company} - ${item.position} (${item.startDate} - ${item.endDate})`
          );
          for (const b of item.bullets.filter((x) => x.isVisible && x.text)) {
            lines.push(`- ${b.text}`);
          }
        }
        lines.push("");
        break;
      }
      case "education": {
        const g = sections.education;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        for (const item of items) {
          lines.push(
            `${item.institution} - ${item.degree} (${item.startDate} - ${item.endDate})`
          );
          if (item.gpa) lines.push(`GPA: ${item.gpa}`);
        }
        lines.push("");
        break;
      }
      case "projects": {
        const g = sections.projects;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        for (const item of items) {
          lines.push(
            [item.name, item.techStack, item.date].filter(Boolean).join(" | ")
          );
          for (const b of item.bullets.filter((x) => x.isVisible && x.text)) {
            lines.push(`- ${b.text}`);
          }
        }
        lines.push("");
        break;
      }
      case "skills": {
        const g = sections.skills;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        for (const item of items) {
          lines.push(`${item.category}: ${item.skills}`);
        }
        lines.push("");
        break;
      }
      case "certifications": {
        const g = sections.certifications;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        for (const item of items) {
          lines.push(
            [item.name, item.issuer, item.date].filter(Boolean).join(" | ")
          );
        }
        lines.push("");
        break;
      }
      case "awards": {
        const g = sections.awards;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        for (const item of items) {
          lines.push(
            [item.title, item.issuer, item.date].filter(Boolean).join(" | ")
          );
        }
        lines.push("");
        break;
      }
      case "languages": {
        const g = sections.languages;
        const items = g.items.filter((i) => i.isVisible);
        if (!g.isVisible || items.length === 0) return;
        lines.push(g.title.toUpperCase());
        lines.push(
          items
            .map((i) =>
              i.proficiency ? `${i.language} (${i.proficiency})` : i.language
            )
            .join(", ")
        );
        lines.push("");
        break;
      }
    }
  };

  config.sectionOrder.forEach(pushSection);
  return lines.join("\n").trim();
}

export function AtsXRayView({ doc }: { doc: ResumeDocument }) {
  const rawText = extractLinearResumeText(doc);

  return (
    <div className="w-full max-w-[794px] bg-white border border-[#E4E4E7] rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F4F4F5]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#09090B]">
            ATS X-Ray — Simulasi Urutan Pembacaan Teks
          </h3>
          <p className="text-[11px] text-[#52525B] mt-0.5">
            Menampilkan urutan teks linear dari atas ke bawah sebagaimana dibaca oleh parser ATS.
          </p>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#ECFDF5] text-[#10B981]">
          Linear Order
        </span>
      </div>
      <pre className="text-[12px] leading-relaxed font-mono text-[#18181B] whitespace-pre-wrap break-words bg-[#FAFAFA] border border-[#E4E4E7] rounded-md p-4">
        {rawText}
      </pre>
    </div>
  );
}
