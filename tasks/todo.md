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
- [x] `src/lib/jd-matcher.ts` mengekstrak kata kunci penting dari teks JD dan mengklasifikasikannya ke dalam 3 kategori (`matchedActive`, `matchedHiddenInMaster`, `missing`) beserta unit test-nya.
- [x] `src/components/editor/JdMatcherModal.tsx` menyediakan input teks JD, menampilkan daftar keyword per kategori (tanpa klaim palsu "100% lolos ATS"), serta tombol cepat untuk mengaktifkan item tersembunyi atau menduplikasi CV untuk lowongan tersebut.
- [x] Tombol akses **JD Matcher** terintegrasi rapi di `EditorTopBar.tsx`.

**Verification:**
- [x] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: Sembunyikan salah satu proyek/pengalaman yang memuat kata `"Docker"`, tempelkan JD yang membutuhkan `"Docker"`, dan pastikan sistem mendeteksinya sebagai *"Ada di Master Profile (Tersembunyi)"*.

**Dependencies:** Task 3

**Files likely touched:**
- `src/lib/jd-matcher.ts`
- `src/lib/__tests__/jd-matcher.test.ts`
- `src/components/editor/JdMatcherModal.tsx`
- `src/components/editor/EditorTopBar.tsx`
- `src/app/editor/page.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 6: Collapsible File Tree Sidebar & Reorderable Workspace Tabs (`feat/workspace-tabs-filetree`) ✅

**Description:** Mengembangkan manajemen multi-CV bergaya IDE/Overleaf di luar area form editor CV (branch `feat/workspace-tabs-filetree`). Menambahkan **Collapsible File Tree Sidebar** di sisi paling kiri layar untuk mengelola seluruh dokumen CV (*New File, Inline Rename, Duplicate, Download `.json`, Upload/Import `.json`, Sort/Reorder, Delete*) serta **Workspace Tab Bar** bergaya tab browser di atas area kerja (*Split-Screen Editor + Preview*) yang memungkinkan pengguna membuka beberapa CV sekaligus sebagai tab, mengurutkan posisi tab dengan *drag-and-drop* (`@dnd-kit/sortable`), dan menutup tab (`×`) tanpa menghapus dokumen dari File Tree.

**Acceptance criteria:**
- [x] `useResumeStore` mendukung state `openTabIds: string[]`, `fileOrder: string[]`, dan `isFileTreeOpen: boolean` beserta action `openTab`, `closeTab`, `reorderTabs`, `reorderFiles`, dan `toggleFileTree` (tanpa mencemari riwayat Undo/Redo `zundo` saat hanya berpindah/menutup tab).
- [x] `src/components/editor/FileTreeSidebar.tsx` menampilkan panel sidebar kiri yang dapat dibuka/tutup (*collapsible*, lebar `~240px` di desktop dan drawer di mobile) dengan header aksi (`+` CV Baru, Sortir, Tutup Sidebar), daftar seluruh file CV yang dapat diurutkan, serta menu konteks `⋮` per file (*Rename, Duplikasi, Download `.json`, Delete*) dan aksi *Upload/Import `.json`*.
- [x] `src/components/editor/WorkspaceTabBar.tsx` menampilkan barisan tab dokumen CV yang sedang dibuka di atas area kerja, mendukung *drag-and-drop* urutan tab via `@dnd-kit/sortable`, klik ganda untuk *inline rename*, tombol `×` untuk menutup tab (dokumen tetap aman di File Tree), dan tombol `+` untuk membuka/membuat tab CV baru.
- [x] Desain visual tetap mematuhi palet monokromatis terang di `brand-guideline.md` (`#F4F4F5` / `#FAFAFA` untuk sidebar & tab non-aktif, `#FFFFFF` untuk tab aktif, border `#E4E4E7`) dan tidak mempersempit area *Split-Screen Editor + Live Preview* saat sidebar ditutup.

**Verification:**
- [x] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: Buat 3 file CV di File Tree, buka ketiganya sebagai tab, geser urutan tab dengan *drag-and-drop*, tutup salah satu tab dengan `×` (pastikan file masih ada di File Tree), lalu uji *Rename*, *Download*, dan *Delete* dari menu `⋮` di File Tree.

