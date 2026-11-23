"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { createSampleResume } from "@/lib/default-resume";
import type {
  DensityPreset,
  FontFamilyPreset,
  TemplateId,
} from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";
import { ResumeHtmlRenderer } from "@/components/preview/ResumeHtmlRenderer";

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
    typographyNote: "EB Garamond · Rata tengah · 2-baris subheading",
    recommendedFont: "serif",
    recommendedFontLabel: "EB Garamond",
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

const BASE_SAMPLE_RESUME = createSampleResume("2026-01-01T00:00:00.000Z");

export default function TemplatesPage() {
  const router = useRouter();
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const updateConfig = useResumeStore((s) => s.updateConfig);

  const activeDoc = documents[activeDocumentId];

  const handleSelectTemplate = (item: TemplateCatalogItem) => {
    updateConfig({
      templateId: item.id,
      fontFamily: item.recommendedFont,
      density: item.recommendedDensity,
    });
    router.push("/editor");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#09090B]">
      {/* Header */}
      <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#E4E4E7] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center font-bold text-[13px]">
              F
            </div>
            <span className="text-[14px] font-semibold tracking-[-0.01em]">
              FormaCV
            </span>
          </Link>

          <span className="h-4 w-px bg-[#E4E4E7] hidden sm:inline-block" />

          <nav className="hidden sm:flex items-center gap-1 text-[12px]">
            <Link
              href="/templates"
              className="px-2.5 py-1 rounded-md bg-[#F4F4F5] text-[#09090B] font-medium"
            >
              Galeri Template
            </Link>
            <Link
              href="/editor"
              className="px-2.5 py-1 rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#FAFAFA] font-medium transition-colors"
            >
              Editor
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#E4E4E7] text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-[#18181B] text-white text-[12px] font-medium hover:bg-[#27272A] transition-colors"
          >
            Buka Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-[#E4E4E7] text-[11px] font-medium text-[#52525B] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            4 Template Terkurasi · Single-Column · Selectable Text
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]">
            Galeri Template ATS
          </h1>
          <p className="text-[13.5px] sm:text-[14px] text-[#52525B] mt-2 leading-relaxed">
            Seluruh template dirancang satu kolom tanpa tabel tata letak atau grafik batang agar mudah dipindai perekrut maupun parser ATS. Anda dapat mengganti template kapan saja di editor tanpa kehilangan isi CV.
          </p>
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
                className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden flex flex-col transition-colors hover:border-[#A1A1AA]"
              >
                {/* Miniature Paper Preview */}
                <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] p-5 flex justify-center overflow-hidden">
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
                        <h2 className="text-[15px] font-semibold text-[#09090B]">
                          {item.name}
                        </h2>
                        <p className="text-[12px] text-[#52525B] mt-0.5">
                          {item.tagline}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ECFDF5] text-[#10B981] text-[10.5px] font-medium shrink-0">
                          <Check className="w-3 h-3" />
                          Aktif
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11.5px]">
                      <div className="bg-[#FAFAFA] border border-[#F4F4F5] rounded-md px-2.5 py-2">
                        <div className="text-[10.5px] font-medium uppercase tracking-wide text-[#A1A1AA]">
                          Rekomendasi
                        </div>
                        <div className="text-[#09090B] font-medium mt-0.5">
                          {item.audience}
                        </div>
                      </div>
                      <div className="bg-[#FAFAFA] border border-[#F4F4F5] rounded-md px-2.5 py-2">
                        <div className="text-[10.5px] font-medium uppercase tracking-wide text-[#A1A1AA]">
                          Tipografi Default
                        </div>
                        <div className="text-[#09090B] font-medium mt-0.5">
                          {item.typographyNote}
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-1.5 pt-1">
                      {item.highlights.map((hl) => (
                        <li
                          key={hl}
                          className="flex items-start gap-2 text-[12px] text-[#52525B]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-[#F4F4F5] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#52525B] font-mono">
                      Font: {item.recommendedFontLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(item)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-[#18181B] text-white text-[12px] font-medium hover:bg-[#27272A] transition-colors"
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
