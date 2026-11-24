# Task Breakdown & Todo List — FormaCV

Dokumen ini adalah satu-satunya daftar tugas (*single source of truth* task list) yang disusun menggunakan skill `planning-and-task-breakdown` berdasarkan spesifikasi di `agents-md/` (`PRD.md`, `DESIGN.md`, `FEATURES.md`, `GIT_RULES.md`, dan `brand-guideline.md`).

---

## Phase 1: Penyelesaian & Verifikasi MVP (Prioritas Utama)

### Task 1: Halaman Galeri Template (`/templates`) & Navigasi Landing Page ✅

**Description:** Merapikan perubahan working tree saat ini lalu membangun halaman Galeri Template (`/templates`, branch `feat/templates-page`) yang menampilkan pratinjau visual ke-4 template ATS single-column (*Classic Academic*, *Modern Minimalist*, *Compact*, *Executive Standard*). Pengguna dapat memilih salah satu template dan langsung diarahkan ke `/editor` dengan `config.templateId` serta `fontFamily` yang sesuai, ditambah tautan navigasi ke `/templates` dari Landing Page (`/`).

**Acceptance criteria:**
- [x] Halaman `/templates` menampilkan 4 kartu template ATS dengan karakteristik tipografi, rekomendasi pengguna, dan pratinjau mini bergaya monokromatis sesuai `brand-guideline.md`.
- [x] Mengklik tombol *"Pakai Template Ini"* pada salah satu template mengatur `config.templateId` pada dokumen aktif di `useResumeStore` dan mengarahkan pengguna ke `/editor`.
- [x] Landing Page (`src/app/page.tsx`) dan `EditorTopBar.tsx` memiliki navigasi yang bersih menuju `/templates`.

**Verification:**
- [x] Tests pass: `npx tsc --noEmit && npm run lint`
- [x] Build succeeds: `npm run build`
- [x] Manual check: Buka `/templates`, pilih template *Classic Academic* atau *Executive Standard*, dan pastikan `/editor` langsung merender CV dengan template tersebut.

**Dependencies:** None

**Files likely touched:**
- `src/app/templates/page.tsx`
- `src/app/page.tsx`
- `src/components/editor/EditorTopBar.tsx`
- `src/lib/default-resume.ts`

**Estimated scope:** Small (2-3 files)

---

### Task 2: Registrasi Font `.ttf` Lokal & Perbaikan Clickable Links pada Ekspor PDF ✅

**Description:** Menyelesaikan kesamaan tipografi antara Live HTML Preview dan hasil cetak `@react-pdf/renderer` (branch `feat/pdf-font-sync`). Menyimpan file font `.ttf` (*Inter, Roboto, EB Garamond, Merriweather*) di `public/fonts/`, mendaftarkannya via `Font.register` beserta penonaktifan *hyphenation* di `src/lib/pdf-fonts.ts`, memperbarui `PDF_FONT_FAMILIES` di `src/lib/template-tokens.ts`, serta mengganti elemen URL/email di `src/components/pdf/PdfDocument.tsx` menjadi komponen `<Link>` yang *clickable*.

**Acceptance criteria:**
- [x] `src/lib/pdf-fonts.ts` mendaftarkan font `.ttf` lokal untuk `Inter`, `Roboto`, `EB Garamond`, dan `Merriweather` serta menonaktifkan *auto-hyphenation* (`Font.registerHyphenationCallback((word) => [word])`).
- [x] `PDF_FONT_FAMILIES` di `src/lib/template-tokens.ts` memetakan ke-4 pilihan font ke keluarga font yang telah didaftarkan tanpa error saat mengekspor PDF.
- [x] Seluruh tautan kontak (`email`, `links`) dan URL proyek/sertifikasi di `src/components/pdf/PdfDocument.tsx` dirender dengan anotasi hyperlink aktif (`<Link src={...}>`).

**Verification:**
- [x] Tests pass: `npx tsc --noEmit && npm run lint`
- [x] Build succeeds: `npm run build`
- [x] Manual check: Ekspor PDF dengan keempat pilihan font (`inter`, `roboto`, `serif`, `georgia`) dan pastikan teks 100% *selectable*, tanpa pemenggalan kata otomatis, dan tautan dapat diklik.

**Dependencies:** None

