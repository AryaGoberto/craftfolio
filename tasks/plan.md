# Implementation Plan: FormaCV — Remaining MVP, Phase 2 (AI/ATS Intelligence) & Phase 3 (Cloud Sync)

Source spec: `agents-md/PRD.md`, `agents-md/DESIGN.md`, `agents-md/FEATURES.md`, `agents-md/AGENTS.md`, `tasks/todo.md`

## Overview

**FormaCV** adalah aplikasi web pembuat CV ramah ATS (*Applicant Tracking System*) dengan filosofi *"Kualitas tipografi sekelas LaTeX, semudah mengisi Google Form"*. Evaluasi terhadap kode saat ini (`src/`) menunjukkan bahwa **~85% fitur inti Fase 1 (MVP)** telah selesai dibangun (Landing Page, Split-Screen Editor, Zustand Store + Undo/Redo + Multi-CV Switcher, 4 Template ATS HTML & PDF, Rule-Based ATS Linter, JSON ATS X-Ray, dan Backup JSON). Rencana implementasi ini memetakan penyelesaian sisa **Fase 1 (MVP Polish & Verification)** sebagai prioritas utama sesuai aturan disiplin scope di `agents-md/AGENTS.md`, diikuti oleh **Fase 2 (ATS Intelligence, JD Tailoring & AI dengan Factuality Guardrails)** dan **Fase 3 (Supabase Cloud Sync & Multi-CV Dashboard)**.

## Evaluasi Status Proyek Saat Ini (Codebase Audit)

| Area / Modul | Status di `src/` | Temuan & Gap yang Perlu Diselesaikan |
| :--- | :--- | :--- |
| **Working Tree Git** | Ada perubahan belum di-commit | Refactoring ekstraksi `BulletListEditor.tsx` & `ItemCardWrapper.tsx` dari `SectionForms.tsx` serta penyederhanaan `use-resume-store.ts` perlu diverifikasi & di-commit bersih terlebih dahulu. |
| **Fase 1.1: Navigasi & Galeri** | Landing Page (`/`) selesai | Halaman **Galeri Template (`/templates`)** belum dibuat (`src/app/templates/page.tsx`). |
| **Fase 1.4 & 1.6: PDF Engine & Font Sync** | 4 Template HTML & PDF selesai | `PDF_FONT_FAMILIES` di `src/lib/template-tokens.ts` masih memakai fallback `Helvetica`/`Times-Roman`. File `.ttf` lokal di `public/fonts/` & `src/lib/pdf-fonts.ts` belum terdaftar, dan URL di `PdfDocument.tsx` masih berupa `<Text>` (belum `<Link>` yang *clickable*). |
| **Fase 1.6: Unit Testing** | `ats-linter.ts` selesai | Belum ada test runner (`vitest`) di `package.json` dan belum ada unit test `src/lib/__tests__/ats-linter.test.ts`. |
| **Fase 2: ATS X-Ray, JD Matcher & AI** | Belum dibuat (0%) | `AtsXRayView.tsx` saat ini baru mengekstrak dari state JSON (belum mem-parse blob PDF asli via `pdfjs-dist`). Fitur JD Keyword Matcher, AI Bullet Enhancer (`/api/ai/enhance`), dan Import CV (`/api/ai/parse-cv`) belum dibuat. |
| **Fase 3: Cloud Sync & Multi-CV** | Belum dibuat (0%) | Integrasi Supabase Auth + PostgreSQL RLS, halaman `/app` (Dashboard), `/settings`, dan fitur opsional (`.docx` export, public link, job tracker) belum dibuat. |

## Dependency Graph

```text
[Task 0: Working Tree Cleanup & Verification]
    │
    ├──► [Task 1: Galeri Template (/templates)]
    │
    ├──► [Task 2: Registrasi Font .ttf Lokal & Clickable Links PDF]
    │        │
    │        └──► [Task 4: ATS X-Ray Berbasis Ekstraksi Blob PDF Asli (pdfjs-dist)]
    │
    ├──► [Task 3: Setup Vitest & Unit Test ats-linter.ts]
    │        │
    │        └──► [Task 5: Job Description (JD) Keyword Matcher & Tailoring Flow]
    │                 │
    │                 ├──► [Task 6: Collapsible File Tree Sidebar & Reorderable Workspace Tabs]
    │                 │
    │                 ├──► [Task 7: AI Bullet-Point Enhancer (/api/ai/enhance)]
    │                 │
    │                 └──► [Task 8: Import CV Lama PDF/DOCX ke JSON (/api/ai/parse-cv)]
    │
    └──► [Task 9: Supabase Auth, Skema DB (RLS) & Migrasi LocalStorage]
             │
             └──► [Task 10: Dashboard Multi-CV (/app), Version History & Settings (/settings)]
```

## Architecture Decisions

1. **Prioritas Ketat Penyelesaian MVP (Fase 1) Sebelum Fase 2/3:**
   - Sesuai `agents-md/AGENTS.md` Bagian 5.4, kita wajib menuntaskan sinkronisasi font PDF `.ttf`, tautan PDF *clickable*, halaman `/templates`, dan pengujian otomatis `ats-linter.ts` sebelum menambahkan dependensi AI atau database eksternal.
2. **Registrasi Font `.ttf` Statis & Menonaktifkan Hyphenation pada `@react-pdf/renderer`:**
   - `@react-pdf/renderer` (fontkit) membutuhkan file `.ttf` statis di `public/fonts/` untuk `Inter`, `Roboto`, `EB Garamond`, dan `Merriweather` dengan `Font.registerHyphenationCallback((word) => [word])` agar teks PDF tidak terpotong tanda hubung saat di-parse mesin ATS.
