# ISSUE-005: Job Description (JD) Keyword Matcher & Deteksi Master Profile Tersembunyi

| Atribut | Detail |
| :--- | :--- |
| **Referensi Plan** | `tasks/todo.md` — Phase 2, **Task 5** |
| **Branch Git** | `feat/jd-keyword-matcher` |
| **Target Eksekutor** | Junior Developer / AI Coding Model Ringan |
| **Estimasi Scope** | Medium (4 file) |

---

## 1. Ide Inti & Problem Statement (*Idea Refine*)

> **How Might We:** Bagaimana membantu pelamar kerja menyesuaikan CV mereka terhadap suatu lowongan dalam hitungan detik—dengan memunculkan kembali pengalaman relevan yang sudah ada di *Master Profile* (`isVisible: false`)—tanpa mengarang pengalaman atau memberi skor ATS palsu?

### Arah Solusi yang Dipilih
Berbeda dengan *keyword checker* biasa yang hanya bilang *"Anda kurang skill X"*, FormaCV memanfaatkan struktur **Master Profile (`isVisible`)**:
1. **100% Client-Side & Deterministik:** Berjalan instan di browser (tanpa biaya API AI, tetap jalan penuh di *Guest Mode*).
2. **3 Kategori Jelas (Bukan Sekadar Skor):**
   - **Sudah Aktif di CV (`matchedActive`)** — Kata kunci sudah terlihat di CV aktif.
   - **Ada di Master Profile — Tersembunyi (`matchedHiddenInMaster`)** — Kata kunci ditemukan pada section/item/bullet yang `isVisible: false`, disertai tombol **1-klik "Tampilkan"** langsung dari modal.
   - **Belum Ada di CV (`missing`)** — Kata kunci belum tertulis di CV (*peringatan jujur: tambahkan hanya jika benar-benar dikuasai*).
3. **Alur Tailoring Aman:** Sediakan tombol **"Duplikasi CV untuk Lowongan Ini"** (`duplicateDocument`) di dalam modal agar pengguna tidak menimpa Master CV mereka secara tidak sengaja.

### Asumsi Utama
- Gabungan kamus *skill/tools* umum + deteksi token teknis (akronim seperti `SQL`, `AWS`, `NLP`, `CI/CD`, atau istilah seperti `Next.js`, `C++`) + filter *stopwords* (ID & EN) sudah cukup akurat untuk mayoritas JD tanpa LLM.

### Yang TIDAK Dikerjakan (*Not Doing*)
- **TIDAK** memanggil endpoint AI/LLM di task ini (hemat biaya & nol dependensi baru).
- **TIDAK** menampilkan klaim *"95% Pasti Lolos ATS"* (cukup tampilkan hitungan faktual, mis. `6/10 kata kunci ditemukan`).
- **TIDAK** menyisipkan kata kunci otomatis ke teks CV tanpa tindakan user.
- **TIDAK** menambah skema tabel database atau mengubah `ResumeDocumentSchema`.

---

## 2. Daftar File yang Diubah / Dibuat

| Aksi | Path File | Ringkasan |
| :--- | :--- | :--- |
| **Buat** | `src/lib/jd-matcher.ts` | Ekstraksi keyword JD & klasifikasi 3 kategori terhadap `ResumeDocument` |
| **Buat** | `src/lib/__tests__/jd-matcher.test.ts` | Unit test ekstraksi keyword, alias, dan deteksi item tersembunyi |
| **Buat** | `src/components/editor/JdMatcherModal.tsx` | Modal UI tempel teks JD, 3 daftar hasil, tombol 1-klik Tampilkan & Duplikasi CV |
| **Ubah** | `src/components/editor/EditorTopBar.tsx` & `src/app/editor/page.tsx` | Tambah tombol **JD Matcher** di top bar dan hubungkan modalnya |

---

## 3. Panduan Implementasi

### Langkah 1 — Buat `src/lib/jd-matcher.ts` (Pure Logic)
1. **Ekstraksi Keyword (`extractJdKeywords(jdText: string): string[]`):**
   - Normalisasi teks ke lowercase untuk pencocokan kamus frasa (*multi-word* seperti `tailwind css`, `next.js`, `rest api`, `machine learning`, `data science`, `ci/cd`, `node.js`, `react`, `typescript`, `docker`, `postgresql`, `figma`, `git`, dll.) beserta alias umum (`nextjs` → `Next.js`, `postgres` → `PostgreSQL`, `ts` → `TypeScript`).
   - Juga tangkap token teknis dari teks asli yang tidak masuk *stopwords* ID/EN (misal akronim kapital `2–6` huruf seperti `SQL`, `AWS`, `LLM`, `RAG`, `SEO`, `KPI`, atau kata bertanda `.`/`+`/`#` seperti `Vue.js`, `C++`, `C#`).
   - Hapus duplikat (case-insensitive) dan batasi maksimal mis. `30` keyword teratas agar tampilan tetap bersih.
