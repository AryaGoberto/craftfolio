# ISSUE-006: Collapsible File Tree Sidebar & Reorderable Workspace Tabs

| Atribut | Detail |
| :--- | :--- |
| **Referensi Plan** | `tasks/todo.md` — Phase 2, **Task 6** |
| **Branch Git** | `feat/workspace-tabs-filetree` |
| **Target Eksekutor** | Junior Developer / AI Coding Model Ringan |
| **Estimasi Scope** | Medium (6 file) |

---

## 1. Ide Inti & Problem Statement (*Idea Refine*)

> **How Might We:** Bagaimana membantu pelamar kerja yang memiliki *Master Profile* dan beberapa versi CV (*tailored CVs*) untuk mengelola seluruh file CV dan berpindah cepat antar lembar kerja semudah menggunakan *File Tree* dan *Tab Bar* di Overleaf / VS Code—tanpa mempersempit area *Split-Screen Editor + Live Preview A4* dan tetap mematuhi palet monokromatis `brand-guideline.md`?

### Arah Solusi yang Dipilih
1. **Collapsible File Tree Sidebar (`FileTreeSidebar.tsx`):**
   - Berada di sisi paling kiri layar, **di luar** area pembuatan/pengisian form CV (`EditorPanel`).
   - Menampilkan **seluruh** dokumen CV yang tersimpan di `documents` berdasarkan urutan `fileOrder`.
   - Dapat dibuka/tutup (*collapsible*, lebar `240px` di desktop dan *slide-over drawer* di layar `< lg`, shortcut `Ctrl/Cmd + B`) agar tidak mengorbankan ruang kerja saat pengguna fokus mengedit isi CV.
   - Memiliki tombol aksi header (`+` Buat CV Baru, Sortir, Upload `.json`, `×` Tutup Sidebar) serta menu konteks `⋮` pada setiap file (**Rename**, **Duplikasi CV**, **Download `.json`**, **Delete**, **New file**, **Upload `.json`**).
2. **Reorderable Browser-Style Workspace Tab Bar (`WorkspaceTabBar.tsx`):**
   - Berada tepat di atas area kerja *Split-Screen* (`EditorPanel` + `PreviewPanel`).
   - Menampilkan dokumen CV yang **sedang dibuka sebagai tab lembar kerja** (`openTabIds`).
   - Mendukung *drag-and-drop* urutan tab secara horizontal menggunakan `@dnd-kit/sortable` (`horizontalListSortingStrategy`).
   - Mengklik tombol `×` pada tab **hanya menutup tab dari `openTabIds`** (dokumen CV tetap tersimpan aman di File Tree / `documents`).
   - Mengklik file apa pun di File Tree akan membukanya di Tab Bar (jika belum terbuka) dan langsung mengaktifkannya.
3. **Isolasi Riwayat Undo/Redo (`zundo`):**
   - State `openTabIds` dan `fileOrder` disimpan ke `localStorage` (`persist` v3), namun `zundo` (`temporal`) tetap hanya melacak mutasi dokumen (`documents` & `activeDocumentId`) sehingga aksi menutup/menggeser tab atau membuka/menutup sidebar tidak mencemari riwayat `Ctrl+Z`.

### Yang TIDAK Dikerjakan (*Not Doing*)
- **TIDAK** membuat subfolder bertingkat (*nested directories*) di dalam File Tree.
- **TIDAK** membuat *Formatting Toolbar* (`Bold`, `Italic`, `Insert Table`, `Insert Image`, `Math`, `Symbol`) di bawah tab bar, karena FormaCV adalah *form-based builder* dan tabel/gambar merusak keterbacaan parser ATS.
- **TIDAK** menggunakan warna sidebar gelap (*dark slate/hijau* seperti Overleaf); wajib menggunakan palet monokromatis netral terang sesuai `agents-md/brand-guideline.md` (`#F4F4F5`, `#FAFAFA`, `#FFFFFF`, `#E4E4E7`, `#18181B`).

---

## 2. Daftar File yang Diubah / Dibuat