**Dependencies:** Task 3

**Files likely touched:**
- `src/store/use-resume-store.ts`
- `src/components/editor/FileTreeSidebar.tsx`
- `src/components/editor/WorkspaceTabBar.tsx`
- `src/components/editor/EditorTopBar.tsx`
- `src/app/editor/page.tsx`
- `src/lib/__tests__/workspace-tabs.test.ts`

**Estimated scope:** Medium (5-6 files)

---

### Task 7: AI Bullet-Point Enhancer dengan Factuality Guardrails (`/api/ai/enhance`)

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

### Task 8: Import CV Lama (PDF / DOCX → Form JSON) dengan Langkah Review (`/api/ai/parse-cv`)

**Description:** Membangun fitur impor CV lama dari file PDF atau teks/DOCX ke struktur `ResumeDocument` (branch `feat/cv-import`). Mengekstrak teks mentah dari file yang diunggah, memetakannya ke skema Zod `ResumeDocumentSchema` menggunakan LLM *Structured Output*, dan menampilkan modal pratinjau & konfirmasi kepada pengguna sebelum menyimpannya sebagai dokumen baru di `useResumeStore` (otomatis muncul di File Tree dan dibuka di tab baru).

**Acceptance criteria:**
- [ ] Endpoint `src/app/api/ai/parse-cv/route.ts` menerima teks hasil ekstraksi CV dan mengembalikan objek JSON yang valid sesuai `ResumeDocumentSchema`.
- [ ] `src/components/editor/CvImportModal.tsx` memungkinkan unggah file PDF/DOCX, menampilkan ringkasan hasil ekstraksi (Nama, Jumlah Pengalaman, Pendidikan, Keahlian) beserta peringatan field yang perlu ditinjau pengguna.
- [ ] Pengguna harus mengklik **"Konfirmasi & Buat CV"** sebelum data hasil ekstraksi dimasukkan sebagai dokumen baru di File Tree & tab kerja.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Unggah file PDF CV contoh melalui modal Import, tinjau ringkasan hasil ekstraksi, klik konfirmasi, dan pastikan seluruh section terisi di editor tanpa merusak dokumen yang sudah ada.

**Dependencies:** Task 4, Task 6, Task 7

**Files likely touched:**
- `src/app/api/ai/parse-cv/route.ts`
- `src/components/editor/CvImportModal.tsx`
- `src/components/editor/FileTreeSidebar.tsx`

**Estimated scope:** Small (3 files)

---

## Checkpoint 2: After Tasks 4–8 (Phase 2 Complete)
- [ ] Seluruh unit test lulus (`npm test`), tipe & lint bersih (`npx tsc --noEmit && npm run lint`), dan build sukses (`npm run build`)
- [ ] Manajemen multi-CV via File Tree Sidebar & Reorderable Tabs berjalan mulus tanpa merusak state Undo/Redo dokumen
- [ ] Guardrails AI terverifikasi: tidak ada perubahan teks otomatis tanpa konfirmasi pengguna dan tidak ada klaim metrik fiktif
- [ ] Mode Guest tetap berfungsi penuh meskipun env API AI belum diisi (fitur AI menampilkan pesan konfigurasi yang sopan tanpa membuat aplikasi crash)
- [ ] Review dengan human sebelum lanjut ke Fase 3

---

## Phase 3: Firebase Auth, Cloud Firestore Sync & Multi-CV Dashboard

### Task 9: Autentikasi Firebase (Google & Email/Password) + Sinkronisasi Cloud Firestore (`feat/firebase-auth-firestore`)

