import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const COMPARISON_ROWS = [
  {
    criterion: "Tanpa menulis kode / sintaks markup",
    formacv: "Ya (Form terstruktur)",
    overleaf: "Tidak (Kode LaTeX)",
    canva: "Ya",
  },
  {
    criterion: "Tipografi rapat presisi sekelas LaTeX",
    formacv: "Ya (4 preset terkurasi)",
    overleaf: "Ya",
    canva: "Manual per kotak teks",
  },
  {
    criterion: "Urutan baca PDF linear & 100% selectable",
    formacv: "Ya + verifikasi ATS X-Ray",
    overleaf: "Ya",
    canva: "Sering acak / terpecah",
  },
  {
    criterion: "Toggle show/hide poin per lowongan",
    formacv: "Ya (Master Profile)",
    overleaf: "Komentar kode manual",
    canva: "Hapus & salin manual",
  },
  {
    criterion: "Mulai langsung tanpa login + backup JSON",
    formacv: "Ya + Cloud opsional",
    overleaf: "Wajib akun",
    canva: "Wajib akun",
  },
];

export function ComparisonAndCtaSection() {
  return (
    <>
      {/* Honest Comparison Table */}
      <section
        aria-labelledby="comparison-heading"
        className="border-t border-[#E4E4E7] bg-[#F8F9FA]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#52525B]">
              Perbandingan Jujur
            </p>
            <h2
              id="comparison-heading"
              className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]"
            >
              Presisi LaTeX tanpa kurva belajarnya.
            </h2>
          </div>

          <div className="mt-8 bg-white border border-[#E4E4E7] rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-[12px] text-[#52525B]">
                  <th scope="col" className="py-3.5 px-4 font-semibold text-[#09090B]">
                    Kriteria
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-[#09090B]">
                    Craftfolio
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-medium">
                    Overleaf (LaTeX)
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-medium">
                    Word / Canva
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-[13px]">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.criterion}>
                    <th
                      scope="row"
                      className="py-3.5 px-4 font-medium text-[#09090B]"
                    >
                      {row.criterion}
                    </th>
                    <td className="py-3.5 px-4 font-medium text-[#09090B]">
                      <span className="inline-flex items-center gap-1.5">
                        <Check
                          className="w-3.5 h-3.5 text-[#10B981] shrink-0"
                          aria-hidden="true"
                        />
                        {row.formacv}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#52525B]">{row.overleaf}</td>
                    <td className="py-3.5 px-4 text-[#52525B]">
                      <span className="inline-flex items-center gap-1.5">
                        <Minus
                          className="w-3 h-3 text-[#71717A] shrink-0"
                          aria-hidden="true"
                        />
                        {row.canva}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final Calm CTA Band */}
      <section
        aria-labelledby="final-cta-heading"
        className="border-t border-[#E4E4E7] bg-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2
            id="final-cta-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]"
          >
            Siapkan CV ramah ATS dalam hitungan menit.
          </h2>
          <p className="mt-3 text-[14px] sm:text-[15px] text-[#52525B] max-w-xl mx-auto leading-relaxed">
            Buka editor sekarang tanpa registrasi. Jika ingin menyimpan lintas perangkat, Anda bisa masuk dengan Google atau Email kapan saja tanpa kehilangan draf.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/editor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-[#18181B] text-white text-[13px] font-medium hover:bg-[#27272A] transition-colors"
            >
              Mulai Buat CV Sekarang
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/templates"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-white border border-[#E4E4E7] text-[#09090B] text-[13px] font-medium hover:bg-[#F4F4F5] transition-colors"
            >
              Lihat Galeri Template
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E4E4E7] bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[#52525B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#09090B] font-semibold">
              <BrandLogo className="h-5 w-auto shrink-0" />
              <span>Craftfolio</span>
            </div>
            <p className="text-[11.5px] text-[#52525B] max-w-md">
              Berfokus pada struktur CV satu kolom konvensional dan PDF selectable text — bukan klaim instan &ldquo;100% lolos semua ATS&rdquo;.
            </p>
          </div>

          <nav aria-label="Navigasi footer" className="flex items-center gap-5 font-medium">
            <Link href="/editor" className="hover:text-[#09090B] transition-colors">
              Editor
            </Link>
            <Link href="/templates" className="hover:text-[#09090B] transition-colors">
              Galeri Template
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
