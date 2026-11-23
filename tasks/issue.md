# ISSUE-002: Registrasi Font `.ttf` Lokal & Perbaikan Clickable Links pada Ekspor PDF

| Atribut | Detail |
| :--- | :--- |
| **Referensi Plan** | `tasks/todo.md` — Phase 1, **Task 2** |
| **Branch Git** | `feat/pdf-font-sync` *(buat dari `main` terbaru sesuai `agents-md/GIT_RULES.md`)* |
| **Target Eksekutor** | Junior Developer / AI Coding Model Ringan |
| **Estimasi Scope** | Medium (5–6 file kode + aset font `.ttf` di `public/fonts/`) |
| **Prasyarat** | Task 1 (`/templates`) sudah selesai; `npm install` sudah berjalan |

---

## 1. Latar Belakang & Masalah Saat Ini

Saat ini terdapat **3 kesenjangan teknis** antara *Live HTML Preview* (`src/components/preview/ResumeHtmlRenderer.tsx`) dan hasil ekspor PDF (`src/components/pdf/PdfDocument.tsx`):

1. **Font PDF tidak cocok dengan HTML Preview:**
   - Di `src/lib/template-tokens.ts` baris 88–93, `PDF_FONT_FAMILIES` masih memetakan seluruh font ke font bawaan PDF (`Helvetica` dan `Times-Roman`), bukan ke *Inter*, *Roboto*, *EB Garamond*, dan *Merriweather*.
   - Di `src/lib/template-tokens.ts` baris 83, `HTML_FONT_FAMILIES.roboto` juga masih meminjam `var(--font-inter)` karena `Roboto` belum dimuat di `src/app/layout.tsx`.
2. **Pemenggalan Kata Otomatis (*Auto-Hyphenation*) pada PDF:**
   - Secara default, `@react-pdf/renderer` memotong kata panjang di ujung baris dengan tanda `-`. Hal ini mengganggu keterbacaan dan dapat memecah *keyword* saat di-parse mesin ATS.
3. **Hyperlink PDF Tidak Dapat Diklik (*Non-Clickable*):**
   - Di `src/components/pdf/PdfDocument.tsx`, email (`basics.email`), tautan kontak (`basics.links`), URL proyek (`item.url`), dan URL sertifikasi (`item.url`) masih dirender dengan `<Text>` biasa (dan `item.url` pada sertifikasi bahkan belum dirender), bukan dengan komponen `<Link>` dari `@react-pdf/renderer`. Padahal `agents-md/PRD.md` Bagian 6.1 mewajibkan semua hyperlink di PDF memiliki anotasi URL yang aktif.

---

## 2. Tujuan & Ruang Lingkup (*Scope*)

### Yang HARUS Dikerjakan (*In Scope*)
1. Menyediakan file font **statis `.ttf`** (Regular, Bold, Italic, Bold Italic) untuk 4 keluarga font di `public/fonts/`:
   - `Inter`
   - `Roboto`
   - `EB Garamond`
   - `Merriweather`
2. Membuat modul registrasi font client-side `src/lib/pdf-fonts.ts` yang mendaftarkan ke-4 keluarga font tersebut ke `@react-pdf/renderer` sekaligus mematikan *auto-hyphenation*.
3. Memperbarui `PDF_FONT_FAMILIES` (dan melengkapi `Roboto` di `layout.tsx` + `HTML_FONT_FAMILIES`) agar ke-4 pilihan font konsisten antara HTML Preview dan PDF.
4. Membuat helper normalisasi URL (`normalizeUrl` & `toMailtoHref`) dan memperbarui `src/components/pdf/PdfDocument.tsx` agar seluruh tautan (**email**, **contact links**, **project URL**, dan **certification URL**) dirender menggunakan `<Link src={...}>` yang *clickable* dan tetap mengikuti gaya monokromatis `agents-md/brand-guideline.md`.

### Yang DILARANG / Di Luar Ruang Lingkup (*Out of Scope*)
- **JANGAN** mengubah layout *split-screen* editor, store `useResumeStore`, atau skema Zod `ResumeDocument`.
- **JANGAN** mengganti `@react-pdf/renderer` ke Playwright/Typst atau mengubah PDF menjadi `<canvas>` / gambar.
- **JANGAN** menggunakan file font `.woff2` atau *variable font* untuk `@react-pdf/renderer` (lihat Bagian 5 — Jebakan Umum).
- **JANGAN** mengubah tampilan warna PDF menjadi biru link default browser (tetap monokromatis `#18181B` / `#09090B`).

