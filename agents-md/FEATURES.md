# FEATURES.md — Daftar Lengkap Fitur & Tracker Progres (FormaCV)

Dokumen ini merangkum seluruh fitur **FormaCV** berdasarkan [PRD.md](./PRD.md), [DESIGN.md](./DESIGN.md), [brand-guideline.md](./brand-guideline.md), dan [todo.md](../tasks/todo.md). Gunakan checkbox di bawah untuk memantau fitur yang sudah selesai dibuat dan yang belum.

**Legenda Status:**
- `[x]` Sudah dibuat & terverifikasi di kode (`src/`)
- `[ ]` Belum dibuat / tahap berikutnya

---

## Fase 1 — MVP (Core CV Builder & Guest Mode)

### 1.1 Halaman & Navigasi Dasar
- [x] **Landing Page (`/`)**
  - **Penjelasan:** Halaman depan bergaya editorial monokromatis dengan penjelasan nilai produk dan tombol CTA langsung ke `/editor` (*Guest Mode*, tanpa login).
  - **File:** `src/app/page.tsx`
- [x] **Galeri Template (`/templates`)** — *Branch: `feat/templates-page`*
  - **Penjelasan:** Halaman untuk melihat pratinjau visual 4 template ATS sebelum memilih dan langsung masuk ke `/editor` dengan template terpilih.
  - **File:** `src/app/templates/page.tsx`

### 1.2 Split-Screen Workspace & State Management
- [x] **Split-Screen Live Editor (`/editor`)**
  - **Penjelasan:** Layar desktop terbagi dua: Panel Kiri (Form Editor) dan Panel Kanan (Live Preview dokumen). Pada layar mobile/tablet otomatis beralih menjadi tab **Edit** dan **Preview**, lengkap dengan skeleton loading saat hidrasi `localStorage`.
  - **File:** `src/app/editor/page.tsx`, `src/components/editor/EditorPanel.tsx`, `src/components/preview/PreviewPanel.tsx`
- [x] **Auto-Save Lokal & Migrasi Skema**
  - **Penjelasan:** Penyimpanan otomatis ke `localStorage` (`formacv-storage`) via Zustand `persist` dengan debounce 300ms, indikator status (`Menyimpan...` / `Disimpan`), serta `schemaVersion` untuk migrasi data aman.
  - **File:** `src/store/use-resume-store.ts`, `src/lib/schemas/resume.ts`
- [x] **Undo / Redo (50 Langkah)**
  - **Penjelasan:** Riwayat perubahan isi CV menggunakan `zundo` (`temporal`), hanya melacak perubahan konten CV tanpa mengikutsertakan state UI sementara.
  - **File:** `src/store/use-resume-store.ts`, `src/components/editor/EditorTopBar.tsx`
- [x] **Document Switcher & Manajemen Multi-CV Lokal** — *Branch: `feat/document-switcher`*
  - **Penjelasan:** Dropdown di top bar untuk melihat daftar CV di `localStorage`, membuat CV baru, mengganti CV aktif, menduplikasi CV, menghapus CV, mengisi data contoh, dan mengosongkan form aktif.
  - **File:** `src/components/editor/DocumentSwitcher.tsx`

### 1.3 Guided Section Builder & Master Profile Controls
- [x] **Form Informasi Pribadi & Tautan Dinamis**
  - **Penjelasan:** Input Nama Lengkap, Headline/Posisi, Email, Nomor Telepon, Lokasi, serta daftar tautan (LinkedIn, GitHub, Portfolio, Custom Link) yang masing-masing dapat disembunyikan/ditampilkan.
  - **File:** `src/components/editor/BasicsForm.tsx`
- [x] **Form Section Standar & Kustom**
  - **Penjelasan:** Mendukung *Ringkasan Profesional* (dengan penghitung kata & badge `Ideal` 30–60 kata), *Pengalaman Kerja*, *Pendidikan*, *Proyek*, *Keahlian*, *Sertifikasi*, *Penghargaan*, *Pengalaman Relawan*, *Bahasa*, dan *Section Kustom*.
  - **File:** `src/components/editor/SectionForms.tsx`
- [x] **Master Profile Controls (Toggle Visibilitas & Reorder)**
  - **Penjelasan:** Saklar `isVisible` (ikon mata) di level *section*, *item*, hingga masing-masing *bullet point* untuk menyesuaikan CV tanpa menghapus data asli. Urutan section dan item dapat diubah via *drag-and-drop* (`@dnd-kit`) maupun tombol naik/turun yang ramah keyboard.
  - **File:** `src/components/editor/EditorPanel.tsx`, `src/components/editor/SectionForms.tsx`