**Description:** Mengintegrasikan **Firebase Authentication** (*Sign In / Sign Up with Google* serta *Email & Password* biasa + *Reset Password*) dan **Cloud Firestore** (branch `feat/firebase-auth-firestore`) agar seluruh dokumen CV (`documents`) serta tata letak lembar kerja (`fileOrder`, `openTabIds`, `activeDocumentId`) milik pengguna tersimpan aman di cloud dan tersinkronisasi lintas perangkat. Fitur ini bersifat **opt-in (Local-First Hybrid)**: pengguna *Guest Mode* tetap dapat memakai `/editor` dan mengunduh PDF 100% tanpa login, dan ketika mereka memutuskan untuk daftar/login, draf CV lokal di `localStorage` otomatis digabungkan (*two-way timestamp merge*) ke Cloud Firestore tanpa kehilangan data yang sudah diketik.

#### Hasil Penyempurnaan Ide (*Idea Refine*)
- **Problem Statement (*How Might We*):** Bagaimana kita memungkinkan pengguna menyimpan dan menyinkronkan seluruh dokumen CV serta workspace mereka ke Cloud menggunakan Firebase Auth (Google & Email/Password) dan Cloud Firestore—tanpa mengorbankan kecepatan ketik instan (`< 100ms`), tanpa menghapus *zero-friction Guest Mode*, dan tanpa menimpa draf lokal saat pengguna baru pertama kali login?
- **Keputusan Arsitektur Utama (*Local-First + Debounced Firestore Sync*):**
  1. **Zustand + `localStorage` Tetap Menjadi Buffer UI Instan:** Mengetik di form tetap memperbarui Zustand secara sinkron (`< 100ms`). Sinkronisasi ke Firestore dijalankan di latar belakang dengan **debounce `1500ms`** agar hemat kuota *write* Firestore.
  2. **Algoritma *Guest-to-Cloud Smart Merge* Saat Login:** Saat pengguna masuk ke akun Firebase, sistem **dilarang** langsung menimpa `localStorage` dengan data cloud secara buta. Sistem membandingkan `doc.id` dan `updatedAt` antara dokumen lokal dan dokumen di koleksi `users/{uid}/resumes`:
     - Dokumen lokal baru yang belum ada di Firestore (dan bukan sekadar sample bawaan yang belum pernah diedit jika di cloud sudah ada CV) langsung di-upload ke Firestore.
     - Dokumen yang hanya ada di Firestore ditarik ke store lokal.
     - Jika `doc.id` sama-sama ada di lokal dan Firestore, dokumen dengan timestamp `updatedAt` paling baru yang dipakai.
  3. **Graceful Fallback Tanpa `.env.local`:** Jika variabel environment `NEXT_PUBLIC_FIREBASE_*` belum diisi (misal saat testing lokal, CI build, atau mode Guest murni), aplikasi **tidak boleh crash**. Helper `isFirebaseConfigured()` akan menonaktifkan inisialisasi SDK dan menampilkan informasi konfigurasi yang sopan saat modal login dibuka.
- **Yang TIDAK Dikerjakan (*Not Doing*):**
  - **TIDAK** memaksa login (*hard auth wall*) untuk mengakses `/editor` atau mengunduh PDF.
  - **TIDAK** menggunakan Firebase Admin SDK / SSR session cookies yang rumit; seluruh autentikasi dan baca/tulis Firestore menggunakan Firebase Client Modular SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`).
  - **TIDAK** menulis ke Firestore pada setiap ketikan huruf tanpa debounce (wajib debounce `1500ms`).
  - **TIDAK** membuat halaman `/login` terpisah yang membuat pengguna keluar dari `/editor`; gunakan modal `AuthModal.tsx` langsung di atas editor.

#### Panduan Implementasi Langkah demi Langkah (Untuk Junior Developer / AI Model Ringan)

1. **Langkah 1 — Install Dependensi & Buat `.env.example`:**
   - Install Firebase Web SDK:
     ```bash
     npm install firebase
     ```
   - Buat/perbarui file `.env.example` di root proyek dengan daftar variabel publik Firebase:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
     NEXT_PUBLIC_FIREBASE_APP_ID=
     ```

