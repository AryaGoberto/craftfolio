import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Sliders } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#09090B]">
      {/* Header */}
      <header className="h-14 px-6 bg-white border-b border-[#E4E4E7] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo className="h-7 w-auto shrink-0" />
          <span className="text-[14px] font-semibold tracking-[-0.01em]">
            FormaCV
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/templates"
            className="inline-flex items-center h-8 px-3 rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
          >
            Galeri Template
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

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E4E4E7] text-[11px] font-medium text-[#52525B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Guest Mode — Data tersimpan aman di browser Anda
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#09090B] leading-[1.15]">
            Kualitas tipografi sekelas LaTeX, semudah mengisi formulir.
          </h1>

          <p className="text-[15px] sm:text-[16px] text-[#52525B] max-w-xl mx-auto leading-relaxed">
            Buat CV yang bersih, terstruktur satu kolom, dan ramah mesin parser ATS tanpa perlu menulis kode atau merapikan garis secara manual.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/editor"
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-[#18181B] text-white text-[13px] font-medium hover:bg-[#27272A] transition-colors"
            >
              Buat CV Sekarang (Gratis, Tanpa Login)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-white border border-[#E4E4E7] text-[#09090B] text-[13px] font-medium hover:bg-[#F4F4F5] transition-colors"
            >
              Lihat Galeri Template
            </Link>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full text-left">
          <div className="bg-white border border-[#E4E4E7] rounded-lg p-5">
            <FileText className="w-4 h-4 text-[#18181B] mb-3" />
            <h2 className="text-[13px] font-semibold text-[#09090B]">
              Split-Screen Live Preview
            </h2>
            <p className="text-[12px] text-[#52525B] mt-1 leading-relaxed">
              Isi formulir di kiri dan lihat hasil halaman A4/Letter diperbarui seketika di kanan.
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-lg p-5">
            <Sliders className="w-4 h-4 text-[#18181B] mb-3" />
            <h2 className="text-[13px] font-semibold text-[#09090B]">
              Master Profile Controls
            </h2>
            <p className="text-[12px] text-[#52525B] mt-1 leading-relaxed">
              Seret urutan bagian dan sembunyikan poin tertentu per lowongan tanpa menghapus data asli.
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-lg p-5">
            <ShieldCheck className="w-4 h-4 text-[#18181B] mb-3" />
            <h2 className="text-[13px] font-semibold text-[#09090B]">
              ATS Readability & X-Ray
            </h2>
            <p className="text-[12px] text-[#52525B] mt-1 leading-relaxed">
              Periksa kelengkapan kontak, format tanggal, serta simulasi urutan teks linear sebelum ekspor PDF.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2 text-[11px] text-[#52525B]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Ekspor PDF Vector dengan teks 100% dapat diseleksi & backup JSON.</span>
        </div>
      </main>
    </div>
  );
}
