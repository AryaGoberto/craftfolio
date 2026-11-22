# TASKS.md — Checklist Eksekusi MVP (Minggu 1–4)

Checklist ini memecah roadmap di [PRD.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents/PRD.md) menjadi tugas-tugas kecil yang dapat dieksekusi dan dilacak per sesi, dengan mengacu pada arsitektur di [DESIGN.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents/DESIGN.md) dan aturan desain di [brand-guideline.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents/brand-guideline.md).

---

## Minggu 1 — Fondasi, Skema Data & Workspace Shell

### 1.1 Setup Proyek & Konfigurasi
- [ ] Inisialisasi Next.js (App Router, TypeScript, Tailwind CSS, `src/`) sesuai [SETUP.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/SETUP.md).
- [ ] Install dependensi inti (`zustand`, `zundo`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`, `@react-pdf/renderer`).
- [ ] Inisialisasi `shadcn/ui` (base `Zinc`) dan tambahkan komponen dasar (`button`, `input`, `label`, `textarea`, `card`, `badge`, `tabs`, `accordion`, `switch`, `select`, `tooltip`, `separator`).
- [ ] Konfigurasi `next.config.ts` (`output: "standalone"`), `Dockerfile`, `Dockerfile.dev`, `.dockerignore`, dan `docker-compose.yml`.
- [ ] Setup font (`Inter`, `EB Garamond`, `Merriweather`) di `src/app/layout.tsx` dan token warna di `src/app/globals.css`.

### 1.2 Skema Data & Store
- [ ] Buat skema Zod & tipe TypeScript (`ResumeDocument`, `SectionGroup`, `BulletPoint`, dll.) dengan `schemaVersion: 1` di `src/lib/schemas/resume.ts`.
- [ ] Buat data contoh awal (`defaultResumeEn` & `defaultResumeId`) serta helper label i18n di `src/lib/default-resume.ts` dan `src/lib/i18n.ts`.
- [ ] Implementasikan `useResumeStore` (`zustand` + `persist` + `zundo` + migrasi `schemaVersion` + `hasHydrated`) di `src/store/use-resume-store.ts`.

### 1.3 Shell Aplikasi & Top Bar
- [ ] Buat layout *split-screen* di `src/app/editor/page.tsx` (desktop side-by-side, mobile tab `Edit` / `Preview`) beserta skeleton saat `hasHydrated === false`.
- [ ] Buat `EditorTopBar` (Logo FormaCV, rename judul dokumen, `SaveStatusBadge`, tombol Undo/Redo).

---

## Minggu 2 — Form Editor & Master Profile Controls

### 2.1 Form Section Dasar
- [ ] Buat `BasicsForm` (Nama, Headline, Email, Telepon, Lokasi, Dynamic Links + toggle visibilitas link).
- [ ] Buat `SummaryForm` dengan penghitung kata (rekomendasi 30–60 kata) dan toggle `isVisible`.
- [ ] Buat `SkillsSectionForm` (tambah/hapus/edit kategori & daftar skill).

### 2.2 Repeatable Section & Bullet Editor
- [ ] Buat komponen generik `ItemCard` (expand/collapse, tombol `isVisible` dengan ikon mata, hapus item, handle drag & tombol naik/turun).
- [ ] Buat `BulletListEditor` (tambah/edit/hapus bullet, toggle `isVisible`, reorder bullet).
- [ ] Implementasikan form untuk `Experience`, `Education`, `Projects`, `Certifications`, `Awards`, `Volunteering`, `Languages`, dan `CustomSection`.

### 2.3 Reordering & Manajemen Dokumen Lokal
- [ ] Implementasikan `SectionNavigator` dengan `@dnd-kit/sortable` + tombol move-up/move-down yang ramah keyboard untuk urutan *section*.
- [ ] Implementasikan menu manajemen dokumen lokal (buat baru, duplikasi, hapus, muat contoh, kosongkan form).

---

## Minggu 3 — Live Preview, Templates & PDF Engine

### 3.1 Shared Layout Tokens & HTML Preview
- [ ] Buat `src/lib/template-tokens.ts` (dimensi A4/Letter + preset `compact`, `normal`, `relaxed`).
- [ ] Bangun `PaperCanvas` dengan skala zoom (`-`, `+`, `Fit`), `ResizeObserver` untuk estimasi jumlah halaman, dan garis batas halaman.
- [ ] Bangun banner peringatan *Page Overflow* (`< 15%` di halaman terakhir atau melebihi `targetPages`) dengan tombol cepat ke `Compact`.

### 3.2 Template ATS (HTML & PDF)
- [ ] Siapkan file font `.ttf` (`Inter`, `Roboto`, `EB Garamond`, `Merriweather`) di `public/fonts/` dan buat `src/lib/pdf-fonts.ts`.
- [ ] Buat 3–4 template HTML Preview (*Classic Academic*, *Modern Minimalist*, *Compact*, *Executive Standard*) di `src/components/preview/`.
- [ ] Buat template `@react-pdf/renderer` yang memetakan token yang sama di `src/components/pdf/`.
- [ ] Buat `PdfExportButton` dengan `next/dynamic(..., { ssr: false })`, kustomisasi nama file (`Nama_Lengkap_CV.pdf`), dan metadata PDF.

### 3.3 Pengaturan Layout & Backup JSON
- [ ] Buat `TemplateAndLayoutPopover` (pilih template, `A4`/`LETTER`, `density`, `fontFamily`, `targetPages`, bahasa `id`/`en`).
- [ ] Implementasikan fitur **Export `.json`** dan **Import `.json`** dengan validasi Zod dan pesan error yang aman.

---

## Minggu 4 — ATS Checker, Polish & Rilis MVP

### 4.1 Rule-Based ATS Readability Checker
- [ ] Implementasikan fungsi murni `runAtsLint` di `src/lib/ats-linter.ts` mencakup seluruh aturan `fix`, `review`, dan `good`.
- [ ] Buat UI panel/drawer `AtsCheckerPanel` dengan badge status (`Good` / `Review` / `Fix`) dan klik-untuk-lompat ke section terkait.
- [ ] Tulis unit test untuk `runAtsLint` (kasus kontak kosong, format tanggal campur, bullet panjang, placeholder, dan CV valid).

### 4.2 Landing Page, Galeri Template & Pengujian
- [ ] Buat Landing Page di `src/app/(marketing)/page.tsx` dengan CTA langsung ke `/editor` ("Buat CV Sekarang — Gratis, Tanpa Login").
- [ ] Buat halaman `/templates` untuk pratinjau pilihan template sebelum masuk editor.
- [ ] Uji hasil ekspor PDF dengan skenario CV pendek (1 halaman) dan CV panjang (2 halaman): pastikan teks 100% *selectable*, urutan baca linear, dan tautan *clickable*.
- [ ] Cek responsivitas mobile (`Edit` / `Preview`), navigasi keyboard, dan jalankan `npx tsc --noEmit`, `npm run lint`, serta `npm run build`.
- [ ] Deploy MVP ke Vercel / container Docker production.