| Aksi | Path File | Ringkasan |
| :--- | :--- | :--- |
| **Ubah** | `src/store/use-resume-store.ts` | Tambah state `openTabIds`, `fileOrder`, `isFileTreeOpen` beserta action tab & file tree + migrasi `persist` v3 |
| **Buat** | `src/components/editor/FileTreeSidebar.tsx` | Komponen sidebar File Tree *collapsible* dengan inline rename, sortir, upload, & context menu `⋮` |
| **Buat** | `src/components/editor/WorkspaceTabBar.tsx` | Komponen tab lembar kerja CV bergaya browser dengan horizontal drag-and-drop (`@dnd-kit/sortable`) |
| **Ubah** | `src/components/editor/EditorTopBar.tsx` | Tambah tombol toggle File Tree Sidebar (`PanelLeft`) di kiri TopBar & sinkronisasi `openTab` |
| **Ubah** | `src/app/editor/page.tsx` | Integrasi layout luar (`FileTreeSidebar` + kolom `WorkspaceTabBar` & `SplitWorkspace`) + shortcut `Ctrl/Cmd + B` |
| **Buat** | `src/lib/__tests__/workspace-tabs.test.ts` | Unit test siklus hidup tab (`openTab`, `closeTab`, `reorderTabs`) dan File Tree (`reorderFiles`, `sortFiles`, `deleteDocument`, `exportResumeJson(id)`) |

---

## 3. Panduan Implementasi Langkah demi Langkah

### Langkah 1 — Perbarui `src/store/use-resume-store.ts`

1. **Pisahkan tipe state untuk `temporal` (`zundo`) dan `persist` (`localStorage`):**
   ```typescript
   interface TemporalResumeState {
     documents: Record<string, ResumeDocument>;
     activeDocumentId: string;
   }

   interface PersistedResumeState extends TemporalResumeState {
     openTabIds: string[];
     fileOrder: string[];
   }
   ```
2. **Tambahkan properti & action baru ke `ResumeStoreState`:**
   - Properti state:
     - `openTabIds: string[]` (default: `[initialSample.id]`)
     - `fileOrder: string[]` (default: `[initialSample.id]`)
     - `isFileTreeOpen: boolean` (default: `true`)
   - Action baru / yang diperbarui:
     - `toggleFileTree: (open?: boolean) => void`
       - Mengubah `isFileTreeOpen` menjadi `open ?? !state.isFileTreeOpen`.
     - `openTab: (id: string) => void`
       - Jika `!state.documents[id]`, abaikan.
       - Jika `id` belum ada di `state.openTabIds`, tambahkan ke akhir `openTabIds`.
       - Set `activeDocumentId: id`.
     - `closeTab: (id: string) => void`
       - Jika `state.openTabIds.length <= 1`, abaikan (minimal 1 tab harus tetap terbuka di workspace).
       - Hapus `id` dari `openTabIds` (**jangan** hapus dari `documents` atau `fileOrder`).
       - Jika `state.activeDocumentId === id`, pindahkan `activeDocumentId` ke tab tetangga:
         ```typescript
         const idx = state.openTabIds.indexOf(id);
         const nextTabs = state.openTabIds.filter((t) => t !== id);
         const nextActive = nextTabs[Math.min(idx, nextTabs.length - 1)];
         ```
     - `reorderTabs: (oldIndex: number, newIndex: number) => void`
       - Gunakan `arrayMove(state.openTabIds, oldIndex, newIndex)`.
     - `reorderFiles: (oldIndex: number, newIndex: number) => void`
       - Gunakan `arrayMove(state.fileOrder, oldIndex, newIndex)`.
     - `sortFiles: (by: "title" | "updatedAt") => void`
       - Urutkan ID di `fileOrder` berdasarkan `title` (`localeCompare`) atau `updatedAt` (terbaru ke terlama).
     - Perbarui `createDocument`, `duplicateDocument`, dan `importResumeJson`:
       - Saat dokumen baru (`newId`) dibuat, tambahkan `newId` ke `fileOrder` dan `openTabIds`, lalu set `activeDocumentId: newId`.
     - Perbarui `setActiveDocument(id)`:
       - Jika `documents[id]` ada, set `activeDocumentId: id` dan pastikan `id` masuk ke `openTabIds` jika belum ada.
     - Perbarui `deleteDocument(id)`:
       - Jika `Object.keys(documents).length <= 1`, abaikan.
       - Hapus `id` dari `documents`, `fileOrder`, dan `openTabIds`.
       - Jika setelah dihapus `openTabIds` menjadi kosong, isi `openTabIds` dengan `[remainingDocId]` dan set `activeDocumentId = remainingDocId`.
       - Jika `activeDocumentId === id` dan masih ada tab lain di `openTabIds`, aktifkan tab pertama yang tersisa di `openTabIds`.
     - Perbarui `exportResumeJson: (id?: string) => string`:
       - Gunakan `const targetId = id ?? activeDocumentId;` agar File Tree dapat mengunduh JSON dokumen mana pun.
