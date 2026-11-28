"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye } from "lucide-react";
import { createSampleResume } from "@/lib/default-resume";
import type { FoldyMood } from "@/lib/foldy-coach";
import { setFoldyVisibility, useFoldyPrefs } from "@/lib/foldy-prefs";
import type {
  DensityPreset,
  FontFamilyPreset,
  TemplateId,
} from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";
import { ResumeHtmlRenderer } from "@/components/preview/ResumeHtmlRenderer";
import { BrandLogo } from "@/components/BrandLogo";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { FoldyMascot } from "@/components/mascot/FoldyMascot";

interface TemplateCatalogItem {
  id: TemplateId;
  name: string;
  tagline: string;
  audience: string;
  typographyNote: string;
  recommendedFont: FontFamilyPreset;
  recommendedFontLabel: string;
  recommendedDensity: DensityPreset;
  highlights: string[];
}

const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  {
    id: "classic-latex",
    name: "Classic Academic",
    tagline: "Terinspirasi Jake's Resume (LaTeX) dengan garis tipis penuh & small-caps.",
    audience: "Mahasiswa, Fresh Graduate, Tech & Akademisi",
    typographyNote: "Computer Modern · Rata tengah · 2-baris subheading",
    recommendedFont: "serif",
    recommendedFontLabel: "Computer Modern (LaTeX)",
    recommendedDensity: "normal",
    highlights: [
      "Header small-caps & garis bawah hairline 0.75pt",
      "Format 2-baris standar LaTeX (Peran/Institusi & Tanggal)",
      "Keterbacaan tinggi untuk magang, software, & riset",
    ],
  },
  {
    id: "modern-minimal",
    name: "Modern Minimalist",
    tagline: "Tipografi sans-serif bersih dengan header rata kiri dan hierarki tegas.",
    audience: "Product, Engineering, Startup & SaaS",
    typographyNote: "Inter · Rata kiri · Pemisah halus Zinc-300",
    recommendedFont: "inter",
    recommendedFontLabel: "Inter",
    recommendedDensity: "normal",
    highlights: [
      "Header rata kiri untuk pemindaian cepat perekrut",
      "Sans-serif geometris dengan kontras keterbacaan tinggi",
      "Cocok untuk peran digital & teknologi modern",
    ],
  },
  {
    id: "compact",
    name: "Compact",
    tagline: "Dioptimalkan untuk pengalaman & proyek padat agar muat rapi dalam 1 halaman.",
    audience: "Early-Career & Experienced Professional",
    typographyNote: "Inter · Margin hemat · Spasi rapat terkendali",
    recommendedFont: "inter",
    recommendedFontLabel: "Inter",
    recommendedDensity: "compact",
    highlights: [
      "Margin & jarak antar-item efisien tanpa mengorbankan keterbacaan",
      "Memuat lebih banyak bullet pencapaian per halaman",
      "Ideal untuk melamar posisi dengan banyak proyek relevan",
    ],
  },
  {
    id: "executive",
    name: "Executive Standard",
    tagline: "Struktur formal dengan headline jabatan eksplisit dan sentuhan editorial serif.",
    audience: "Bisnis, Manajemen, Konsultan & Korporat",
    typographyNote: "Merriweather · Rata kiri · Menampilkan Headline",
    recommendedFont: "georgia",
    recommendedFontLabel: "Merriweather",
    recommendedDensity: "normal",
    highlights: [
      "Menampilkan Headline/Jabatan langsung di bawah nama",
      "Nuansa editorial formal untuk peran manajerial & bisnis",
      "Tetap satu kolom penuh & 100% selectable text",
    ],
  },
];

const TEMPLATE_FOLDY_NOTES: Record<
  TemplateId,
  { mood: FoldyMood; note: string }
> = {
  "classic-latex": {
    mood: "crafty",
    note: "Classic Academic cocok banget buat mahasiswa, fresh graduate, riset, dan software engineer ala LaTeX!",
  },
  "modern-minimal": {
    mood: "wink",
    note: "Modern Minimalist punya ritme sans-serif bersih — favorit perekrut startup, SaaS, dan product team.",
  },
  compact: {
    mood: "eureka",
    note: "Punya banyak pengalaman & proyek tapi ingin tetap 1 halaman? Compact jago memadatkan spasi tanpa sesak!",
  },
  executive: {
    mood: "happy",
    note: "Executive Standard menonjolkan headline jabatan dengan serif editorial yang berwibawa untuk peran senior.",
  },
};

const BASE_SAMPLE_RESUME = createSampleResume("2026-01-01T00:00:00.000Z");

