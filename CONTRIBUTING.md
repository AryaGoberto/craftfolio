# Panduan Kontribusi — Craftfolio

Terima kasih telah tertarik berkontribusi pada **Craftfolio**! Dokumen ini merangkum cara mulai, aturan Git, standar kode, dan checklist sebelum mengajukan Pull Request (PR).

---

## 1. Cara Mulai (*Quick Start*)

1. **Fork & Clone** repositori ini:
   ```bash
   git clone https://github.com/AryaGoberto/craftfolio.git
   cd online-cv-ats-maker
   ```
2. **Install dependensi** (pastikan Node.js v20+ terpasang):
   ```bash
   npm install
   ```
3. **Siapkan environment lokal** *(opsional — Guest Mode & Editor berjalan tanpa API key)*:
   ```bash
   cp .env.example .env.local
   ```
   Isi konfigurasi Firebase & `GOOGLE_GENERATIVE_AI_API_KEY` jika Anda mengerjakan fitur Cloud Sync atau Asisten AI.
4. **Jalankan server development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` (atau `/editor`).

---

## 2. Alur Kerja Git & Branching

Craftfolio menggunakan **GitHub Flow**: setiap branch baru **wajib dibuat dari `main` terbaru**.

### Konvensi Nama Branch
| Prefix | Kegunaan | Contoh |
| :--- | :--- | :--- |
| `feat/` | Fitur baru | `feat/jd-matcher-export` |
| `fix/` | Perbaikan bug | `fix/pdf-margin-overflow` |
| `refactor/` | Perapihan kode tanpa ubah perilaku | `refactor/resume-store` |
| `chore/` | Konfigurasi, dependensi, Docker | `chore/update-vitest` |
| `docs/` | Pembaruan dokumentasi (`*.md`) | `docs/api-examples` |

### Format Pesan Commit (*Conventional Commits*)
Gunakan prinsip *atomic commit* (1 commit = 1 perubahan logis):
```text
<type>(<scope opsional>): <deskripsi singkat dalam kalimat aktif>
```
- **Tipe:** `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `build`.
- **Contoh benar:** `feat(editor): add keyboard shortcut for file tree`, `fix(ai): refund quota on Gemini timeout`.
- **Hindari:** `update`, `fix`, `wip`, `benerin dikit`.

> Detail aturan Git lengkap dapat dilihat di [`agents-md/GIT_RULES.md`](./agents-md/GIT_RULES.md).

---

## 3. Standar Kode & Prinsip Proyek

- **Single Source of Truth:** Semua perubahan struktur data CV wajib memperbarui skema Zod di [`src/lib/schemas/resume.ts`](./src/lib/schemas/resume.ts) dan aturan validasi di [`firestore.rules`](./firestore.rules) (jika memengaruhi penyimpanan Cloud).
- **Kepatuhan ATS:** Template CV harus tetap satu kolom, memiliki urutan baca linear, dan menghasilkan teks PDF yang *selectable*.
- **Konsistensi Tema & Dark Mode:** Gunakan token CSS semantik (`bg-ui-*`, `text-ui-*`, `border-ui-*`) sesuai [`agents-md/brand-guideline.md`](./agents-md/brand-guideline.md) — hindari *hardcoded hex* pada komponen UI.
- **Keamanan & Privasi:**
  - **Dilarang** meng-commit `.env.local`, API key, token, atau data CV pribadi asli (gunakan data dummy di `src/lib/default-resume.ts`).
  - Endpoint API baru wajib menerapkan validasi input (Zod), pengecekan origin/auth, dan batas ukuran payload.
- **Testing:** Perubahan logika bisnis, linter, parser, atau API route wajib disertai unit test di `src/lib/__tests__/`.

---

## 4. Checklist Wajib Sebelum Pull Request

Jalankan seluruh perintah verifikasi berikut dan pastikan semuanya **hijau (0 error)**:

```bash
# 1. Jalankan semua unit test (Vitest)
npm test

# 2. Cek tipe TypeScript
npx tsc --noEmit

# 3. Cek ESLint
npm run lint

# 4. Pastikan production build sukses
npm run build
```

Saat membuka **Pull Request** ke branch `main`, sertakan:
- Ringkasan singkat **apa** yang diubah dan **mengapa**.
- Tangkapan layar (*screenshot*) atau rekaman singkat jika mengubah UI (sertakan mode terang & gelap bila relevan).
- Cara menguji perubahan tersebut secara lokal.

---

## 5. Melaporkan Bug & Mengusulkan Fitur

- **Bug Report:** Sertakan langkah reproduksi, hasil yang diharapkan (*expected*), hasil aktual (*actual*), browser/OS, serta log error atau *screenshot* jika ada.
- **Feature Request:** Jelaskan masalah pengguna yang ingin diselesaikan, usulan solusi, dan dampaknya terhadap alur kerja CV ATS.