---

## 3. Daftar File yang Akan Dibuat / Diubah

| Aksi | Path File | Ringkasan Perubahan |
| :--- | :--- | :--- |
| **Buat (Aset)** | `public/fonts/*.ttf` | 16 file static `.ttf` (4 font × 4 varian: Regular, Bold, Italic, BoldItalic) |
| **Buat** | `src/lib/pdf-fonts.ts` | Fungsi idempoten `registerPdfFonts()` + `Font.registerHyphenationCallback` |
| **Buat** | `src/lib/url-utils.ts` | Helper murni `normalizeUrl(url)` dan `toMailtoHref(email)` |
| **Ubah** | `src/lib/template-tokens.ts` | Update `PDF_FONT_FAMILIES` ke nama font terdaftar & `HTML_FONT_FAMILIES.roboto` ke `var(--font-roboto)` |
| **Ubah** | `src/app/layout.tsx` | Muat `Roboto` dari `next/font/google` dengan variable `--font-roboto` |
| **Ubah** | `src/components/pdf/PdfDocument.tsx` | Panggil `registerPdfFonts()`, ganti email & URL menjadi `<Link>` dari `@react-pdf/renderer` |

---

## 4. Panduan Implementasi Langkah demi Langkah

### Langkah 1 — Buat Branch Fitur Baru
Pastikan berada di `main` terbaru, lalu buat branch `feat/pdf-font-sync`:
```bash
git checkout main
git pull origin main
git checkout -b feat/pdf-font-sync
```

---

### Langkah 2 — Siapkan Aset Font `.ttf` Statis di `public/fonts/`
Buat folder `public/fonts/` dan simpan **file `.ttf` statis** (*bukan variable font, bukan `.woff2`*) dengan penamaan tepat seperti di bawah ini:

```text
public/fonts/
├── Inter-Regular.ttf
├── Inter-Bold.ttf
├── Inter-Italic.ttf
├── Inter-BoldItalic.ttf
├── Roboto-Regular.ttf
├── Roboto-Bold.ttf
├── Roboto-Italic.ttf
├── Roboto-BoldItalic.ttf
├── EBGaramond-Regular.ttf
├── EBGaramond-Bold.ttf
├── EBGaramond-Italic.ttf
├── EBGaramond-BoldItalic.ttf
├── Merriweather-Regular.ttf
├── Merriweather-Bold.ttf
├── Merriweather-Italic.ttf
└── Merriweather-BoldItalic.ttf
```

**Sumber pengunduhan resmi (aman & open-source SIL OFL / Apache 2.0):**
- **Google Fonts GitHub (`google/fonts`)** folder `static/` untuk masing-masing keluarga font:
  - Inter: `ofl/inter/static/` (atau release resmi `rsms/inter` folder `extras/ttf/`)
  - Roboto: `ofl/roboto/static/`
  - EB Garamond: `ofl/ebgaramond/static/`
  - Merriweather: `ofl/merriweather/static/`
- **Atau via package `@fontsource` sementara** (lalu salin `.ttf` jika tersedia — catatan: `@fontsource` umumnya hanya berisi `.woff`/`.woff2`, jadi **Google Fonts static `.ttf`** adalah sumber paling aman).

**Wajib verifikasi keabsahan file `.ttf` setelah mengunduh:**
Jalankan perintah berikut di terminal dan pastikan **semua** file terdeteksi sebagai `TrueType Font data` (bukan `HTML document` akibat URL salah/404):
```bash
file public/fonts/*.ttf
```
Contoh output yang benar:
```text
public/fonts/Inter-Regular.ttf: TrueType Font data, ...
```

---

### Langkah 3 — Buat `src/lib/pdf-fonts.ts`
Buat file baru `src/lib/pdf-fonts.ts` dengan kode lengkap berikut. Gunakan guard `fontsRegistered` agar registrasi hanya terjadi **1 kali** di client-side:

