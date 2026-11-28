# Issue: Integrasi Maskot Interaktif "Foldy" di Seluruh Halaman Craftfolio (Adaptive Calm Gamified Coach)

- **Status:** Implemented (Fase 1, 2, & 3 selesai)
- **Tipe:** Feature / Brand Experience / UX Micro-Interactions
- **Arah Terpilih:** Arah C — *Full Adaptive Gamified Ecosystem* (dijalankan dengan disiplin arsitektur *Calm Guided Coach* & *Dual-Engine Auto-Sleep*)
- **Referensi Prototipe:** [`foldy-web-animation-demo.html`](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/foldy-web-animation-demo.html)
- **Dokumen Terkait:** [`agents-md/brand-guideline.md`](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents-md/brand-guideline.md), [`agents-md/DESIGN.md`](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/agents-md/DESIGN.md)

---

## 1. Problem Statement (*How Might We*)

> **How might we** menghadirkan maskot origami **Foldy** beserta 8 ekspresi hidupnya di seluruh halaman Craftfolio (`/`, `/templates`, `/dashboard`, `/editor`) sebagai *Adaptive Gamified Coach* yang mengurangi kecemasan membuat CV dan memperkuat *brand recall* — **tanpa** merusak ketenangan *Quiet Craft*, mengganggu fokus mengetik di `/editor` (*jebakan Clippy*), maupun menurunkan performa dan aksesibilitas aplikasi?

---

## 2. Recommended Direction — *Adaptive Calm Gamified Coach*

Alih-alih menaruh widget melayang (*floating widget*) yang menutupi kanvas kerja atau menjalankan animasi 60fps tanpa henti, Foldy diintegrasikan secara organik ke dalam permukaan UI yang sudah ada (**Zero Floating Widget**) di keempat halaman Craftfolio. Foldy bertindak sebagai pelatih yang **peka terhadap ritme user**: aktif menyapa dan memandu di awal perjalanan (*newcomer mode*), bereaksi secara *event-driven* terhadap progres nyata CV (`runAtsLint`, `getCvCompletionStatus`, proses AI, dan ekspor PDF), lalu otomatis beralih menjadi lebih tenang (*graduated / Quiet Craft mode*) ketika user sudah mahir atau melewati ekspor PDF pertamanya.

Untuk menjaga ketenangan `/editor` dan melindungi hasil optimasi performa terbaru, seluruh animasi Foldy digerakkan oleh **Dual-Engine Auto-Sleep**:
1. **Ambient Mode (Default di `/editor`, `/dashboard`, `/templates`):** `0%` loop `requestAnimationFrame` saat diam. Perubahan ekspresi memakai atribut SVG + CSS transition ringan; *spring physics* hanya aktif singkat (1,5–2 detik) saat dipicu interaksi/milestone lalu otomatis tidur (*auto-sleep*).
2. **Interactive Stage Mode (Landing Hero & Modal Celebration):** *2.5D cursor tracking* dan *spring physics* 60fps aktif **hanya** saat komponen berada di dalam viewport (`IntersectionObserver`) dan pengguna tidak mengaktifkan `prefers-reduced-motion: reduce`.

Secara visual, Foldy mengadopsi penuh palet **Warm Forest Sage** (Light Mode: badan `#1F7A61`, lipatan origami `#114839`; Dark Mode: badan `#258066`, lipatan `#165B48`) serta tunduk mutlak pada **Paper Isolation Rule** (Foldy tidak pernah tampil di atas kertas A4/Letter CV atau di dalam PDF ekspor).

---

## 3. Key Assumptions to Validate

