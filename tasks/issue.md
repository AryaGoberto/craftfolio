# ISSUE-016: Overleaf-Grade `.tex` Generator & `pdflatex` PDF Compiler Engine (Opsi 1)

| Atribut | Detail |
| :--- | :--- |
| **Branch Git Target** | `feat/overleaf-latex-pdf` *(buat dari `main` terbaru)* |
| **Target Eksekutor** | Junior Developer |
| **Estimasi Scope** | Medium–Large (8–10 file) |
| **Prasyarat Lokal (Opsional untuk Dev)** | TeX Live / MacTeX (`pdflatex`) atau Docker container (`web-dev` / `web-prod`) |

---

## 1. Latar Belakang & Masalah yang Diselesaikan

Berdasarkan perbandingan langsung antara PDF ekspor web saat ini (**`@react-pdf/renderer`**) dengan PDF hasil kompilasi **Overleaf (`pdfTeX-1.40.26`)**, ditemukan 2 masalah utama:

1. **Bug pada Renderer PDF Saat Ini (`src/components/pdf/PdfDocument.tsx`):**
   - **Header Bertabrakan (Overlap):** Nama di header (`styles.name`, `fontSize: 24`) tidak memiliki `lineHeight` eksplisit sehingga mewarisi `lineHeight` dari `Page` (`fontSize: 10`), menyebabkan baris kontak di bawahnya naik menimpa nama (*selisih Y hanya ~1.6pt*).
   - **Section Kosong Ikut Tercetak:** Custom section yang baru ditambahkan dengan item kosong (`title: ""`) tetap mencetak judul section kosong di PDF.
2. **Perbedaan Visual dengan Hasil Compile `.tex` Overleaf:**
   - `@react-pdf/renderer` memakai *Flexbox* JS dan font Google (`EB Garamond` / `Merriweather`) tanpa dukungan *True Small Caps* (`\scshape`), *Knuth–Plass paragraph justification*, *Computer Modern Roman* asli LaTeX, maupun metrik margin/indentasi `\resumeSubheading` ala *Jake's Resume*.
   - Agar hasil unduhan PDF **100% identik secara matematis & tipografis dengan Overleaf**, aplikasi perlu men-generate kode **`.tex`** dari data JSON form (`ResumeDocument`) lalu meng-compile-nya dengan **`pdflatex`** (Opsi 1).

---

## 2. Arsitektur Solusi (Opsi 1 — Real `.tex` Compilation + Safe Fallback)

```text
[Form Editor / Dashboard]
         │
         ├──► Klik "Download .tex (Overleaf)" ──► [generateLatexDocument(doc)] ──► File .tex
         │
         └──► Klik "Download PDF"
                   │
                   ▼
          [POST /api/pdf/latex]
                   ├── Jika `pdflatex` tersedia (Docker / Server / Lokal):
                   │      Compile .tex di temp folder terisolasi (-no-shell-escape)
                   │      ──► Kembalikan PDF 100% identik Overleaf (application/pdf)
                   │
                   └── Jika `pdflatex` BELUM terpasang (503 LATEX_UNAVAILABLE):
                          Fallback otomatis ke `@react-pdf/renderer` (yang sudah diperbaiki)
                          + tampilkan info halus bahwa PDF memakai mode browser fallback
```

