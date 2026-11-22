# GIT_RULES.md — Aturan & Alur Kerja Git (FormaCV)

Dokumen ini mengatur standar penamaan *branch*, format *commit*, serta pemeriksaan wajib sebelum kode masuk ke repositori **FormaCV**.

---

## 1. Strategi Branch

Gunakan struktur branch yang sederhana dan konsisten:

| Branch | Fungsi | Aturan |
| :--- | :--- | :--- |
| `main` | Branch utama yang selalu stabil dan siap build/deploy. | **Dilarang** commit fitur eksperimental langsung ke `main` jika masih setengah jadi. |
| `feat/<nama-fitur>` | Pengembangan fitur baru (misal: `feat/ats-linter`, `feat/pdf-export`). | Dibuat dari `main`, di-merge kembali ke `main` setelah lolos verifikasi. |
| `fix/<nama-bug>` | Perbaikan bug (misal: `fix/pdf-page-break`, `fix/hydration-flash`). | Fokus hanya pada bug terkait. |
| `refactor/<cakupan>` | Perapihan kode tanpa mengubah perilaku fitur. | Pastikan build dan lint tetap hijau. |
| `chore/<tugas>` | Setup, dependensi, Docker, atau konfigurasi proyek. | Contoh: `chore/docker-setup`. |
| `docs/<topik>` | Penambahan atau pembaruan dokumentasi Markdown (`agents/`). | Contoh: `docs/update-prd`. |

---

## 2. Format Pesan Commit (*Conventional Commits*)

Gunakan format:
```text
<type>(<scope opsional>): <deskripsi singkat dalam kalimat aktif>
```

### Tipe Commit yang Diizinkan
- `feat`: Menambah fitur baru untuk pengguna.
- `fix`: Memperbaiki bug.
- `refactor`: Mengubah struktur kode tanpa mengubah fungsionalitas.
- `style`: Perubahan UI/CSS/formatting tanpa mengubah logika bisnis.
- `docs`: Perubahan pada file dokumentasi (`*.md`).
- `chore`: Perubahan config, `package.json`, Docker, atau tooling.
- `test`: Menambah atau memperbaiki unit/integration test.
- `build`: Perubahan sistem build atau CI/CD.

### Contoh yang Benar vs. Dilarang
- **Benar:**
  - `feat(editor): add drag-and-drop section reordering`
  - `feat(preview): implement ATS X-Ray linear text view`
  - `fix(pdf): align A4 margins between HTML preview and PDF output`
  - `chore(docker): add multi-stage Dockerfile and compose profiles`
- **Dilarang:**
  - `update`, `fix`, `wip`, `asdf`, `benerin dikit`

### Prinsip Atomic Commit
- **1 commit = 1 perubahan logis yang jelas.** Hindari mencampur perubahan fitur UI baru, perbaikan bug tidak terkait, dan update dependensi dalam satu commit besar.

---

## 3. File yang Wajib Diabaikan (`.gitignore`)

Pastikan file berikut **tidak pernah** ter-commit ke repositori:
- `node_modules/`
- `.next/`, `out/`
- `.env`, `.env.local`, `.env.*.local` *(hanya `.env.example` tanpa nilai rahasia yang boleh masuk Git)*
- `.DS_Store`, `*.log`, `npm-debug.log*`
- Data pribadi/CV asli pengguna (gunakan data dummy di `src/lib/default-resume.ts`).

---

## 4. Checklist Wajib Sebelum Commit & Push

### Sebelum `git commit` (Wajib untuk perubahan kode di `src/`)
1. Cek file yang akan di-commit:
   ```bash
   git status
   git diff --staged
   ```
2. Pastikan tidak ada API key, token, atau `console.log` sisa debugging.
3. Jalankan pengecekan tipe & linter:
   ```bash
   npx tsc --noEmit && npm run lint
   ```

### Sebelum Merge ke `main` atau `git push` Fitur Besar
Jalankan build production untuk memastikan tidak ada error SSR/Turbopack:
```bash
npm run build
```

---

## 5. Alur Kerja Harian (Quick Reference)

```bash
# 1. Pastikan berada di main terbaru
git checkout main
git pull origin main

# 2. Buat branch baru untuk tugas saat ini
git checkout -b feat/nama-fitur

# 3. Setelah selesai & lolos tsc + lint + build:
git add <file-terkait>
git commit -m "feat(scope): deskripsi singkat perubahan"

# 4. Push branch ke remote
git push -u origin feat/nama-fitur
```
