# DESIGN.md — Technical Design Document (MVP)

Dokumen ini merinci arsitektur teknis, kontrak *state*, sinkronisasi preview/PDF, aturan deterministik *ATS Linter*, serta *component tree* untuk tahap MVP **Craftfolio**, melengkapi spesifikasi di [PRD.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents-md/PRD.md) dan [brand-guideline.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents-md/brand-guideline.md).

---

## 1. Arsitektur State (`useResumeStore`)

Seluruh state editor dikelola di client-side oleh **Zustand** (`src/store/use-resume-store.ts`) dengan kombinasi middleware `temporal` (`zundo`) dan `persist` (`localStorage`).

### 1.1 Struktur State
```typescript
interface ResumeStoreState {
  // Persisted Data
  documents: Record<string, ResumeDocument>;
  activeDocumentId: string;
  openTabIds: string[]; // Daftar ID dokumen CV yang sedang dibuka di Workspace Tab Bar (dapat diurutkan)
  fileOrder: string[];  // Urutan ID dokumen CV di File Tree Sidebar

  // Ephemeral UI State (TIDAK disimpan ke localStorage & TIDAK masuk history zundo)
  saveStatus: 'saved' | 'saving' | 'unsaved';
  activeSection: SectionKey | 'basics';
  mobileTab: 'edit' | 'preview';
  previewZoom: number; // default: 0.85 atau 'fit'
  isFileTreeOpen: boolean; // Toggle buka/tutup File Tree Sidebar di luar area editor CV
  hasHydrated: boolean;
}
```

### 1.2 Konfigurasi Middleware (`persist` + `zundo`)
1. **Urutan Pembungkusan:** `persist(temporal(storeCreator, zundoOptions), persistOptions)` agar riwayat Undo/Redo tetap bekerja pada sesi aktif sementara data dokumen tersimpan otomatis.
2. **Filter History (`zundo` `partialize`):**
   - Hanya melacak `documents` dan `activeDocumentId`.
   - Abaikan perubahan pada `saveStatus`, `activeSection`, `mobileTab`, `previewZoom`, dan `hasHydrated` agar menekan `Ctrl+Z` hanya mengembalikan isi CV, bukan memindahkan tab UI.
   - Batasi `limit: 50` langkah undo.
3. **Konfigurasi `persist` & Migrasi `schemaVersion`:**
   - `name`: `'craftfolio-storage'`
   - `version`: `1`
   - `partialize`: hanya simpan `{ documents, activeDocumentId }`.
   - `onRehydrateStorage`: set `hasHydrated = true` setelah pembacaan `localStorage` selesai (mencegah Next.js *hydration mismatch*).
   - `migrate(persistedState, version)`: jika `version < 1` atau dokumen di dalamnya memiliki `schemaVersion` lama, jalankan migrasi bertahap untuk mengisi properti baru dengan nilai default yang aman sebelum validasi Zod.
4. **Debounced Save Indicator:**
   - Setiap mutasi konten langsung memperbarui store (agar Live Preview instan `< 100ms`), men-set `saveStatus: 'saving'`, lalu setelah `300ms` idle men-set `saveStatus: 'saved'`.

### 1.3 Daftar Actions
- **Document, File Tree & Workspace Tab Lifecycle:**
  - `createDocument(templateId?, language?)` *(menambahkan dokumen ke `documents`, `fileOrder`, `openTabIds`, dan menjadikannya `activeDocumentId`)*
  - `duplicateDocument(id)`
  - `renameDocument(id, title)`
  - `deleteDocument(id)` *(menjaga minimal 1 dokumen tetap ada; menghapus dari `documents`, `fileOrder`, dan `openTabIds`)*
  - `setActiveDocument(id)` *(mengaktifkan dokumen dan memastikannya masuk ke `openTabIds`)*
  - `openTab(id)` / `closeTab(id)` *(menutup tab dari `openTabIds` tanpa menghapus dokumen dari `documents` / File Tree; menjaga minimal 1 tab tetap terbuka)*
  - `reorderTabs(oldIndex, newIndex)` *(mengubah urutan tab di `WorkspaceTabBar` via drag-and-drop)*
  - `reorderFiles(oldIndex, newIndex)` *(mengubah urutan file di `FileTreeSidebar`)*
  - `toggleFileTree(open?: boolean)`
  - `loadSampleResume()` / `clearActiveResume()`
  - `importResumeJson(rawJson: string): { ok: boolean; error?: string }` *(divalidasi dengan `ResumeDocumentSchema.safeParse`)*
  - `exportResumeJson(id?: string): string`
