import { CheckCircle2, Eye, EyeOff, FileText, GripVertical, Target } from "lucide-react";

export function HeroWorkspacePreview() {
  return (
    <div
      aria-label="Pratinjau antarmuka Split-Screen Editor dan hasil CV LaTeX FormaCV"
      className="w-full max-w-5xl mx-auto rounded-lg border border-[#E4E4E7] bg-white shadow-xl overflow-hidden text-left"
    >
      {/* Window Top Chrome */}
      <div className="h-10 px-4 bg-[#FAFAFA] border-b border-[#E4E4E7] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E4E4E7]" aria-hidden="true" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#E4E4E7]" aria-hidden="true" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#E4E4E7]" aria-hidden="true" />
          <span className="ml-2 text-[11px] font-medium text-[#52525B] font-mono">
            formacv / editor
          </span>
        </div>

        {/* Simulated Unified Strip */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-[11px] font-medium text-[#52525B]">
          <span>Classic Academic</span>
          <span className="text-[#D4D4D8]" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-[#09090B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
            ATS OK
          </span>
          <span className="text-[#D4D4D8]" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Target className="w-3 h-3" aria-hidden="true" />
            JD 8/9
          </span>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#18181B] text-white text-[10.5px] font-medium">
          Download PDF
        </span>
      </div>

      {/* Tab Strip */}
      <div className="h-8 px-3 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-end gap-1.5 text-[11px]">
        <div className="inline-flex items-center gap-1.5 px-3 h-7 bg-white border-t border-x border-[#E4E4E7] rounded-t-md -mb-px font-medium text-[#09090B]">
          <FileText className="w-3 h-3 text-[#18181B]" aria-hidden="true" />
          <span>CV_Frontend_2026</span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 h-6 mb-0.5 rounded-t-md text-[#52525B]">
          <FileText className="w-3 h-3" aria-hidden="true" />
          <span>Master_Profile</span>
        </div>
      </div>

      {/* Split-Screen Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Guided Form & Master Profile Controls */}
        <div className="lg:col-span-5 bg-[#FAFAFA] border-b lg:border-b-0 lg:border-r border-[#E4E4E7] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52525B]">
              Struktur &amp; Master Profile
            </span>
            <span className="text-[11px] font-mono text-[#52525B]">
              4 Bagian Aktif
            </span>
          </div>

          {/* Active Experience Card */}
          <div className="bg-white border border-[#E4E4E7] rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-[#71717A] shrink-0" aria-hidden="true" />
                <span className="text-[12.5px] font-semibold text-[#09090B] truncate">
                  Pengalaman Kerja
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#52525B]">
                <Eye className="w-3.5 h-3.5 text-[#09090B]" aria-hidden="true" />
                Aktif
              </span>
            </div>

            <div className="space-y-2 pl-1 border-l-2 border-[#E4E4E7]">
              <div className="pl-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#09090B] truncate">
                    PT Teknologi Nusantara
                  </p>
                  <p className="text-[11px] text-[#52525B]">
                    Frontend Engineer · Jan 2023 – Present
                  </p>
                </div>
                <Eye className="w-3.5 h-3.5 text-[#52525B] shrink-0 mt-0.5" aria-hidden="true" />
              </div>

              {/* Hidden Item Example (Master Profile Power) */}
              <div className="pl-2.5 flex items-start justify-between gap-2 opacity-50">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#09090B] line-through truncate">
                    Asisten Lab Basis Data
                  </p>
                  <p className="text-[11px] text-[#52525B]">
                    Disembunyikan untuk lowongan ini
                  </p>
                </div>
                <EyeOff className="w-3.5 h-3.5 text-[#52525B] shrink-0 mt-0.5" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Compact Secondary Section Cards */}
          <div className="bg-white border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-[#71717A]" aria-hidden="true" />
              <span className="text-[12px] font-medium text-[#09090B]">
                Proyek Pilihan
              </span>
            </div>
            <span className="text-[11px] text-[#52525B]">2 item aktif</span>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-[#71717A]" aria-hidden="true" />
              <span className="text-[12px] font-medium text-[#09090B]">
                Keahlian Teknis
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" aria-hidden="true" />
              Terbaca linear
            </span>
          </div>
        </div>

        {/* Right: Authentic LaTeX-Grade A4 Paper Preview */}
        <div className="lg:col-span-7 bg-[#F8F9FA] p-5 sm:p-6 flex flex-col justify-between">
          <div className="bg-white border border-[#E4E4E7] shadow-sm rounded-sm p-6 sm:p-7 font-[family-name:var(--font-garamond)] text-[#09090B]">
            <div className="text-center pb-3 border-b border-[#09090B]/20">
              <p className="text-xl sm:text-2xl font-bold tracking-wide uppercase leading-none">
                Raka Pratama
              </p>
              <p className="mt-1.5 text-[11.5px] sm:text-[12px] text-[#27272A]">
                Jakarta, Indonesia &nbsp;|&nbsp; raka.pratama@email.com &nbsp;|&nbsp; linkedin.com/in/rakapratama
              </p>
            </div>

            <div className="mt-3.5 space-y-3 text-[12px] leading-snug">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider border-b border-[#09090B] pb-0.5">
                  Experience
                </p>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="font-bold">PT Teknologi Nusantara</span>
                  <span className="text-[11px] italic text-[#27272A] shrink-0">
                    Jan 2023 – Present
                  </span>
                </div>
                <p className="italic text-[11.5px] text-[#27272A]">
                  Frontend Engineer — Jakarta, Indonesia
                </p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11.5px] text-[#18181B]">
                  <li>
                    Developed real-time analytics dashboards in Next.js and TypeScript, improving page render speed by 40%.
                  </li>
                  <li>
                    Architected a modular design system with Tailwind CSS adopted across 4 core product squads.
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider border-b border-[#09090B] pb-0.5">
                  Technical Skills
                </p>
                <p className="mt-1 text-[11.5px] text-[#18181B]">
                  <strong className="font-bold">Languages &amp; Frameworks:</strong>{" "}
                  TypeScript, React, Next.js, Tailwind CSS, Node.js, PostgreSQL
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#52525B] font-mono">
            <span>A4 · 210 × 297 mm · Teks 100% Selectable</span>
            <span>Halaman 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
