# Craftfolio — Brand & Design System Guidelines

- **Versi:** 2.0
- **Status:** Approved & Living Document
- **Filosofi Inti:** *"Kualitas tipografi sekelas LaTeX, ketenangan dan kemudahan alat tulis seperti Notion / iA Writer."*

---

## 1. Brand Identity & Karakter Visual

### 1.1 Brand Essence
Craftfolio adalah alat produktivitas berbasis web untuk membuat resume ramah *Applicant Tracking System* (ATS). Desain Craftfolio mengusung palet editorial **Warm Forest Sage** dalam dua mode (**Light Mode** & **Dark Mode**) dan sengaja menjauhi estetika *"AI generic / slop"* (gradien neon, sci-fi glow berlebihan, ornamen dekoratif palsu):

- **Calm & Editorial:** Permukaan alabaster hangat (Light) dan arang-zaitun tenang (Dark) bebas distraksi visual, berfokus pada konten teks pengguna.
- **Utilitarian Elegance:** Setiap garis pemisah, jarak, dan tombol memiliki fungsi ergonomis yang jelas dengan aksen hijau hutan (*Forest Sage*) yang terukur.
- **High Craftsmanship:** Tipografi presisi, spasi berirama, *micro-interaction* halus, serta pemisahan mutlak antara antarmuka aplikasi dan lembar kertas dokumen CV.

### 1.2 Logo & Simbol Brand
- **Logo Mark:** Karakter lembar dokumen origami hidup **Foldy** (`BrandLogo` di `src/components/BrandLogo.tsx` dan `icon.svg` favicon).
- **Brand Title:** Teks **Craftfolio** menggunakan font sans-serif geometris semi-bold (`Inter` / tracking `-0.01em`).
- **Aturan Penggunaan:** `BrandLogo` memakai warna Warm Forest Sage (`--foldy-body` & `--foldy-flap`), adaptif terhadap Light Mode dan Dark Mode, dengan sudut lipatan origami dan senyum khas Foldy yang bersih dan ramah. Hover halus (`hover:scale-105`) memberi sentuhan hidup tanpa mengganggu tata letak navbar.

### 1.3 Maskot Pendamping — Foldy (Warm Forest Sage Origami Companion)
- **Komponen:** `<FoldyMascot />` (`src/components/mascot/FoldyMascot.tsx`) dengan token warna khusus `--foldy-body` (`#1F7A61` Light / `#258066` Dark), `--foldy-flap` (`#114839` Light / `#165B48` Dark), dan `--foldy-shadow`.
- **Prinsip *Zero Floating Widget*:** Foldy selalu tertanam di permukaan UI yang sudah ada (Hero Landing, kartu `/templates`, empty & greeting states `/dashboard`, avatar hidup di `EditorTopBar` + `FoldyCoachPopover`, serta header modal AI/ATS/Export) — **tidak pernah** melayang menutupi form atau kertas CV A4.
- **Performa & Aksesibilitas:** Menggunakan arsitektur *Dual-Engine Auto-Sleep* (`ambient` 0% loop saat mengetik + `interactive` yang otomatis tidur saat keluar viewport / tab non-aktif), menghormati `prefers-reduced-motion`, dan menyediakan kontrol mode `Aktif / Tenang / Sembunyikan` (`craftfolio-foldy-prefs`).

---

## 2. Palet Warna — Warm Forest Sage (Light & Dark Mode)

Craftfolio memetakan seluruh warna antarmuka aplikasi ke CSS custom properties `[data-color-scheme="light" | "dark"]` di `src/app/globals.css` yang diekspos sebagai token Tailwind v4 (`--color-ui-*` / kelas `ui-*`).

### 2.1 Neutral & Surface Tokens

| Token (`ui-*`) | Light Mode | Dark Mode | Peruntukan Utama |
| :--- | :--- | :--- | :--- |
| `ui-canvas` | `#F5F4EF` | `#111311` | Latar belakang kanvas workspace utama & area preview di luar kertas CV |
| `ui-panel` | `#FAF9F5` | `#171A17` | Latar belakang panel formulir editor kiri & area pratinjau strip |
| `ui-subtle` | `#EAE8E0` | `#222622` | Latar file tree sidebar, tab tidak aktif, dan track segmented control |
| `ui-card` | `#FFFFFF` | `#1B1E1B` | Permukaan kartu form, header topbar, modal, popover, dan dropdown |
| `ui-border` | `#E6E4DD` | `#2C312C` | Garis pemisah hairline `1px`, border kartu, input & toolbar |
| `ui-border-strong` | `#D6D3C9` | `#3C433C` | Border dashed, border hover komponen, dan garis batas halaman UI |
| `ui-divider` | `#F0EEE7` | `#232723` | Garis pemisah internal kartu, menu dropdown, dan tabel |

### 2.2 Typography & Text Tokens