- **Config & Basics:**
  - `updateConfig(patch: Partial<ResumeDocument['config']>)`
  - `setLanguage(lang: 'id' | 'en')` *(opsional menyinkronkan heading default yang belum dikustomisasi)*
  - `updateBasics(patch)`
  - `addLink()`, `updateLink(id, patch)`, `removeLink(id)`, `toggleLinkVisibility(id)`
  - `updateSummary(patch)`
- **Section & Item Controls (*Master Profile*):**
  - `reorderSections(newOrder: SectionKey[])`
  - `toggleSectionVisibility(sectionKey)`
  - `updateSectionTitle(sectionKey, title)`
  - `addSectionItem(sectionKey, item)`
  - `updateSectionItem(sectionKey, itemId, patch)`
  - `removeSectionItem(sectionKey, itemId)`
  - `toggleItemVisibility(sectionKey, itemId)`
  - `reorderSectionItems(sectionKey, oldIndex, newIndex)`
- **Bullet Controls:**
  - `addBullet(sectionKey, itemId)`
  - `updateBullet(sectionKey, itemId, bulletId, text)`
  - `removeBullet(sectionKey, itemId, bulletId)`
  - `toggleBulletVisibility(sectionKey, itemId, bulletId)`
  - `reorderBullets(sectionKey, itemId, oldIndex, newIndex)`
- **Custom Sections:**
  - `addCustomSection(title)`, `removeCustomSection(customId)`

---

## 2. Sinkronisasi HTML Preview & `@react-pdf/renderer`

Agar pengguna tidak kecewa karena perbedaan hasil *live preview* dengan PDF yang diunduh, kedua renderer **wajib** memakai satu sumber token ukuran dan metrik tipografi (`src/lib/template-tokens.ts`).

### 2.1 Dimensi Kertas Absolut
| Ukuran Kertas | Dimensi Fisik | PDF Points (`@react-pdf/renderer`) | HTML Preview (`96 DPI` base) |
| :--- | :--- | :--- | :--- |
| **A4** | `210mm × 297mm` | `595.28pt × 841.89pt` | `794px × 1123px` |
| **LETTER** | `8.5in × 11in` | `612pt × 792pt` | `816px × 1056px` |

- HTML Preview dirender pada container dengan dimensi tetap (`width: 210mm` / `794px`) lalu diskalakan secara visual menggunakan CSS `transform: scale(zoom)` agar proporsi baris teks dan *line-wrapping* identik pada ukuran layar apa pun.

### 2.2 Shared Layout Tokens (`src/lib/template-tokens.ts`)
Nilai berikut dibagikan langsung ke komponen HTML Preview (dalam `pt` atau `px` terkonversi) dan stylesheet `@react-pdf/renderer` (dalam `pt`):

| Token | `compact` | `normal` | `relaxed` |
| :--- | :--- | :--- | :--- |
| **Page Padding (Top/Bottom)** | `28pt` | `36pt` | `44pt` |
| **Page Padding (Left/Right)** | `30pt` | `38pt` | `46pt` |
| **Body Font Size** | `9.5pt` | `10pt` | `10.5pt` |
| **Line Height** | `1.22` | `1.30` | `1.38` |
| **Section Gap** | `8pt` | `12pt` | `16pt` |
| **Item Gap** | `5pt` | `8pt` | `11pt` |
| **Bullet Gap** | `2pt` | `3pt` | `4pt` |

### 2.3 Registrasi Font `@react-pdf/renderer`
- `@react-pdf/renderer` membutuhkan file font `.ttf` (hindari `.woff2` karena sering gagal di-parse oleh fontkit internalnya).
- Simpan file `.ttf` (*Regular, Medium, Bold, Italic*) di `public/fonts/` untuk:
  - `Inter`
  - `Roboto`
  - `EB Garamond`
  - `Merriweather`
- Daftarkan sekali di `src/lib/pdf-fonts.ts` menggunakan `Font.register(...)`.
- Matikan pemenggalan kata otomatis (*hyphenation*) dengan `Font.registerHyphenationCallback((word) => [word])` agar teks PDF tetap utuh saat di-copy atau di-parse ATS.

