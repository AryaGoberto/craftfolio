# Craftfolio — ATS-Friendly CV Builder

> **"Kualitas tipografi sekelas LaTeX, semudah mengisi Google Form."**

**Craftfolio** adalah aplikasi web pembuat CV berbasis *split-screen editor* yang memungkinkan siapa saja membuat resume bersih, terstruktur satu kolom, dan ramah *Applicant Tracking System* (ATS) tanpa perlu menulis kode LaTeX atau mengatur margin dan garis secara manual.

> **Catatan:** Kompatibilitas ATS tidak memiliki standar tunggal. Craftfolio berfokus pada struktur dokumen konvensional, urutan baca linear, dan teks PDF yang dapat diseleksi (*selectable text*), disertai pengecekan berbasis aturan—bukan mengklaim jaminan mutlak lolos semua sistem ATS.

---

## Fitur Utama (MVP)

- **Split-Screen Live Editor:** Form pengisian terpandu di panel kiri dan pratinjau dokumen kertas (A4 / US Letter) *real-time* di panel kanan (pada layar mobile otomatis beralih menjadi tab **Edit** dan **Preview**).
- **Master Profile Controls:** Ubah urutan *section* (*drag-and-drop* maupun tombol naik/turun) serta nyalakan/matikan visibilitas *section*, item, hingga masing-masing *bullet point* tanpa menghapus data asli.
- **Template ATS Terkurasi:** *Classic Academic* (gaya LaTeX / Jake's Resume), *Modern Minimalist*, *Compact*, dan *Executive Standard* — seluruhnya satu kolom dan bebas dekorasi pengganggu parser.
- **ATS Readability Checker & ATS X-Ray Mode:** Pemeriksaan deterministik berbasis aturan (`Good` / `Review` / `Fix`) serta simulasi urutan pembacaan teks linear.
- **Guest Mode & Backup JSON:** Tanpa wajib login; data tersimpan otomatis di `localStorage` lengkap dengan Undo/Redo dan fitur Export/Import `.json`.
- **Ekspor PDF Vector:** Menghasilkan file PDF dengan teks 100% *selectable* langsung di sisi klien.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **State & Undo/Redo:** Zustand (`persist` middleware) + Zundo (`temporal`)
- **Validasi Skema:** Zod
- **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Ikon:** `lucide-react`
- **PDF Engine (MVP):** `@react-pdf/renderer`

---

## Cara Menjalankan

### Prasyarat
- **Node.js** v20+ (untuk menjalankan secara lokal), **atau**
- **Docker & Docker Compose** v2 (untuk menjalankan di dalam container)

### Opsi 1 — Menjalankan Secara Lokal (Direkomendasikan untuk Development)

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server development
npm run dev
```

Buka browser dan akses:
- Landing Page: `http://localhost:3000`
- Split-Screen Editor: `http://localhost:3000/editor`

### Opsi 2 — Menjalankan dengan Docker

**Mode Development (dengan hot-reload):**
```bash
docker compose --profile dev up --build
```

**Mode Production:**
```bash
docker compose --profile prod up --build -d
```

**Menghentikan Container:**
```bash
docker compose --profile dev down
# atau
docker compose --profile prod down
```

---

## Perintah Verifikasi

```bash
# Cek tipe TypeScript
npx tsc --noEmit

# Cek ESLint
npm run lint

# Build production
npm run build
```

---

## Struktur Proyek & Dokumentasi

```text
.
├── src/
│   ├── app/                  # Halaman Next.js App Router (/, /editor)
│   ├── components/
│   │   ├── editor/           # Top bar, form section, drag-and-drop, ATS checker
│   │   ├── preview/          # Live HTML Preview & ATS X-Ray Mode
│   │   └── pdf/              # Template & tombol ekspor @react-pdf/renderer
│   ├── lib/
│   │   ├── schemas/          # Skema Zod & tipe ResumeDocument
│   │   ├── ats-linter.ts     # Aturan deterministik ATS Readability Checker
│   │   ├── default-resume.ts # Data contoh awal
│   │   └── template-tokens.ts# Token dimensi kertas & kerapatan spasi
│   └── store/                # Zustand store + localStorage persist + zundo
├── agents-md/                # Dokumentasi spesifikasi & panduan proyek
├── Dockerfile                # Multi-stage build production
├── Dockerfile.dev            # Container development
└── docker-compose.yml        # Konfigurasi service dev & prod
```

### Referensi Dokumen (`agents-md/`)
- [PRD.md](./agents-md/PRD.md) — *Product Requirements Document* & roadmap pengembangan
- [DESIGN.md](./agents-md/DESIGN.md) — *Technical Design Document* (arsitektur state, sinkronisasi PDF, aturan linter)
- [brand-guideline.md](./agents-md/brand-guideline.md) — Sistem desain, palet warna, dan tipografi
- [SETUP.md](./agents-md/SETUP.md) — Panduan setup Next.js, Tailwind CSS, & Docker
- [todo.md](./tasks/todo.md) — Daftar tugas & roadmap eksekusi (*single source of truth*)
- [GIT_RULES.md](./agents-md/GIT_RULES.md) — Aturan branching, format commit, & checklist push
- [AGENTS.md](./agents-md/AGENTS.md) — Panduan kerja untuk AI coding agent
