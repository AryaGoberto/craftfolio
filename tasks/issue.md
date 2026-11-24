# ISSUE-010: Dashboard Multi-CV Pengguna (`/dashboard`) dengan Kartu Visual, Menu `⋮` & Direct PDF Download

| Atribut | Detail |
| :--- | :--- |
| **Referensi Plan** | `tasks/todo.md` — Phase 3, **Task 10** |
| **Branch Git** | `feat/user-cv-dashboard` |
| **Target Eksekutor** | Junior Developer / AI Coding Model Ringan |
| **Estimasi Scope** | Medium (7–8 file) |

---

## 1. Ide Inti & Problem Statement (*Idea Refine*)

> **How Might We:** Bagaimana kita menyediakan ruang kendali terpusat (`/dashboard`) bagi pengguna yang sudah login agar mereka dapat memantau seluruh CV & draf mereka secara visual, mengunduh file PDF siap kirim dalam 1 klik tanpa membuka editor, serta merapikan banyak versi lamaran lewat kartu bermenu `⋮` yang tersinkronisasi langsung dengan Cloud Firestore?

### Arah Solusi yang Dipilih
1. **Kartu CV dengan Pratinjau Kertas A4 Nyata + Menu `⋮` (Gaya Google Docs / Notion):**
   - Bagian atas kartu merender `<ResumeHtmlRenderer />` berskala kecil (`pointer-events-none`) sesuai template & font masing-masing CV agar mudah dikenali secara visual.
   - Bagian bawah kartu menampilkan judul CV, `targetRole` / nama lengkap, badge status otomatis, waktu terakhir diubah, tombol cepat **Download PDF**, serta tombol **menu titik tiga `⋮`** (*Buka di Editor, Rename, Duplikasi CV, Download PDF, Export `.json`, dan Hapus dengan konfirmasi*).
2. **Penanda Status Otomatis (`Siap` vs `Draf`) Tanpa Input Manual:**
   - Memanfaatkan `runAtsLint(doc)` yang sudah ada di `src/lib/ats-linter.ts`:
     - **`Draf`** — Jika `lint.summary.fix > 0` (misal nama/email wajib kosong atau masih berisi teks placeholder contoh bawaan).
     - **`Siap`** — Jika `lint.summary.fix === 0`.
3. **On-Demand PDF Generation (Anti-Freeze Performa):**
   - File PDF hanya di-generate *on-demand* (`downloadResumePdf(doc)` lewat dynamic import `@react-pdf/renderer` + `@/components/pdf/PdfDocument`) tepat saat tombol **Download PDF** pada kartu diklik, sehingga halaman `/dashboard` terbuka instan (`< 100ms`) meskipun ada banyak kartu CV.
4. **Sinkronisasi Penuh dengan Cloud Firestore & Navigasi Pasca-Login:**
   - Memasang `<CloudSyncManager />` di `/dashboard` agar daftar CV selalu menarik data terbaru dari `users/{uid}/resumes` dan aksi *Buat Baru / Rename / Duplikasi / Hapus* langsung tersinkron ke Firestore.
   - Menghubungkan navigasi menuju `/dashboard` dari navbar Landing Page (`LandingAuthActions.tsx` — termasuk redirect pasca-login) dan dropdown akun di `EditorTopBar.tsx`.

### Yang TIDAK Dikerjakan (*Not Doing*)
- **TIDAK** me-mount `<PDFDownloadLink>` aktif di seluruh kartu secara bersamaan saat halaman dibuka (wajib *on-demand click*).
- **TIDAK** menggabungkan fitur kompleks *version diff viewer* baris-demi-baris di task ini (variasi per lowongan dikelola lewat aksi **Duplikasi CV**).
- **TIDAK** melempar (*redirect* paksa) pengguna saat Firebase Auth masih memulihkan sesi (`authLoading`); tampilkan *skeleton cards* terlebih dahulu, lalu tampilkan kartu ajakan login (`AuthModal`) yang sopan bila belum login.

---

## 2. Daftar File yang Diubah / Dibuat