### 2.4 Indikator Halaman & *Page Overflow*
1. **HTML Preview:** Ukur `scrollHeight` container dokumen dibanding tinggi 1 halaman (`1123px` untuk A4, `1056px` untuk Letter) melalui `ResizeObserver`.
2. Hitung estimasi jumlah halaman: `pageCount = Math.ceil(scrollHeight / pageHeight)`.
3. Gambar garis batas halaman horizontal (*dashed line* + label `Batas Halaman 1`) di setiap kelipatan `pageHeight`.
4. **Peringatan Overflow:** Jika `pageCount > config.targetPages` **atau** sisa tinggi pada halaman terakhir `< 15%` tinggi halaman (`remainder > 0 && remainder < pageHeight * 0.15`), tampilkan banner non-intrusif di atas preview dengan tombol aksi cepat **"Ubah ke Compact"** (jika belum `compact`).
5. **Dynamic Import:** Komponen ekspor PDF dimuat dengan `next/dynamic(..., { ssr: false })` agar tidak mengeksekusi kode browser-only saat SSR Next.js.

---

## 3. Spesifikasi Aturan `ats-linter.ts`

`src/lib/ats-linter.ts` adalah fungsi murni (*pure function*) `runAtsLint(doc: ResumeDocument): AtsLintReport` yang berjalan 100% di browser tanpa panggilan API.

### 3.1 Struktur Output
```typescript
export type LintStatus = 'good' | 'review' | 'fix';

export interface LintItem {
  id: string;
  status: LintStatus;
  title: string;
  description: string;
  targetSection?: SectionKey | 'basics';
}

export interface AtsLintReport {
  summary: { good: number; review: number; fix: number };
  items: LintItem[];
}
```