2. **Langkah 2 — Buat Inisialisasi Firebase Aman di `src/lib/firebase/config.ts`:**
   - Buat fungsi `isFirebaseConfigured(): boolean` yang mengembalikan `true` hanya jika `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` dan `process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID` terisi string non-kosong.
   - Jika `isFirebaseConfigured() === true`, inisialisasi Firebase App menggunakan singleton pattern (`getApps().length ? getApp() : initializeApp(firebaseConfig)`), lalu ekspor instance `auth = getAuth(app)` dan `db = getFirestore(app)`.
   - Jika `false`, ekspor `app = null`, `auth = null`, dan `db = null` agar `npm test` dan `npm run build` tidak pernah gagal meskipun env kosong.

3. **Langkah 3 — Buat Helper Auth di `src/lib/firebase/auth.ts`:**
   - Bungkus fungsi modular `firebase/auth`:
     - `signInWithGoogle()` → menggunakan `new GoogleAuthProvider()` dan `signInWithPopup(auth, provider)`.
     - `signUpWithEmail(email, password, displayName?)` → `createUserWithEmailAndPassword(auth, email, password)` dilanjutkan `updateProfile(userCredential.user, { displayName })` bila ada nama.
     - `signInWithEmail(email, password)` → `signInWithEmailAndPassword(auth, email, password)`.
     - `resetPassword(email)` → `sendPasswordResetEmail(auth, email)`.
     - `logOut()` → `signOut(auth)`.
   - Buat fungsi `mapFirebaseAuthError(error: unknown): string` yang menerjemahkan kode error Firebase (`auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`, `auth/email-already-in-use`, `auth/weak-password`, `auth/popup-closed-by-user`, `auth/too-many-requests`) ke pesan Bahasa Indonesia yang jelas dan ramah pengguna.

4. **Langkah 4 — Desain Skema Cloud Firestore & Helper Sync di `src/lib/firebase/firestore-sync.ts`:**
   - **Struktur Dokumen di Firestore:**
     - Dokumen Metadata Workspace User: `users/{uid}`
       ```typescript
       interface UserWorkspaceMeta {
         uid: string;
         email: string | null;
         displayName: string | null;
         activeDocumentId: string;
         openTabIds: string[];
         fileOrder: string[];
         updatedAt: string; // ISO timestamp
       }
       ```
     - Subkoleksi Dokumen CV: `users/{uid}/resumes/{docId}`
       - Menyimpan objek `ResumeDocument` penuh (divalidasi dengan `ResumeDocumentSchema.safeParse` saat dibaca dari Firestore).
   - **Fungsi Murni yang Mudah Di-Unit Test (Ekspor untuk Vitest):**
     - `mergeLocalAndCloudDocuments(localDocs: Record<string, ResumeDocument>, cloudDocs: Record<string, ResumeDocument>): { mergedDocs: Record<string, ResumeDocument>; toUploadIds: string[] }`
       - Menggabungkan dokumen lokal & cloud. Jika suatu `id` ada di keduanya, pilih yang memiliki `new Date(doc.updatedAt).getTime()` lebih besar. Jika dokumen lokal lebih baru atau belum ada di `cloudDocs`, masukkan `id`-nya ke `toUploadIds`.
   - **Fungsi Operasi Firestore:**
     - `fetchUserCloudWorkspace(uid: string)` → membaca `users/{uid}` dan seluruh dokumen di `users/{uid}/resumes`.
     - `saveUserWorkspaceToCloud(uid: string, state: PersistedResumeState, docIdsToSave?: string[])` → menggunakan `writeBatch(db)` untuk menyimpan metadata `users/{uid}` dan dokumen CV yang berubah ke `users/{uid}/resumes/{docId}`.
     - `deleteResumeFromCloud(uid: string, docId: string)` → memanggil `deleteDoc(doc(db, "users", uid, "resumes", docId))` saat pengguna menghapus file CV di File Tree.

5. **Langkah 5 — Tambahkan File Aturan Keamanan `firestore.rules` di Root Proyek:**
   - Tulis aturan keamanan Firestore agar setiap pengguna hanya bisa membaca/menulis dokumennya sendiri:
     ```text
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
           match /resumes/{resumeId} {
             allow read, write: if request.auth != null && request.auth.uid == userId;
           }
         }
       }
     }
     ```