export default function TemplatesPage() {
  const router = useRouter();
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const updateConfig = useResumeStore((s) => s.updateConfig);
  const foldyPrefs = useFoldyPrefs();
  const [hoveredTemplateId, setHoveredTemplateId] = useState<TemplateId | null>(
    null
  );

  const activeDoc = documents[activeDocumentId];
  const focusedTemplateId =
    hoveredTemplateId ??
    (hasHydrated ? activeDoc?.config.templateId : null) ??
    null;
  const foldyPreview = focusedTemplateId
    ? TEMPLATE_FOLDY_NOTES[focusedTemplateId]
    : {
        mood: "idle" as FoldyMood,
        note: "Arahkan kursor ke salah satu kartu template untuk melihat rekomendasi singkat dari Foldy.",
      };

  const handleSelectTemplate = (item: TemplateCatalogItem) => {
    updateConfig({
      templateId: item.id,
      fontFamily: item.recommendedFont,
      density: item.recommendedDensity,
    });
    router.push("/editor");
  };

  return (
    <div className="min-h-screen flex flex-col bg-ui-canvas text-ui-text">
      {/* Header */}
      <header className="h-14 px-4 sm:px-6 bg-ui-card border-b border-ui-border flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-7 w-auto shrink-0" />
            <span className="text-[14px] font-semibold tracking-[-0.01em]">
              Craftfolio
            </span>
          </Link>

          <span className="h-4 w-px bg-ui-border hidden sm:inline-block" />

          <nav className="hidden sm:flex items-center gap-1 text-[12px]">
            <Link
              href="/templates"
              className="px-2.5 py-1 rounded-md bg-ui-primary-soft text-ui-link-soft-text font-medium"
            >
              Galeri Template
            </Link>
            <Link
              href="/editor"
              className="px-2.5 py-1 rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-panel font-medium transition-colors"
            >
              Editor
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle text-[12px] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-ui-primary text-white text-[12px] font-medium hover:bg-ui-primary-hover transition-colors"
          >
            Buka Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="h-4 w-px bg-ui-border mx-0.5" aria-hidden="true" />
          <ColorSchemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-ui-card border border-ui-border text-[11px] font-medium text-ui-text-secondary mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-ui-success" />
              4 Template Terkurasi · Single-Column · Selectable Text
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ui-text">
              Galeri Template ATS
            </h1>
            <p className="text-[13.5px] sm:text-[14px] text-ui-text-secondary mt-2 leading-relaxed">
              Seluruh template dirancang satu kolom tanpa tabel tata letak atau grafik batang agar mudah dipindai perekrut maupun parser ATS. Anda dapat mengganti template kapan saja di editor tanpa kehilangan isi CV.
            </p>
          </div>

          {foldyPrefs.visibility === "hidden" ? (
            <button
              type="button"
              onClick={() => setFoldyVisibility("full")}
              className="self-start lg:self-end inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-ui-border bg-ui-card text-[11.5px] text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors shrink-0"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Tampilkan Foldy
            </button>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-ui-card border border-ui-border max-w-md shrink-0">
              <div className="w-12 h-12 rounded-lg bg-ui-panel border border-ui-divider flex items-center justify-center shrink-0">
                <FoldyMascot
                  mood={foldyPreview.mood}
                  size="sm"
                  engine="ambient"
                  interactiveClick
                  ariaLabel="Rekomendasi template dari Foldy"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ui-link">
                  Catatan Foldy
                </p>
                <p className="text-[12px] text-ui-text-secondary leading-snug mt-0.5">
                  {foldyPreview.note}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {TEMPLATE_CATALOG.map((item) => {
            const isCurrent =
              hasHydrated && activeDoc?.config.templateId === item.id;

            const previewDoc = {
              ...BASE_SAMPLE_RESUME,
              config: {
                ...BASE_SAMPLE_RESUME.config,
                templateId: item.id,
                fontFamily: item.recommendedFont,
                density: item.recommendedDensity,
                paperSize: "A4" as const,
              },
            };

            return (
              <article
                key={item.id}
                onMouseEnter={() => setHoveredTemplateId(item.id)}
                onMouseLeave={() => setHoveredTemplateId(null)}
                onFocusCapture={() => setHoveredTemplateId(item.id)}
                className="bg-ui-card border border-ui-border rounded-lg overflow-hidden flex flex-col transition-colors hover:border-ui-border-strong"
              >
                {/* Miniature Paper Preview */}
                <div className="bg-ui-panel border-b border-ui-border p-5 flex justify-center overflow-hidden">
                  <div className="w-[300px] h-[360px] bg-white border border-[#E4E4E7] shadow-md rounded-sm overflow-hidden relative pointer-events-none select-none">
                    <div
                      style={{
                        width: "794px",
                        transform: "scale(0.3778)",
                        transformOrigin: "top left",
                      }}
                    >
                      <ResumeHtmlRenderer doc={previewDoc} />
                    </div>
                  </div>
                </div>

                {/* Metadata & Action */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-[15px] font-semibold text-ui-text">
                          {item.name}
                        </h2>
                        <p className="text-[12px] text-ui-text-secondary mt-0.5">
                          {item.tagline}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ui-success-bg text-ui-success text-[10.5px] font-medium shrink-0">
                          <Check className="w-3 h-3" />
                          Aktif
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11.5px]">
                      <div className="bg-ui-panel border border-ui-divider rounded-md px-2.5 py-2">
                        <div className="text-[10.5px] font-medium uppercase tracking-wide text-ui-text-placeholder">
                          Rekomendasi
                        </div>
                        <div className="text-ui-text font-medium mt-0.5">
                          {item.audience}
                        </div>
                      </div>
                      <div className="bg-ui-panel border border-ui-divider rounded-md px-2.5 py-2">
                        <div className="text-[10.5px] font-medium uppercase tracking-wide text-ui-text-placeholder">
                          Tipografi Default
                        </div>
                        <div className="text-ui-text font-medium mt-0.5">
                          {item.typographyNote}
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-1.5 pt-1">
                      {item.highlights.map((hl) => (
                        <li
                          key={hl}
                          className="flex items-start gap-2 text-[12px] text-ui-text-secondary"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-ui-success shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-ui-divider flex items-center justify-between gap-3">
                    <span className="text-[11px] text-ui-text-secondary font-mono">
                      Font: {item.recommendedFontLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(item)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-ui-primary text-white text-[12px] font-medium hover:bg-ui-primary-hover transition-colors"
                    >
                      {isCurrent ? "Lanjut Edit Template Ini" : "Pakai Template Ini"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