### 3.2 Daftar Aturan Deterministik
| Rule ID | Status | Kondisi Pemicu | Pesan / Rekomendasi |
| :--- | :--- | :--- | :--- |
| `contact-completeness` | `fix` | `fullName` kosong, `email` tidak valid, atau `phone` kosong. | Lengkapi nama, email valid, dan nomor telepon agar perekrut dapat menghubungi Anda. |
| `placeholder-text` | `fix` | Ditemukan teks contoh bawaan atau `"lorem ipsum"` / `"[isi di sini]"`. | Masih ada teks contoh bawaan yang belum diganti pada bagian `<section>`. |
| `empty-visible-section` | `review` | Section memiliki `isVisible: true` namun tidak ada item dengan `isVisible: true`. | Bagian `<section>` aktif tetapi kosong. Tambahkan item atau matikan visibilitasnya. |
| `missing-dates` | `review` | Item aktif di `experience` atau `education` tidak memiliki `startDate` atau `endDate`. | Tambahkan bulan/tahun mulai dan selesai (atau *"Present"*/*"Sekarang"*). |
| `inconsistent-dates` | `review` | Format tanggal antar item aktif bercampur (misal `"Jan 2024"` vs `"01/2024"` vs `"2024"`). | Gunakan format tanggal yang seragam di seluruh CV (misal: `Jan 2024`). |
| `long-bullet` | `review` | Terdapat bullet aktif dengan panjang `> 220` karakter. | Bullet terlalu panjang (> 2–3 baris). Pertimbangkan memecah atau meringkasnya agar cepat dipindai. |
| `first-person-pronoun` | `review` | Ditemukan kata `\b(saya|aku|kami|i|me|my|we)\b` (case-insensitive) di bullet/summary aktif. | Hindari kata ganti orang pertama; mulai bullet langsung dengan kata kerja aktif. |
| `summary-word-count` | `review` | `summary.isVisible` aktif dan jumlah kata `< 15` atau `> 80`. | Panjang ringkasan disarankan 30–60 kata agar padat dan informatif. |
| `non-standard-heading` | `review` | Judul section yang dikustomisasi tidak mengandung kata kunci standar ID/EN. | Gunakan judul konvensional (misal: *Experience*, *Education*, *Skills*) agar mudah dikenali parser. |
| `page-overflow` | `review` | Estimasi halaman melebihi `targetPages` atau halaman terakhir terisi `< 15%`. | CV sedikit meluber ke halaman berikutnya. Gunakan preset `Compact` atau sembunyikan item kurang relevan. |
| `core-structure-ok` | `good` | Seluruh aturan `fix` lolos. | Struktur dasar terbaca linear dan teks PDF dapat diseleksi. *(Catatan: tiap ATS punya perilaku parsing berbeda).* |

---

## 4. Component Tree & UI States

### 4.1 Component Tree (`/editor`)
```text
EditorPage
├── EditorTopBar
│   ├── FileTreeToggleButton (buka/tutup sidebar File Tree) + BrandLogo
│   ├── DocumentSwitcher + SaveStatusBadge (Saved / Saving / Unsaved)
│   ├── UndoRedoButtons (terhubung ke useResumeStore.temporal)
│   ├── TemplateAndLayoutPopover (Template, PaperSize, Density, Font, TargetPages, Language)
│   ├── JdMatcherButton + AtsCheckerPill
│   ├── JsonBackupMenu (Export .json, Import .json)
│   └── PdfExportButton (dynamic ssr: false)
└── OuterWorkspace (flex-row)
    ├── FileTreeSidebar (collapsible di luar area buat CV, ~240px)
    │   ├── FileTreeHeader ("File tree", + New File, Sort/Reorder, × Close)
    │   ├── FileTreeList (daftar seluruh dokumen CV, inline rename, drag-and-drop)
    │   │   └── FileTreeItemContextMenu (⋮ -> Rename, Duplikasi, Download .json, Delete, New file, Upload .json)
    │   └── FileTreeFooter (Quick Upload / Backup info)
    └── MainEditorColumn (flex-1 flex-col)
        ├── WorkspaceTabBar (tab lembar kerja CV bergaya browser, sortable via @dnd-kit)
        │   ├── SortableDocumentTab (ikon file, judul CV, double-click rename, tombol × close tab)
        │   └── NewTabButton (+)
        ├── MobileViewSwitcher (Edit | Preview — tampil < lg)
        └── SplitWorkspace
            ├── EditorPanel (kiri)
            │   ├── SectionNavigator (drag-and-drop & move up/down urutan section)
            │   ├── BasicsForm (Personal Info, Links, Summary + word counter)
            │   ├── RepeatableSectionForm (Experience, Education, Projects, Certifications, Awards, Volunteering, Languages, Custom)
            │   │   └── ItemCard (visibility toggle, reorder, edit fields, BulletListEditor)
            │   └── SkillsSectionForm
            └── PreviewPanel (kanan)
                ├── OverflowWarningBanner (kondisional)
                ├── PaperCanvas (skala zoom, garis batas halaman)
                │   └── ResumeHtmlRenderer (ClassicTemplate | ModernTemplate | CompactTemplate | ExecutiveTemplate)
                └── PreviewFooterBar (Page 1/1, Zoom - / + / Fit)
```

### 4.2 Spesifikasi UI States
- **Initial Loading / Hydration State:**
  - Saat `hasHydrated === false`, tampilkan skeleton minimalis di panel kiri & kanan (menghindari *flash of default content* dan React hydration error).
- **Empty State:**
  - *Section kosong:* Kartu dashed border halus (`#E4E4E7`) dengan teks singkat + tombol `+ Tambah <Section>`.
  - *CV dikosongkan total:* Tampilkan tombol cepat **"Isi dengan Data Contoh"** di panel editor dan pratinjau kertas bersih di panel preview.
- **Error State:**
  - *Validasi field:* Border `#EF4444` (`Red-500`) + pesan error ringkas `11px` tepat di bawah input.
  - *Import JSON gagal:* Tampilkan pesan error spesifik (misal *"Format JSON tidak valid atau skema tidak cocok"*) tanpa menimpa dokumen aktif yang sedang dibuka.
  - *Ekspor PDF gagal:* Nonaktifkan tombol selama proses (`Menyiapkan PDF...`), tangkap error via `try/catch` dan tampilkan notifikasi toast/alert agar UI tidak crash.

---

## 5. Konvensi Bahasa (`id` & `en`)

Perubahan `language` pada `ResumeDocument` hanya mengubah label heading default jika user belum mengedit judul section secara manual, serta mengubah label tanggal berjalan:
- `en`: `Present`, `Work Experience`, `Education`, `Projects`, `Skills`, `Certifications`, `Awards`, `Volunteering`, `Languages`, `Summary`.
- `id`: `Sekarang`, `Pengalaman Kerja`, `Pendidikan`, `Proyek`, `Keahlian`, `Sertifikasi`, `Penghargaan`, `Pengalaman Relawan`, `Bahasa`, `Ringkasan Profil`.