3. **Konfigurasi `temporal` & `persist` (Version 3):**
   - Pada `temporal` (`zundo`), `partialize` tetap hanya mengembalikan `{ documents: state.documents, activeDocumentId: state.activeDocumentId }`.
   - Pada `persist`, naikkan `version: 3`, simpan `{ documents, activeDocumentId, openTabIds, fileOrder }`, dan pada `migrate` pastikan jika `openTabIds` atau `fileOrder` belum ada/kosong (migrasi dari v1/v2), isi otomatis dengan:
     - `fileOrder`: daftar key dari `documents` yang valid.
     - `openTabIds`: `[activeDocumentId]` (atau key pertama dari `documents`).

---

### Langkah 2 — Buat `src/components/editor/FileTreeSidebar.tsx`

Buat komponen client (`"use client"`) yang merepresentasikan sidebar *File Tree* di luar editor CV:

1. **Perilaku Buka/Tutup (*Collapsible*):**
   - Ambil `isFileTreeOpen`, `toggleFileTree`, `documents`, `activeDocumentId`, `openTabIds`, `fileOrder`, `openTab`, `createDocument`, `duplicateDocument`, `renameDocument`, `deleteDocument`, `sortFiles`, `exportResumeJson`, dan `importResumeJson` dari `useResumeStore`.
   - Jika `!isFileTreeOpen`, return `null`.
2. **Struktur & Gaya Visual (Monokromatis sesuai `brand-guideline.md`):**
   - Desktop: `<aside className="w-60 bg-[#F4F4F5] border-r border-[#E4E4E7] flex flex-col h-full shrink-0 select-none">` (pada layar mobile `< lg`, tampilkan sebagai drawer dengan backdrop tipis atau panel absolut `z-40`).
   - **Header (`h-9 px-3 border-b border-[#E4E4E7] flex items-center justify-between`):**
     - Kiri: Judul **`File tree`** (`text-[12px] font-semibold text-[#09090B] tracking-tight`).
     - Kanan (deretan ikon `w-6 h-6 rounded hover:bg-[#E4E4E7]/70 text-[#52525B] hover:text-[#09090B]`):
       - Tombol `+` (`Plus`): Buat file CV baru (`createDocument()`).
       - Tombol Sortir (`ArrowUpDown`): Toggle urutkan file berdasarkan Nama (`title`) atau Waktu Diubah (`updatedAt`).
       - Tombol Upload (`Upload`): Membuka file picker `.json` tersembunyi untuk `importResumeJson`.
       - Tombol `×` (`X`): Menutup sidebar (`toggleFileTree(false)`).
3. **Daftar File & Menu Konteks `⋮`:**
   - Normalisasikan daftar ID file: pastikan semua key di `documents` tampil sesuai urutan `fileOrder`.
   - Untuk setiap dokumen `doc`:
     - Baris item:
       - Jika `doc.id === activeDocumentId`: style aktif tegas (`bg-[#18181B] text-white font-medium` atau `bg-white text-[#09090B] font-medium border border-[#E4E4E7] shadow-2xs`).
       - Jika tidak aktif: `text-[#52525B] hover:bg-[#E4E4E7]/60 hover:text-[#09090B]`.
     - Klik baris → `openTab(doc.id)`.
     - **Inline Rename:** Jika `renamingId === doc.id`, tampilkan `<input>` di tempat judul dokumen. Simpan perubahan dengan `renameDocument(doc.id, draftTitle.trim() || "Tanpa Judul")` saat `Enter` atau `onBlur`, dan batalkan saat `Escape`.
     - **Tombol `⋮` (`MoreVertical`):** Saat diklik (`e.stopPropagation()`), tampilkan menu dropdown (`w-44 bg-white border border-[#E4E4E7] rounded-lg shadow-xl py-1 z-50 text-[12px]`):
       - **Rename** → aktifkan mode *Inline Rename* untuk file ini.
       - **Duplikasi CV** → `duplicateDocument(doc.id)`.
       - **Download (.json)** → unduh blob dari `exportResumeJson(doc.id)` dengan nama file `${doc.title}.json`.
       - **Delete** → `deleteDocument(doc.id)` (disabled jika total dokumen hanya 1).
       - Garis pemisah (`border-t border-[#F4F4F5] my-1`).
       - **New file** → `createDocument()`.
       - **Upload (.json)** → buka input file `.json`.

