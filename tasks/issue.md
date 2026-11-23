# ISSUE-003: Setup Vitest & Unit Test Lengkap untuk `ats-linter.ts` dan `extractLinearResumeText`

| Atribut | Detail |
| :--- | :--- |
| **Referensi Plan** | `tasks/todo.md` — Phase 1, **Task 3** |
| **Branch Git** | `test/ats-linter` *(dibuat dari `main` terbaru sesuai `agents-md/GIT_RULES.md`)* |
| **Target Eksekutor** | Junior Developer / AI Coding Model Ringan |
| **Estimasi Scope** | Small (3–4 file) |
| **Prasyarat** | Task 1 (`/templates`) & Task 2 (`feat/pdf-font-sync`) sudah ter-merge di `main` |

---

## 1. Latar Belakang & Masalah Saat Ini

Saat ini proyek **FormaCV** belum memiliki *test runner* otomatis di `package.json`. Padahal fungsi deterministik berikut adalah pondasi kualitas ATS dan akan terus dipakai di Fase 2:

1. **`runAtsLint` (`src/lib/ats-linter.ts`):** Mengandung **11 aturan deterministik** (`fix`, `review`, `good`) termasuk validasi kontak, deteksi placeholder, panjang summary, section kosong, judul non-standar, tanggal kosong/campur, bullet terlalu panjang (`> 220` karakter), kata ganti orang pertama, *page overflow*, dan `core-structure-ok`.
2. **`extractLinearResumeText` (`src/components/preview/AtsXRayView.tsx`):** Menyusun urutan teks linear ATS dari `ResumeDocument` dan wajib memastikan item/section/bullet dengan `isVisible: false` tidak bocor ke teks output.
3. **`normalizeUrl` & `toMailtoHref` (`src/lib/url-utils.ts`):** Baru ditambahkan pada Task 2 untuk sanitasi dan normalisasi tautan PDF (`https://`, `mailto:`, blokir `javascript:`/`data:`).

Tanpa unit test otomatis, perubahan kecil pada regex atau struktur `ResumeDocument` dapat memicu regresi diam-diam.

---

## 2. Tujuan & Ruang Lingkup (*Scope*)

### Yang HARUS Dikerjakan (*In Scope*)
1. Menginstal `vitest` sebagai `devDependency` dan menambahkan script `"test": "vitest run"` (serta opsional `"test:watch": "vitest"`) di `package.json`.
2. Membuat konfigurasi `vitest.config.ts` di root proyek dengan alias `@` → `./src` dan `esbuild: { jsx: "automatic" }` agar `.tsx` (seperti `AtsXRayView.tsx`) dapat diimpor langsung tanpa error JSX.
3. Membuat `src/lib/__tests__/ats-linter.test.ts` yang menguji **seluruh aturan `fix`, `review`, dan `good`** di `runAtsLint`, termasuk *edge cases* (batas 220 karakter, *word boundary* kata ganti, visibilitas `isVisible: false`, dan kondisi `lastPageFillRatio < 0.15`).
4. Menguji `extractLinearResumeText` (di dalam `src/lib/__tests__/ats-linter.test.ts` atau file terpisah `src/lib/__tests__/ats-xray.test.ts`) untuk memastikan urutan `config.sectionOrder` diikuti dan seluruh entitas `isVisible: false` (links, summary, section, item, bullet, custom section) tidak muncul di hasil ekstraksi.
5. Menambahkan pengujian singkat untuk `normalizeUrl` dan `toMailtoHref` (`src/lib/__tests__/url-utils.test.ts`).

### Yang DILARANG / Di Luar Ruang Lingkup (*Out of Scope*)
- **JANGAN** mengubah logika produksi di `src/lib/ats-linter.ts`, `src/components/preview/AtsXRayView.tsx`, atau `src/lib/url-utils.ts` kecuali ditemukan bug nyata yang jelas melanggar spesifikasi (jika ada, catat di PR).
- **JANGAN** menginstal library berat yang tidak perlu (`jest`, `playwright`, `jsdom`, `@testing-library/react`). Seluruh fungsi yang diuji adalah *pure functions* yang berjalan cepat di environment `node` bawaan Vitest.
- **JANGAN** mengubah file `.gitignore` atau `skills-lock.json`.

