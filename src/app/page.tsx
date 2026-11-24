import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LandingAuthActions } from "@/components/auth/LandingAuthActions";
import { HeroWorkspacePreview } from "@/components/landing/HeroWorkspacePreview";
import { WorkflowShowcase } from "@/components/landing/WorkflowShowcase";
import { TemplateStripSection } from "@/components/landing/TemplateStripSection";
import { ComparisonAndCtaSection } from "@/components/landing/ComparisonAndCtaSection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#09090B]">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-[#18181B] focus:text-white focus:text-[12px] focus:font-medium"
      >
        Langsung ke konten utama
      </a>

      {/* Sticky Editorial Header */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <BrandLogo className="h-7 w-auto shrink-0" />
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#09090B]">
              FormaCV
            </span>
          </Link>

          <nav aria-label="Navigasi utama">
            <LandingAuthActions />
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-heading"
          className="px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24"
        >
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-[#E4E4E7] text-[11.5px] font-medium text-[#52525B]">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                aria-hidden="true"
              />
              Guest Mode Aktif · Sinkronisasi Cloud Opsional
            </div>

            <h1
              id="hero-heading"
              className="mt-5 text-3xl sm:text-5xl font-bold tracking-[-0.025em] text-[#09090B] leading-[1.12]"
            >
              Kualitas tipografi sekelas LaTeX, semudah mengisi formulir.
            </h1>

            <p className="mt-5 text-[15px] sm:text-[17px] text-[#52525B] max-w-2xl mx-auto leading-relaxed">
              Susun CV satu kolom yang bersih, presisi, dan mudah dibaca perekrut maupun parser ATS—tanpa menulis kode markup dan tanpa menggeser garis secara manual.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/editor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-[#18181B] text-white text-[13.5px] font-medium hover:bg-[#27272A] transition-colors"
              >
                Buat CV Sekarang — Gratis
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/templates"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-white border border-[#E4E4E7] text-[#09090B] text-[13.5px] font-medium hover:bg-[#F4F4F5] transition-colors"
              >
                Lihat 4 Template ATS
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[#52525B]">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[#10B981] shrink-0"
                  aria-hidden="true"
                />
                <span>PDF Vector 100% selectable text</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[#10B981] shrink-0"
                  aria-hidden="true"
                />
                <span>Tanpa wajib daftar akun</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[#10B981] shrink-0"
                  aria-hidden="true"
                />
                <span>Backup JSON &amp; Cloud Sync</span>
              </li>
            </ul>
          </div>

          {/* Authentic Interactive-Style Split-Screen Product Preview */}
          <div className="mt-12 sm:mt-14">
            <HeroWorkspacePreview />
          </div>
        </section>

        <WorkflowShowcase />
        <TemplateStripSection />
        <ComparisonAndCtaSection />
      </main>
    </div>
  );
}