### Must Be True (*Dealbreakers*)
- [ ] **Foldy di `/editor` tidak mengganggu fokus mengetik:** Validasi lewat uji pemakaian langsung (mengetik 5+ menit di `/editor`) — tidak ada pop-up otomatis yang muncul saat *keystroke* berlangsung, dan 0 frame drop pada Live Preview.
- [ ] **Saran 1-langkah dari Coach Popover terasa relevan dan tidak "sotoy":** Validasi dengan menguji pemetaan `runAtsLint` pada 4 skenario CV (kosong, draft minim, CV sedang, CV siap kirim ≥ 85) agar saran prioritas Foldy selalu akurat dan langsung dapat dieksekusi (*one-click jump* ke section terkait).
- [ ] **Performa & bundle `/editor` tetap ringan:** Validasi via DevTools Performance trace dan `npm run build` — tidak ada CPU spike saat idle, dan loop 60fps benar-benar berhenti (`cancelAnimationFrame`) setelah animasi selesai atau saat tab tidak aktif.

### Should Be True (*Important*)
- [ ] **Adaptive Maturity (`newcomer` → `graduated`) terasa alami:** Pengguna baru terbantu mengurangi *blank page anxiety* pada 5 menit pertama, sementara pengguna berulang tidak merasa digurui.
- [ ] **Tidak tumpang tindih dengan `AtsCheckerModal`:** Popover Foldy hanya menampilkan **1 langkah paling berdampak berikutnya** + tombol *"Lihat Laporan ATS Lengkap"* yang membuka `AtsCheckerModal`.

### Might Be True (*Nice to Have*)
- [ ] **Milestone mikro meningkatkan penyelesaian CV hingga ekspor PDF:** Melacak pencapaian ringan (Draft Pertama, ATS ≥ 80, AI Enhance Pertama, Ekspor PDF Pertama) memberi rasa progres tanpa perlu sistem poin/XP yang terasa kekanak-kanakan.

---

## 4. Arsitektur & Rancangan Teknis (Grounded in Codebase)

### 4.1 Komponen & Modul Baru
| Modul / File | Tanggung Jawab |
| :--- | :--- |
| `src/components/mascot/FoldyMascot.tsx` | Komponen SVG reusable (`mood`, `size`, `engine: "ambient" \| "interactive"`, `interactiveClick`, `speech`, `className`). Wajib memakai React `useId()` untuk `<mask id={maskId}>` agar beberapa instance Foldy di satu halaman tidak bentrok ID SVG-nya. |
| `src/lib/foldy-engine.ts` | Utilitas *Dual-Engine Auto-Sleep*: pengelola `IntersectionObserver`, `document.visibilityState`, `prefers-reduced-motion`, *spring physics* on-demand (otomatis stop saat `|vel| < ε` & durasi selesai), serta helper transformasi 8 ekspresi (`idle`, `cursor`, `happy`, `ai`, `wink`, `eureka`, `crafty`, `sleepy`). |
| `src/lib/foldy-coach.ts` | *Pure deterministic mapper* (mudah di-unit test): menerima `AtsLintReport`, `getCvCompletionStatus`, status AI/Export, dan `maturity` → menghasilkan `{ mood, headline, nextAction, targetSection }`. Dilengkapi aturan **Hysteresis & Cooldown** (buffer skor & *per-session milestone dedupe*) agar Foldy tidak *spam* melompat saat skor naik-turun di batas 79↔80. |
| `src/lib/foldy-preferences.ts` | Penyimpanan preferensi ringan di `localStorage` (`craftfolio-foldy-prefs`, terpisah dari `craftfolio-storage` & `zundo` undo stack): `{ enabled: boolean, maturity: "newcomer" \| "graduated", unlockedMilestones: string[], quietOverride: boolean }`. Menggunakan `useSyncExternalStore` (mengikuti pola `src/lib/color-scheme.ts`) agar aman dari SSR hydration mismatch & ESLint React Hooks. |
| `src/components/mascot/FoldyCoachPopover.tsx` | Popover ringkas di `EditorTopBar` (dan opsional ringkasan `/dashboard`) yang menampilkan mood Foldy, progres milestone, 1 aksi ATS prioritas berikutnya, tombol *jump to section*, serta toggle **Mode Tenang / Sembunyikan Foldy**. |

### 4.2 Pemetaan Implementasi per Halaman (Semua 4 Halaman)