---

## 3. Daftar File yang Akan Dibuat / Diubah

| Aksi | Path File | Ringkasan Perubahan |
| :--- | :--- | :--- |
| **Ubah** | `package.json` & `package-lock.json` | Tambah `vitest` di `devDependencies` dan script `"test": "vitest run"` |
| **Buat** | `vitest.config.ts` | Konfigurasi Vitest (`environment: "node"`, alias `@` → `src`, `esbuild.jsx: "automatic"`) |
| **Buat** | `src/lib/__tests__/ats-linter.test.ts` | Unit test lengkap untuk seluruh aturan `runAtsLint` + `extractLinearResumeText` |
| **Buat** | `src/lib/__tests__/url-utils.test.ts` | Unit test untuk `normalizeUrl` & `toMailtoHref` |

---

## 4. Panduan Implementasi Langkah demi Langkah

### Langkah 1 — Pastikan Berada di Branch `test/ats-linter`
```bash
git branch --show-current
# Pastikan outputnya: test/ats-linter
```

---

### Langkah 2 — Install `vitest` & Tambah Script di `package.json`
Jalankan perintah berikut:
```bash
npm install -D vitest
```

Lalu tambahkan script `"test"` dan `"test:watch"` di bagian `"scripts"` pada `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

### Langkah 3 — Buat `vitest.config.ts`
Buat file `vitest.config.ts` di root proyek:

```typescript
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
```

> **Kenapa `esbuild: { jsx: "automatic" }` wajib ada?**
> Karena `extractLinearResumeText` berada di dalam `src/components/preview/AtsXRayView.tsx` yang mengandung JSX. Tanpa opsi ini, Vitest tanpa `@vitejs/plugin-react` bisa melempar `ReferenceError: React is not defined` saat me-load file `.tsx` tersebut.

---

### Langkah 4 — Pahami Detail Perilaku Aktual `ats-linter.ts` Sebelum Menulis Test

Rujuk `src/lib/ats-linter.ts` baris 43–277. Berikut tabel kontrak aturan yang **wajib** dicakup di test:

| # | Rule ID | Status | Kondisi Pemicu Persis di Kode |
| :--- | :--- | :--- | :--- |
| 1 | `contact-completeness` | `fix` | `fullName` kosong, email tidak cocok `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, atau `phone` kosong/undefined. |
| 2 | `placeholder-text` | `fix` | Ditemukan `"lorem ipsum"` atau `"[isi di sini]"` (case-insensitive) pada `fullName`, `summary.text`, `experience.items[].company`, atau `experience.items[].bullets[].text`. |
| 3 | `summary-word-count` | `review` | `summary.isVisible === true`, teks tidak kosong, dan jumlah kata `< 15` atau `> 80`. *(Jika `isVisible: false`, tidak memicu).* |
| 4 | `empty-section-<key>` | `review` | Built-in section (`experience`, `education`, `projects`, `skills`, `certifications`, `awards`, `volunteering`, `languages`) punya `isVisible: true` tetapi 0 item dengan `isVisible: true`. |
| 5 | `non-standard-heading-<key>` | `review` | Built-in section aktif punya `title` non-kosong yang tidak mengandung satu pun kata dari `STANDARD_HEADING_KEYWORDS` (misal `"My Cool Journey"`). |
| 6 | `missing-dates` | `review` | Item `isVisible: true` di `experience` atau `education` memiliki `startDate` kosong atau `endDate` kosong. |
| 7 | `inconsistent-dates` | `review` | Lebih dari 1 pola tanggal berbeda (`YYYY`, `MMM YYYY`, `MM/YYYY`, `YYYY-MM`, `OTHER`) ditemukan di antara item aktif `experience` + `education`. *(Catatan: `"Present"`, `"Sekarang"`, `"Current"` diabaikan).* |
| 8 | `long-bullet` | `review` | Ada bullet `isVisible: true` pada item `isVisible: true` (`experience`, `projects`, atau `volunteering`) dengan `text.trim().length > 220`. *(220 karakter tepat = aman; 221 karakter = memicu).* |
| 9 | `first-person-pronoun` | `review` | Cocok `/\b(saya|aku|kami|i|me|my|we)\b/i` pada `summary` (jika `isVisible`) atau bullet aktif. *(Kata seperti `"time"`, `"implement"`, `"system"` TIDAK boleh memicu karena `\b`).* |
| 10 | `page-overflow` | `review` | `pageCount > config.targetPages` **ATAU** `(pageCount > 1 && lastPageFillRatio > 0 && lastPageFillRatio < 0.15)`. |
| 11 | `core-structure-ok` | `good` | Ditambahkan di indeks 0 (`unshift`) **hanya jika `fixCount === 0`**. Jika ada minimal 1 `fix`, `core-structure-ok` **tidak** muncul (`summary.good === 0`). |