6. **Langkah 6 — Perbarui State & Buat Hook/Manager Sinkronisasi (`src/store/use-resume-store.ts` & `src/components/auth/CloudSyncManager.tsx`):**
   - Tambahkan state ephemeral (tidak masuk `zundo` dan tidak disimpan ke `localStorage`) di `useResumeStore`:
     - `authUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null`
     - `cloudSyncStatus: "idle" | "syncing" | "synced" | "error" | "offline"`
     - `applyCloudWorkspace: (payload: PersistedResumeState) => void` *(memperbarui `documents`, `activeDocumentId`, `openTabIds`, `fileOrder` dari hasil merge cloud tanpa memicu loop upload berulang)*.
   - Buat komponen `src/components/auth/CloudSyncManager.tsx` yang dipasang di `src/app/editor/page.tsx`:
     - Mendengarkan `onAuthStateChanged(auth, ...)`.
     - Saat user baru login: jalankan `fetchUserCloudWorkspace(user.uid)`, gabungkan dengan `mergeLocalAndCloudDocuments`, panggil `applyCloudWorkspace`, dan upload dokumen lokal yang ada di `toUploadIds`.
     - Saat user sedang login dan ada perubahan pada `documents` / `openTabIds` / `fileOrder`: jadwalkan penyimpanan ke Firestore dengan debounce `1500ms` (dan panggil `deleteResumeFromCloud` jika ada ID dokumen yang dihapus).

7. **Langkah 7 — Buat Modal Login/Register `src/components/auth/AuthModal.tsx` & Integrasikan di `EditorTopBar.tsx`:**
   - Desain `AuthModal.tsx` dengan palet monokromatis sesuai `agents-md/brand-guideline.md`:
     - Memiliki tab switch: **"Masuk (Sign In)"** dan **"Daftar Akun (Sign Up)"**.
     - Tombol utama **"Lanjutkan dengan Google"** (ikon Google SVG bersih + `signInWithGoogle()`).
     - Form **Email & Password** (ditambah input **Nama Lengkap** saat tab *Daftar Akun*, validasi password minimal 6 karakter, dan tombol **"Lupa Password?"** yang memanggil `resetPassword(email)`).
     - Menampilkan pesan error dalam kotak merah lembut (`#FEF2F2` / `#EF4444`) atau pesan sukses reset password dalam kotak hijau (`#ECFDF5` / `#10B981`).
     - Jika pengguna sudah login, klik tombol profil di `EditorTopBar.tsx` membuka popover ringkas berisi Nama/Email pengguna, status sinkronisasi Cloud Firestore (`Tersinkron ke Cloud` / `Menyinkronkan...`), tombol **"Sinkronkan Sekarang"**, dan tombol **"Keluar (Sign Out)"**.

8. **Langkah 8 — Buat Unit Test di `src/lib/__tests__/firestore-sync.test.ts`:**
   - Uji fungsi `mergeLocalAndCloudDocuments`:
     - Draf lokal baru + cloud kosong → semua draf lokal dipertahankan dan masuk `toUploadIds`.
     - Dokumen dengan ID sama di lokal dan cloud → versi dengan `updatedAt` lebih baru yang menang.
     - Dokumen yang hanya ada di cloud → otomatis masuk ke `mergedDocs` tanpa perlu di-upload ulang.
   - Uji fungsi `mapFirebaseAuthError` untuk seluruh kode error umum (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, dll.).
   - Uji `isFirebaseConfigured()` mengembalikan `false` secara aman ketika env kosong.