| Halaman / File Target | Penempatan Alami (*Zero Floating Widget*) | Perilaku & Ekspresi Foldy | Engine Mode |
| :--- | :--- | :--- | :--- |
| **1. Landing Page (`/`)**<br>`src/app/page.tsx`<br>`src/components/landing/HeroWorkspacePreview.tsx`<br>`src/components/landing/ComparisonAndCtaSection.tsx` | • Dekat area Hero / sudut atas bingkai `HeroWorkspacePreview` (tidak menutupi isi CV contoh).<br>• CTA akhir (`ComparisonAndCtaSection`) dalam ukuran sedang sebagai penyambut hangat. | • `cursor` (2.5D mengikuti kursor saat visible di Hero).<br>• `wink` saat user hover tombol *"Buat CV Sekarang — Gratis"*.<br>• `happy` / `eureka` / `crafty` saat diklik langsung oleh pengunjung (*easter egg* interaktif). | `interactive` (hanya saat in-viewport via `IntersectionObserver`) |
| **2. Galeri Template (`/templates`)**<br>`src/app/templates/page.tsx` | • Header intro `/templates` (sebagai *template guide* ringkas berdampingan dengan deskripsi halaman). | • Default: `wink` / `idle`.<br>• Saat user hover/fokus kartu template:<br>&nbsp;&nbsp;- *Classic Academic* → `crafty` (*"Presisi akademis & tech ala LaTeX!"*)<br>&nbsp;&nbsp;- *Modern Minimalist* → `wink` (*"Bersih & cepat dipindai HRD startup."*)<br>&nbsp;&nbsp;- *Compact* → `eureka` (*"Padat rapi, muat banyak proyek dalam 1 halaman!"*)<br>&nbsp;&nbsp;- *Executive Standard* → `happy` (*"Berwibawa untuk peran bisnis & manajemen."*) | `ambient` (burst spring singkat saat hover berganti) |
| **3. Dashboard CV (`/dashboard`)**<br>`src/app/dashboard/page.tsx`<br>`src/components/dashboard/DashboardStates.tsx` | • `DashboardEmptyState`: Foldy ukuran panggung (`120px`) menggantikan ikon statis.<br>• `DashboardEmptyFilterState`: Foldy `sleepy` / bingung saat pencarian 0 hasil.<br>• `DashboardAuthPrompt`: Foldy `wink` mengajak sinkronisasi cloud.<br>• Header status koleksi CV: mini-Foldy (`36px`) dengan rekap 1 baris (`X CV siap kirim · Y masih draft`). | • 0 dokumen → `sleepy` / hangat mengajak buat CV pertama.<br>• Semua masih `draft` → `crafty`.<br>• Ada CV status `ready` → `happy`.<br>• Sedang cloud syncing → `ai` (`✦`). | `ambient` (klik untuk reaksi playful singkat) |
| **4. Editor Workspace (`/editor`)**<br>`src/app/editor/page.tsx`<br>`src/components/editor/EditorTopBar.tsx`<br>`src/components/editor/AtsCheckerModal.tsx`<br>`src/components/editor/JdMatcherModal.tsx`<br>`src/components/editor/CvImportModal.tsx`<br>`src/components/pdf/PdfExportButton.tsx` | • **`EditorTopBar`:** Avatar hidup mungil (`28px`) di samping indikator skor ATS (mengklik membuka `FoldyCoachPopover`).<br>• **Modal AI (`CvImportModal`, `JdMatcherModal`, AI Enhance/Summary):** Foldy `ai` (`✦` + 2 baris CV mengetik) sebagai *loading visual* yang hidup.<br>• **`AtsCheckerModal`:** Foldy bereaksi sesuai skor (`< 60` `crafty`, `60–79` `eureka`, `≥ 80` `happy`).<br>• **`PdfExportButton`:** Micro-celebration toast ringkas (`happy` jump) saat ekspor PDF berhasil. | • **Wajib diam saat user mengetik** (tidak ada gerakan selama `saveStatus === "saving"` atau input fokus aktif).<br>• Di `newcomer` mode: badge dot halus muncul di avatar saat milestone baru tercapai.<br>• Di `graduated` mode: ekspresi ikon berubah tenang tanpa speech bubble / toast berulang.<br>• Menu/Popover menyediakan toggle **"Sembunyikan Foldy"** permanen. | `ambient` (0% idle CPU loop; physics hanya menyala sesaat saat event/modal) |