### Prinsip Keamanan & Kepatuhan (*WAJIB DIPATUHI*)
1. **Dilarang LaTeX Injection / Crash Karakter Khusus:** Semua input teks user (`&`, `%`, `$`, `#`, `_`, `{`, `}`, `~`, `^`, `\`) **wajib** di-escape via `escapeLatex()` sebelum dimasukkan ke file `.tex`. Tanpa ini, karakter seperti `"40%"`, `"C#"`, `"R&D"`, atau perintah jahat `\input{/etc/passwd}` akan merusak kompilasi atau membocorkan file server.
2. **Dilarang Shell Escape & Command Injection:** Pemanggilan `pdflatex` **wajib** memakai `execFile` (bukan `exec`), selalu menyertakan flag `-no-shell-escape -interaction=nonstopmode -halt-on-error`, berjalan di direktori sementara unik (`fs.mkdtemp`), dan folder sementara tersebut **wajib dihapus** di blok `try / finally`.
3. **Guest Mode & Dev Tanpa TeX Tetap Jalan:** Jika developer atau pengguna menjalankan `npm run dev` tanpa `pdflatex` terinstal di laptopnya, aplikasi tidak boleh error/crash—tombol PDF harus otomatis *fallback* ke `@react-pdf/renderer` (yang bug header-nya sudah diperbaiki), dan tombol **Export `.tex`** tetap berfungsi 100% di browser.

### Yang TIDAK Dikerjakan (*Not Doing*)
- **TIDAK** meminta user menulis kode LaTeX secara manual (user tetap memakai form UI FormaCV).
- **TIDAK** mengganti Live Preview HTML kanan menjadi compiler PDF realtime (Live Preview HTML di `ResumeHtmlRenderer.tsx` tetap dipakai agar ketikan instan `< 100ms`).
- **TIDAK** menjalankan `pdflatex` dengan `--shell-escape`.

---

## 3. Tahapan Pengerjaan (Step-by-Step untuk Junior Developer)

### Tahap 1 — Perbaiki Bug Kritis di `@react-pdf/renderer` (`PdfDocument.tsx`)
Sebelum membangun engine `.tex`, pastikan fallback PDF di browser bebas dari bug fatal:
1. Buka `src/components/pdf/PdfDocument.tsx`:
   - Tambahkan `lineHeight: 1.2` secara eksplisit pada `styles.name`, `lineHeight: 1.3` pada `styles.headline`, `styles.contact`, dan `styles.sectionHeading` agar teks besar tidak bertabrakan dengan baris di bawahnya.
   - Tambahkan helper pengecekan item non-kosong sebelum merender item/section (misal untuk `customSections`: item dianggap valid hanya jika `title.trim()`, `subtitle?.trim()`, `date?.trim()`, atau ada bullet visible non-kosong—jika sebuah section tidak punya item berisi sama sekali, jangan cetak heading section-nya).
   - Beri `paddingLeft: isClassic ? 11 : 0` pada `skills`, `certifications`, `awards`, dan `languages` agar sejajar konsisten dengan section lainnya saat memakai template *Classic Academic*.

---

### Tahap 2 — Buat Generator `.tex` Overleaf (`src/lib/latex-generator.ts`)
Buat modul *pure function* (tanpa dependensi Node `fs` agar bisa jalan baik di browser maupun server API):

1. **Buat Helper Escaping (`escapeLatex(input: string): string`):**
   - Wajib memetakan seluruh 10 karakter khusus TeX dengan urutan aman (backslash **harus** pertama agar tidak menggandakan `{}` dari hasil escape karakter lain!):
     - `\` → `\textbackslash{}`
     - `{` → `\{`
     - `}` → `\}`
     - `&` → `\&`
     - `%` → `\%`
     - `$` → `\$`
     - `#` → `\#`
     - `_` → `\_`
     - `~` → `\textasciitilde{}`
     - `^` → `\textasciicircum{}`
   - Konversi tanda pisah rentang tanggal agar rapi di TeX: `–` (en-dash) → `--`, `—` (em-dash) → `---`, dan rapikan newline ganda menjadi spasi/baris baru aman.
2. **Buat Helper Link (`formatLatexHref(url: string, label: string): string`):**
   - Validasi & normalkan URL memakai `normalizeUrl` / `toMailtoHref` dari `src/lib/url-utils.ts`.
   - Jika URL tidak valid/kosong, kembalikan `escapeLatex(label)` saja tanpa `\href`.
   - Jika valid, escape karakter `%`, `#`, `&` pada URL agar `\href{...}{\underline{...}}` tidak error saat compile.
3. **Buat Fungsi Utama `generateLatexDocument(doc: ResumeDocument): string`:**
   - Hasilkan dokumen `.tex` lengkap berstruktur **Jake's Resume / Overleaf Classic Academic** yang persis menghasilkan layout seperti PDF Overleaf referensi:
     - **Preamble:**
       - `\documentclass[letterpaper,11pt]{article}` (atau `a4paper` sesuai `doc.config.paperSize`, ukuran `10pt`/`10.5pt`/`11pt` sesuai `doc.config.density` & `compact`).
       - Paket standar: `latexsym`, `fullpage` / `geometry` (margin `0.4in` untuk `compact`, `0.5in` untuk `normal`, `0.6in` untuk `relaxed`), `titlesec`, `enumitem`, `[hidelinks]{hyperref}`, `fancyhdr`, `tabularx`, `[T1]{fontenc}`, `[utf8]{inputenc}`.
       - Preset font: `serif` memakai font default **Computer Modern Roman** (identik 100% dengan Overleaf PDF referensi); `inter` / `roboto` memakai `\usepackage[sfdefault]{roboto}` (jika tersedia) atau `\usepackage[sfdefault]{helvet}`; `georgia` memakai `\usepackage{charter}`.
       - Heading section: `\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]` (menghasilkan *True Small Caps* + garis `\titlerule` tipis).
       - Makro `\resumeItem`, `\resumeSubheading`, `\resumeProjectHeading`, `\resumeSubHeadingListStart`, `\resumeItemListStart`, `\resumeItemListEnd`, `\resumeSubHeadingListEnd`.
     - **Header:**
       - `\textbf{\Huge <Nama Mixed Case>} \\ \vspace{2pt}` (rata kiri untuk `modern-minimal` / `executive`, rata tengah untuk `classic-latex` / `compact`).
       - Baris kontak terpusat dipisahkan `$|$` dengan `\href` clickable (`phone | email | links`).
     - **Isi Sections (`doc.config.sectionOrder`):**
       - Loop `doc.config.sectionOrder` sesuai urutan pengguna.
       - Abaikan setiap section/item/bullet yang `isVisible === false` atau isinya benar-benar kosong.
       - Mapping section `summary` (tanpa heading untuk `classic-latex`, rata kiri-kanan bawaan LaTeX), `experience`, `volunteering`, `education`, `projects`, `skills`, `certifications`, `awards`, `languages`, dan `customSections`.
   - **Bonus Export `.tex` Client-Side (`downloadResumeTex(doc)`):**
     - Tambahkan helper `downloadResumeTex(doc)` di `src/lib/pdf-download.tsx` untuk mengunduh string hasil `generateLatexDocument(doc)` sebagai `${safeName}_CV.tex` (`text/plain;charset=utf-8`).

---

### Tahap 3 — Buat Endpoint API Server Compiler (`src/app/api/pdf/latex/route.ts` & `src/lib/latex-compiler.ts`)
Buat Route Handler Next.js App Router (berjalan otomatis di Node.js runtime tanpa `export const runtime` agar kompatibel dengan `nextConfig.cacheComponents`):

1. **Validasi Request Body dengan Zod:**
   - Parse JSON body menggunakan `ResumeDocumentSchema.safeParse(body)`. Jika gagal, kembalikan `400 Bad Request`.
2. **Deteksi Ketersediaan Binary `pdflatex`:**
   - Cek path binary dari env `PDFLATEX_BIN` (default `"pdflatex"`).
   - Jika binary tidak ditemukan (`ENOENT`), kembalikan respons JSON terstruktur `503 Service Unavailable`:
     ```json
     { "code": "LATEX_COMPILER_UNAVAILABLE", "error": "Compiler pdflatex belum tersedia di server ini." }
     ```
3. **Eksekusi Aman di Direktori Temporer Terisolasi:**
   - Buat folder sementara: `const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "formacv-tex-"))`.
   - Generate sumber TeX via `generateLatexDocument(parsed.data)` dan tulis ke `path.join(tmpDir, "resume.tex")`.
   - Jalankan `pdflatex` menggunakan `execFile` (`node:child_process` yang di-promisify):
     ```typescript
     const args = [
       "-no-shell-escape",
       "-interaction=nonstopmode",
       "-halt-on-error",
       `-output-directory=${tmpDir}`,
       texFilePath,
     ];
     ```
   - **Jalankan 2 kali (`pass 1` & `pass 2`)** atau `1` kali jika tidak ada cross-reference (untuk `tabularx` / `\extracolsep` / `hyperref` bookmark, jalankan 2 pass cepat atau `1` pass cukup karena `tabular*` selesai dalam 1 pass; verifikasi hasil log). Batasi timeout `15_000` ms dan `maxBuffer: 2 * 1024 * 1024`.
   - Baca file hasil `path.join(tmpDir, "resume.pdf")`, kembalikan `new NextResponse(pdfBuffer, { status: 200, headers: { "Content-Type": "application/pdf", "X-Pdf-Engine": "pdflatex" } })`.
   - Jika kompilasi gagal, baca potongan error log (misal baris yang diawali `!` di `resume.log`) untuk debugging server, kembalikan `500` dengan pesan error ringkas tanpa membocorkan path sensitif server.
   - **Wajib di `finally`:** Hapus folder sementara `await fs.rm(tmpDir, { recursive: true, force: true })`.

---

### Tahap 4 — Perbarui `Dockerfile` & `.env.example` untuk Menjalankan `pdflatex`
1. **Perbarui `Dockerfile` (Stage `runner`):**
   - Image `node:20-alpine` sebelumnya belum memiliki LaTeX. Ganti base stage `runner` ke `node:20-bookworm-slim` (atau pasang `texlive` Alpine) dan install paket LaTeX minimal yang memuat `pdflatex`, `titlesec`, `enumitem`, `fullpage`, `hyperref`, `marvosym`, `roboto`:
     ```dockerfile
     FROM node:20-bookworm-slim AS runner
     WORKDIR /app
     ENV NODE_ENV=production
     ENV NEXT_TELEMETRY_DISABLED=1

     RUN apt-get update && apt-get install -y --no-install-recommends \
         texlive-latex-base \
         texlive-latex-recommended \
         texlive-latex-extra \
         texlive-fonts-recommended \
         texlive-fonts-extra \
       && rm -rf /var/lib/apt/lists/*
     ```
   - *Catatan:* Pastikan `addgroup`/`adduser` di Debian memakai syntax Debian (`groupadd -r nodejs && useradd -r -g nodejs -u 1001 nextjs`) serta direktori `/tmp` dapat ditulisi oleh user `nextjs`.
   - Uji build container: `docker compose --profile prod build` dan tes endpoint `/api/pdf/latex` di dalam container.
2. **Tambahkan `PDFLATEX_BIN=` (opsional) di `.env.example`.**

---

### Tahap 5 — Hubungkan ke UI Ekspor PDF, Menu Overflow `⋯` & Dashboard Card
1. **Perbarui `downloadResumePdf(doc)` di `src/lib/pdf-download.tsx`:**
   - Tambahkan return type status `{ engine: "pdflatex" | "react-pdf-fallback" }`.
   - Pertama coba `fetch("/api/pdf/latex", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc) })`.
   - Jika respons `200 OK` dan `Content-Type` adalah `application/pdf`, unduh blob PDF hasil compile `pdflatex` asli (`Overleaf-grade`).
   - Jika status `503` (`LATEX_COMPILER_UNAVAILABLE`) atau jaringan endpoint tidak tersedia, lakukan **fallback otomatis** ke `@react-pdf/renderer` (`ResumePdfDocument`) yang bug-nya sudah diperbaiki di Tahap 1 — sehingga pengguna tidak pernah mengalami tombol macet!
2. **Tambahkan Opsi Export `.tex (Overleaf)` di UI:**
   - Di **Editor (`EditorTopBar.tsx`)**: Tambahkan item menu **"Export LaTeX (.tex)"** di dropdown `⋯` (sebelah *Export Backup .json*).
   - Di **Dashboard (`CvDocumentCard.tsx`)**: Tambahkan item menu **"Export LaTeX (.tex)"** di dalam menu titik tiga `⋮`.
   - Di **`PdfExportButton.tsx`**: Tampilkan tooltip/judul jelas (*"Download PDF (Overleaf LaTeX)"*) dan notifikasi ringan jika sedang memakai fallback lokal tanpa `pdflatex`.

---

### Tahap 6 — Tambahkan Unit Test Lengkap (`src/lib/__tests__/latex-generator.test.ts` & Route Test)
1. **Uji `escapeLatex` & `formatLatexHref`:**
   - Menguji seluruh 10 karakter khusus (`& % $ # _ { } ~ ^ \`), memastikan tidak terjadi *double escaping*.
   - Menguji input berbahaya seperti `\input{/etc/passwd}` atau `\write18{ls}` agar ter-escape aman menjadi teks literal `\textbackslash{}input\{/etc/passwd\}`.
   - Menguji link `mailto:` dan `https://` valid vs input kosong / `javascript:alert(1)`.
2. **Uji `generateLatexDocument`:**
   - Menguji bahwa `isVisible: false` (baik level section, item, maupun bullet) **tidak muncul** di output `.tex`.
   - Menguji bahwa custom section dengan item kosong **tidak mencetak** `\section{...}`.
   - Menguji kesesuaian `paperSize` (`a4paper` vs `letterpaper`), header mixed-case nama, pemisah kontak `$|$`, urutan `sectionOrder`, dan keberadaan makro `\titleformat{\section}` (`\scshape` + `\titlerule`).
3. **Uji API Route `/api/pdf/latex` (dengan mocking `execFile`):**
   - Input tidak valid → mengembalikan status `400`.
   - Saat binary tidak ditemukan (`ENOENT`) → mengembalikan status `503` dengan `code: "LATEX_COMPILER_UNAVAILABLE"`.
   - Saat kompilasi sukses → mengembalikan `200` `application/pdf` dan membersihkan direktori sementara `tmpDir`.

---

## 4. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] `src/lib/latex-generator.ts` menghasilkan dokumen `.tex` valid bergaya Overleaf (*Jake's Resume*: *True Small Caps* `\scshape`, `\titlerule`, Computer Modern Roman default, indentasi seragam, hyperlink `\href`, serta escaping aman untuk seluruh karakter khusus TeX).
- [x] `src/app/api/pdf/latex/route.ts` memvalidasi input via `ResumeDocumentSchema`, mengeksekusi `pdflatex` dengan `-no-shell-escape` di temp directory yang selalu dibersihkan, dan mengembalikan `503 LATEX_COMPILER_UNAVAILABLE` secara aman jika `pdflatex` belum terpasang.
- [x] `Dockerfile` menyertakan instalasi paket TeX Live minimal sehingga `docker compose --profile prod up` mampu menghasilkan PDF asli yang 100% identik dengan Overleaf.
- [x] `downloadResumePdf` di `src/lib/pdf-download.tsx` memprioritaskan `/api/pdf/latex` dan melakukan fallback otomatis ke `@react-pdf/renderer` (yang sudah bebas bug header overlap dan section kosong di `PdfDocument.tsx`).
- [x] Tombol **Export LaTeX (.tex)** tersedia di menu `⋯` `EditorTopBar.tsx` dan menu `⋮` `CvDocumentCard.tsx` (file `.tex` dapat langsung di-upload & dicompile di Overleaf.com tanpa error).
- [x] Seluruh unit test (termasuk `src/lib/__tests__/latex-generator.test.ts`), `tsc`, `lint`, dan `build` lulus seluruhnya.

---

## 5. Cara Verifikasi

```bash
# 1. Jalankan pengujian unit, typecheck, linter, dan build
npm test
npx tsc --noEmit && npm run lint
npm run build

# 2. Uji Ekspor .tex di Overleaf:
#    - Klik menu "Export LaTeX (.tex)" di Editor atau Dashboard.
#    - Upload file .tex ke proyek baru di Overleaf.com dan pastikan compile sukses (0 error).

# 3. Uji Server pdflatex via Docker (atau MacTeX lokal):
docker compose --profile prod up --build
#    - Buka /editor -> Download PDF -> periksa bahwa header respons /api/pdf/latex adalah 200 application/pdf
#    - Cek PDF hasil unduhan: font Computer Modern, Small Caps pada heading section, tidak ada overlap, dan identik dengan hasil Overleaf.
```