### 1.4 Template, Layout Engine & Preview
- [x] **4 Template ATS Single-Column (HTML & PDF)**
  - **Penjelasan:** *Classic Academic* (gaya LaTeX / Jake's Resume), *Modern Minimalist*, *Compact*, dan *Executive Standard* — seluruhnya satu kolom, bebas tabel layout dan *skill bar*.
  - **File:** `src/components/preview/ResumeHtmlRenderer.tsx`, `src/components/pdf/PdfDocument.tsx`
- [x] **Pengaturan Layout, Ukuran Kertas, Font & Bahasa (`id` / `en`)**
  - **Penjelasan:** Popover pengaturan untuk memilih template, kerapatan spasi (`Compact` / `Normal` / `Relaxed`), font (`Inter`, `Roboto`, `EB Garamond`, `Merriweather`), ukuran kertas (`A4` / `Letter`), target halaman (`1` / `2`), dan bahasa label CV (`Indonesia` / `English`).
  - **File:** `src/components/editor/EditorTopBar.tsx`, `src/lib/template-tokens.ts`, `src/lib/i18n.ts`
- [x] **Kontrol Zoom, Batas Halaman & Peringatan Overflow**
  - **Penjelasan:** Zoom `- / + / Fit`, garis batas halaman putus-putus, penghitung `Halaman X / Y`, serta banner peringatan otomatis jika konten meluber (`> targetPages` atau halaman terakhir terisi `< 15%`) dengan tombol cepat ke `Compact`.
  - **File:** `src/components/preview/PreviewPanel.tsx`

### 1.5 ATS Checker, Ekspor & Backup
- [x] **Rule-Based ATS Readability Checker**
  - **Penjelasan:** Pemeriksaan deterministik 100% di browser (tanpa klaim skor prediktif palsu) dengan status `Good`, `Review`, dan `Fix` (kelengkapan kontak, teks placeholder, panjang summary, format tanggal seragam, panjang bullet `> 220` karakter, kata ganti orang pertama, dan overflow).
  - **File:** `src/lib/ats-linter.ts`, `src/components/editor/AtsCheckerModal.tsx`
- [x] **ATS X-Ray Mode (Simulasi Urutan Teks Preview)**
  - **Penjelasan:** Tab di panel preview untuk melihat ekstraksi teks linear dari atas ke bawah sesuai urutan pembacaan parser ATS.
  - **File:** `src/components/preview/AtsXRayView.tsx`
- [x] **Ekspor PDF Vector (`@react-pdf/renderer`)**
  - **Penjelasan:** Mengunduh file PDF *vector* dengan teks *selectable* langsung di browser (`ssr: false`), penamaan file otomatis `Nama_Lengkap_CV.pdf`, dan metadata PDF.
  - **File:** `src/components/pdf/PdfDocument.tsx`, `src/components/pdf/PdfExportButton.tsx`
- [x] **Export & Import Backup `.json`**
  - **Penjelasan:** Mengunduh seluruh data CV ke file `.json` dan mengimpornya kembali dengan validasi ketat Zod agar aman antar perangkat.
  - **File:** `src/components/editor/EditorTopBar.tsx`, `src/store/use-resume-store.ts`

### 1.6 Penyempurnaan & Pengujian MVP (Belum Dikerjakan)
- [x] **Registrasi Font Lokal `.ttf` untuk PDF** — *Branch: `feat/pdf-font-sync`*
  - **Penjelasan:** Menyimpan file `.ttf` (*Inter, Roboto, EB Garamond, Merriweather*) di `public/fonts/` dan mendaftarkannya via `Font.register` + menonaktifkan *hyphenation* agar tampilan font PDF 100% identik dengan HTML Preview, serta memperbarui tautan PDF menjadi *clickable* `<Link>`.
  - **File:** `public/fonts/`, `src/lib/pdf-fonts.ts`, `src/lib/url-utils.ts`, `src/lib/template-tokens.ts`, `src/app/layout.tsx`, `src/components/pdf/PdfDocument.tsx`
- [x] **Unit Test `ats-linter.ts` & Verifikasi Ekstraksi PDF** — *Branch: `test/ats-linter`*
  - **Penjelasan:** Pengujian otomatis via Vitest untuk seluruh 11 aturan `ats-linter.ts`, fungsi `extractLinearResumeText`, dan helper `url-utils.ts` (35 test cases lulus).
  - **File:** `vitest.config.ts`, `src/lib/__tests__/ats-linter.test.ts`, `src/lib/__tests__/url-utils.test.ts`

---

## Fase 2 — ATS Intelligence, Tailoring & AI

- [x] **ATS X-Ray Berbasis Ekstraksi File PDF Asli** — *Branch: `feat/pdf-xray-parser`*
  - **Penjelasan:** Meningkatkan *ATS X-Ray Mode* agar membaca teks langsung dari hasil generate PDF (menggunakan `pdfjs-dist`), bukan hanya dari JSON state, lengkap dengan fallback simulasi linear dan unit test.
  - **File:** `src/lib/pdf-text-extractor.ts`, `src/components/preview/AtsXRayView.tsx`, `src/lib/__tests__/pdf-text-extractor.test.ts`
- [x] **Job Description (JD) Keyword Matcher** — *Branch: `feat/jd-keyword-matcher`*
  - **Penjelasan:** Panel modal untuk menempelkan teks lowongan kerja, mengekstrak *hard skills* & kata kunci secara deterministik di browser, memisahkan 3 kategori (`matchedActive`, `matchedHiddenInMaster` dengan tombol 1-klik **Tampilkan**, dan `missing`), serta tombol **Duplikasi CV untuk Lowongan Ini**.
  - **File:** `src/lib/jd-matcher.ts`, `src/lib/__tests__/jd-matcher.test.ts`, `src/components/editor/JdMatcherModal.tsx`, `src/components/editor/EditorTopBar.tsx`, `src/app/editor/page.tsx`
- [x] **Collapsible File Tree Sidebar & Reorderable Workspace Tabs** — *Branch: `feat/workspace-tabs-filetree`*
  - **Penjelasan:** Sidebar *File Tree* di sisi luar editor (terinspirasi Overleaf/VS Code) untuk mengelola seluruh dokumen CV (*New File, Rename, Duplicate, Download `.json`, Upload/Import `.json`, Reorder, Delete*), dipadukan dengan *Workspace Tab Bar* bergaya tab browser di atas area kerja yang dapat diurutkan dengan *drag-and-drop* (`@dnd-kit/sortable`) dan ditutup (`×`) tanpa menghapus file CV.
  - **File:** `src/components/editor/FileTreeSidebar.tsx`, `src/components/editor/WorkspaceTabBar.tsx`, `src/store/use-resume-store.ts`, `src/components/editor/EditorTopBar.tsx`, `src/app/editor/page.tsx`, `src/lib/__tests__/workspace-tabs.test.ts`
- [ ] **AI Bullet-Point Enhancer (dengan Factuality Guardrails)** — *Branch: `feat/ai-bullet-enhancer`*
  - **Penjelasan:** Tombol *"Perbaiki dengan AI"* di tiap bullet untuk mengubah kalimat pasif menjadi format **Action → Context → Result (XYZ / STAR)** dalam ID/EN via Vercel AI SDK. Wajib disertai *guardrails* (dilarang mengarang angka/pengalaman, label teks AI, dan wajib konfirmasi user).
  - **Target:** `src/app/api/ai/enhance/route.ts`
- [ ] **Import CV Lama (PDF / DOCX → Form JSON)** — *Branch: `feat/cv-import`*
  - **Penjelasan:** Unggah PDF atau DOCX lama, ekstrak teks (`pdfjs-dist` / `unpdf`), lalu petakan ke skema `ResumeDocument` menggunakan LLM *Structured Output* (`generateObject`) dengan langkah review/konfirmasi sebelum disimpan.
  - **Target:** `src/app/api/ai/parse-cv/route.ts`

---

## Fase 3 — Cloud Sync, Multi-CV & Scaling

- [ ] **Autentikasi Opsional & Cloud Sync (Supabase)** — *Branch: `feat/cloud-sync`*
  - **Penjelasan:** Login opsional (Google / GitHub / Magic Link) dengan migrasi otomatis data `localStorage` ke database PostgreSQL (`profiles`, `cv_documents`) yang dilindungi *Row Level Security* (RLS), plus fitur hapus akun/data.
- [ ] **Dashboard Multi-CV (`/app`) & Version History** — *Branch: `feat/multi-cv-dashboard`*
  - **Penjelasan:** Halaman dashboard untuk mengelola banyak versi CV per posisi/perusahaan, riwayat versi (`cv_versions`), membandingkan dua versi, dan arsip/restore.
- [ ] **Pengaturan Akun & Privasi (`/settings`)** — *Branch: `feat/settings-page`*
  - **Penjelasan:** Halaman pengaturan bahasa UI, ekspor seluruh data, kebijakan privasi, dan penghapusan data permanen.
- [ ] **Job Application Tracker (Opsional)** — *Branch: `feat/job-tracker`*
  - **Penjelasan:** Pencatatan lamaran kerja sederhana (Perusahaan, Posisi, Versi CV yang dipakai, Tanggal lamar, Status: *Draft / Applied / Interview / Rejected / Offer*, Catatan).
- [ ] **Shareable Public Link (Opsional)** — *Branch: `feat/public-share`*
  - **Penjelasan:** Tautan web publik baca-saja untuk dibagikan ke perekrut lengkap dengan tombol unduh PDF.
- [ ] **Ekspor Format `.docx` (Future)** — *Branch: `feat/docx-export`*
  - **Penjelasan:** Ekspor dokumen CV ke format Microsoft Word (`.docx`) untuk pengguna yang membutuhkan penyuntingan lanjutan di Word.
- [ ] **Upgrade Mesin PDF ke Playwright / Typst (Opsional)** — *Branch: `feat/playwright-pdf`*
  - **Penjelasan:** Opsi migrasi mesin render PDF jika diperlukan kesamaan *pixel-perfect* 100% antara semantic HTML/CSS preview dan hasil cetak.
