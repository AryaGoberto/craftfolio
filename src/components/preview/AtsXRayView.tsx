"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
  const fallbackText = useMemo(() => extractLinearResumeText(doc), [doc]);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [source, setSource] = useState<"pdf" | "fallback">("fallback");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsExtracting(true);
      try {
        const [{ pdf }, { ResumePdfDocument }, { extractTextFromPdfBuffer }] =
          await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/pdf/PdfDocument"),
            import("@/lib/pdf-text-extractor"),
          ]);

        if (cancelled) return;
        const blob = await pdf(<ResumePdfDocument doc={doc} />).toBlob();
        if (cancelled) return;

        const buffer = await blob.arrayBuffer();
        const extracted = await extractTextFromPdfBuffer(buffer);
        if (cancelled) return;

        setPdfText(extracted.fullText);
        setPdfPageCount(extracted.pageCount);
        setSource("pdf");
      } catch (err) {
        console.warn("PDF X-Ray extraction failed, falling back to linear simulation:", err);
        if (!cancelled) {
          setPdfText(null);
          setPdfPageCount(null);
          setSource("fallback");
        }
      } finally {
        if (!cancelled) {
          setIsExtracting(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [doc]);

  const displayedText = source === "pdf" && pdfText ? pdfText : fallbackText;

  return (
    <div className="w-full max-w-[794px] bg-white border border-[#E4E4E7] rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#F4F4F5]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#09090B]">
            ATS X-Ray — Ekstraksi Teks Linear PDF
          </h3>
          <p className="text-[11px] text-[#52525B] mt-0.5">
            {source === "pdf"
              ? "Teks berikut diekstrak langsung dari file biner PDF hasil render sebagaimana dibaca parser ATS."
              : "Menampilkan simulasi urutan teks linear dari atas ke bawah sebagaimana dibaca parser ATS."}
          </p>
        </div>
        {isExtracting ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded bg-[#F4F4F5] text-[#52525B] shrink-0">
            <Loader2 className="w-3 h-3 animate-spin" />
            Mengekstrak PDF...
          </span>
        ) : source === "pdf" && pdfPageCount !== null ? (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#ECFDF5] text-[#10B981] shrink-0">
            PDF Binary Parsed · {pdfPageCount} Halaman
          </span>
        ) : (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F4F4F5] text-[#52525B] shrink-0">
            Linear Simulation
          </span>
        )}
      </div>
      <pre className="text-[12px] leading-relaxed font-mono text-[#18181B] whitespace-pre-wrap break-words bg-[#FAFAFA] border border-[#E4E4E7] rounded-md p-4">
        {displayedText}
      </pre>
    </div>
  );
}
