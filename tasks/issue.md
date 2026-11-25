# ISSUE-018: Visual & Typographic Parity — Menyamakan Hasil PDF (`Alan_Walker_CV.pdf`) dengan Referensi Overleaf (`Nov-Resume`)

| Atribut | Detail |
| :--- | :--- |
| **Branch Git Target** | `fix/pdf-overleaf-typography-parity` *(buat dari `main` setelah PR #17)* |
| **Target Eksekutor** | Junior / Mid Developer |
| **Estimasi Scope** | Medium (6–8 file) |
| **Fokus Area** | Fallback PDF (`@react-pdf/renderer`), Generator LaTeX (`.tex`), Live Preview HTML, dan Default Bahasa Section |

---

## 1. Temuan Forensik: Mengapa `Alan_Walker_CV.pdf` Masih Berbeda dari Overleaf Asli?

Setelah menginspeksi kedua file PDF secara visual dan membongkar metadata serta koordinat teks (`pdfjs-dist`) pada **`Alan_Walker_CV.pdf`** vs **`Nov-Resume-Arya Gunavaro Goberto.pdf`**, ditemukan **1 fakta arsitektur penting** ditambah **5 pembeda tipografi & layout spesifik**:

### Fakta Kunci: Engine yang Menghasilkan `Alan_Walker_CV.pdf`
| Properti Metadata | `Alan_Walker_CV.pdf` (Hasil Terbaru Web) | `Nov-Resume-Arya Gunavaro Goberto.pdf` (Overleaf Asli) |
| :--- | :--- | :--- |
| **PDF Producer** | **`react-pdf`** *(Mode Browser Fallback)* | **`pdfTeX-1.40.26`** *(LaTeX Compiler)* |
| **Ukuran Kertas** | `A4` (`595.28 × 841.89 pt`) | `US Letter` (`612.00 × 792.00 pt`) |
| **Margin Kiri / Kanan** | `38.0 pt` (area tulis `519.3 pt`) | `36.0 pt` / `0.5 in` (area tulis `540.0 pt`) |
| **Font Utama** | `EB Garamond` *(x-height kecil secara optik)* | `Computer Modern Roman` (`CMR` / `CMBX` / `CMCSC`) |
| **Ukuran Nama Header** | `24.00 pt` | `24.79 pt` (`\Huge`) |
| **Ukuran Kontak** | `9.50 pt` | `9.96 pt` (`\small`) |
| **Ukuran Paragraf Summary** | **`10.00 pt`** | **`10.91 pt`** (`\normalsize` 11pt) |
| **Ukuran Sub-Header Section** | **`11.00 pt` (All-Caps biasa)** | **`11.96 pt` (*True Small Caps* `\scshape`)** |
| **Ukuran Posisi / Kampus / Tanggal** | `10.00 pt` / `9.50 pt` | `10.91 pt` *(keduanya 11pt)* |
| **Ukuran Subjudul Italic** | `9.50 pt` | `9.96 pt` |
| **Ukuran Titik Bullet (`•`)** | `10.00 pt` *(terlalu besar)* | `5.98 pt` *(kecil & rapi di tengah)* |

> **Mengapa `Alan_Walker_CV.pdf` memakai `react-pdf` bukan `pdflatex`?**
> Karena saat aplikasi dijalankan lokal lewat `npm run dev` tanpa instalasi `pdflatex` (BasicTeX / MacTeX / Docker), endpoint `/api/pdf/latex` mengembalikan `503 LATEX_COMPILER_UNAVAILABLE` sehingga tombol **Download PDF** otomatis turun ke mode **Browser Fallback (`src/components/pdf/PdfDocument.tsx`)**.
>
> **Kesimpulan Penting:** Kita harus menyempurnakan **KEDUA jalur** — baik **Mode Browser Fallback (`PdfDocument.tsx` + `template-tokens.ts`)** agar tanpa `pdflatex` pun hasilnya hampir 100% identik dengan Overleaf, maupun **Mode LaTeX (`latex-generator.ts`)** agar saat dikompilasi di Docker/Overleaf hasilnya persis sampai ke detail paragraf & heading.

---

## 2. Analisis Pembeda Utama, Akar Masalah (*Root Cause*), & Solusi

### Pembeda 1 — Lebar Paragraf Ringkasan Profesional Terlalu Sempit (Tidak Mencapai Ujung Kanan)
- **Bukti Pengukuran (`pdfjs-dist`):**
  - Di **Overleaf asli (`Nov-Resume`)**, batas kanan area isi CV berada di `x = 576.0 pt`, dan teks summary mengalir hingga **`x = 553.9 – 571.4 pt`** (**96%–99%** lebar area tulis).
  - Di **`Alan_Walker_CV.pdf`**, batas kanan area isi CV (garis horizontal & tanggal) berada di `x = 557.3 pt`, tetapi teks summary berhenti di **`x = 432.5 – 462.8 pt`** — menyisakan ruang kosong **`95 – 125 pt` (~3.5–4.4 cm)** di sebelah kanan!
- **Akar Masalah (*Root Cause*):**
  1. **Karakter Newline Keras (`\n`) Hasil Copy-Paste Dipertahankan Apa Adanya:** Saat teks summary (atau bullet) disalin dari PDF lalu di-paste ke textarea editor, terdapat karakter `\n` tunggal di akhir setiap baris PDF lama (persis setelah `"data science,"`, `"versatile"`, `"LLM performance"`, `"contribute to"`). Di `PdfDocument.tsx` (`<Text>{basics.summary.text}</Text>`) dan `ResumeHtmlRenderer.tsx` (`whitespace-pre-line`), `\n` tunggal memaksa teks turun baris sebelum menyentuh tepi kanan!
  2. **Tidak Ada Perataan Kanan-Kiri (`textAlign: "justify"`):** Pada `PdfDocument.tsx` (baris 157), `<Text>` summary tidak memiliki `textAlign: "justify"`, sehingga tepi kanan bergerigi (*ragged right*). Demikian juga di `latex-generator.ts`, perintah global `\raggedright` (baris 495) ikut mematikan rata kanan-kiri pada paragraf summary.
  3. **Ukuran Font Summary Lebih Kecil & Sempit:** Summary di `Alan_Walker_CV.pdf` memakai `10.00 pt` `EB Garamond` (lebih sempit ~15% dibanding `10.91 pt` Computer Modern), sehingga baris yang patah karena `\n` tampak makin pendek dan "menggantung" di kiri.
- **Solusi:**
  1. Buat helper normalisasi paragraf (mis. `normalizeParagraphText(text: string)` di `src/lib/resume-item-utils.ts`): ubah *single newline* (`\n`) menjadi spasi tunggal agar teks mengalir penuh (*reflow*) ke tepi kanan, sementara baris kosong ganda (`\n\n`) tetap dipertahankan sebagai pemisah paragraf. Terapkan juga normalisasi *single newline* untuk teks bullet.
  2. Terapkan `textAlign: "justify"` (dan `width: "100%"`) pada teks summary di `PdfDocument.tsx` dan `ResumeHtmlRenderer.tsx`.
  3. Di `latex-generator.ts`, ubah summary dari `\small{...}` menjadi ukuran normal (`\normalsize`) dan gunakan `\usepackage{ragged2e}` dengan blok `{\justifying ... \par}` agar paragraf summary rata kiri-kanan penuh sejajar ujung kanan tanggal/garis section.

---

### Pembeda 2 — Ukuran Font Terlihat Lebih Kecil pada Level Zoom yang Sama
- **Bukti Pengukuran:**
  - Hampir seluruh elemen teks di `Alan_Walker_CV.pdf` lebih kecil **`0.5 pt` s/d `1.4 pt`** dibanding Overleaf asli (`Summary` `10pt` vs `10.91pt`, `Section Heading` `11pt` vs `11.96pt`, `Judul Posisi/Tanggal` `10pt/9.5pt` vs `10.91pt`, `Nama` `24pt` vs `24.79pt`).
  - Ditambah lagi, font **`EB Garamond`** secara optik memiliki *x-height* (tinggi huruf kecil seperti `a, e, o, x`) sekitar **12% lebih kecil** daripada **Computer Modern Roman** pada ukuran `pt` yang sama!
  - Selain itu, kertas default `A4` (`841.89 pt` tinggi) lebih panjang `50 pt` dibanding `US Letter` (`792 pt`), sehingga pada tampilan *Fit to Page* di PDF viewer, teks A4 tampak sedikit lebih kecil.
- **Solusi:**
  1. **Kalibrasi Skala Font `classic-latex` ke Metrik LaTeX `11pt` Asli (`src/lib/template-tokens.ts` & `PdfDocument.tsx`):**
     - `name`: `~25 pt` (untuk `normal`), `margin`: `36 pt` (`0.5 in`) kiri/kanan & atas/bawah.
     - `sectionHeading`: `12 pt` (`\large`).
     - `summary`, `boldTitle` (posisi/institusi), dan `dateText` baris 1: **`11 pt`** (`10.91 pt` di LaTeX).
     - `contact`, `italicSubText`, dan `bulletText`: **`10 pt`** (`9.96 pt` di LaTeX).
  2. **Tambahkan / Gunakan Font *Computer Modern Unicode* (`CMU Serif`) untuk Preset `serif` (Classic Academic):**
     - Unduh 4 varian font `.ttf` open-source (lisensi *SIL Open Font License*) **CMU Serif** (`cmunrm.ttf`, `cmunbx.ttf`, `cmunti.ttf`, `cmunbi.ttf`) ke `public/fonts/` dan daftarkan di `src/lib/pdf-fonts.ts` (serta `@font-face` lokal di CSS untuk HTML Preview).
     - Dengan `CMU Serif`, baik tampilan *Browser Fallback PDF* maupun *Live Preview HTML* memiliki proporsi lebar huruf, *x-height*, dan nuansa klasik **100% setara Computer Modern Overleaf**!

---

### Pembeda 3 — Underline Tautan Informasi Pribadi Terlalu Rapat
- **Bukti Visual:**
  - Di `Alan_Walker_CV.pdf`, garis bawah pada `Alan@gmail.com`, `https://aryag12.vercel.app/`, `github.com/alanwalker`, dan `linkedin.com/alanwalker` menempel langsung ke dasar huruf (*baseline*) dan memotong ekor huruf turun (`g`, `p`, `y`).
- **Akar Masalah (*Root Cause*):**
  - Di `PdfDocument.tsx` baris 72, `<Link>` memakai `textDecoration: "underline"`. Mesin `@react-pdf/renderer` menggambar garis tepat pada posisi `underlinePosition` font yang sangat rapat dan **tidak mendukung properti CSS `textUnderlineOffset`**.
  - Di `latex-generator.ts`, `\underline{...}` standar TeX juga relatif dekat pada huruf berekor jika tidak diatur kedalaman garisnya.
- **Solusi:**
  1. **Di `PdfDocument.tsx` (Browser Fallback):**
     - Ubah baris kontak dari satu `<Text>` datar menjadi kontainer flex-wrap terpusat (`flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center"`).
     - Untuk setiap kontak yang berupa tautan (`email`, `links`), hapus `textDecoration: "underline"` dan ganti dengan **border bawah terkontrol**:
       ```tsx
       linkWrapper: {
         borderBottomWidth: 0.6,
         borderBottomColor: "#18181B",
         paddingBottom: 1.5, // Memberi jarak napas ~1.5pt agar tidak menempel ke g/p/y
       }
       ```
     - Pastikan pemisah `|` juga memiliki jarak horizontal yang seimbang (`marginHorizontal: 5`) dan sejajar secara vertikal.
  2. **Di `ResumeHtmlRenderer.tsx`:**
     - Gunakan `underline underline-offset-[3px] decoration-[0.75px]` agar tampilan HTML Preview konsisten lega dengan PDF.
  3. **Di `latex-generator.ts` (`pdflatex`):**
     - Gunakan paket `\usepackage[normalem]{ulem}` (dengan `\IfFileExists{ulem.sty}{\usepackage[normalem]{ulem}\setlength{\ULdepth}{2pt}}{}`) dan makro `\uline{...}` (fallback `\underline{...}`) agar garis bawah pada tautan di hasil compile `pdflatex` juga berjarak rapi di bawah *descender*.

---

### Pembeda 4 — Sub-Header Masih Bahasa Indonesia & Belum *True Small Caps* (`E` Lebih Besar dari `XPERIENCE`)
- **Bukti Visual & Kode:**
  - Di `Nov-Resume`, judul section berbahasa Inggris (**`Education`**, **`Experience`**, **`Projects`**, **`Technical Skills`**) dan dirender dengan **True Small Caps (`\scshape`)**: huruf kapital awal (**`E`**, **`P`**, **`T`**, **`S`**) berukuran penuh (`12 pt`), sementara huruf lainnya (**`DUCATION`**, **`XPERIENCE`**, **`ROJECTS`**) berbentuk huruf kapital kecil (`~9.5 pt`).
  - Di `Alan_Walker_CV.pdf`, judulnya masih Bahasa Indonesia (`PENGALAMAN KERJA`, `PENDIDIKAN`, `PROYEK`, `KEAHLIAN`) dan seluruh huruf berukuran sama besar (`11 pt` *all-caps*).
- **Akar Masalah (*Root Cause*):**
  1. **Default Bahasa pada CV Baru Masih `"id"`:** Di `src/lib/default-resume.ts` baris 203–240, fungsi `createEmptyResume()` (yang dipanggil saat pengguna klik **+ Buat CV Baru**) menginisialisasi `language: "id"` dan judul section Bahasa Indonesia (`"Pengalaman Kerja"`, `"Pendidikan"`, `"Proyek"`, `"Keahlian"`), berbeda dengan `createSampleResume()` yang memakai `"en"`.
  2. **`@react-pdf/renderer` Tidak Mendukung `fontVariant: "small-caps"`:** Di `PdfDocument.tsx` baris 84, heading memakai `textTransform: "uppercase"` sehingga semua huruf memiliki tinggi yang sama persis.
  3. **Potensi Jebakan `\scshape` di `latex-generator.ts`:** Di LaTeX, `\scshape` hanya mengecilkan huruf *lowercase* (`a–z`). Jika judul section tersimpan sebagai huruf kapital semua (mis. `"EXPERIENCE"`), `\scshape` tetap akan merendernya sama tinggi!
- **Solusi:**
  1. **Default Bahasa Inggris untuk CV Baru (`src/lib/default-resume.ts`):**
     - Ubah `createEmptyResume()` agar default-nya `language: "en"` dengan judul section Bahasa Inggris standar Overleaf (`"Experience"`, `"Education"`, `"Projects"`, `"Technical Skills"`, `"Certifications"`, `"Awards"`, `"Volunteering"`, `"Languages"`).
     - Pengguna tetap bisa beralih ke Bahasa Indonesia kapan saja lewat dropdown **Tampilan → Bahasa CV**.
  2. **Komponen `<SmallCapsHeading />` di `PdfDocument.tsx` (Untuk `classic-latex`):**
     - Buat helper `formatTitleCaseForSmallCaps(title: string)` dan komponen kecil `<SmallCapsHeading title={...} style={...} />` yang tetap merender **satu elemen `<Text>` utuh** (aman 100% untuk ATS linear text extraction) dengan `<Text>` anak per segmen kata:
       - Karakter pertama tiap kata (atau huruf kapital awal) dirender pada ukuran penuh **`12 pt`** (`headingSizePt`).
       - Karakter sisanya dirender dalam huruf kapital pada ukuran **`~9.3 pt`** (`headingSizePt * 0.78`, `letterSpacing: 0.35`).
     - Contoh hasil visual untuk `"Experience"` → **`E`** (`12 pt`) + **`XPERIENCE`** (`9.3 pt`), dan `"Technical Skills"` → **`T`**`ECHNICAL` **`S`**`KILLS` — identik dengan *Small Caps* Overleaf!
  3. **Normalisasi Title Case di `latex-generator.ts`:**
     - Buat helper `toSmallCapsInput(title: string)`: jika seluruh huruf input berupa uppercase semua (mis. `"EXPERIENCE"`), ubah ke Title Case (`"Experience"`) sebelum dibungkus `\section{...}` agar `\scshape` selalu memunculkan kontras huruf awal besar & huruf berikutnya kecil.
  4. **Sinkronisasi `ResumeHtmlRenderer.tsx`:**
     - Pastikan heading `classic-latex` memakai `fontVariant: "small-caps"` dengan Title Case yang rapi (termasuk untuk judul 2 kata seperti `"Technical Skills"`).

---

### Pembeda 5 (Bonus Penyelarasan Detail Visual) — Ukuran Titik Bullet & Sub-Heading
- **Bullet Dot (`•`):** Di `Nov-Resume`, ukuran titik bullet hanya `5.98 pt` (halus & tidak mendominasi teks), sedangkan di `PdfDocument.tsx` ukurannya `10 pt` (terlalu tebal/besar). Ubah `bulletDot` di `PdfDocument.tsx` (khusus `classic-latex`) menjadi `fontSize: 7.5, paddingTop: 1.5, width: 9` agar halus seperti `\tiny\bullet` di LaTeX.
- **Tebal Garis Section (`\titlerule`):** Di `PdfDocument.tsx`, gunakan `borderBottomWidth: 0.6`, `borderBottomColor: "#000000"`, `paddingBottom: 1.5`, `marginBottom: 6` agar ketebalan garis bawah heading sangat mirip `\titlerule` (`0.4pt`–`0.6pt`) di Overleaf.

---

## 3. Tahapan Pengerjaan (Step-by-Step untuk Developer)

> **Catatan:** Jangan mengubah kode dulu sebelum issue ini disetujui & dibuatkan branch `fix/pdf-overleaf-typography-parity`.

### Tahap 1 — Tambah Helper Normalisasi Paragraf & Title Case (`src/lib/resume-item-utils.ts`)
1. Tambahkan `normalizeParagraphText(text: string): string`:
   - Ubah `\r\n` → `\n`.
   - Pisahkan berdasarkan paragraf ganda (`/\n\s*\n+/`), lalu di dalam tiap paragraf ubah single `\n` dan spasi berlebih menjadi satu spasi `" "`.
   - Gabungkan kembali dengan `"\n\n"` (untuk multi-paragraf) atau kembalikan satu blok teks bersih (untuk bullet).
2. Tambahkan `normalizeSmallCapsTitle(title: string): string`:
   - Jika seluruh huruf alfabet di `title` adalah huruf kapital (mis. `"EXPERIENCE"` atau `"TECHNICAL SKILLS"`), ubah ke Title Case (`"Experience"`, `"Technical Skills"`). Jika sudah mixed-case (mis. `"UI/UX Experience"`), pertahankan huruf kapitalnya.
3. Tulis unit test untuk kedua helper tersebut di `src/lib/__tests__/latex-generator.test.ts` (atau file test terpisah) **sebelum** implementasi (TDD).

---

### Tahap 2 — Ubah Default Sub-Header CV Baru ke Bahasa Inggris (`src/lib/default-resume.ts` & `src/lib/i18n.ts`)
1. Di `src/lib/default-resume.ts`:
   - Pada `createEmptyResume()`, ubah `language: "en"` dan perbarui seluruh `sections.*.title` ke Bahasa Inggris standar Overleaf:
     - `experience`: `"Experience"`
     - `education`: `"Education"`
     - `projects`: `"Projects"`
     - `skills`: `"Technical Skills"`
     - `certifications`: `"Certifications"`
     - `awards`: `"Awards"`
     - `volunteering`: `"Volunteering"`
     - `languages`: `"Languages"`
   - Samakan juga `skills.title` di `createSampleResume()` jika ingin konsisten `"Technical Skills"` (cek dulu apakah ada unit test di `ats-linter.test.ts` yang mengecek `"SKILLS"` — karena `"TECHNICAL SKILLS"` tetap mengandung `"SKILLS"`, pastikan seluruh test di `ats-linter.test.ts` dan `dashboard-utils.test.ts` tetap hijau!).
2. Pastikan ketika pengguna secara eksplisit mengganti dropdown **Bahasa CV** ke `"id"` di `EditorTopBar.tsx`, judul section masih dapat berubah ke Bahasa Indonesia seperti sebelumnya.

---

### Tahap 3 — Kalibrasi Ukuran Font, Margin, & Aset Font `NewCM10-Book` (`public/fonts/`, `src/lib/pdf-fonts.ts`, `src/lib/template-tokens.ts`, `src/app/globals.css`)
1. Tambahkan 4 file `.otf` resmi **New Computer Modern 10pt Book** (weight `450`, lisensi SIL OFL — versi *Computer Modern* dengan ketebalan teks regular yang lebih solid di layar & PDF viewer dibanding `CMUSerif-Roman` weight `400` yang tipis) ke `public/fonts/`:
   - `NewCM10-Book.otf` (400/450 normal)
   - `NewCM10-Bold.otf` (700 normal)
   - `NewCM10-BookItalic.otf` (400/450 italic)
   - `NewCM10-BoldItalic.otf` (700 italic)
2. Daftarkan keluarga font `"CMU Serif"` di `src/lib/pdf-fonts.ts` dan petakan `PDF_FONT_FAMILIES.serif = "CMU Serif"` (serta `@font-face` lokal `"CMU Serif"` di `globals.css` untuk `HTML_FONT_FAMILIES.serif`) sehingga *Classic Academic* memakai *Computer Modern* asli baik di HTML Preview maupun PDF Fallback!
3. Kalibrasi `DENSITY_TOKENS` di `src/lib/template-tokens.ts` (khususnya preset `normal`) agar sejajar dengan LaTeX `11pt`:
   - `paddingYPt: 36`, `paddingXPt: 36` (`0.5 in`)
   - `nameSizePt: 23` (`+2 = 25 pt` untuk `classic-latex`, sangat dekat dengan `24.79 pt` Overleaf)
   - `headingSizePt: 12` (`11.96 pt` Overleaf)
   - `bodySizePt: 10.5`–`11` untuk summary & subheading, sementara bullet/subjudul/kontak memakai `10 pt` (`9.96 pt` Overleaf).

---

### Tahap 4 — Perbaiki Paragraf Full-Width, Underline Renggang, *Small Caps*, & Bullet Dot di `PdfDocument.tsx` dan `ResumeHtmlRenderer.tsx`
1. **Paragraf Summary & Bullet Full-Width (`PdfDocument.tsx` & `ResumeHtmlRenderer.tsx`):**
   - Lewatkan `basics.summary.text` dan `b.text` ke `normalizeParagraphText(...)` sebelum dirender.
   - Beri `textAlign: "justify"` pada paragraf summary di `PdfDocument.tsx` (dan pastikan container summary memiliki `width: "100%"` tanpa padding kanan ekstra).
2. **Underline Tautan Kontak yang Lega (`PdfDocument.tsx` & `ResumeHtmlRenderer.tsx`):**
   - Di `PdfDocument.tsx`, ubah baris kontak (`isClassic`) menjadi flex-wrap row (`flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center"`).
   - Hilangkan `textDecoration: "underline"` pada link kontak; bungkus `<Link>` dalam `<View style={styles.contactLinkUnderline}>` dengan `borderBottomWidth: 0.6, borderBottomColor: "#18181B", paddingBottom: 1.5`.
   - Di `ResumeHtmlRenderer.tsx`, gunakan `underline underline-offset-[3px] decoration-[0.75px]`.
3. **Sub-Header *Small Caps* (`E` Lebih Besar dari `XPERIENCE`) di `PdfDocument.tsx`:**
   - Implementasikan komponen `SmallCapsSectionHeading` khusus untuk `isClassic`:
     - Bungkus seluruh judul di dalam satu `<Text style={styles.sectionHeading}>`.
     - Pecah judul hasil `normalizeSmallCapsTitle(title)` menjadi token huruf kapital awal (`fontSize: density.headingSizePt`) dan huruf non-awal (`fontSize: Number((density.headingSizePt * 0.78).toFixed(2))`, `textTransform: "uppercase"`, `letterSpacing: 0.35`).
   - Pastikan secara teks PDF (`extractTextFromPdfBuffer`), kata `"Experience"` tetap terbaca utuh tanpa spasi terpecah!
4. **Bullet Dot Halus:**
   - Kecilkan `bulletDot` pada `isClassic` menjadi `fontSize: 7.5`, `paddingTop: 1.5`, `width: 9` agar proporsional dengan `•` `5.98 pt` di Overleaf.

---

### Tahap 5 — Penyelarasan `latex-generator.ts` (Untuk Jalur `pdflatex` / Overleaf)
1. **Summary Full-Width & Ukuran `11pt` (`\normalsize`):**
   - Hapus pembungkus `\small{...}` pada paragraf summary agar ukuran fontnya `10.91 pt` (`\normalsize`) persis seperti `Nov-Resume`.
   - Muat `\IfFileExists{ragged2e.sty}{\usepackage{ragged2e}}{}` dan bungkus paragraf summary dengan `\justifying` (atau nonaktifkan `\raggedright` khusus blok summary) agar teks merata sampai tepi kanan area CV.
   - Terapkan `normalizeParagraphText` pada summary dan bullet sebelum `escapeLatex`.
2. **Underline Tautan yang Rapi:**
   - Muat `\IfFileExists{ulem.sty}{\usepackage[normalem]{ulem}\setlength{\ULdepth}{2pt}}{}` dan pakai `\uline{...}` (fallback `\underline{...}`) pada `formatLatexHref` agar garis bawah tautan tidak terlalu rapat ke huruf `g/p/y`.
3. **Jaminan *Small Caps* pada `\section{...}`:**
   - Lewatkan setiap judul section ke `normalizeSmallCapsTitle(...)` sebelum `escapeLatex` sehingga `\titleformat{\section}{...\scshape...}` selalu menghasilkan huruf pertama besar & huruf berikutnya *small caps*.

---

### Tahap 6 — Unit Test Regresi & Verifikasi Visual
1. Perbarui & tambahkan test di `src/lib/__tests__/pdf-document.test.ts`:
   - **Test lebar paragraf summary:** Render CV dengan summary yang mengandung hard `\n` (simulasi copy-paste dari PDF), ekstrak koordinat `x..right` tiap baris dengan `pdfjs-dist`, dan pastikan baris summary mengisi **≥ 85%** lebar area konten (`rightX >= pageWidth - marginRight - 45`).
   - **Test ukuran font:** Pastikan `summary` ≥ `10.5 pt`, `sectionHeading` ≥ `11.5 pt`, dan huruf pertama heading (`E`) memiliki `fontSize` lebih besar daripada huruf sisanya (`XPERIENCE`) pada template `classic-latex`.
   - **Test teks ATS tetap utuh:** Pastikan `extractTextFromPdfBuffer` tetap membaca `"Experience"` / `"Education"` sebagai kata utuh (bukan `"E xperience"`).
2. Perbarui test di `src/lib/__tests__/latex-generator.test.ts`:
   - Pastikan summary tidak lagi dibungkus `\small{...}`, single `\n` ternormalisasi menjadi spasi, dan judul all-caps `"EXPERIENCE"` dikonversi menjadi `\section{Experience}` agar `\scshape` bekerja benar.
3. Perbarui test default bahasa di `src/lib/__tests__/dashboard-utils.test.ts` / `workspace-tabs.test.ts` bila diperlukan.
4. Jalankan `npm test && npx tsc --noEmit && npm run lint && npm run build`, lalu unduh ulang PDF di browser dan bandingkan berdampingan pada zoom 100% dengan `Nov-Resume-Arya Gunavaro Goberto.pdf`.

---

## 4. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] Paragraf **Summary** (termasuk teks hasil copy-paste yang memiliki `\n` tunggal) mengalir penuh & rata sampai ujung kanan sejajar batas kanan tanggal/garis CV, baik di mode fallback `@react-pdf/renderer`, Live Preview HTML, maupun hasil `pdflatex`.
- [x] Ukuran font pada zoom yang sama setara dengan Overleaf referensi (`~25 pt` nama, `~12 pt` heading, `~11 pt` summary & judul pengalaman/pendidikan/tanggal, `~10 pt` kontak/subjudul/bullet) menggunakan font *Computer Modern* (`CMU Serif`) pada template *Classic Academic*.
- [x] Garis bawah (*underline*) pada tautan kontak (`email`, `portfolio`, `github`, `linkedin`) memiliki jarak napas yang jelas (~`1.5–2 pt`) dan tidak menempel/memotong huruf `g`, `p`, `y`.
- [x] Sub-header CV baru (`createEmptyResume`) default menggunakan **Bahasa Inggris** (`Experience`, `Education`, `Projects`, `Technical Skills`, dll.) dan dirender dengan tipografi **Small Caps** (huruf awal tiap kata lebih besar daripada huruf sisanya) yang tetap terbaca utuh oleh parser ATS.
- [x] Seluruh unit test (termasuk test regresi lebar paragraf & *Small Caps*), `npx tsc --noEmit`, `npm run lint`, dan `npm run build` lulus tanpa error.
