# AGENTS.md — Panduan Kerja Agen & Pengembang (FormaCV)

Dokumen ini menjadi panduan utama bagi AI coding agent dan pengembang dalam membangun **FormaCV**. Selalu rujuk dokumen spesifikasi berikut sebelum membuat perubahan besar:
- **Product Requirements:** `agents/PRD.md`
- **Brand & Design System:** `agents/brand-guideline.md`
- **Panduan Setup & Docker:** `SETUP.md`

---

## 1. Ringkasan Proyek

**FormaCV** adalah aplikasi web pembuat CV ramah *Applicant Tracking System* (ATS) dengan pendekatan *data-first* dan *zero-friction Guest Mode* pada MVP.
- **Filosofi:** *"Kualitas tipografi sekelas LaTeX, semudah mengisi Google Form"* — antarmuka tenang ala Notion/iA Writer, bukan kanvas desain grafis.
- **Tech Stack Utama:**
  - **Framework & Bahasa:** Next.js (App Router) + TypeScript
  - **UI & Styling:** Tailwind CSS + `shadcn/ui` (base `Zinc`) + `lucide-react`
  - **Form & Validasi:** `react-hook-form` + `zod`
  - **State Management:** `zustand` (`persist` ke `localStorage`) + `zundo` (Undo/Redo)
  - **Reordering:** `@dnd-kit/core` + `@dnd-kit/sortable`
  - **PDF Engine (MVP):** `@react-pdf/renderer` (client-side, `ssr: false`) + Live Preview HTML/CSS
  - **Fase Lanjut:** Vercel AI SDK (`ai`), `pdfjs-dist`/`unpdf`, Firebase (Firebase Auth + Cloud Firestore + Security Rules)

---

## 2. Perintah Kerja Utama

### Lokal (Node.js)
```bash
# Install dependensi
npm install

# Jalankan server development (http://localhost:3000)
npm run dev

# Cek tipe TypeScript & linting
npx tsc --noEmit
npm run lint

# Build production
npm run build
npm run start
```

### Docker
```bash
# Development dengan hot-reload
docker compose --profile dev up --build

# Production container
docker compose --profile prod up --build -d

# Hentikan container
docker compose --profile dev down
docker compose --profile prod down
```

---

## 3. Struktur Folder

### Dokumentasi & Konfigurasi Root
```text
.
├── AGENTS.md                 # Panduan kerja agent & konvensi repo ini
├── SETUP.md                  # Panduan setup Next.js, Tailwind, & Docker
├── agents/
│   ├── PRD.md                # Spesifikasi produk, skema data, & roadmap
│   └── brand-guideline.md    # Palet warna, tipografi, layout, & aturan visual
├── Dockerfile                # Multi-stage build production
├── Dockerfile.dev            # Container development
└── docker-compose.yml        # Orkestrasi service dev & prod
```

### Struktur Aplikasi (`src/` — Next.js App Router)
```text
src/
├── app/
│   ├── (marketing)/          # Landing page & galeri template
│   ├── editor/               # Halaman utama Split-Screen Editor (Guest MVP)
│   ├── app/                  # Dashboard Multi-CV & Settings (Fase 3)
│   ├── api/
│   │   ├── ai/enhance/       # Endpoint AI bullet enhancer (Fase 2)
│   │   └── ai/parse-cv/      # Endpoint import PDF/DOCX ke JSON (Fase 2)
│   └── layout.tsx            # Konfigurasi font (Inter, EB Garamond, Merriweather)
├── components/
│   ├── ui/                   # Komponen dasar shadcn/ui
│   ├── editor/               # Form section, drag-and-drop, toolbar, ATS checker
│   ├── preview/              # Live HTML Preview & ATS X-Ray view
│   └── pdf/                  # Template dokumen @react-pdf/renderer
├── lib/
│   ├── schemas/              # Skema validasi Zod & TypeScript types (ResumeDocument)
│   ├── ats-linter.ts         # Aturan deterministik ATS Readability Checker
│   └── default-resume.ts     # Data contoh awal untuk onboarding editor
└── store/
    └── use-resume-store.ts   # Zustand store + localStorage persist + zundo
```

---

## 4. Aturan Kode

1. **Schema-First & Type Safety:**
   - Seluruh struktur data CV (`ResumeDocument`, `SectionGroup<T>`, `BulletPoint`, dll.) harus didefinisikan dengan **Zod** di `src/lib/schemas/` dan di-infer menjadi tipe TypeScript.
   - Selalu sertakan `schemaVersion` pada dokumen untuk memudahkan migrasi data di `localStorage` maupun database.
