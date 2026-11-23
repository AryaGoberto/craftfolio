# TASKS.md — Checklist Eksekusi MVP (Minggu 1–4)

Checklist ini memecah roadmap di [PRD.md](./PRD.md) menjadi tugas-tugas kecil yang dapat dieksekusi dan dilacak per sesi, dengan mengacu pada arsitektur di [DESIGN.md](./DESIGN.md) dan aturan desain di [brand-guideline.md](./brand-guideline.md).

---

## Minggu 1 — Fondasi, Skema Data & Workspace Shell

### 1.1 Setup Proyek & Konfigurasi
- [x] Inisialisasi Next.js (App Router, TypeScript, Tailwind CSS, `src/`) sesuai [SETUP.md](./SETUP.md).
- [x] Install dependensi inti (`zustand`, `zundo`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`, `@react-pdf/renderer`).
- [ ] Inisialisasi `shadcn/ui` (base `Zinc`) dan tambahkan komponen dasar (`button`, `input`, `label`, `textarea`, `card`, `badge`, `tabs`, `accordion`, `switch`, `select`, `tooltip`, `separator`) *(sebelumnya timeout ke `ui.shadcn.com`; komponen saat ini memakai Tailwind CSS langsung)*.
- [x] Konfigurasi `next.config.ts` (`output: "standalone"`), `Dockerfile`, `Dockerfile.dev`, `.dockerignore`, dan `docker-compose.yml`.
- [x] Setup font (`Inter`, `EB Garamond`, `Merriweather`) di `src/app/layout.tsx` dan token warna di `src/app/globals.css`.

### 1.2 Skema Data & Store
- [x] Buat skema Zod & tipe TypeScript (`ResumeDocument`, `SectionGroup`, `BulletPoint`, dll.) dengan `schemaVersion: 1` di `src/lib/schemas/resume.ts`.
- [x] Buat data contoh awal (`createSampleResume`, `createEmptyResume`) serta helper label i18n di `src/lib/default-resume.ts` dan `src/lib/i18n.ts`.
- [x] Implementasikan `useResumeStore` (`zustand` + `persist` + `zundo` + migrasi `schemaVersion` + `hasHydrated`) di `src/store/use-resume-store.ts`.

### 1.3 Shell Aplikasi & Top Bar
- [x] Buat layout *split-screen* di `src/app/editor/page.tsx` (desktop side-by-side, mobile tab `Edit` / `Preview`) beserta skeleton saat `hasHydrated === false`.
- [x] Buat `EditorTopBar` (Logo FormaCV, rename judul dokumen, `SaveStatusBadge`, tombol Undo/Redo).

---

## Minggu 2 — Form Editor & Master Profile Controls

### 2.1 Form Section Dasar
- [x] Buat `BasicsForm` (Nama, Headline, Email, Telepon, Lokasi, Dynamic Links + toggle visibilitas link).
- [x] Buat `Summary` form dengan penghitung kata (rekomendasi 30–60 kata) dan toggle `isVisible`.
- [x] Buat form `Skills` (tambah/hapus/edit kategori & daftar skill).

### 2.2 Repeatable Section & Bullet Editor
- [x] Buat komponen generik `ItemCardWrapper` (tombol `isVisible` dengan ikon mata, hapus item, tombol naik/turun).
- [x] Buat `BulletListEditor` (tambah/edit/hapus bullet, toggle `isVisible`).
- [x] Implementasikan form untuk `Experience`, `Education`, `Projects`, `Certifications`, `Awards`, `Volunteering`, `Languages`, dan `CustomSection`.

### 2.3 Reordering & Manajemen Dokumen Lokal
- [x] Implementasikan reordering section di `EditorPanel.tsx` dengan `@dnd-kit/sortable` + tombol move-up/move-down yang ramah keyboard.
- [x] Implementasikan menu manajemen dokumen lokal (`DocumentSwitcher.tsx`: buat baru, duplikasi, hapus, muat contoh, kosongkan form).

---

## Minggu 3 — Live Preview, Templates & PDF Engine

### 3.1 Shared Layout Tokens & HTML Preview
- [x] Buat `src/lib/template-tokens.ts` (dimensi A4/Letter + preset `compact`, `normal`, `relaxed`).
- [x] Bangun `PreviewPanel` dengan skala zoom (`-`, `+`, `Fit`), `ResizeObserver` untuk estimasi jumlah halaman, dan garis batas halaman.
- [x] Bangun banner peringatan *Page Overflow* (`< 15%` di halaman terakhir atau melebihi `targetPages`) dengan tombol cepat ke `Compact`.

### 3.2 Template ATS (HTML & PDF)
- [ ] Siapkan file font `.ttf` (`Inter`, `Roboto`, `EB Garamond`, `Merriweather`) di `public/fonts/` dan buat `src/lib/pdf-fonts.ts`.
- [x] Buat 4 template HTML Preview (*Classic Academic*, *Modern Minimalist*, *Compact*, *Executive Standard*) di `src/components/preview/ResumeHtmlRenderer.tsx`.
- [x] Buat template `@react-pdf/renderer` yang memetakan token yang sama di `src/components/pdf/PdfDocument.tsx`.
- [x] Buat `PdfExportButton` dengan `next/dynamic(..., { ssr: false })`, kustomisasi nama file (`Nama_Lengkap_CV.pdf`), dan metadata PDF.

### 3.3 Pengaturan Layout & Backup JSON
- [x] Buat popover pengaturan layout di `EditorTopBar.tsx` (pilih template, `A4`/`LETTER`, `density`, `fontFamily`, `targetPages`, bahasa `id`/`en`).
- [x] Implementasikan fitur **Export `.json`** dan **Import `.json`** dengan validasi Zod dan pesan error yang aman.

---

## Minggu 4 — ATS Checker, Polish & Rilis MVP

### 4.1 Rule-Based ATS Readability Checker
- [x] Implementasikan fungsi murni `runAtsLint` di `src/lib/ats-linter.ts` mencakup seluruh aturan `fix`, `review`, dan `good`.
- [x] Buat UI modal `AtsCheckerModal` dengan badge status (`Good` / `Review` / `Fix`) dan klik-untuk-lompat ke section terkait.
- [ ] Tulis unit test untuk `runAtsLint` (kasus kontak kosong, format tanggal campur, bullet panjang, placeholder, dan CV valid).

### 4.2 Landing Page, Galeri Template & Pengujian
- [x] Buat Landing Page di `src/app/page.tsx` dengan CTA langsung ke `/editor` ("Buat CV Sekarang — Gratis, Tanpa Login").
- [x] Buat halaman `/templates` untuk pratinjau pilihan template sebelum masuk editor.
- [ ] Uji hasil ekspor PDF dengan skenario CV pendek (1 halaman) dan CV panjang (2 halaman): pastikan teks 100% *selectable*, urutan baca linear, dan tautan *clickable*.
- [ ] Cek responsivitas mobile (`Edit` / `Preview`) dan navigasi keyboard secara langsung *(cek `npx tsc --noEmit`, `npm run lint`, dan `npm run build` sudah lulus)*.
- [ ] Deploy MVP ke Vercel / container Docker production.