### 4.3 Token Warna & Aksesibilitas
- **CSS Variables di `src/app/globals.css`:**
  - Light Mode: `--ui-mascot-body: #1F7A61`, `--ui-mascot-flap: #114839`, `--ui-mascot-shadow: rgba(17, 72, 57, 0.16)`
  - Dark Mode: `--ui-mascot-body: #258066`, `--ui-mascot-flap: #165B48`, `--ui-mascot-shadow: rgba(0, 0, 0, 0.45)`
- **Aksesibilitas (WCAG 2.2 AA):**
  - Semua SVG dekoratif memakai `aria-hidden="true"`; elemen interaktif (tombol klik Foldy / Coach trigger) memakai `<button type="button">` dengan `aria-label` deskriptif dan *focus ring* (`--ui-focus`).
  - Mematuhi `@media (prefers-reduced-motion: reduce)` secara penuh (menghentikan seluruh spring physics, bounce, dan cursor tracking; hanya menampilkan perubahan ekspresi statis yang bersih).

---

## 5. Phased Delivery & MVP Scope

Untuk menghindari PR raksasa dan risiko regresi pada performa `/editor`, implementasi Arah C dibagi menjadi **3 fase inkremental yang masing-masing dapat diverifikasi mandiri**:

### Fase 1 — Fondasi Dual-Engine, Aksesibilitas & Identitas (MVP Core)
- [x] Tambahkan token warna maskot di `src/app/globals.css` (Light & Dark Warm Forest Sage).
- [x] Bangun engine *Dual-Engine Auto-Sleep* (`IntersectionObserver`, `prefers-reduced-motion`) terintegrasi di `src/components/mascot/FoldyMascot.tsx`.
- [x] Bangun `src/components/mascot/FoldyMascot.tsx` (8 ekspresi dari `foldy-web-animation-demo.html`, `useId()` safe mask, responsif berbagai ukuran `xs`/`sm`/`md`/`lg`/`xl`).
- [x] Bangun `src/lib/foldy-prefs.ts` (`useSyncExternalStore` + toggle *Tampilkan/Tenang/Sembunyikan Foldy*).
- [x] Integrasikan di **Landing Page (`/`)** dan **Dashboard (`/dashboard` & `DashboardStates.tsx`)**.

### Fase 2 — Integrasi `/templates`, `/editor` & Momen Event-Driven
- [x] Integrasikan Foldy reaktif di **`/templates`** (merespons hover/focus 4 kartu template).
- [x] Integrasikan mini living avatar Foldy di **`EditorTopBar.tsx`** (membaca mood deterministik dari `lintReport`).
- [x] Integrasikan ekspresi `ai` (`✦` + animasi mengetik) pada state loading **`CvImportModal`**, **`JdMatcherModal`**, dan aksi AI Enhance/Summary.
- [x] Integrasikan ekspresi hasil di **`AtsCheckerModal`** dan micro-celebration pasca-unduh di **`PdfExportButton`**.

### Fase 3 — Calm Guided Coach & Adaptive Maturity
- [x] Bangun `src/lib/foldy-coach.ts` (pemetaan 1 aksi prioritas tertinggi dari `AtsLintReport` + *hysteresis* & *session cooldown* anti-spam).
- [x] Bangun `src/components/mascot/FoldyCoachPopover.tsx` (diakses dari klik avatar di `EditorTopBar`, termasuk *quick jump* ke `activeSection`, ringkasan milestone, dan kontrol mode Tenang/Sembunyikan).
- [x] Implementasikan transisi **Adaptive Maturity (`onboarding` → `guided` → `quiet-pro`)** yang otomatis melunakkan prompt setelah ekspor PDF pertama atau ≥ 2 CV berstatus `ready`.
- [x] Update dokumentasi visual di `agents-md/brand-guideline.md` & `agents-md/DESIGN.md` (menambahkan panduan penggunaan resmi maskot Foldy).

---