| Token (`ui-*`) | Light Mode | Dark Mode | Peruntukan Utama |
| :--- | :--- | :--- | :--- |
| `ui-text` | `#181917` | `#ECEEE8` | Heading, teks utama formulir, judul tab aktif, nilai input |
| `ui-text-secondary` | `#57564F` | `#B2B5AC` | Label input, instruksi, metadata, tab tidak aktif |
| `ui-text-muted` | `#78756C` | `#8E9288` | Teks meta sekunder, counter kata/halaman, indikator sync |
| `ui-text-placeholder` | `#9C9A90` | `#6E726A` | Placeholder text input, ikon drag handle sekunder |

### 2.3 Brand Primary, Focus & Link Accents

| Token (`ui-*`) | Light Mode | Dark Mode | Penggunaan |
| :--- | :--- | :--- | :--- |
| `ui-primary` | `#165B48` | `#1D6A54` | Latar tombol CTA utama (`Download PDF`, `Masuk`, dll.) dengan teks putih `#FFFFFF` & item aktif File Tree |
| `ui-primary-hover` | `#114839` | `#258066` | Status `:hover` pada CTA utama `bg-ui-primary` |
| `ui-primary-soft` | `#E9F3EF` | `#17332A` | Latar soft badge ikon section editor, nav aktif, kartu rekomendasi AI |
| `ui-primary-soft-text` | `#114839` | `#7ED9B7` | Teks & ikon di atas `ui-primary-soft` |
| `ui-link` / `ui-link-hover` | `#165B48` / `#114839` | `#58C4A0` / `#7ED9B7` | Link aksi (`+ Tambah tautan`, `Gunakan Print PDF`) & ikon aksen di atas kartu/panel |
| `ui-focus` | `#165B48` | `#58C4A0` | Ring fokus keyboard (`focus:ring-ui-focus`, `focus-visible:ring-ui-focus`) dengan kontras WCAG ≥ 3:1 |

### 2.4 Semantic Status Tokens

Warna status hanya digunakan untuk indikasi sistem riil (ATS checklist, sync status, validasi, warning halaman meluber):

| Peran | Light Mode | Dark Mode | Penggunaan |
| :--- | :--- | :--- | :--- |
| `ui-success` | `#10B981` | `#34D399` | Dot auto-save aktif, centang ATS pass |
| `ui-success-bg` / `ui-success-border` / `ui-success-text` | `#ECFDF5` / `#A7F3D0` / `#065F46` | `#0D2820` / `#1B4D3E` / `#6EE7B7` | Badge lulus ATS, banner sukses impor/auth, ringkasan ideal |
| `ui-warning` | `#F59E0B` | `#FBBF24` | Ikon peringatan sync/overflow/ATS review |
| `ui-warning-bg` / `ui-warning-border` / `ui-warning-text` | `#FFFBEB` / `#FDE68A` / `#92400E` | `#2B210B` / `#574115` / `#FCD34D` | Banner Mode Guest, peringatan halaman meluber, kartu keyword belum cocok |
| `ui-error` | `#EF4444` | `#F87171` | Validasi error wajib & aksi hapus |
| `ui-error-bg` / `ui-error-border` / `ui-error-text` | `#FEF2F2` / `#FECACA` / `#B91C1C` | `#2C1414` / `#5C2323` / `#FCA5A5` | Banner error autentikasi/impor, highlight hover tombol keluar/hapus |

### 2.5 Aturan Isolasi Kertas Dokumen CV (*Paper Isolation Rule*)
> **Penting:** Dark Mode hanya berlaku pada antarmuka aplikasi (*UI chrome*). Seluruh dokumen CV (`ResumeHtmlRenderer`, `PdfDocument`, pratinjau kertas pada `/templates`, `CvDocumentCard`, `HeroWorkspacePreview`, `TemplateStripSection`, dan `PreviewPanel`) **wajib selalu tampil di atas kertas putih `#FFFFFF` dengan tinta netral gelap (`#000000` / `#09090B` / `#18181B`)**. Dengan begitu pratinjau CV di layar tetap otentik seperti lembar cetak fisik dan identik dengan hasil ekspor PDF.

---

## 3. Tipografi (Typography Hierarchy)

Craftfolio membedakan secara tegas tipografi **UI Editor** (bersih, sans-serif) dan tipografi **Dokumen Resume** (editorial, akademik/LaTeX-grade).

### 3.1 Antarmuka Editor (UI Font: Inter / System Sans)
- **Editor App Title:** `14px` · Semi-Bold (`600`) · Tracking `-0.01em`
- **Section Heading:** `13px` · Semi-Bold · Color `ui-text`
- **Input Labels:** `11px` · Medium · Sentence-case · Color `ui-text-secondary`
- **Input Field Values:** `13px` · Regular · Color `ui-text`
- **Toolbar Pills & Buttons:** `12px` · Medium · Color `ui-text-secondary` / `ui-text` / `#FFFFFF` (on `ui-primary`)
- **Status & Meta Counters:** `11px` · Regular · Monospace / Tabular numbers (`ui-text-muted`)

### 3.2 Dokumen Resume (Document Font Presets)
- **Preset 1 (Academic Standard):** Computer Modern (`CMU Serif`)
- **Preset 2 (Modern Clean):** Inter / Roboto (Sans-serif minimalis, ATS high readability)
- **Preset 3 (Executive Editorial):** Merriweather (Serif editorial)

