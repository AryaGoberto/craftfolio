# Craftfolio — Brand & Design System Guidelines

- **Versi:** 1.0
- **Status:** Approved & Living Document
- **Filosofi Inti:** *"Kualitas tipografi sekelas LaTeX, ketenangan dan kemudahan alat tulis seperti Notion / iA Writer."*

---

## 1. Brand Identity & Karakter Visual

### 1.1 Brand Essence
Craftfolio adalah alat produktivitas berbasis web untuk membuat resume ramah *Applicant Tracking System* (ATS). Desain Craftfolio sengaja menjauhi estetika *"AI generic / slop"* (gradien neon, sci-fi dark mode berlebihan, ornamen dekoratif palsu). Sebaliknya, Craftfolio mengusung:

- **Calm & Editorial:** Antarmuka tenang, bebas distraksi visual, berfokus pada konten teks pengguna.
- **Utilitarian Elegance:** Setiap garis, jarak, dan tombol memiliki fungsi ergonomis yang jelas.
- **High Craftsmanship:** Tipografi presisi, spasi berirama, dan *micro-interaction* yang halus.

### 1.2 Logo & Simbol Brand
- **Logo Wordmark:** Ikon dokumen & pesawat kertas tipis bernuansa monokromatis (`BrandLogo`).
- **Brand Title:** Teks **Craftfolio** menggunakan font sans-serif geometris semi-bold (`Inter` / tracking normal).
- **Aturan Penggunaan:** Logo selalu tampil monokromatik (hitam di atas putih atau sebaliknya), tanpa gradien warna-warni, tanpa efek *glow*/*drop-shadow* berlebihan.

---

## 2. Palet Warna (Color System)

Craftfolio mengadopsi palet monokromatis dan netral hangat (*Warm & Neutral Grays*) dengan aksen fungsional yang sangat hemat.

### 2.1 Neutral & Surface Colors

| Token / Kelas | Kode HEX | Peruntukan Utama |
| :--- | :--- | :--- |
| `surface-canvas` | `#F8F9FA` | Latar belakang kanvas workspace utama & area preview luar |
| `surface-panel` | `#FAFAFA` | Latar belakang panel formulir editor kiri |
| `surface-card` | `#FFFFFF` | Permukaan kartu section form, kertas dokumen A4/Letter |
| `border-subtle` | `#E4E4E7` (Zinc-200) | Garis pemisah hairline `1px`, border kartu & toolbar |
| `border-divider` | `#F4F4F5` (Zinc-100) | Garis pemisah internal komponen / list item |

### 2.2 Typography & Text Colors

| Token / Kelas | Kode HEX | Peruntukan Utama |
| :--- | :--- | :--- |
| `text-primary` | `#09090B` (Zinc-950) | Heading, teks utama formulir, isi dokumen resume |
| `text-secondary` | `#52525B` (Zinc-600) | Label input, instruksi, metadata, sub-keterangan |
| `text-muted` | `#A1A1AA` (Zinc-400) | Placeholder text, ikon bantu sekunder, divider teks `/` |

### 2.3 Semantic & Functional Accents
Warna aksen hanya dipakai untuk indikasi status riil, bukan dekorasi grafis:

| Peran | Kode HEX | Penggunaan |
| :--- | :--- | :--- |
| `status-success` | `#10B981` (Emerald-500) | Dot auto-save ("Disimpan"), indikator lulus ATS checklist |
| `status-success-bg` | `#ECFDF5` (Emerald-50) | Latar badge lulus / checklist tuntas |
| `status-warning` | `#F59E0B` (Amber-500) | Peringatan panjang bullet / format tanggal perlu direview |
| `status-error` | `#EF4444` (Red-500) | Validasi kesalahan field wajib (email/nama) |
| `interactive-primary` | `#18181B` (Zinc-900) | Tombol CTA utama (Download PDF), pill pilihan aktif |

---

## 3. Tipografi (Typography Hierarchy)

Craftfolio membedakan secara tegas tipografi **UI Editor** (bersih, sans-serif) dan tipografi **Dokumen Resume** (editorial, akademik/LaTeX-grade).

### 3.1 Antarmuka Editor (UI Font: Inter / System Sans)
- **Editor App Title:** `14px` · Medium · Tracking `-0.01em`
- **Section Heading:** `13px` · Semi-Bold · Color `Zinc-900`
- **Input Labels:** `11px` · Medium · Uppercase/Sentence-case · Color `Zinc-600`
- **Input Field Values:** `13px` · Regular · Color `Zinc-900`
- **Toolbar Pills & Buttons:** `12px` · Medium · Color `Zinc-700` / `White` (active)
- **Status & Meta Counters:** `11px` · Regular · Monospace / Tabular numbers

### 3.2 Dokumen Resume (Document Font Presets)
- **Preset 1 (Academic Standard):** EB Garamond / Computer Modern Roman (LaTeX feel)
- **Preset 2 (Modern Clean):** Inter (Sans-serif minimalis, ATS high readability)
- **Preset 3 (Executive Editorial):** Merriweather / Liberation Serif

#### Aturan Tipografi Dokumen
- **Header Nama:** `22–24pt` · All-Caps / Small-Caps · Centered atau Left-aligned
- **Heading Section:** `11–12pt` · Bold / All-Caps dengan underline hairline `0.75pt`
- **Body Text:** `9.5–10.5pt` · Line-height `1.25–1.35` (rapat & teratur khas LaTeX)

---

## 4. Layout, Spacing & Elemen Komponen

### 4.1 Layout Split-Screen Workspace
- **Top Navigation Bar:** Tinggi fix `48px`, `border-bottom: 1px solid #E4E4E7`, latar `#FFFFFF`.
- **Collapsible File Tree Sidebar (Sisi Kiri Luar):** Lebar `230px – 250px` saat dibuka, latar `#F4F4F5` / `#FAFAFA`, `border-right: 1px solid #E4E4E7`. Item aktif menggunakan latar `#18181B` (teks putih) atau `#FFFFFF` dengan border `#E4E4E7` dan tombol konteks `⋮`. Dapat disembunyikan penuh agar tidak mempersempit ruang kerja pada layar laptop.
- **Workspace Tab Bar (Di Atas Area Kerja CV):** Tinggi `36px`, latar strip `#F4F4F5` dengan `border-bottom: 1px solid #E4E4E7`. Tab aktif berlatar `#FFFFFF` menyatu dengan panel di bawahnya, dilengkapi ikon dokumen, judul CV, dukungan *drag-and-drop* urutan tab, serta tombol tutup tab (`×`).
- **Kiri (Form Editor):** Lebar `460px – 520px` (atau `45%` viewport desktop), scroll vertikal independen, padding `20px`.
- **Kanan (Document Preview Canvas):** Sisa viewport, background kanvas `#F8F9FA`, centering dokumen dengan *auto-margins* dan *drop-shadow* realistis (`shadow-xl`).

### 4.2 Komponen Form & Master Profile Controls
- **Card Container:** Background `#FFFFFF`, `border: 1px solid #E4E4E7`, radius `8px` (`rounded-lg`), padding `16px`.
- **Drag & Reorder Handles:** Titik enam (`GripVertical`), warna `#A1A1AA`, hanya muncul saat hover atau dapat diakses via keyboard.
- **Visibility Toggle (`Eye` icon):** Mengizinkan item/bullet point dimatikan (`opacity-40`) tanpa menghapus konten asli (*Master Profile Tailoring*).
- **Input Fields:** Tinggi `34px`, `border: 1px solid #E4E4E7`, radius `6px` (`rounded-md`), fokus `ring-1 ring-zinc-900` halus tanpa glow berwarna biru terang.

### 4.3 Toolbar Terpadu (Unified Controls Strip)
- Segmented control strip berlatar `#F4F4F5`, radius `6px`, padding `2px`.
- Pemisah internal menggunakan hairline border vertikal setinggi `16px`.
- Pilihan aktif menggunakan latar `#FFFFFF` dengan shadow mikro (`shadow-sm`).

---

## 5. Do's & Don'ts (Prinsip Desain Anti-AI Slop)

### DO (Wajib Diterapkan)
- Pertahankan palet monokromatik netral dengan kontras keterbacaan tinggi (WCAG AAA).
- Jadikan preview dokumen terasa otentik seperti lembar kertas nyata yang dicetak.
- Gunakan *micro-interaction* yang tenang, responsif, dan instan (`<100ms` feedback).
- Berikan kontrol penuh pada manipulasi data pengguna (reorder, show/hide, export JSON).

### DON'T (Dilarang Keras)
- Jangan memakai gradien warna neon (misal: ungu-ke-cyan, biru elektrik glow).
- Jangan menggunakan *rounded pill* raksasa atau badge dekoratif yang tidak fungsional.
- Jangan menambahkan grafik *skill bar* persentase pada dokumen CV (merusak skor parsing ATS).
- Jangan membuat antarmuka terasa gelap gulita/sci-fi terminal kecuali diminta secara eksplisit untuk mode malam khusus developer.
