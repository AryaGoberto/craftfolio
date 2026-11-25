import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TEMPLATES = [
  {
    name: "Classic Academic",
    fontLabel: "Computer Modern (LaTeX)",
    audience: "Tech, Mahasiswa & Akademisi",
    description:
      "Terinspirasi Jake's Resume (LaTeX) dengan header small-caps dan garis bawah hairline penuh.",
    fontClass: "font-[family-name:var(--font-serif-academic)]",
    alignClass: "text-center",
  },
  {
    name: "Modern Minimalist",
    fontLabel: "Inter",
    audience: "Product, Startup & Engineering",
    description:
      "Tipografi sans-serif bersih rata kiri untuk pemindaian cepat perekrut dalam hitungan detik.",
    fontClass: "font-sans",
    alignClass: "text-left",
  },
  {
    name: "Compact",
    fontLabel: "Inter · Spasi Hemat",
    audience: "Pengalaman & Proyek Padat",
    description:
      "Margin dan jarak baris efisien agar banyak pencapaian tetap muat rapi dalam satu halaman A4.",
    fontClass: "font-sans",
    alignClass: "text-left",
  },
  {
    name: "Executive Standard",
    fontLabel: "Merriweather",
    audience: "Manajemen, Bisnis & Korporat",
    description:
      "Nuansa editorial serif formal dengan headline jabatan eksplisit di bawah nama lengkap.",
    fontClass: "font-[family-name:var(--font-merriweather)]",
    alignClass: "text-left",
  },
];

export function TemplateStripSection() {
  return (
    <section
      aria-labelledby="templates-heading"
      className="border-t border-[#E4E4E7] bg-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#52525B]">
              4 Template ATS Terkurasi
            </p>
            <h2
              id="templates-heading"
              className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]"
            >
              Satu kolom penuh. Bebas tabel layout dan grafik batang.
            </h2>
          </div>

          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#09090B] hover:underline shrink-0"
          >
            Jelajahi semua pratinjau
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((tpl) => (
            <Link
              key={tpl.name}
              href="/templates"
              className="group bg-[#FAFAFA] hover:bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded-lg p-4 flex flex-col justify-between gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
            >
              {/* Crisp Typographic Specimen */}
              <div
                className={`bg-white border border-[#E4E4E7] rounded-sm p-4 space-y-2 ${tpl.fontClass}`}
              >
                <div className={tpl.alignClass}>
                  <p className="text-[13px] font-bold text-[#09090B] tracking-tight">
                    RAKA PRATAMA
                  </p>
                  <p className="text-[9.5px] text-[#52525B]">
                    Frontend Engineer · Jakarta
                  </p>
                </div>
                <div className="border-t border-[#09090B]/30 pt-2 space-y-1.5">
                  <div className="h-1.5 w-16 bg-[#09090B]/70 rounded-xs" />
                  <div className="h-1 w-full bg-[#D4D4D8] rounded-xs" />
                  <div className="h-1 w-5/6 bg-[#D4D4D8] rounded-xs" />
                </div>
                <div className="pt-1 space-y-1.5">
                  <div className="h-1.5 w-12 bg-[#09090B]/70 rounded-xs" />
                  <div className="h-1 w-11/12 bg-[#D4D4D8] rounded-xs" />
                  <div className="h-1 w-4/5 bg-[#D4D4D8] rounded-xs" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-[#09090B]">
                    {tpl.name}
                  </h3>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-[#52525B] group-hover:text-[#09090B] group-hover:translate-x-0.5 transition-transform shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-[12px] text-[#52525B] leading-relaxed">
                  {tpl.description}
                </p>
                <p className="mt-3 pt-2.5 border-t border-[#E4E4E7] text-[11px] font-mono text-[#52525B]">
                  {tpl.fontLabel} · {tpl.audience}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