```typescript
"use client";

import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

export const PDF_REGISTERED_FAMILIES = {
  INTER: "Inter",
  ROBOTO: "Roboto",
  EB_GARAMOND: "EB Garamond",
  MERRIWEATHER: "Merriweather",
} as const;

export function registerPdfFonts(): void {
  if (fontsRegistered) return;

  Font.register({
    family: PDF_REGISTERED_FAMILIES.INTER,
    fonts: [
      { src: "/fonts/Inter-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/Inter-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/Inter-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/Inter-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.ROBOTO,
    fonts: [
      { src: "/fonts/Roboto-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/Roboto-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/Roboto-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.EB_GARAMOND,
    fonts: [
      { src: "/fonts/EBGaramond-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/EBGaramond-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/EBGaramond-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/EBGaramond-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: PDF_REGISTERED_FAMILIES.MERRIWEATHER,
    fonts: [
      { src: "/fonts/Merriweather-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "/fonts/Merriweather-Bold.ttf", fontWeight: 700, fontStyle: "normal" },
      { src: "/fonts/Merriweather-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/Merriweather-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
    ],
  });

  // Nonaktifkan pemenggalan kata otomatis (-) agar teks ATS utuh
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
```

---

### Langkah 4 — Buat `src/lib/url-utils.ts`
Pengguna sering mengetik URL tanpa protokol (contoh: `linkedin.com/in/rakapratama` atau `github.com/rakapratama`). Jika langsung diberikan ke `<Link src="...">`, banyak PDF viewer tidak mengenalinya sebagai tautan web eksternal.

Buat `src/lib/url-utils.ts`:

```typescript
/**
 * Memastikan URL eksternal memiliki protokol yang valid untuk anotasi hyperlink PDF.
 * Mengembalikan string kosong jika input kosong atau memakai protokol berbahaya (mis. javascript:).
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return "";
  }

  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Mengubah alamat email menjadi href mailto: yang valid.
 */
export function toMailtoHref(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase().startsWith("mailto:")
    ? trimmed
    : `mailto:${trimmed}`;
}
```

---

### Langkah 5 — Sinkronkan `src/app/layout.tsx` & `src/lib/template-tokens.ts`

#### 5.1 Update `src/app/layout.tsx`
Tambahkan `Roboto` dari `next/font/google`:
```tsx
import { Inter, Roboto, EB_Garamond, Merriweather } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});
```
Lalu tambahkan `${roboto.variable}` pada `className` elemen `<html>`.

#### 5.2 Update `src/lib/template-tokens.ts`
Ubah bagian `HTML_FONT_FAMILIES` dan `PDF_FONT_FAMILIES` (baris 81–93) menjadi:
```typescript
export const HTML_FONT_FAMILIES: Record<FontFamilyPreset, string> = {
  inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  roboto: "var(--font-roboto), ui-sans-serif, system-ui, sans-serif",
  serif: "var(--font-garamond), Georgia, 'Times New Roman', serif",
  georgia: "var(--font-merriweather), Georgia, serif",
};

export const PDF_FONT_FAMILIES: Record<FontFamilyPreset, string> = {
  inter: "Inter",
  roboto: "Roboto",
  serif: "EB Garamond",
  georgia: "Merriweather",
};
```
*(Catatan: Jangan import `pdf-fonts.ts` di `template-tokens.ts` karena `template-tokens.ts` juga dipakai oleh komponen non-PDF / SSR!)*

---

### Langkah 6 — Update `src/components/pdf/PdfDocument.tsx`

1. **Import `Link` dari `@react-pdf/renderer`**, `registerPdfFonts` dari `@/lib/pdf-fonts`, serta `normalizeUrl` dan `toMailtoHref` dari `@/lib/url-utils`.
2. **Panggil `registerPdfFonts()`** di awal komponen `ResumePdfDocument` (sebelum `StyleSheet.create(...)`).
3. **Tambahkan style `link` di `StyleSheet.create`:**
   ```typescript
   link: {
     color: "#18181B",
     textDecoration: isClassic ? "underline" : "none",
   },
   inlineLink: {
     color: "#18181B",
     textDecoration: "underline",
   },
   ```