**Acceptance criteria:**
- [ ] `src/lib/firebase/config.ts` menginisialisasi Firebase Auth & Firestore secara aman dan tidak crash bila variabel environment `.env.local` belum diisi (`isFirebaseConfigured()`).
- [ ] `src/components/auth/AuthModal.tsx` mendukung **Sign In / Sign Up with Google** maupun **Email & Password** (beserta *Reset Password* dan *Sign Out*) dengan pesan error Bahasa Indonesia yang jelas dan desain monokromatis sesuai `brand-guideline.md`.
- [ ] `src/lib/firebase/firestore-sync.ts` dan `CloudSyncManager.tsx` menggabungkan draf `localStorage` (*Guest Mode*) ke koleksi Firestore `users/{uid}/resumes/{docId}` saat login tanpa menghilangkan draf yang baru diketik, serta menyinkronkan perubahan berikutnya secara otomatis (debounced `1500ms`).
- [ ] `EditorTopBar.tsx` menampilkan tombol **"Masuk / Simpan Cloud"** saat Guest Mode, dan menampilkan avatar/email pengguna beserta indikator status sinkronisasi Firestore saat sudah login.
- [ ] File `firestore.rules` dan `.env.example` tersedia di root proyek, serta unit test di `src/lib/__tests__/firestore-sync.test.ts` lulus seluruhnya.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buat CV di *Guest Mode*, klik **"Masuk / Simpan Cloud"**, daftar/masuk dengan Google atau Email & Password, lalu verifikasi di Firebase Console bahwa dokumen otomatis tersimpan di koleksi `users/{uid}/resumes/{docId}` dan tetap muncul saat halaman di-refresh.

**Dependencies:** Task 3, Task 6

**Files likely touched:**
- `package.json`
- `.env.example`
- `firestore.rules`
- `src/lib/firebase/config.ts`
- `src/lib/firebase/auth.ts`
- `src/lib/firebase/firestore-sync.ts`
- `src/components/auth/AuthModal.tsx`
- `src/components/auth/CloudSyncManager.tsx`
- `src/store/use-resume-store.ts`
- `src/components/editor/EditorTopBar.tsx`
- `src/app/editor/page.tsx`
- `src/lib/__tests__/firestore-sync.test.ts`

**Estimated scope:** Medium (8-10 files)

---

### Task 10: Dashboard Multi-CV (`/app`), Version History & Pengaturan Privasi (`/settings`)

**Description:** Membangun halaman Dashboard `/app` dan halaman Pengaturan `/settings` (branch `feat/multi-cv-dashboard`). Pengguna dapat melihat daftar seluruh versi CV (baik dari `localStorage` maupun Cloud Firestore), membuat snapshot versi bernama (`users/{uid}/resumes/{docId}/versions/{versionId}`), membandingkan perubahan antar versi, mengekspor seluruh data akun, atau menghapus seluruh data Cloud Firestore & akun Firebase secara permanen.

**Acceptance criteria:**
- [ ] Halaman `/app` menampilkan kartu daftar CV dengan metadata (`title`, `targetRole`, `templateId`, `updatedAt`), aksi cepat (Edit, Duplikasi, Simpan Snapshot Versi, Hapus), dan riwayat snapshot.
- [ ] Halaman `/settings` menyediakan fitur **Ekspor Semua Data (`.json`)**, **Bersihkan Penyimpanan Lokal**, dan **Hapus Akun & Data Cloud Firestore Permanen**.
- [ ] Desain kedua halaman mematuhi palet monokromatis netral di `brand-guideline.md`.

**Verification:**
- [ ] Tests pass: `npm test && npx tsc --noEmit && npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buka `/app`, buat versi baru untuk target role tertentu, simpan snapshot versi, dan uji fitur ekspor/hapus data di `/settings`.

**Dependencies:** Task 9

**Files likely touched:**
- `src/app/app/page.tsx`
- `src/app/settings/page.tsx`
- `src/components/editor/FileTreeSidebar.tsx`

**Estimated scope:** Small (3 files)

---

## Checkpoint 3: After Tasks 9–10 (Phase 3 Complete)
- [ ] Semua tes lulus (`npm test`), build production bersih (`npm run build`)
- [ ] Aturan keamanan `firestore.rules` (`request.auth.uid == userId`) dan mekanisme hapus data permanen bekerja sesuai persyaratan privasi PRD Bagian 6.3
- [ ] Siap untuk peluncuran penuh atau penambahan ekstensi opsional (`.docx` export, public share link, job tracker)