| Aksi | Path File | Ringkasan |
| :--- | :--- | :--- |
| **Buat** | `src/lib/pdf-download.ts` | Helper async *on-demand* `downloadResumePdf(doc)` dengan dynamic import `@react-pdf/renderer` |
| **Ubah** | `src/components/pdf/PdfExportButton.tsx` | Gunakan `downloadResumePdf(doc)` bersama agar bebas duplikasi kode |
| **Buat** | `src/lib/dashboard-utils.ts` | Pure helpers untuk status CV (`draft` vs `ready`), filter pencarian, pengurutan, & format tanggal |
| **Buat** | `src/components/dashboard/CvDocumentCard.tsx` | Kartu CV visual dengan pratinjau kertas A4 mini, badge *Siap/Draf*, tombol Download PDF, inline rename, & menu `⋮` |
| **Buat** | `src/app/dashboard/page.tsx` | Halaman `/dashboard` lengkap dengan `<CloudSyncManager />`, skeleton loading, state belum login, search/filter/sort, & grid kartu |
| **Ubah** | `src/components/auth/LandingAuthActions.tsx` & `src/components/editor/EditorTopBar.tsx` | Tambah tautan **Dashboard** bagi pengguna login & redirect pasca-login ke `/dashboard` |
| **Buat** | `src/lib/__tests__/dashboard-utils.test.ts` | Unit test untuk klasifikasi `draft`/`ready`, filter pencarian, dan pengurutan dokumen |

---

## 3. Panduan Implementasi Langkah demi Langkah

### Langkah 1 — Buat `src/lib/pdf-download.ts` & Perbarui `PdfExportButton.tsx`
1. Buat fungsi `export async function downloadResumePdf(doc: ResumeDocument): Promise<void>`:
   - Lakukan dynamic import `const [{ createElement }, { pdf }, { ResumePdfDocument }] = await Promise.all([import("react"), import("@react-pdf/renderer"), import("@/components/pdf/PdfDocument")])`.
   - Generate blob: `const blob = await pdf(createElement(ResumePdfDocument, { doc })).toBlob()`.
   - Sanitasi nama file `${safeName}_CV.pdf` dan trigger download via `<a download>` + `URL.revokeObjectURL`.
2. Perbarui `src/components/pdf/PdfExportButton.tsx` agar memanggil `await downloadResumePdf(doc)`.

### Langkah 2 — Buat Pure Helpers di `src/lib/dashboard-utils.ts`
1. `getCvCompletionStatus(doc: ResumeDocument): "ready" | "draft"`:
   - Jalankan `runAtsLint(doc)`; kembalikan `"draft"` jika `summary.fix > 0`, selain itu `"ready"`.
2. `filterAndSortDashboardDocs(docs: ResumeDocument[], options: { query: string; statusFilter: "all" | "ready" | "draft"; sortBy: "updatedAt" | "title" }): ResumeDocument[]`:
   - Filter berdasarkan `statusFilter` (`all`, `ready`, `draft`).
   - Filter pencarian *case-insensitive* pada `doc.title`, `doc.targetRole`, dan `doc.basics.fullName`.
   - Urutkan berdasarkan `updatedAt` (terbaru ke terlama) atau `title` (`localeCompare` A–Z).

### Langkah 3 — Buat Komponen Kartu `src/components/dashboard/CvDocumentCard.tsx`
- Ikuti palet monokromatis `agents-md/brand-guideline.md`:
  - **Area Pratinjau Atas:** Miniatur `<ResumeHtmlRenderer doc={doc} />` dengan `width: "794px"` dan `transform: scale(0.28)` (`transformOrigin: "top left"`, `pointer-events-none`). Klik pada area pratinjau memanggil `onOpenEditor()`.
  - **Badge Status:** Pojok kanan atas / samping judul menampilkan badge **`Siap`** (`#ECFDF5` / `#065F46`) atau **`Draf`** (`#FFFBEB` / `#92400E`).
  - **Area Metadata & Aksi Bawah:**
    - Judul dokumen (mendukung *inline rename* dengan `Enter`/`onBlur` simpan dan `Escape` batal), subjudul (`targetRole` / `basics.fullName`), label template, dan waktu ubah terakhir.
    - Tombol cepat **Download PDF** (menampilkan spinner `Loader2` pada kartu tersebut selama `downloadResumePdf(doc)` berjalan).
    - Tombol **Menu `⋮` (`MoreVertical`)** dengan penutupan *click-outside* & `Escape`:
      1. **Buka di Editor**
      2. **Rename**
      3. **Duplikasi CV**
      4. **Download PDF**
      5. **Export Backup `.json`**
      6. **Hapus CV** (dengan konfirmasi klik kedua *"Klik lagi untuk hapus"* agar aman; nonaktif jika hanya tersisa 1 CV).