4. **Ubah daftar kontak (baris 107–113 dan 364–368)** dari `string[]` biasa menjadi array terstruktur agar setiap segmen tahu apakah ia teks biasa atau hyperlink:
   ```typescript
   type ContactEntry = { text: string; href?: string };

   const contactEntries: ContactEntry[] = [];
   if (basics.phone?.trim()) {
     contactEntries.push({ text: basics.phone.trim() });
   }
   if (basics.email?.trim()) {
     contactEntries.push({
       text: basics.email.trim(),
       href: toMailtoHref(basics.email),
     });
   }
   for (const link of visibleLinks) {
     const href = normalizeUrl(link.url);
     contactEntries.push({
       text: link.url.trim(),
       href: href || undefined,
     });
   }
   if (!isClassic && basics.location?.trim()) {
     contactEntries.push({ text: basics.location.trim() });
   }
   ```
   Lalu render di dalam `<View style={styles.header}>`:
   ```tsx
   {contactEntries.length > 0 ? (
     <Text style={styles.contact}>
       {contactEntries.map((entry, idx) => (
         <Text key={`${entry.text}-${idx}`}>
           {idx > 0 ? (isClassic ? "  |  " : "  •  ") : ""}
           {entry.href ? (
             <Link src={entry.href} style={styles.link}>
               {entry.text}
             </Link>
           ) : (
             entry.text
           )}
         </Text>
       ))}
     </Text>
   ) : null}
   ```
5. **Ubah URL pada bagian `projects` (baris 253–255):**
   ```tsx
   {item.url && normalizeUrl(item.url) ? (
     <Link
       src={normalizeUrl(item.url)}
       style={[styles.italicSubText, styles.inlineLink]}
     >
       {item.url.trim()}
     </Link>
   ) : null}
   ```
6. **Ubah bagian `certifications` (baris 298–306):**
   Jika `item.url` terisi dan valid (`normalizeUrl(item.url)`), bungkus `item.name` dengan `<Link src={normalizeUrl(item.url)} style={styles.inlineLink}>`:
   ```tsx
   {items.map((item) => {
     const certHref = item.url ? normalizeUrl(item.url) : "";
     return (
       <View key={item.id} style={styles.rowBetween}>
         <Text>
           {certHref ? (
             <Link src={certHref} style={[styles.boldTitle, styles.inlineLink]}>
               {item.name}
             </Link>
           ) : (
             <Text style={styles.boldTitle}>{item.name}</Text>
           )}
           {item.issuer ? ` — ${item.issuer}` : ""}
         </Text>
         {item.date ? <Text style={styles.dateText}>{item.date}</Text> : null}
       </View>
     );
   })}
   ```

---

## 5. Jebakan Umum yang Harus Dihindari (*Gotchas*)

1. **Error `Could not resolve font for <Family>, fontWeight 700`:**
   - Pastikan **keempat varian** (`400 normal`, `700 normal`, `400 italic`, `700 italic`) terdaftar pada `Font.register`. Di `PdfDocument.tsx`, ada penggunaan `fontWeight: "bold"` (700) dan `fontStyle: "italic"`. Jika satu saja varian tidak terdaftar, `@react-pdf/renderer` akan gagal saat klik **Download PDF**.
2. **Error `Unknown font format` atau PDF korup:**
   - Terjadi jika memakai `.woff2` atau *variable font* `.ttf`. Pastikan semua file di `public/fonts/` adalah **static `.ttf`** dan lolos pemeriksaan `file public/fonts/*.ttf`.
3. **Jangan Import `@react-pdf/renderer` ke File Server/Shared:**
   - Pastikan `src/lib/pdf-fonts.ts` memiliki `"use client"` dan hanya di-import oleh `src/components/pdf/PdfDocument.tsx` (yang sudah dimuat via `next/dynamic(..., { ssr: false })` di `EditorTopBar.tsx`).
4. **URL Relatif Tidak Bisa Diklik di PDF Reader:**
   - Selalu lewati semua URL melalui `normalizeUrl(...)` agar `github.com/user` menjadi `https://github.com/user`, dan email melalui `toMailtoHref(...)` agar menjadi `mailto:user@domain.com`.
5. **Tampilan Link Tidak Boleh Berwarna Biru Mencolok:**
   - `@react-pdf/renderer` default-nya mewarnai `<Link>` menjadi biru. Selalu pasang `color: "#18181B"` pada style `<Link>` agar konsisten dengan palet monokromatis `agents-md/brand-guideline.md`.

---