#### Aturan Tipografi Dokumen
- **Header Nama:** `22–24pt` · All-Caps / Small-Caps · Centered atau Left-aligned
- **Heading Section:** `11–12pt` · Bold / Small-Caps dengan underline hairline `0.6pt–0.75pt`
- **Body Text:** `9.5–10.5pt` · Line-height `1.22–1.38` (rapat & teratur khas LaTeX)

---

## 4. Layout, Spacing, Tema Gelap/Terang & Elemen Komponen

### 4.1 Mekanisme Light & Dark Mode
- Preferensi disimpan di `localStorage` dengan kunci `craftfolio-color-scheme` (`"light"` atau `"dark"`), dan mengikuti `prefers-color-scheme` sistem bila pengguna belum memilih secara manual.
- Skrip inisialisasi inline (`COLOR_SCHEME_INIT_SCRIPT` di `src/app/layout.tsx`) menetapkan `document.documentElement.dataset.colorScheme` sebelum first paint untuk mencegah kilatan mode terang saat halaman dimuat dalam Dark Mode.
- Tombol toggle tema (`ColorSchemeToggle`) ditempatkan terintegrasi di header/topbar setiap halaman (`/`, `/templates`, `/dashboard`, dan `/editor`), tanpa tombol melayang terpisah.

### 4.2 Layout Split-Screen Workspace
- **Top Navigation Bar:** Tinggi fix `48px` (`/editor`) atau `56px` (`/`, `/templates`, `/dashboard`), `border-bottom: 1px solid ui-border`, latar `ui-card`.
- **Collapsible File Tree Sidebar (Sisi Kiri Luar):** Lebar `240px` (`w-60`) saat dibuka, latar `ui-subtle`, `border-right: 1px solid ui-border`. Item aktif menggunakan `bg-ui-primary` dengan teks putih dan tombol konteks `⋮`.
- **Workspace Tab Bar (Di Atas Area Kerja CV):** Tinggi `36px`, latar strip `ui-subtle` dengan `border-bottom: 1px solid ui-border`. Tab aktif berlatar `ui-card` menyatu dengan workspace di bawahnya, dilengkapi dukungan *drag-and-drop* urutan tab dan tombol tutup (`×`).
- **Kiri (Form Editor):** Lebar `480px–520px`, latar `ui-panel`, scroll vertikal independen, padding `16px–20px`.
- **Kanan (Document Preview Canvas):** Sisa viewport, background kanvas `ui-canvas`, centering dokumen kertas putih `#FFFFFF` dengan *drop-shadow* realistis (`shadow-xl`).

### 4.3 Komponen Form & Master Profile Controls
- **Card Container:** Background `ui-card`, border `ui-border`, radius `8px` (`rounded-lg`).
- **Drag & Reorder Handles:** Titik enam (`GripVertical`), warna `ui-text-placeholder`, aksesibel dan mendukung keyboard.
- **Visibility Toggle (`Eye` icon):** Mengizinkan item/bullet point dimatikan (`opacity-40`) tanpa menghapus konten asli (*Master Profile Tailoring*).
- **Input Fields:** Tinggi `34px`, border `ui-border`, latar `ui-card`, radius `6px` (`rounded-md`), fokus `ring-1 ring-ui-focus`.

### 4.4 Toolbar Terpadu (Unified Controls Strip)
- Segmented control strip berlatar `ui-subtle`, border `ui-border`, radius `6px`, padding `2px`.
- Pemisah internal menggunakan hairline `ui-border` vertikal setinggi `14px–16px`.
- Pilihan aktif menggunakan latar `ui-card` dengan `shadow-2xs` / `shadow-sm`.

---

## 5. Do's & Don'ts (Prinsip Desain Anti-AI Slop)

### DO (Wajib Diterapkan)
- Pertahankan palet **Warm Forest Sage** melalui token semantic `ui-*` agar Light Mode dan Dark Mode tetap konsisten dengan kontras tinggi (WCAG AA/AAA).
- Jaga dokumen preview CV & ekspor PDF tetap berlatar putih bersih `#FFFFFF` dan tinta gelap di mode apa pun.
- Gunakan *micro-interaction* yang tenang, responsif, serta hormati `prefers-reduced-motion`.
- Berikan kontrol penuh pada manipulasi data pengguna (reorder, show/hide, export JSON/LaTeX/PDF).

### DON'T (Dilarang Keras)
- Jangan memakai gradien warna neon (misal: ungu-ke-cyan, efek *glow* sci-fi pada kartu atau tombol).
- Jangan menggunakan *hardcoded hex colors* netral/status di komponen UI baru (selalu gunakan token `ui-*`), kecuali untuk renderer kertas CV.
- Jangan menambahkan grafik *skill bar* persentase pada dokumen CV (merusak skor parsing ATS).
- Jangan menginversi warna kertas CV menjadi gelap saat pengguna memilih Dark Mode.