2. **Pencocokan terhadap CV (`matchJobDescription(doc: ResumeDocument, jdText: string): JdMatchResult`):**
   - Kumpulkan `activeText` dari seluruh bagian yang aktif (`summary`, `experience`, `education`, `projects`, `skills`, `certifications`, `awards`, `volunteering`, `languages`, `customSections`) di mana section, item, dan bullet semuanya `isVisible === true`.
   - Kumpulkan daftar `hiddenSources`: entitas yang memiliki `isVisible === false` (baik level `section`, `item`, maupun `bullet`) beserta metadata (`targetType`, `sectionKey`, `itemId?`, `bulletId?`, `label`, `text`).
   - Untuk tiap keyword JD (cek batas kata yang aman untuk karakter khusus seperti `c++`, `next.js`, `node.js`):
     - Jika ada di `activeText` → masuk `matchedActive`.
     - Else jika ada di salah satu `hiddenSources` → masuk `matchedHiddenInMaster` (sertakan `sources` agar UI bisa menyalakannya).
     - Else → masuk `missing`.
   - Kembalikan `{ keywords, matchedActive, matchedHiddenInMaster, missing }`.

### Langkah 2 — Buat `src/components/editor/JdMatcherModal.tsx`
- Ikuti gaya monokromatis `agents-md/brand-guideline.md` (mirip `AtsCheckerModal.tsx`):
  - Textarea untuk menempelkan teks *Job Description* (JD) + tombol **"Kosongkan"** dan contoh ringkas.
  - Tombol **"Duplikasi CV untuk Lowongan Ini"** yang memanggil `duplicateDocument(doc.id)` dari `useResumeStore` (dengan feedback singkat bahwa salinan baru sedang aktif).
  - Ringkasan hitungan faktual: `X Aktif · Y Tersembunyi di Master · Z Belum Ada` (dengan catatan bahwa ini pencocokan kata kunci, bukan skor jaminan ATS).
  - 3 kelompok hasil:
    1. **Ada di Master Profile (Tersembunyi)** (badge amber `#FFFBEB` / `#F59E0B`): Tampilkan keyword + nama item yang menyimpannya + tombol **"Tampilkan"** (memanggil `toggleSectionVisibility` / `toggleItemVisibility` / `toggleBulletVisibility` sesuai sumbernya).
    2. **Sudah Aktif di CV** (badge hijau `#ECFDF5` / `#10B981`).
    3. **Belum Ada di CV** (badge netral `#F4F4F5` / `#52525B` + catatan jangan mengarang skill).

### Langkah 3 — Hubungkan ke `EditorTopBar.tsx` & `src/app/editor/page.tsx`
- Tambah props `onOpenJdModal: () => void` pada `EditorTopBarProps`.
- Tambah tombol **JD Matcher** (ikon `Target` atau `Briefcase` dari `lucide-react`) di sebelah tombol **ATS Check** di `EditorTopBar.tsx`.
- Kelola state `jdModalOpen` di `src/app/editor/page.tsx` dan render `<JdMatcherModal />`.

### Langkah 4 — Buat Unit Test `src/lib/__tests__/jd-matcher.test.ts`
- Uji ekstraksi keyword multi-kata (`Tailwind CSS`, `Next.js`, `CI/CD`) dan penghapusan duplikat/stopwords.
- Uji deteksi 3 kategori:
  - Keyword pada item aktif → `matchedActive`.
  - Keyword pada proyek/pengalaman/bullet/section dengan `isVisible: false` (misal `"Docker"`) → `matchedHiddenInMaster` lengkap dengan referensi `sectionKey`/`itemId`.
  - Keyword yang tidak ada sama sekali (misal `"Kubernetes"`) → `missing`.
- Uji input JD kosong mengembalikan array kosong tanpa error.

---

## 4. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] `src/lib/jd-matcher.ts` mengekstrak kata kunci dari teks JD dan mengklasifikasikannya ke `matchedActive`, `matchedHiddenInMaster`, dan `missing`.
- [x] `JdMatcherModal.tsx` menampilkan input JD, 3 kategori hasil (tanpa klaim palsu "100% lolos ATS"), tombol **Tampilkan** untuk item tersembunyi, serta tombol **Duplikasi CV**.
- [x] Tombol **JD Matcher** tersedia di `EditorTopBar.tsx` dan membuka modal dengan lancar.
- [x] Unit test di `src/lib/__tests__/jd-matcher.test.ts` lulus seluruhnya (4 test files, 46 tests passed).

---

## 5. Verifikasi & GitHub Flow

- [x] `npm test` — 4 test files, 46 tests passed.
- [x] `npx tsc --noEmit && npm run lint` — 0 error, 0 warning.
- [x] `npm run build` — exit code 0.

```bash
npm test
npx tsc --noEmit && npm run lint
npm run build
```

Setelah seluruh verifikasi lulus, centang Task 5 di `tasks/issue.md`, `tasks/todo.md`, `tasks/plan.md`, dan `agents-md/FEATURES.md`, lalu commit & push ke `feat/jd-keyword-matcher`.