---

### Langkah 5 — Buat `src/lib/__tests__/ats-linter.test.ts`

Buat helper `makeCleanResume()` di awal file test yang menghasilkan `ResumeDocument` **100% bersih** (0 `fix`, 0 `review`, 1 `good`) agar setiap test case hanya memutasi 1 kondisi yang sedang diuji.

> **PERHATIAN PENTING (Gotcha #1):**
> `createSampleResume()` dari `src/lib/default-resume.ts` memakai `"Jan 2023"` (`MMM YYYY`) pada `experience` dan `"2018"` (`YYYY`) pada `education`, sehingga `runAtsLint(createSampleResume())` **akan memicu `inconsistent-dates`**!
> Oleh karena itu, pada helper `makeCleanResume()`, seragamkan tanggal `education` menjadi `"Aug 2018"` & `"Jul 2022"` (format `MMM YYYY`) agar baseline memiliki `summary = { good: 1, review: 0, fix: 0 }`.

Struktur kerangka test yang wajib diimplementasikan di `src/lib/__tests__/ats-linter.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { runAtsLint } from "@/lib/ats-linter";
import { createSampleResume } from "@/lib/default-resume";
import { extractLinearResumeText } from "@/components/preview/AtsXRayView";
import type { ResumeDocument } from "@/lib/schemas/resume";

function makeCleanResume(): ResumeDocument {
  const doc = createSampleResume("2026-01-01T00:00:00.000Z");
  // Seragamkan format tanggal education agar sama (MMM YYYY) dengan experience
  doc.sections.education.items[0].startDate = "Aug 2018";
  doc.sections.education.items[0].endDate = "Jul 2022";
  return doc;
}

describe("runAtsLint", () => {
  it("returns good (core-structure-ok) with 0 fix and 0 review for a clean resume", () => {
    const report = runAtsLint(makeCleanResume(), 1, 0.85);
    expect(report.summary).toEqual({ good: 1, review: 0, fix: 0 });
    expect(report.items.map((i) => i.id)).toEqual(["core-structure-ok"]);
  });

  // 1. contact-completeness (fix):
  //    - uji fullName kosong
  //    - uji email tidak valid (mis. "not-an-email")
  //    - uji phone kosong
  //    - pastikan status === "fix", targetSection === "basics", dan core-structure-ok TIDAK muncul (summary.good === 0)

  // 2. placeholder-text (fix):
  //    - uji "Lorem ipsum" di summary (case-insensitive)
  //    - uji "[isi di sini]" di bullet experience
  //    - pastikan id === "placeholder-text", status === "fix", summary.good === 0

  // 3. summary-word-count (review):
  //    - uji < 15 kata memicu summary-word-count
  //    - uji > 80 kata memicu summary-word-count
  //    - uji summary.isVisible = false dengan 3 kata TIDAK memicu

  // 4. empty-section-<key> (review):
  //    - uji section aktif dengan semua item isVisible = false memicu "empty-section-projects"
  //    - uji section dengan isVisible = false TIDAK memicu

  // 5. non-standard-heading-<key> (review):
  //    - uji mengubah title section experience menjadi "Petualangan Karier" memicu "non-standard-heading-experience"
  //    - uji judul standar ID ("Pengalaman Kerja") dan EN ("Work Experience") TIDAK memicu

  // 6. missing-dates (review):
  //    - uji startDate atau endDate kosong pada item aktif experience/education memicu "missing-dates"
  //    - uji item dengan isVisible = false yang tanggalnya kosong TIDAK memicu

  // 7. inconsistent-dates (review):
  //    - uji campuran "Jan 2023" (MMM YYYY) dan "2022" (YYYY) memicu "inconsistent-dates"
  //    - uji "Jan 2023" + "Present" / "Sekarang" TIDAK dianggap tidak konsisten

  // 8. long-bullet (review):
  //    - uji bullet sepanjang 220 karakter TIDAK memicu
  //    - uji bullet sepanjang 221 karakter memicu "long-bullet"
  //    - uji bullet 250 karakter dengan isVisible = false TIDAK memicu

  // 9. first-person-pronoun (review):
  //    - uji "Saya mengembangkan fitur..." memicu "first-person-pronoun"
  //    - uji "Built my own parser" memicu "first-person-pronoun"
  //    - uji "Implemented real-time API system" TIDAK memicu (cek word boundary)

  // 10. page-overflow (review):
  //    - uji pageCount = 2 saat targetPages = 1 memicu "page-overflow"
  //    - uji pageCount = 2, targetPages = 2, lastPageFillRatio = 0.1 (< 0.15) memicu "page-overflow"
  //    - uji pageCount = 2, targetPages = 2, lastPageFillRatio = 0.5 TIDAK memicu
});

describe("extractLinearResumeText", () => {
  // 1. Mengikuti urutan config.sectionOrder (mis. memindahkan "skills" sebelum "experience" membuat SKILLS muncul sebelum EXPERIENCE di teks output)
  // 2. Tidak membocorkan data dengan isVisible: false:
  //    - link dengan isVisible: false tidak muncul
  //    - summary dengan isVisible: false tidak muncul
  //    - section dengan isVisible: false tidak muncul
  //    - item experience/projects/education dengan isVisible: false tidak muncul
  //    - bullet point dengan isVisible: false tidak muncul
  //    - customSection yang isVisible: false tidak muncul, sedangkan customSection isVisible: true muncul lengkap dengan judul & bullet aktifnya
  // 3. Menghormati bahasa dokumen (doc.language === "id" -> "RINGKASAN PROFESIONAL", "en" -> "SUMMARY")
});
```

---

### Langkah 6 — Buat `src/lib/__tests__/url-utils.test.ts`
Tulis unit test singkat untuk `normalizeUrl` dan `toMailtoHref` di `src/lib/__tests__/url-utils.test.ts`:
- `normalizeUrl("github.com/AryaGoberto")` → `"https://github.com/AryaGoberto"`
- `normalizeUrl("https://example.com/path")` → `"https://example.com/path"`
- `normalizeUrl("http://example.com")` → `"http://example.com"`
- `normalizeUrl("  ")` → `""`
- `normalizeUrl("javascript:alert(1)")` → `""`
- `normalizeUrl("DATA:text/html,<h1>x</h1>")` → `""`
- `toMailtoHref("raka@email.com")` → `"mailto:raka@email.com"`
- `toMailtoHref("mailto:raka@email.com")` → `"mailto:raka@email.com"`
- `toMailtoHref("   ")` → `""`

---

## 5. Jebakan Umum yang Harus Dihindari (*Gotchas*)

1. **Asumsi Keliru tentang `createSampleResume()`:**
   - Seperti dijelaskan di Langkah 5, `createSampleResume()` mencampur format tanggal `MMM YYYY` (Experience) dan `YYYY` (Education). Jangan jadikan `createSampleResume()` langsung sebagai fixture "0 review" tanpa menyeragamkan tanggalnya di `makeCleanResume()`.
2. **Error JSX saat Import `AtsXRayView.tsx` di Vitest:**
   - Wajib pasang `esbuild: { jsx: "automatic" }` di `vitest.config.ts` agar import `extractLinearResumeText` dari `AtsXRayView.tsx` berjalan mulus di Node environment.
3. **ESLint / TypeScript Conflict pada File Test:**
   - Pastikan tidak ada `any` atau variabel tidak terpakai di file test agar `npx tsc --noEmit && npm run lint` tetap bersih (0 error, 0 warning).
4. **Mutasi Antar Test Case:**
   - Selalu panggil `makeCleanResume()` baru di dalam setiap `it(...)` — jangan berbagi satu objek `ResumeDocument` yang dimutasi antar test.

---

## 6. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] `vitest` (`vitest@^4`) terpasang di `devDependencies` pada `package.json`, dan script `"test": "vitest run"` berjalan sukses (2 test files, 35 tests hijau).
- [x] `vitest.config.ts` mengonfigurasi alias `@/` (Vite 8 / Oxc pada Vitest v4 sudah mendukung JSX transform otomatis tanpa `esbuild.jsx`).
- [x] `src/lib/__tests__/ats-linter.test.ts` menguji seluruh 11 aturan `runAtsLint` (`fix`, `review`, `good`) serta batas *edge case* (`220` vs `221` karakter, *word boundary*, `isVisible: false`, `lastPageFillRatio < 0.15`).
- [x] Pengujian `extractLinearResumeText` memverifikasi urutan `sectionOrder`, bahasa `id`/`en`, `customSections`, dan menjamin tidak ada konten `isVisible: false` yang bocor ke output.
- [x] `src/lib/__tests__/url-utils.test.ts` menguji `normalizeUrl` dan `toMailtoHref` termasuk pemblokiran protokol berbahaya (`javascript:`, `data:`).

---

## 7. Checklist Verifikasi Wajib Sebelum Commit / PR

- [x] `npm test` — 2 test files, 35 tests passed.
- [x] `npx tsc --noEmit && npm run lint` — 0 error, 0 warning.
- [x] `npm run build` — exit code 0.

```bash
# 1. Jalankan seluruh unit test (semua harus hijau)
npm test

# 2. Cek TypeScript & ESLint (wajib 0 error, 0 warning)
npx tsc --noEmit && npm run lint

# 3. Cek Production Build Next.js (wajib exit code 0)
npm run build
```

---

## 8. Prosedur Commit, Push & Pull Request (GitHub Flow)

Setelah seluruh test & build hijau, centang **Task 3** di `tasks/todo.md`, `tasks/plan.md`, `agents-md/TASKS.md`, dan `agents-md/FEATURES.md`, lalu jalankan:

```bash
git add package.json package-lock.json vitest.config.ts src/lib/__tests__/ tasks/issue.md tasks/todo.md tasks/plan.md agents-md/TASKS.md agents-md/FEATURES.md
git commit -m "test(ats): setup vitest and add unit tests for ats-linter, xray, and url-utils"
git push -u origin test/ats-linter
```

Lalu buat Pull Request ke `main` (hubungkan dengan issue GitHub untuk Task 3 jika sudah dibuat).

---

## 9. Checkpoint 1 & Antrean Issue Berikutnya

Setelah **ISSUE-003 (Task 3)** di-merge ke `main`, **Phase 1 (MVP)** selesai (**Checkpoint 1** di `tasks/todo.md`). Issue berikutnya masuk ke **Phase 2**:
- **ISSUE-004 (Task 4 — `feat/pdf-xray-parser`):** Meningkatkan *ATS X-Ray Mode* agar mengekstrak teks langsung dari blob PDF asli menggunakan `pdfjs-dist`.