## 6. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] Terdapat 16 file static `.ttf` valid di `public/fonts/` (`Inter`, `Roboto`, `EB Garamond`, `Merriweather` × Regular/Bold/Italic/BoldItalic).
- [x] `src/lib/pdf-fonts.ts` mendaftarkan keempat keluarga font dan memanggil `Font.registerHyphenationCallback((word) => [word])`.
- [x] `src/lib/url-utils.ts` menormalisasi URL (`https://`) dan email (`mailto:`) serta menolak protokol berbahaya (`javascript:`, `data:`).
- [x] `src/app/layout.tsx` memuat `Roboto` (`--font-roboto`) dan `src/lib/template-tokens.ts` memetakan ke-4 font secara akurat untuk HTML & PDF.
- [x] Seluruh tautan di `src/components/pdf/PdfDocument.tsx` (`basics.email`, `basics.links`, `projects[].url`, `certifications[].url`) dirender dengan `<Link>` berwarna `#18181B` (bukan biru default).
- [x] Tidak ada error SSR/hydration saat mengakses `/`, `/templates`, maupun `/editor`.

---

## 7. Checklist Verifikasi Wajib Sebelum Merge

### A. Verifikasi Otomatis (Terminal)
- [x] `file public/fonts/*.ttf` — ke-16 file terverifikasi `TrueType Font data`.
- [x] `npx tsc --noEmit && npm run lint` — 0 error dan 0 warning.
- [x] `npm run build` — exit code 0 (`/`, `/editor`, `/templates` berhasil di-build).
- [x] Verifikasi render `@react-pdf/renderer` untuk ke-4 font (`Inter`, `Roboto`, `EB Garamond`, `Merriweather`) & anotasi hyperlink (`mailto:`, `https://`).

```bash
# 1. Pastikan semua file font adalah TrueType valid
file public/fonts/*.ttf

# 2. Cek TypeScript & ESLint (wajib 0 error)
npx tsc --noEmit && npm run lint

# 3. Cek Production Build Next.js (wajib exit code 0)
npm run build
```

### B. Verifikasi Manual di Browser & PDF Viewer
Jalankan `npm run dev` dan buka `http://localhost:3000/editor`:
1. Uji ekspor **Download PDF** untuk **keempat pilihan font** di popover layout:
   - [ ] `Inter` → PDF terunduh tanpa error, tampil sans-serif Inter.
   - [ ] `Roboto` → PDF terunduh tanpa error, tampil sans-serif Roboto (sama dengan HTML preview).
   - [ ] `EB Garamond` (`serif`) → PDF terunduh tanpa error, tampil serif akademik LaTeX-style.
   - [ ] `Merriweather` (`georgia`) → PDF terunduh tanpa error, tampil serif editorial.
2. Buka hasil PDF di macOS Preview / Chrome PDF Viewer:
   - [ ] **Selectable Text:** Blok & copy teks dari PDF lalu paste ke Notepad — urutan baca harus linear dari atas ke bawah dan **tidak ada kata terpotong dengan tanda `-`** di akhir baris.
   - [ ] **Clickable Links:** Klik email (membuka mail client `mailto:`), klik tautan LinkedIn/GitHub (membuka `https://...`), klik URL Proyek, dan klik Sertifikasi yang memiliki URL.
   - [ ] **Multi-Halaman:** Tambahkan beberapa pengalaman hingga menjadi 2 halaman, lalu ekspor PDF dan pastikan tidak ada teks terpotong atau tumpang tindih.

---

## 8. Prosedur Commit & Merge (GitHub Flow)

Setelah seluruh checklist di Bagian 6 dan 7 lulus, centang Task 2 di `tasks/todo.md`, `tasks/plan.md`, `agents-md/TASKS.md`, dan `agents-md/FEATURES.md`, lalu jalankan:

```bash
git add public/fonts/ src/lib/pdf-fonts.ts src/lib/url-utils.ts src/lib/template-tokens.ts src/app/layout.tsx src/components/pdf/PdfDocument.tsx tasks/todo.md tasks/plan.md agents-md/TASKS.md agents-md/FEATURES.md
git commit -m "feat(pdf): register local TTF fonts, disable hyphenation, and add clickable PDF links"

git checkout main
git merge --no-ff feat/pdf-font-sync
git push origin main
git branch -d feat/pdf-font-sync
```

---

## 9. Antrean Issue Berikutnya

Setelah **ISSUE-002** di-merge ke `main`, issue berikutnya sesuai `tasks/todo.md` adalah:
- **ISSUE-003 (Task 3 — `test/ats-linter`):** Setup `vitest` dan unit test lengkap untuk `src/lib/ats-linter.ts` serta `extractLinearResumeText`.