3. **JD Keyword Matcher Berjalan Deterministik di Client Terlebih Dahulu:**
   - Agar hemat biaya server dan tetap berfungsi di *Guest Mode* tanpa API key, ekstraksi keyword lowongan kerja dan perbandingan antara *"Item Aktif CV"*, *"Item Tersembunyi di Master Profile (`isVisible: false`)"*, dan *"Belum Ada di CV"* diimplementasikan secara deterministik di browser (`src/lib/jd-matcher.ts`).
4. **AI Guardrails Berbasis Structured Output & Diff Confirmation:**
   - Endpoint `/api/ai/enhance` dan `/api/ai/parse-cv` wajib menggunakan skema Zod (`generateObject`) dengan instruksi sistem yang melarang penambahan angka/metrik palsu. UI tidak boleh langsung menimpa state `useResumeStore` tanpa klik konfirmasi eksplisit dari pengguna.
5. **GitHub Flow per Task:**
   - Sesuai `agents-md/GIT_RULES.md`, setiap task dikerjakan pada branch fitur terpisah yang dibuat langsung dari `main` (`feat/templates-page`, `feat/pdf-font-sync`, `test/ats-linter`, dst.) dan diverifikasi dengan `npx tsc --noEmit && npm run lint && npm run build`.

## Task List

Detail lengkap setiap task beserta *acceptance criteria*, *verification*, *dependencies*, dan *files touched* tercatat di [`tasks/todo.md`](./todo.md).

### Phase 1: Penyelesaian & Verifikasi MVP (Prioritas Utama)
- [x] Task 1: Commit Refactoring Working Tree & Buat Halaman Galeri Template (`/templates`)
- [x] Task 2: Registrasi Font `.ttf` Lokal & Perbaikan Clickable Links pada Ekspor PDF
- [x] Task 3: Setup Vitest & Unit Test Lengkap untuk `ats-linter.ts`

### Checkpoint 1: MVP Release Readiness ✅
- [x] Semua tes lulus (`npm test`), tipe & lint bersih (`npx tsc --noEmit && npm run lint`), build production sukses (`npm run build`)
- [x] Hasil unduhan PDF 1–2 halaman memiliki font identik dengan HTML preview, teks 100% *selectable*, dan link *clickable*

### Phase 2: ATS Intelligence, Tailoring & AI
- [x] Task 4: ATS X-Ray Mode Berbasis Ekstraksi Blob PDF Asli (`pdfjs-dist`)
- [x] Task 5: Job Description (JD) Keyword Matcher & Deteksi Master Profile Tersembunyi
- [x] Task 6: Collapsible File Tree Sidebar & Reorderable Workspace Tabs (`feat/workspace-tabs-filetree`)
- [ ] Task 7: AI Bullet-Point Enhancer dengan Factuality Guardrails (`/api/ai/enhance`)
- [ ] Task 8: Import CV Lama (PDF/DOCX) ke Form JSON dengan Langkah Review (`/api/ai/parse-cv`)

### Checkpoint 2: Phase 2 Complete
- [ ] Alur Tailoring CV end-to-end bekerja: Kelola Multi-CV di File Tree & Tab Bar → Import/Buat CV → Match JD → Enhance Bullet (dengan konfirmasi) → Verifikasi PDF X-Ray Asli

### Phase 3: Cloud Sync & Multi-CV Dashboard
- [ ] Task 9: Autentikasi Opsional Supabase, Tabel RLS & Migrasi Otomatis `localStorage`
- [ ] Task 10: Dashboard Multi-CV (`/app`), Riwayat Versi (`cv_versions`) & Pengaturan Privasi (`/settings`)

### Checkpoint 3: Full Roadmap Complete
- [ ] Guest Mode tetap berfungsi 100% tanpa login; pengguna yang login dapat menyinkronkan multi-CV dan riwayat versi dengan aman

## Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| File font `.woff2` atau variable font gagal dirender oleh `@react-pdf/renderer` | High | Gunakan file static `.ttf` (*Regular, Bold, Italic*) di `public/fonts/` dan uji render PDF untuk ke-4 preset font. |
| Worker `pdfjs-dist` gagal dimuat di Next.js App Router (Turbopack) | Medium | Gunakan dynamic import client-only (`ssr: false`) atau ekstraksi buffer PDF via helper ringan yang kompatibel dengan bundler Next.js 16. |
| Halusinasi AI mengarang angka/metrik pada Bullet Enhancer | High | Batasi prompt agar hanya merestrukturisasi kalimat (pola Action-Context-Result), beri placeholder `[X]%` jika pengguna ingin menambah metrik sendiri, dan wajibkan klik konfirmasi diff. |
| Konflik state saat migrasi `localStorage` Guest Mode ke akun Supabase | Medium | Bandingkan `id` dan `updatedAt`; unggah dokumen lokal sebagai dokumen baru/terbaru tanpa menghapus `localStorage` sampai sinkronisasi terkonfirmasi sukses. |

## Open Questions

1. **Perubahan di Working Tree Saat Ini:** Saat ini terdapat refactoring yang belum di-commit di working tree (`BulletListEditor.tsx`, `ItemCardWrapper.tsx`, `SectionForms.tsx`, `use-resume-store.ts`). Apakah Anda ingin kita melakukan verifikasi dan commit perubahan tersebut terlebih dahulu sebelum memulai branch `feat/templates-page` (Task 1)?
2. **Provider LLM untuk Fase 2:** Ketika masuk ke Fase 2 (Task 6 & Task 7), provider AI mana yang ingin Anda gunakan sebagai default dengan Vercel AI SDK (`@ai-sdk/google` Gemini Flash atau `@ai-sdk/openai` GPT-4o-mini)?