**Files likely touched:**
- `public/fonts/` (16 aset `.ttf`)
- `src/lib/pdf-fonts.ts`
- `src/lib/url-utils.ts`
- `src/lib/template-tokens.ts`
- `src/app/layout.tsx`
- `src/components/pdf/PdfDocument.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 3: Setup Vitest & Unit Test Lengkap untuk `ats-linter.ts` ✅

**Description:** Mengonfigurasi test runner `vitest` di proyek dan menulis rangkaian pengujian unit otomatis (branch `test/ats-linter`) untuk memverifikasi seluruh 11 aturan deterministik pada `runAtsLint` (`src/lib/ats-linter.ts`) serta fungsi ekstraksi teks linear `extractLinearResumeText` (`src/components/preview/AtsXRayView.tsx`).

**Acceptance criteria:**
- [x] Script `"test": "vitest run"` terdaftar di `package.json` dan dapat mengeksekusi file test TypeScript dengan alias `@/`.
- [x] `src/lib/__tests__/ats-linter.test.ts` menguji seluruh skenario aturan `fix` (`contact-completeness`, `placeholder-text`), `review` (`empty-section`, `missing-dates`, `inconsistent-dates`, `long-bullet`, `first-person-pronoun`, `summary-word-count`, `non-standard-heading`, `page-overflow`), dan `good` (`core-structure-ok`).
- [x] Pengujian mencakup verifikasi `extractLinearResumeText` bahwa item dan section dengan `isVisible: false` tidak bocor ke hasil teks linear ATS.

**Verification:**
- [x] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [x] Build succeeds: `npm run build`
- [x] Manual check: Jalankan `npm test` di terminal dan pastikan seluruh test case hijau (2 files, 35 tests passed).

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/lib/__tests__/ats-linter.test.ts`
- `src/lib/__tests__/url-utils.test.ts`

**Estimated scope:** Small (4-5 files)

---

## Checkpoint 1: After Tasks 1–3 (MVP Complete)
- [x] Seluruh unit test lulus (`npm test`)
- [x] Pengecekan tipe dan linter bersih (`npx tsc --noEmit && npm run lint`)
- [x] Aplikasi berhasil di-build untuk production (`npm run build`)
- [x] Alur inti MVP (*Landing Page → Galeri Template → Split-Screen Editor → ATS Checker → Export PDF Vector & JSON Backup*) berjalan end-to-end tanpa error
- [ ] Cek responsivitas mobile (`Edit` / `Preview`) dan navigasi keyboard secara langsung
- [ ] Deploy MVP ke Vercel / container Docker production
- [x] Review dengan human sebelum lanjut ke Fase 2

---

## Phase 2: ATS Intelligence, Tailoring & AI

### Task 4: ATS X-Ray Mode Berbasis Ekstraksi Blob PDF Asli

**Description:** Meningkatkan `AtsXRayView.tsx` (branch `feat/pdf-xray-parser`) agar tidak hanya menyusun string dari state JSON, melainkan meng-generate blob PDF asli di memori menggunakan `pdf(<ResumePdfDocument doc={doc} />).toBlob()` dari `@react-pdf/renderer`, lalu mengekstrak urutan teks baris-demi-baris langsung dari biner PDF menggunakan `pdfjs-dist`.

**Acceptance criteria:**
- [x] `src/lib/pdf-text-extractor.ts` mampu menerima blob/buffer PDF hasil render `@react-pdf/renderer` dan mengembalikan teks linear per halaman menggunakan `pdfjs-dist`.
- [x] `AtsXRayView.tsx` menampilkan hasil ekstraksi teks langsung dari file PDF yang di-generate lengkap dengan indikator jumlah halaman & status pembacaan linear.
- [x] Jika ekstraksi PDF sedang dimuat atau berada di environment non-worker, UI menampilkan indikator loading yang tenang dan fallback ke `extractLinearResumeText(doc)`.

**Verification:**
- [x] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: Buka tab **ATS X-Ray** di panel preview pada CV 1 halaman dan 2 halaman, lalu verifikasi teks yang tampil berasal dari hasil parsing PDF asli.

**Dependencies:** Task 2

**Files likely touched:**
- `package.json`
- `package-lock.json`
- `src/lib/pdf-text-extractor.ts`
- `src/components/preview/AtsXRayView.tsx`
- `src/lib/__tests__/pdf-text-extractor.test.ts`

**Estimated scope:** Small (3 files)

---

### Task 5: Job Description (JD) Keyword Matcher & Deteksi Master Profile Tersembunyi

**Description:** Membangun fitur pencocokan kata kunci lowongan kerja (branch `feat/jd-keyword-matcher`). Pengguna dapat menempelkan teks *Job Description* (JD); sistem mengekstrak *hard skills* & kata kunci teknis, lalu membandingkannya dengan isi CV aktif dan membedakan secara jelas antara: (1) **"Sudah tertulis di CV aktif"**, (2) **"Ada di Master Profile tapi masih disembunyikan (`isVisible: false`)"**, dan (3) **"Belum ada di CV"**.