2. **Pemisahan Konten & Presentasi (*Data-First*):**
   - Komponen template di `src/components/preview/` dan `src/components/pdf/` hanya boleh membaca data terstruktur dan `config` (tidak boleh menyimpan state editor).
   - Pertahankan kontrol visibilitas (`isVisible: boolean`) di level *section*, item, dan *bullet point* agar fitur *Master Profile* bekerja tanpa menghapus data asli.
3. **Konsistensi Preview HTML & Ekspor PDF:**
   - Gunakan dimensi kertas absolut (`210mm x 297mm` untuk A4, `8.5in x 11in` untuk Letter) serta samakan *font metrics* dan *line-height* antara komponen HTML preview dan template `@react-pdf/renderer`.
   - Muat komponen `@react-pdf/renderer` secara dinamis dengan `next/dynamic` (`{ ssr: false }`) agar tidak error saat SSR Next.js.
4. **Kepatuhan Desain (`agents/brand-guideline.md`):**
   - Gunakan palet monokromatis netral (`#F8F9FA`, `#FAFAFA`, `#FFFFFF`, `Zinc-950/900/600/400`, border `#E4E4E7`).
   - Warna aksen (`Emerald-500`, `Amber-500`, `Red-500`) hanya dipakai untuk status fungsional nyata (auto-save, ATS checklist, validasi error).
   - **Dilarang** menambahkan estetika *AI slop* (gradien neon, *glow* berlebihan, *rounded pill* dekoratif raksasa, atau dark-mode sci-fi yang tidak diminta).
5. **Aksesibilitas & i18n:**
   - Setiap fitur *drag-and-drop* (`@dnd-kit`) wajib disertai kontrol alternatif yang ramah keyboard (tombol naik/turun atau fokus ring yang jelas).
   - Pisahkan label *heading* default CV untuk bahasa Indonesia (`id`) dan Inggris (`en`).
6. **Kualitas Kode:**
   - Hindari duplikasi logika antar template CV atau form section; ekstrak *helper* atau komponen generik jika pola berulang.
   - Jangan mengubah komentar/dokumentasi yang tidak terkait dengan perubahan tugas.

---

## 5. Batasan yang Perlu Dipatuhi

1. **Aturan Kepatuhan ATS (Ketat):**
   - Template CV bawaan **wajib** *single-column*, menggunakan font standar yang terbaca mesin, tanpa tabel tata letak, tanpa *skill bar* persentase, dan tanpa ikon sebagai pengganti label teks.
   - PDF yang diekspor **dilarang keras** berupa gambar (*rasterized canvas*); seluruh teks harus *selectable*, memiliki urutan baca linear (atas ke bawah), dan tautan harus *clickable*.
   - **Jangan pernah** mengklaim bahwa CV dijamin "100% lolos semua ATS" atau menampilkan angka skor ATS prediktif yang menyesatkan. Gunakan status deterministik `Good` / `Review` / `Fix` dengan penjelasan yang transparan.
2. **Privasi & Guest Mode (MVP):**
   - Pada MVP, pengguna **tidak boleh dipaksa login**. Seluruh data CV disimpan lokal di `localStorage` dengan fitur ekspor/impor `.json`.
   - Jangan mengirim data CV pengguna ke server atau pihak ketiga tanpa tindakan eksplisit pengguna (seperti memicu fitur AI di Fase 2 atau Cloud Sync di Fase 3).
3. **Guardrails Fitur AI (Fase 2):**
   - AI **dilarang keras** mengarang pengalaman, skill, angka, atau metrik dampak yang tidak pernah diberikan pengguna.
   - Saat mencocokkan *Job Description*, bedakan secara jelas antara *"belum tertulis di CV"* dan *"tidak dimiliki pengguna"*.
   - Setiap teks yang dihasilkan atau diubah AI wajib ditandai dengan jelas dan memerlukan konfirmasi pengguna sebelum disimpan.
4. **Disiplin Scope MVP:**
   - Prioritaskan alur inti MVP (*Editor → Live Preview → ATS Readability Checker → Export PDF + JSON Backup*) sebelum mengerjakan fitur Fase 2/3 (AI, Import PDF/DOCX, Auth/Supabase, Job Tracker, DOCX export).
