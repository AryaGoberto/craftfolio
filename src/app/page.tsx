import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LandingAuthActions } from "@/components/auth/LandingAuthActions";
import { LandingFoldyHero } from "@/components/landing/LandingFoldyHero";
import { HeroWorkspacePreview } from "@/components/landing/HeroWorkspacePreview";
import { WorkflowShowcase } from "@/components/landing/WorkflowShowcase";
import { TemplateStripSection } from "@/components/landing/TemplateStripSection";
import { ComparisonAndCtaSection } from "@/components/landing/ComparisonAndCtaSection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-ui-canvas text-ui-text">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-ui-primary focus:text-white focus:text-[12px] focus:font-medium"
      >
        Langsung ke konten utama
      </a>

      {/* Sticky Editorial Header */}
      <header className="sticky top-0 z-30 h-14 bg-ui-card/95 backdrop-blur-xs border-b border-ui-border">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 text-ui-text"
            >
              <BrandLogo className="h-7 w-auto shrink-0" />
              <span className="text-[14px] font-semibold tracking-[-0.01em] text-ui-text">
                Craftfolio
              </span>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-ui-border" aria-hidden="true" />

            <Link
              href="/templates"
              className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[12.5px] font-medium text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors"
            >
              Template
            </Link>
          </div>

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-ui-card border border-ui-border text-[11.5px] font-medium text-ui-text-secondary">
              <span
                className="w-1.5 h-1.5 rounded-full bg-ui-success"
                aria-hidden="true"
              />
              Guest Mode Aktif · Sinkronisasi Cloud Opsional
            </div>

            <h1
              id="hero-heading"
              className="mt-5 text-3xl sm:text-5xl font-bold tracking-[-0.025em] text-ui-text leading-[1.12]"
            >
              Kualitas tipografi sekelas LaTeX, semudah mengisi formulir.
            </h1>

            <p className="mt-5 text-[15px] sm:text-[17px] text-ui-text-secondary max-w-2xl mx-auto leading-relaxed">
              Susun CV satu kolom yang bersih, presisi, dan mudah dibaca perekrut maupun parser ATS—tanpa menulis kode markup dan tanpa menggeser garis secara manual.
            </p>

            <LandingFoldyHero />

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-ui-text-secondary">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-ui-success shrink-0"
                  aria-hidden="true"
                />
                <span>PDF Vector 100% selectable text</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-ui-success shrink-0"
                  aria-hidden="true"
                />
                <span>Tanpa wajib daftar akun</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-ui-success shrink-0"
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