**Acceptance criteria:**
- [ ] `src/lib/jd-matcher.ts` mengekstrak kata kunci penting dari teks JD dan mengklasifikasikannya ke dalam 3 kategori (`matchedActive`, `matchedHiddenInMaster`, `missing`) beserta unit test-nya.
- [ ] `src/components/editor/JdMatcherModal.tsx` menyediakan input teks JD, menampilkan daftar keyword per kategori (tanpa klaim palsu "100% lolos ATS"), serta tombol cepat untuk mengaktifkan item tersembunyi atau menduplikasi CV untuk lowongan tersebut.
- [ ] Tombol akses **JD Matcher** terintegrasi rapi di `EditorTopBar.tsx`.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Sembunyikan salah satu proyek/pengalaman yang memuat kata `"Docker"`, tempelkan JD yang membutuhkan `"Docker"`, dan pastikan sistem mendeteksinya sebagai *"Ada di Master Profile (Tersembunyi)"*.

**Dependencies:** Task 3

**Files likely touched:**
- `src/lib/jd-matcher.ts`
- `src/lib/__tests__/jd-matcher.test.ts`
- `src/components/editor/JdMatcherModal.tsx`
- `src/components/editor/EditorTopBar.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 6: AI Bullet-Point Enhancer dengan Factuality Guardrails (`/api/ai/enhance`)

**Description:** Mengimplementasikan fitur *"Perbaiki dengan AI"* pada `BulletListEditor.tsx` menggunakan Vercel AI SDK (branch `feat/ai-bullet-enhancer`). Mengubah kalimat pasif atau catatan kasar menjadi pola **Action → Context → Result (XYZ / STAR)** sesuai bahasa dokumen (`id` / `en`) dengan *factuality guardrails* ketat: dilarang mengarang angka/metrik yang tidak ada di input pengguna, ditandai badge AI, dan wajib dikonfirmasi pengguna sebelum menggantikan teks asli.

**Acceptance criteria:**
- [ ] Endpoint `src/app/api/ai/enhance/route.ts` memvalidasi input dengan Zod dan memanggil model AI dengan aturan sistem yang melarang penambahan metrik/pengalaman fiktif.
- [ ] `BulletListEditor.tsx` menampilkan tombol aksi AI per bullet yang membuka pratinjau perbandingan (*Teks Asli* vs *Saran AI*) dengan label penanda AI yang jelas.
- [ ] Teks bullet di `useResumeStore` hanya berubah setelah pengguna mengklik tombol **"Terapkan"**, dan dapat dibatalkan dengan Undo (`Ctrl+Z`).

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Masukkan bullet tanpa angka (misal *"Membuat halaman dashboard admin"*), jalankan AI Enhancer, dan pastikan saran AI menggunakan kata kerja aktif tanpa mengarang persentase palsu.

**Dependencies:** Task 3

**Files likely touched:**
- `package.json`
- `src/app/api/ai/enhance/route.ts`
- `src/components/editor/BulletListEditor.tsx`

**Estimated scope:** Small (3 files)

---

### Task 7: Import CV Lama (PDF / DOCX → Form JSON) dengan Langkah Review (`/api/ai/parse-cv`)

**Description:** Membangun fitur impor CV lama dari file PDF atau teks/DOCX ke struktur `ResumeDocument` (branch `feat/cv-import`). Mengekstrak teks mentah dari file yang diunggah, memetakannya ke skema Zod `ResumeDocumentSchema` menggunakan LLM *Structured Output*, dan menampilkan modal pratinjau & konfirmasi kepada pengguna sebelum menyimpannya sebagai dokumen baru di `useResumeStore`.

**Acceptance criteria:**
- [ ] Endpoint `src/app/api/ai/parse-cv/route.ts` menerima teks hasil ekstraksi CV dan mengembalikan objek JSON yang valid sesuai `ResumeDocumentSchema`.
- [ ] `src/components/editor/CvImportModal.tsx` memungkinkan unggah file PDF/DOCX, menampilkan ringkasan hasil ekstraksi (Nama, Jumlah Pengalaman, Pendidikan, Keahlian) beserta peringatan field yang perlu ditinjau pengguna.
- [ ] Pengguna harus mengklik **"Konfirmasi & Buat CV"** sebelum data hasil ekstraksi dimasukkan sebagai dokumen baru di `DocumentSwitcher.tsx`.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Unggah file PDF CV contoh melalui modal Import, tinjau ringkasan hasil ekstraksi, klik konfirmasi, dan pastikan seluruh section terisi di editor tanpa merusak dokumen yang sudah ada.

**Dependencies:** Task 4, Task 6

**Files likely touched:**
- `src/app/api/ai/parse-cv/route.ts`
- `src/components/editor/CvImportModal.tsx`
- `src/components/editor/DocumentSwitcher.tsx`

**Estimated scope:** Small (3 files)

---

## Checkpoint 2: After Tasks 4–7 (Phase 2 Complete)
- [ ] Seluruh unit test lulus (`npm test`), tipe & lint bersih (`npx tsc --noEmit && npm run lint`), dan build sukses (`npm run build`)
- [ ] Guardrails AI terverifikasi: tidak ada perubahan teks otomatis tanpa konfirmasi pengguna dan tidak ada klaim metrik fiktif
- [ ] Mode Guest tetap berfungsi penuh meskipun env API AI belum diisi (fitur AI menampilkan pesan konfigurasi yang sopan tanpa membuat aplikasi crash)
- [ ] Review dengan human sebelum lanjut ke Fase 3

---

## Phase 3: Cloud Sync, Multi-CV Dashboard & Privasi

### Task 8: Autentikasi Opsional Supabase, Skema RLS & Migrasi `localStorage`

**Description:** Mengintegrasikan Supabase Auth dan PostgreSQL (branch `feat/cloud-sync`) sebagai fitur *opt-in* tanpa menghilangkan *Guest Mode*. Menyediakan skrip migrasi SQL (`profiles`, `cv_documents`, `cv_versions` dengan *Row Level Security*), tombol Login opsional, serta sinkronisasi dua arah yang memigrasikan dokumen dari `localStorage` ke akun cloud saat pengguna masuk.

**Acceptance criteria:**
- [ ] File migrasi SQL di `supabase/migrations/` mendefinisikan tabel `profiles`, `cv_documents`, dan `cv_versions` dengan kebijakan RLS ketat (`auth.uid() = user_id`).
- [ ] Pengguna *Guest* tetap dapat memakai `/editor` tanpa login; pengguna yang login dapat menyinkronkan dokumen `localStorage` ke Supabase tanpa kehilangan draf lokal.
- [ ] Indikator status simpan di `EditorTopBar.tsx` menampilkan status sinkronisasi cloud jika pengguna sedang login.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buat CV di Guest Mode, lakukan login, dan verifikasi dokumen lokal otomatis tersimpan ke tabel `cv_documents` milik pengguna tersebut.

**Dependencies:** Task 3

**Files likely touched:**
- `supabase/migrations/0001_init_formacv.sql`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/sync.ts`
- `src/components/editor/EditorTopBar.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 9: Dashboard Multi-CV (`/app`), Version History & Pengaturan Privasi (`/settings`)

**Description:** Membangun halaman Dashboard `/app` dan halaman Pengaturan `/settings` (branch `feat/multi-cv-dashboard`). Pengguna dapat melihat daftar seluruh versi CV (baik dari `localStorage` maupun Cloud), membuat snapshot versi bernama (`cv_versions`), membandingkan perubahan antar versi, mengekspor seluruh data akun, atau menghapus seluruh data/akun secara permanen.

**Acceptance criteria:**
- [ ] Halaman `/app` menampilkan kartu daftar CV dengan metadata (`title`, `targetRole`, `templateId`, `updatedAt`), aksi cepat (Edit, Duplikasi, Simpan Snapshot Versi, Hapus), dan riwayat snapshot.
- [ ] Halaman `/settings` menyediakan fitur **Ekspor Semua Data (`.json`)**, **Bersihkan Penyimpanan Lokal**, dan **Hapus Akun & Data Cloud Permanen**.
- [ ] Desain kedua halaman mematuhi palet monokromatis netral di `brand-guideline.md`.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buka `/app`, buat versi baru untuk target role tertentu, simpan snapshot versi, dan uji fitur ekspor/hapus data di `/settings`.

**Dependencies:** Task 8

**Files likely touched:**
- `src/app/app/page.tsx`
- `src/app/settings/page.tsx`
- `src/components/editor/DocumentSwitcher.tsx`

**Estimated scope:** Small (3 files)

---

## Checkpoint 3: After Tasks 8–9 (Phase 3 Complete)
- [ ] Semua tes lulus (`npm test`), build production bersih (`npm run build`)
- [ ] Kebijakan RLS dan mekanisme hapus data permanen bekerja sesuai persyaratan privasi PRD Bagian 6.3
- [ ] Siap untuk peluncuran penuh atau penambahan ekstensi opsional (`.docx` export, public share link, job tracker)