### Langkah 4 — Buat Halaman `src/app/dashboard/page.tsx` & Integrasi Navigasi
1. Di `src/app/dashboard/page.tsx`:
   - Render `<CloudSyncManager />` di puncak halaman.
   - Header bersih: `<BrandLogo />` + `FormaCV`, badge status sinkronisasi Cloud, tombol **Galeri Template**, **Buka Editor**, dan **Keluar**.
   - Jika `!hasHydrated || authLoading`: tampilkan skeleton 3 kartu CV.
   - Jika `!authUser`: tampilkan kartu ajakan login bersih dengan tombol **"Masuk / Daftar Akun"** (membuka `<AuthModal />`) dan tautan **"Lanjut ke Editor (Guest Mode)"**.
   - Jika `authUser` aktif: tampilkan ringkasan jumlah CV (*Total, Siap, Draf*), toolbar **Cari CV** + filter **`Semua | Siap | Draf`** + sortir + tombol **`Import .json`** + tombol utama **`+ Buat CV Baru`**, diikuti grid kartu `<CvDocumentCard />`.
2. Di `src/components/auth/LandingAuthActions.tsx`:
   - Tambahkan tautan **Dashboard** (`/dashboard`) saat `authUser` aktif, dan arahkan `onAuthSuccess` ke `router.push("/dashboard")`.
3. Di `src/components/editor/EditorTopBar.tsx`:
   - Tambahkan tautan **Dashboard CV Saya** (`/dashboard`) di dropdown menu akun pengguna dan menu `⋯`.

### Langkah 5 — Buat Unit Test `src/lib/__tests__/dashboard-utils.test.ts`
- Uji `getCvCompletionStatus`:
  - Sample bawaan (*"Raka Pratama"*) atau CV dengan email/nama kosong → `"draft"`.
  - CV valid dengan kontak lengkap dan nama asli pengguna → `"ready"`.
- Uji `filterAndSortDashboardDocs`:
  - Filter berdasarkan status (`all`, `ready`, `draft`).
  - Pencarian berdasarkan judul CV, `targetRole`, maupun `fullName`.
  - Pengurutan berdasarkan `updatedAt` terbaru dan `title` A–Z.

---

## 4. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] Halaman `/dashboard` tersinkron penuh dengan Cloud Firestore (`<CloudSyncManager />`), menangani state skeleton saat loading auth, dan menampilkan prompt login yang rapi jika belum masuk akun.
- [x] Setiap CV tampil sebagai kartu visual (`CvDocumentCard.tsx`) dengan pratinjau kertas A4 mini, badge otomatis **Siap** / **Draf**, tombol **Download PDF langsung** (*on-demand* tanpa masuk editor), dan menu **`⋮`** (*Buka di Editor, Rename, Duplikasi, Download PDF, Export `.json`, Hapus dengan konfirmasi*).
- [x] Tersedia pencarian, filter tab (*Semua / Siap / Draf*), sortir, serta tombol **Buat CV Baru** & **Import `.json`**.
- [x] Navigasi ke `/dashboard` terhubung dari navbar Landing Page dan `EditorTopBar.tsx`.
- [x] Desain mematuhi palet monokromatis `agents-md/brand-guideline.md` dan seluruh unit test di `src/lib/__tests__/dashboard-utils.test.ts` lulus (7 test files, 69 tests passed).

---

## 5. Verifikasi & GitHub Flow

- [x] `npm test` — 7 test files, 69 tests passed.
- [x] `npx tsc --noEmit && npm run lint` — 0 error, 0 warning.
- [x] `npm run build` — exit code 0 (`/dashboard` prerendered cleanly).

```bash
npm test
npx tsc --noEmit && npm run lint
npm run build
```