---

### Langkah 3 — Buat `src/components/editor/WorkspaceTabBar.tsx`

Buat komponen client (`"use client"`) untuk barisan tab lembar kerja CV di atas area *Split-Screen Editor + Preview*:

1. **Drag-and-Drop Horizontal dengan `@dnd-kit/sortable`:**
   - Gunakan `DndContext`, `closestCenter`, `PointerSensor` (dengan `activationConstraint: { distance: 5 }` agar klik biasa pada tab atau tombol `×` tidak dianggap drag), `KeyboardSensor`, `useSensor`, `useSensors` dari `@dnd-kit/core`.
   - Gunakan `SortableContext`, `horizontalListSortingStrategy`, `sortableKeyboardCoordinates`, dan `useSortable` dari `@dnd-kit/sortable` serta `CSS` dari `@dnd-kit/utilities`.
   - Saat `onDragEnd`: jika `active.id !== over.id`, cari `oldIndex` dan `newIndex` di `openTabIds` lalu panggil `reorderTabs(oldIndex, newIndex)`.
2. **Desain Setiap Tab (`SortableTabItem`):**
   - Menampilkan ikon `FileText` (`w-3.5 h-3.5 shrink-0`), judul CV (`max-w-[160px] truncate`), dan tombol tutup tab `×` (`X` icon `w-3 h-3`).
   - **Tab Aktif (`id === activeDocumentId`):** `bg-white text-[#09090B] font-medium border-t border-x border-[#E4E4E7] rounded-t-md -mb-px h-[33px] px-3`.
   - **Tab Non-Aktif:** `bg-[#ECECEE] hover:bg-[#E4E4E7] text-[#52525B] hover:text-[#09090B] rounded-t-md h-7 px-2.5`.
   - **Klik Tab:** `setActiveDocument(id)`.
   - **Double-Click Judul Tab:** Mengaktifkan *inline rename* langsung di tab.
   - **Klik Tombol `×`:** `e.stopPropagation(); closeTab(id)` (hanya menutup tab dari `openTabIds`; jika `openTabIds.length === 1`, sembunyikan atau disable tombol `×` agar minimal 1 tab selalu terbuka).
3. **Tombol Tambah Tab (`+`):**
   - Di sebelah kanan daftar tab, sediakan tombol `+` (`Plus` icon, `h-7 w-7 rounded hover:bg-[#E4E4E7] text-[#52525B] hover:text-[#09090B]`) yang memanggil `createDocument()`.

---

### Langkah 4 — Integrasikan ke `EditorTopBar.tsx` & `src/app/editor/page.tsx`