## 6. Not Doing (and Why)

- **Tidak membuat Floating Corner Widget ala Clippy** — widget melayang di pojok kanan bawah berisiko menutupi kontrol zoom preview, tombol aksi mobile, dan terasa mengganggu saat user serius menyusun CV.
- **Tidak membuat sistem XP, koin, level angka, atau *daily login streak*** — CV builder adalah alat kerja musiman (*job-search sprint*), bukan aplikasi belajar harian seperti Duolingo; gamifikasi palsu justru merusak kredibilitas editorial Craftfolio.
- **Tidak menambahkan efek suara (*sound effects*)** — banyak pengguna membuka CV editor di kantor, kampus, atau ruang publik; suara tidak terduga melanggar prinsip *Quiet Craft*.
- **Tidak menjalankan loop `requestAnimationFrame` terus-menerus di `/editor`** — menjaga hasil optimasi performa `/editor` agar mengetik dan Live Preview tetap instan `< 100ms` serta hemat baterai.
- **Tidak menyentuh permukaan Kertas CV (HTML Preview / PDF Export)** — menjaga **Paper Isolation Rule** 100% agar hasil CV ATS tetap bersih, profesional, dan monokromatis.
- **Tidak menyimpan state maskot di `zundo` undo history maupun skema Firestore CV pada v1** — menekan `Ctrl+Z` tidak boleh memutar balik status maskot, dan preferensi maskot cukup ringan di `localStorage` perangkat tanpa menambah beban tulis Firestore.

---

## 7. Acceptance Criteria & Verification Plan

- [ ] **Keempat halaman** (`/`, `/templates`, `/dashboard`, `/editor`) menampilkan Foldy sesuai matriks penempatan pada Light Mode dan Dark Mode tanpa *layout shift* (CLS) atau tabrakan elemen di viewport desktop (`1280px`) maupun mobile (`390px`).
- [ ] **Zero SVG Mask Collision:** Merender 2+ komponen `<FoldyMascot />` secara bersamaan di halaman yang sama tidak merusak render mata/mulut satu sama lain.
- [ ] **Performa:** Saat `/editor` idle selama 3 detik atau saat user mengetik cepat di form, tidak ada loop `requestAnimationFrame` aktif dari Foldy.
- [ ] **Aksesibilitas & Kontrol User:**
  - Mengaktifkan `prefers-reduced-motion: reduce` menonaktifkan seluruh gerakan spring/bounce/cursor tracking.
  - Mengaktifkan toggle *"Sembunyikan Foldy"* langsung menyembunyikan Foldy di seluruh halaman dan tersimpan persisten antar-reload.
- [ ] **Automated Quality Gates:**
  - Unit tests baru (`src/lib/__tests__/foldy-coach.test.ts` & `src/lib/__tests__/foldy-preferences.test.ts`) lolos via `npm test`.
  - `npx tsc --noEmit`, `npm run lint`, dan `npm run build` semuanya bersih tanpa error.

---

## 8. Open Questions (Untuk Dikonfirmasi Sebelum Fase 1 Dimulai)

1. **Hubungan dengan `BrandLogo.tsx`:** Apakah `BrandLogo` di kiri atas navbar tetap dipertahankan sebagai mark resmi yang statis (Foldy jadi karakter pendamping terpisah), atau `BrandLogo` ingin diganti total memakai siluet Foldy? *(Rekomendasi: pertahankan `BrandLogo` di navbar agar identitas dokumen tetap profesional, jadikan Foldy sebagai maskot pendamping hidup).*
2. **File Demo `foldy-web-animation-demo.html`:** Setelah komponen React `<FoldyMascot />` jadi di Fase 1, apakah file HTML standalone ini tetap disimpan sebagai playground internal (atau dipindah ke `/docs`) atau dihapus dari root repo?
3. **Bahasa Ucapan Foldy:** Apakah *speech bubble* & pesan coach Foldy mengikuti toggle bahasa CV (`doc.config.language`: `'id' | 'en'`) atau konsisten memakai Bahasa Indonesia mengikuti bahasa UI aplikasi Craftfolio?
