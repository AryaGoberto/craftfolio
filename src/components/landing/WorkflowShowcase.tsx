import { Cloud, FolderTree, ScanSearch, Sliders, Target } from "lucide-react";

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Isi formulir terstruktur sekali saja",
    description:
      "Masukkan seluruh riwayat pendidikan, pengalaman, proyek, dan keahlian ke Master Profile tanpa mengatur margin atau garis manual.",
  },
  {
    number: "02",
    title: "Sesuaikan isi CV per lowongan",
    description:
      "Tempel Job Description untuk melihat kata kunci yang tersembunyi, lalu nyalakan atau matikan poin relevan dengan saklar visibilitas.",
  },
  {
    number: "03",
    title: "Verifikasi ATS X-Ray & unduh PDF Vector",
    description:
      "Periksa urutan teks asli dari biner PDF dan jalankan checklist aturan ATS sebelum mengekspor PDF 100% selectable text.",
  },
];

const CAPABILITIES = [
  {
    icon: Sliders,
    label: "Master Profile & Tab Kerja",
    title: "Satu profil utama, banyak versi CV rapi",
    description:
      "Kelola banyak versi CV lewat File Tree dan tab lembar kerja bergaya browser. Sembunyikan pengalaman atau bullet point tertentu per lamaran tanpa pernah menghapus data asli Anda.",
    detail: "Drag-and-drop section · Toggle isVisible di tiap level",
  },
  {
    icon: ScanSearch,
    label: "Transparansi ATS",
    title: "ATS Readability Checker & PDF X-Ray Asli",
    description:
      "Kami tidak menampilkan skor ATS palsu. FormaCV mengekstrak teks langsung dari file PDF hasil render agar Anda melihat persis urutan baca linear yang diterima sistem rekrutmen.",
    detail: "11 aturan deterministik · Parser blob PDF via pdfjs-dist",
  },
  {
    icon: Target,
    label: "Tailoring Cepat",
    title: "Job Description Keyword Matcher",
    description:
      "Tempel teks lowongan kerja untuk memetakan kata kunci yang sudah aktif, yang ternyata ada di Master Profile namun masih disembunyikan, dan yang belum tertulis.",
    detail: "1-klik tampilkan item tersembunyi · 100% di browser",
  },
  {
    icon: Cloud,
    label: "Privasi & Portabilitas",
    title: "Guest Mode lokal + Cloud Firestore opsional",
    description:
      "Mulai langsung tanpa login dengan auto-save localStorage dan backup JSON. Kapan pun siap, masuk dengan Google atau Email untuk menyinkronkan seluruh CV lintas perangkat.",
    detail: "Auto-merge draf Guest ke Cloud · Ekspor & impor .json",
  },
];

export function WorkflowShowcase() {
  return (
    <>
      {/* 3-Step Editorial Workflow */}
      <section
        aria-labelledby="workflow-heading"
        className="border-t border-[#E4E4E7] bg-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#52525B]">
              Cara Kerja
            </p>
            <h2
              id="workflow-heading"
              className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]"
            >
              Dirancang agar Anda fokus pada isi, bukan merapikan kotak teks.
            </h2>
          </div>

          <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {WORKFLOW_STEPS.map((step) => (
              <li
                key={step.number}
                className="pt-5 border-t border-[#E4E4E7] space-y-2.5"
              >
                <span className="text-[12px] font-mono font-semibold text-[#52525B]">
                  {step.number}
                </span>
                <h3 className="text-[15px] font-semibold text-[#09090B]">
                  {step.title}
                </h3>
                <p className="text-[13px] text-[#52525B] leading-relaxed">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Core Capabilities (2x2 Editorial Grid) */}
      <section
        aria-labelledby="capabilities-heading"
        className="border-t border-[#E4E4E7] bg-[#F8F9FA]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#52525B]">
                Fitur Inti
              </p>
              <h2
                id="capabilities-heading"
                className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B]"
              >
                Alat produktivitas serius untuk setiap tahap lamaran.
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-[12px] text-[#52525B]">
              <FolderTree className="w-4 h-4 text-[#18181B]" aria-hidden="true" />
              <span>File Tree + Multi-Tab Workspace siap pakai</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="bg-white border border-[#E4E4E7] rounded-lg p-6 flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] inline-flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52525B]">
                        {item.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[16px] font-semibold text-[#09090B]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] text-[#52525B] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <p className="pt-3 border-t border-[#F4F4F5] text-[11.5px] font-mono text-[#52525B]">
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