1. **Di `src/components/editor/EditorTopBar.tsx`:**
   - Ambil `isFileTreeOpen` dan `toggleFileTree` dari `useResumeStore`.
   - Tambahkan tombol ikon `PanelLeft` (dari `lucide-react`) di sisi paling kiri (sebelum logo FormaCV) untuk membuka/menutup File Tree Sidebar:
     ```tsx
     <button
       type="button"
       onClick={() => toggleFileTree()}
       title="Tampilkan / Sembunyikan File Tree (Ctrl+B)"
       aria-label="Toggle File Tree Sidebar"
       className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
         isFileTreeOpen
           ? "bg-[#18181B] text-white border-[#18181B]"
           : "bg-white text-[#52525B] border-[#E4E4E7] hover:text-[#09090B] hover:bg-[#F4F4F5]"
       }`}
     >
       <PanelLeft className="w-4 h-4" />
     </button>
     ```
2. **Di `src/app/editor/page.tsx`:**
   - Tambahkan `useEffect` untuk shortcut keyboard `Ctrl+B` / `Cmd+B` yang memanggil `toggleFileTree()`.
   - Bungkus area di bawah `<EditorTopBar />` menjadi:
     ```tsx
     <div className="flex-1 flex overflow-hidden relative">
       <FileTreeSidebar />

       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
         <WorkspaceTabBar />

         {/* Mobile Tab Switcher (Edit | Preview) */}
         ...

         {/* Split-Screen Workspace (EditorPanel + PreviewPanel) */}
         <main className="flex-1 flex overflow-hidden">
           ...
         </main>
       </div>
     </div>
     ```

---

### Langkah 5 — Buat Unit Test `src/lib/__tests__/workspace-tabs.test.ts`

Tulis unit test dengan Vitest untuk menguji seluruh logika store File Tree & Workspace Tabs:
1. State awal memiliki `openTabIds` dan `fileOrder` yang berisi ID dokumen awal.
2. `createDocument` dan `duplicateDocument` menambahkan dokumen baru ke `documents`, `fileOrder`, dan `openTabIds`, serta menjadikannya `activeDocumentId`.
3. `closeTab(id)` menghapus tab dari `openTabIds` **tanpa** menghapus dokumen dari `documents` atau `fileOrder`, dan memindahkan `activeDocumentId` ke tab terbuka lainnya jika tab aktif yang ditutup.
4. `closeTab(id)` menolak menutup tab jika hanya tersisa 1 tab yang terbuka.
5. `openTab(id)` membuka kembali dokumen dari File Tree ke dalam `openTabIds` dan mengaktifkannya.
6. `reorderTabs` dan `reorderFiles` mengubah urutan `openTabIds` dan `fileOrder` secara akurat, serta `sortFiles("title")` mengurutkan file sesuai abjad.
7. `deleteDocument(id)` menghapus dokumen dari `documents`, `fileOrder`, dan `openTabIds`, serta memastikan minimal 1 tab tetap terbuka.
8. `exportResumeJson(id)` mengekspor JSON dokumen tertentu dari File Tree meskipun bukan dokumen yang sedang aktif.

---

## 4. Kriteria Penerimaan (*Acceptance Criteria*)

- [x] `useResumeStore` mengelola `openTabIds`, `fileOrder`, dan `isFileTreeOpen` dengan migrasi `persist` v3 yang aman dan tanpa mencemari riwayat Undo/Redo `zundo`.
- [x] `FileTreeSidebar.tsx` tampil di luar area editor CV, dapat dibuka/tutup (*collapsible*), menampilkan seluruh file CV, serta mendukung *New file*, *Inline Rename*, *Duplikasi*, *Download `.json`*, *Upload `.json`*, *Sortir*, dan *Delete* melalui menu `⋮`.
- [x] `WorkspaceTabBar.tsx` menampilkan tab lembar kerja CV di atas editor, mendukung *drag-and-drop* urutan tab (`@dnd-kit/sortable`), klik ganda untuk *rename*, tombol `×` untuk menutup tab tanpa menghapus file di File Tree, dan tombol `+` untuk tab baru.
- [x] Seluruh tampilan mematuhi palet monokromatis netral di `agents-md/brand-guideline.md`.
- [x] Seluruh unit test di `src/lib/__tests__/workspace-tabs.test.ts` lulus (5 test files, 56 tests passed).

---

## 5. Verifikasi & GitHub Flow

- [x] `npm test` — 5 test files, 56 tests passed.
- [x] `npx tsc --noEmit && npm run lint` — 0 error, 0 warning.
- [x] `npm run build` — exit code 0.

```bash
npm test
npx tsc --noEmit && npm run lint
npm run build
```

Setelah seluruh verifikasi lulus (`0` error), centang checklist di `tasks/issue.md`, `tasks/todo.md`, `tasks/plan.md`, dan `agents-md/FEATURES.md`, lalu commit dan push ke branch `feat/workspace-tabs-filetree`.
