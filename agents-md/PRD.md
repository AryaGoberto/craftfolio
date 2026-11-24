# Product Requirements Document (PRD): FormaCV — ATS-Friendly CV Builder

| Atribut | Detail |
| :--- | :--- |
| **Nama Proyek (Working Title)** | **FormaCV** *(Opsi alternatif: CVFlow, ClearCV, ResumeCraft, Forma, CV Studio, PathCV, Paperwise)* |
| **Versi Dokumen** | 2.0 (Unified PRD) |
| **Status** | Ready for Development |
| **Target Platform** | Web Application (Desktop-first Split-Screen Editor, Mobile-friendly Tabbed View) |
| **Tech Stack Utama** | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Zustand |

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Visi & Positioning Produk
> **"Kualitas tipografi sekelas LaTeX, semudah mengisi Google Form."**

**FormaCV** adalah platform pembuat CV berbasis web yang memungkinkan siapa saja—baik pengguna teknis maupun non-teknis—membuat CV yang bersih, profesional, dan ramah *Applicant Tracking System* (ATS) dalam hitungan menit, tanpa perlu menulis kode LaTeX dan tanpa repot mengatur margin, garis, kolom, atau spasi secara manual seperti di Canva atau Microsoft Word.

Editor dirancang agar terasa seperti **alat tulis/produktivitas (seperti Notion)** yang terstruktur dan fokus pada kualitas konten, bukan seperti kanvas desain grafis.

> **Catatan Penting Kepatuhan ATS:**
> Kompatibilitas ATS bukanlah jaminan universal karena setiap produk ATS mem-parse dokumen dengan cara berbeda. Produk ini berfokus pada struktur konvensional yang mudah dibaca manusia dan mesin (*selectable text*, urutan baca linear, tanpa elemen grafis pengganggu) serta menyediakan pengecekan berbasis aturan—**bukan** mengklaim bahwa CV akan "100% lolos semua ATS".

### 1.2 Latar Belakang Masalah
1. **Hambatan Teknis pada LaTeX (Overleaf, dll.):** Menghasilkan struktur PDF dan tipografi terbaik untuk ATS, tetapi memiliki *learning curve* tinggi, membutuhkan sintaks markup, rawan *compile error*, dan mengintimidasi pengguna pemula/non-IT.
2. **Ketidakefisienan & Risiko ATS pada Canva/Word:** Pengguna menghabiskan banyak waktu merapikan garis, kolom, *bullet points*, dan perataan secara manual. Hasil ekspor alat desain sering memakai *text box* acak, tabel tersembunyi, atau elemen grafis yang membuat parser ATS gagal membaca urutan teks dengan benar.
3. **Sulitnya Menyesuaikan CV per Lowongan (*Tailoring*):** Pelamar kerja perlu menyesuaikan CV untuk tiap posisi yang dilamar. Mengedit ulang dokumen statis secara manual berisiko menghapus pengalaman lama, merusak tata letak halaman, atau mengulang pekerjaan dari nol.

---

## 2. Target Pengguna (User Personas)

### 2.1 Pengguna Utama (Primary)
| Persona | Profil | Pain Points Utama | Kebutuhan Utama |
| :--- | :--- | :--- | :--- |
| **Fresh Graduate / Mahasiswa / Magang** | Mahasiswa tingkat akhir, pelamar magang, atau lulusan baru non-teknis (ekonomi, hukum, administrasi, dll.). | Tidak bisa coding LaTeX; sering memakai Canva yang kurang ramah ATS; bingung format CV standar industri. | Form pengisian terpandu, template ATS terkurasi, langsung bisa pakai tanpa wajib daftar akun (*zero friction*). |
| **Early-Career & Experienced Professional** | Pekerja dengan pengalaman 1–7 tahun yang ingin pindah kerja atau melamar ke banyak posisi. | Punya banyak pengalaman & proyek; lelah mengedit dokumen berbeda untuk tiap lowongan; kesulitan menjaga CV tetap ringkas (1–2 halaman). | Fitur *Master Profile* (toggle *show/hide* item/bullet), kontrol kerapatan spasi otomatis, duplikasi versi, dan pencocokan *keyword* lowongan. |
| **Tech / Academic User** | Developer, engineer, atau akademisi yang terbiasa dengan *Jake's Resume* (LaTeX). | Sebenarnya bisa LaTeX, tetapi malas membuka Overleaf dan mengutak-atik sintaks hanya untuk menambah 1 proyek atau mengubah urutan poin. | Kecepatan *editing*, impor/ekspor JSON, dukungan *drag-and-drop*, dan hasil PDF *vector* yang bersih. |

### 2.2 Pengguna Sekunder (Secondary)
* **Career Centers & Organisasi Mahasiswa:** Pembimbing karier atau himpunan mahasiswa yang membantu peserta menyiapkan CV standar industri secara cepat.

---

## 3. Prinsip Desain & Arah UX/UI

### 3.1 Prinsip Inti Produk
1. **Data-First Architecture:** Memisahkan konten (data JSON terstruktur) dari presentasi (template). Ganti template kapan saja tanpa kehilangan data.
2. **Master Profile → Tailored CV:** Pengguna menyimpan seluruh riwayat karier di satu tempat, lalu dapat menyalakan/mematikan (*toggle* `isVisible`) section, item, atau *bullet point* tertentu—atau menduplikasi versi—untuk menghasilkan CV spesifik tanpa menghapus data asli.
3. **Strict ATS Compliance by Default:** Semua template bawaan menggunakan tata letak satu kolom (*single-column*), hierarki teks jelas, font standar yang terbaca mesin, tanpa grafik batang (*skill bar*), tanpa tabel tata letak, tanpa ikon sebagai label, dan mengekspor PDF dengan teks yang dapat diseleksi (*selectable text*).
4. **ATS Transparency:** Memberikan transparansi dan pengecekan yang jelas (*rule-based checklist* dan mode *ATS X-Ray*), bukan angka skor ATS yang bersifat spekulatif.
5. **Calm & Uncluttered Interface:** Kontrol sederhana dan dapat diprediksi. Hindari membanjiri pengguna dengan pengaturan desain tingkat lanjut yang tidak perlu.

### 3.2 Tata Letak Workspace & Catatan Interaksi
```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] Logo   My CVs   Template   Density/Font   Undo/Redo   JD   ATS Check   Export │
├──────────────────┬──────────────────────────────────────────────────────────────────────┤
│ FILE TREE        │ [📄 Master_CV ×]  [📄 CV_Frontend_Tokopedia ×]  [+]                  │
│ [+  ⇅  ×]        ├──────────────────────────────────┬───────────────────────────────────┤
│                  │ EDITOR (Form Sections)           │ LIVE PREVIEW (A4 / Letter)        │
│ 📄 Master_CV   ⋮ │                                  │                                   │
│ 📄 CV_Front... ⋮ │ Personal Information             │       ┌───────────────────┐       │
│   ┌────────────┐ │ [Fields...]                      │       │    CV DOCUMENT    │       │
│   │ Rename     │ │                                  │       │    Live Preview   │       │
│   │ Duplicate  │ │ Education                        │       │   (Paper Ratio)   │       │
│   │ Download   │ │ [Add education +]                │       │                   │       │
│   │ Delete     │ │                                  │       └───────────────────┘       │
│   │ New file   │ │ Experience                       │                                   │
│   │ Upload     │ │ [Add experience +]               │       [Page 1 / 1]  [Zoom]        │
│   └────────────┘ │                                  │                                   │
└──────────────────┴──────────────────────────────────┴───────────────────────────────────┘
```
* **Collapsible File Tree Sidebar (Di Luar Area Form CV):** Panel di sisi paling kiri (dapat dibuka/tutup) yang menampilkan daftar seluruh file CV pengguna beserta menu aksi cepat (`⋮` → *Rename, Duplicate, Download, Delete, New file, Upload `.json`*), terinspirasi dari pengalaman manajemen file di Overleaf/IDE.
* **Browser-Style Workspace Tabs:** Barisan tab lembar kerja di atas area *Split-Screen Editor + Preview* untuk berpindah cepat antar CV yang sedang dibuka, dapat diurutkan ulang (*drag-and-drop*), dan dapat ditutup (`×`) tanpa menghapus file dari File Tree.
* **Desktop:** Editor dan Live Preview tampil berdampingan (*split-screen*).
* **Mobile / Tablet:** Beralih menjadi tab/segmented switch antara **Edit** dan **Preview**, sementara File Tree menjadi *slide-over drawer*.
* **Aksesibilitas Reorder:** Mendukung *drag-and-drop* sekaligus tombol *move-up / move-down* yang ramah keyboard dan *screen reader*.
* **Pengeditan Inline di Preview:** Dapat ditambahkan pada iterasi lanjutan setelah form editor stabil.

---

## 4. Alur Pengguna Utama (User Flows)

### 4.1 Alur Pembuatan CV Baru (MVP — Guest Mode / Zero Friction)
1. Pengguna membuka *Landing Page* → Klik **"Buat CV Sekarang (Gratis, Tanpa Login)"**.
2. Sistem mengarahkan ke editor dengan data contoh/placeholder yang sudah terisi (tersedia tombol **"Kosongkan Form"**).
3. Pengguna memilih template ATS yang diinginkan dan mengisi form terstruktur di panel kiri.
4. *Live Preview* (A4/Letter) di panel kanan diperbarui secara *real-time*, termasuk indikator batas halaman (*page break* / *page overflow*).
5. Pengguna mengatur urutan *section* atau menyembunyikan item yang tidak relevan, serta menyesuaikan preset spasi (`Compact` / `Normal` / `Relaxed`) atau target panjang (1 vs 2 halaman).
6. Pengguna memeriksa panel **ATS Readability Checker** untuk memastikan tidak ada kesalahan dasar (kontak kosong, format tanggal tidak konsisten, dll.).
7. Pengguna klik **"Download PDF"** → File PDF *vector* terunduh dengan nama file yang dapat dikustomisasi. Data otomatis tersimpan di `localStorage` dan dapat dicadangkan via **Export JSON**.

### 4.2 Alur Tailoring CV (Fase 2)
1. Pengguna memilih CV dari *Master Profile* → Klik **"Duplikasi / Buat Versi Baru"** untuk lowongan tertentu.
2. Pengguna menempelkan *Job Description* (JD) di panel *Keyword Matcher*.
3. Sistem menyoroti kata kunci yang belum muncul di CV, menyarankan pengalaman/proyek yang relevan, dan membantu merapikan *bullet point* dengan **AI Enhancer** (wajib direview pengguna).
4. Pengguna memverifikasi urutan pembacaan teks melalui mode **ATS X-Ray** → Klik **"Download PDF"**.

---

## 5. Rincian Kebutuhan Fungsional (Functional Requirements)

### Fase 1: MVP (Minimum Viable Product)
*Fokus loop utama MVP:* **Create CV → Fill sections → Live preview → Basic ATS checks → Export PDF**.

#### 1.1 Workspace & Split-Screen Live Editor
* **FR-1.1:** Layar desktop terbagi dua: Panel Kiri (Form Input berbasis *accordion/tabs*) dan Panel Kanan (Live Preview dokumen A4/Letter dengan kontrol *zoom* dan *fit-to-screen*).
* **FR-1.2:** Pada layar *mobile/tablet*, tampilan beralih menjadi tab **Edit** dan **Preview**.
* **FR-1.3:** *Auto-save* instan ke `localStorage` setiap ada perubahan (debounce 300ms) dengan indikator status (*Saving / Saved / Unsaved changes*).
* **FR-1.4:** Mendukung **Undo / Redo**, serta manajemen multi-dokumen lokal melalui **Collapsible File Tree Sidebar** (buat baru, ubah nama, duplikasi, unduh, unggah `.json`, urutkan, hapus) dan **Workspace Tab Bar** bergaya tab browser (buka beberapa CV sekaligus, urutkan tab via *drag-and-drop*, tutup tab tanpa menghapus file).
* **FR-1.5:** Pengaturan dasar dokumen: judul dokumen, target role (opsional), bahasa CV (`id` / `en`), dan ukuran kertas (`A4` / `LETTER`).

#### 1.2 Guided Section Builder
Mendukung bagian standar ATS dengan entri yang dapat diulang (*repeatable entries*):
* **Personal Info / Header:** Nama Lengkap, Jabatan/Headline (opsional), Email, Nomor Telepon, Lokasi (Kota/Negara, opsional), Tautan (LinkedIn, GitHub, Portfolio, serta custom links opsional).
* **Professional Summary / Objective:** Paragraf ringkas (opsional) dengan panduan jumlah kata/karakter (rekomendasi: 30–60 kata).
* **Education:** Nama Institusi, Gelar/Jurusan, Lokasi (opsional), Tanggal Mulai–Selesai, IPK/GPA (opsional), dan *Coursework / Honors / Activities* (opsional).
* **Work Experience:** Nama Perusahaan/Organisasi, Posisi/Role, Tipe Pekerjaan (opsional, misal: *Full-time, Intern*), Lokasi (opsional), Tanggal Mulai–Selesai (dengan opsi *"Present"*), dan daftar *bullet points*.
* **Projects:** Nama Proyek, Peran (opsional), Tech Stack, Tanggal (opsional), Tautan proyek, dan *bullet points*.
* **Skills:** Pengelompokan berbasis kategori (misal: *Programming, Frameworks, Tools*) yang dapat diurutkan ulang.
* **Optional & Custom Sections:** Certifications, Awards, Volunteering, Leadership/Organizations, Publications, Languages, Coursework, dan Custom Sections.

#### 1.3 Master Profile Controls (Toggle & Reorder)
* **FR-1.6:** Pengguna dapat mengubah urutan *section* (misal: memindahkan *Projects* di atas *Work Experience*) via *drag-and-drop* maupun tombol naik/turun.
* **FR-1.7:** Pengguna dapat mengubah urutan item di dalam *section* dan urutan *bullet point*.
* **FR-1.8:** Setiap *section*, item, hingga masing-masing *bullet point* memiliki saklar visibilitas (`isVisible: boolean`) untuk disembunyikan dari pratinjau & PDF tanpa menghapus data dari penyimpanan.

#### 1.4 Template & Layout Engine
* **FR-1.9:** Menyediakan 3–4 template terkurasi ATS di awal (seluruhnya *single-column*, hierarki tipografi jelas, minim dekorasi):
  1. **Classic Academic (Jake's Style):** Terinspirasi LaTeX, garis tipis di bawah *heading*, gaya tradisional/akademik.
  2. **Modern Minimalist:** Tipografi sans-serif bersih (*Inter / Roboto*), hierarki ketebalan font tegas.
  3. **Compact / Graduate:** Dioptimalkan untuk mahasiswa/fresh graduate atau pengalaman padat agar muat rapi tanpa mengorbankan keterbacaan.
  4. **Executive Standard:** Struktur formal untuk peran bisnis, manajemen, atau korporat.
* **FR-1.10:** Pengaturan tata letak dalam batas aman ATS:
  * Ukuran kertas: **A4** dan **US Letter**.
  * Kerapatan spasi (*Density Preset*): **Compact**, **Normal** *(Balanced)*, **Relaxed** *(Spacious)*.
  * Pilihan font aman: *Inter*, *Roboto*, *Times New Roman (Liberation Serif)*, *Georgia*.
  * Pilihan target panjang CV (1 halaman atau 2 halaman) tanpa memaksa mengecilkan font hingga tidak terbaca.
* **FR-1.11:** **Page Break & Overflow Indicator:** Menampilkan indikator jumlah halaman (misal: `1 / 1 Halaman`), garis batas halaman di preview, dan peringatan visual jika halaman terakhir hanya terisi sedikit (< 15% tinggi halaman) beserta tombol cepat *adjust density*.

#### 1.5 ATS Readability Checker (Rule-Based)
* **FR-1.12:** Menyediakan checklist berbasis aturan (*client-side*, deterministik, tanpa biaya AI) dengan status **Good** (aman), **Review** (perlu pertimbangan user), dan **Fix** (masalah jelas):
  * Kelengkapan informasi kontak (nama, email, telepon).
  * Penggunaan judul *section* konvensional (*Experience, Education, Skills, Projects*).
  * Konsistensi format tanggal & deteksi tanggal kosong.
  * Panjang *bullet point* (> 2 baris) dan penggunaan kata ganti orang pertama (*"Saya", "Aku", "I", "Me"*).
  * Deteksi *section* kosong atau teks *placeholder* bawaan yang belum diubah.
  * Peringatan ukuran font terlalu kecil atau panjang CV berlebihan sesuai tahap karier.
  * *Catatan:* Hindari menampilkan angka skor ATS yang mengklaim dapat memprediksi kelulusan; jika memakai indikator ringkas, jelaskan bahwa itu sekadar heuristik dari checklist di atas.

#### 1.6 Export & Backup
* **FR-1.13:** Ekspor ke **PDF Vector** dengan teks 100% *selectable*, urutan pembacaan linear, tautan *clickable*, metadata PDF (title, author), pratinjau cetak, dan nama file yang dapat dikustomisasi (default: `Nama_Lengkap_CV.pdf`).
* **FR-1.14:** Ekspor dan Impor data mentah dalam format **`.json`** agar pengguna *guest* dapat mencadangkan atau memindahkan data antar perangkat.
* **Future (Pasca-MVP):** Ekspor **`.docx`** untuk pengguna yang perlu mengedit lebih lanjut di Microsoft Word.

---

### Fase 2: Fitur Pembeda (ATS Intelligence, Tailoring & AI)
* **FR-2.1 (ATS X-Ray Mode):** Mode pratinjau khusus yang mengekstrak teks mentah dari file PDF hasil ekspor secara berurutan (simulasi pembacaan mesin parser ATS) untuk membuktikan struktur teks tidak berantakan.
* **FR-2.2 (Job Description Keyword Matcher):** Pengguna menempelkan teks lowongan kerja → Sistem mengekstrak *hard skills* dan *keywords*, membandingkan dengan isi CV, dan membedakan secara jelas antara **"belum tertulis di CV"** vs **"memang tidak dimiliki pengguna"**. Menyediakan saran pengalaman/proyek paling relevan dan menyimpan hasil tailoring sebagai versi terpisah.
* **FR-2.3 (AI Bullet-Point Enhancer):** Tombol *"Perbaiki dengan AI"* untuk mengubah catatan kasar/kalimat pasif menjadi pola **Action → Context → Result** (atau format **XYZ / STAR**) dalam Bahasa Indonesia maupun Bahasa Inggris, dengan opsi variasi nada/panjang.
  * **Guardrails AI (Wajib):** Dilarang keras mengarang pengalaman, skill, angka, atau metrik yang tidak diberikan pengguna; saran kuantifikasi hanya muncul jika user memberi data; seluruh teks hasil AI wajib ditandai dan direview/dikonfirmasi user sebelum disimpan.
* **FR-2.4 (Import CV Lama / PDF & DOCX to Form):** Pengguna mengunggah PDF atau DOCX lama → Sistem mengekstrak teks dan memetakannya ke skema JSON form (*assisted extraction*). Pengguna wajib meninjau dan mengonfirmasi hasil ekstraksi yang kurang yakin sebelum disimpan.

---

### Fase 3: Cloud Sync (Firebase Auth & Firestore), Manajemen Multi-CV & Opsional
* **FR-3.1 (Autentikasi Opsional Firebase & Cloud Firestore Sync):** Login / Daftar menggunakan **Google** maupun **Email & Password** biasa (dilengkapi fitur *Reset Password*). Data `localStorage` dari *Guest Mode* digabungkan otomatis (*two-way timestamp merge*) ke Cloud Firestore (`users/{uid}/resumes/{docId}`) saat pengguna masuk, tanpa menghapus draf lokal. Tersedia fitur keluar (*Sign Out*) serta hapus akun & data cloud permanen.
* **FR-3.2 (Dashboard Multi-CV Pengguna `/dashboard`):** Halaman dashboard berbentuk grid kartu visual (*CV Cards*) untuk pengguna yang login guna memantau CV siap pakai maupun draf, mengunduh PDF langsung dari kartu tanpa harus membuka `/editor`, serta melakukan aksi cepat lewat menu titik tiga `⋮` (*Edit, Rename, Duplikasi per perusahaan/posisi, Export `.json`, dan Hapus*).
* **FR-3.3 (Job Application Tracker — Opsional):** Pelacakan lamaran sederhana (Perusahaan, Posisi, Versi CV yang dipakai, Tanggal lamar, Status: *Draft / Applied / Interview / Rejected / Offer*, Catatan & pengingat). Tetap bersifat opsional agar fokus produk tetap sebagai CV builder.
* **FR-3.4 (Shareable Public Link — Opsional):** Tautan web publik baca-saja untuk dibagikan ke perekrut lengkap dengan tombol unduh PDF.

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Kepatuhan ATS (Kritikal):**
   * PDF yang dihasilkan **dilarang keras** berupa gambar (*rasterized canvas*).
   * Urutan *reading order* teks di dalam file PDF harus linear dari atas ke bawah.
   * Semua hyperlink (LinkedIn, Email, Portfolio) harus memiliki anotasi URL yang aktif dan dapat diklik.
2. **Performa:**
   * Pembaruan *Live Preview* terasa instan (< 100ms untuk pembaruan state UI, < 500ms untuk re-render komponen preview).
   * Waktu ekspor & unduh PDF < 3 detik.
3. **Privasi & Keamanan Data:**
   * Pada *Guest Mode*, seluruh data CV tetap berada di browser pengguna (`localStorage`) dan tidak dikirim ke server kecuali pengguna secara eksplisit memicu fitur AI atau Cloud Sync.
   * Data yang dikirim ke API AI tidak boleh disimpan untuk pelatihan model pihak ketiga.
   * Pada mode Cloud (Fase 3), terapkan *Row Level Security* (RLS) agar pengguna hanya dapat mengakses dokumennya sendiri, serta sediakan kebijakan privasi dan mekanisme penghapusan data.
4. **Aksesibilitas & Dukungan Bahasa (*i18n*):**
   * Mendukung Bahasa Indonesia dan Bahasa Inggris untuk UI serta label *heading* default pada template CV (misal: *"Pengalaman Kerja"* vs *"Work Experience"*).
   * Mendukung navigasi keyboard, label ARIA yang jelas, dan kontras warna yang memenuhi standar aksesibilitas.

---

## 7. Desain Skema Data & Database

### 7.1 Skema Data Aplikasi (TypeScript + Validasi Zod)
Seluruh data CV disimpan dalam struktur JSON berversi (`schemaVersion`) agar mudah dimigrasikan saat struktur berkembang, dan kompatibel untuk `localStorage` maupun kolom `JSONB` di PostgreSQL.

```typescript
export interface ResumeDocument {
  id: string;
  schemaVersion: number; // e.g., 1
  userId?: string;
  title: string;         // e.g., "CV Frontend Engineer 2026"
  targetRole?: string;
  language: 'id' | 'en';
  createdAt: string;
  updatedAt: string;

  config: {
    templateId: 'classic-latex' | 'modern-minimal' | 'compact' | 'executive';
    paperSize: 'A4' | 'LETTER';
    density: 'compact' | 'normal' | 'relaxed';
    fontFamily: 'inter' | 'roboto' | 'serif' | 'georgia';
    targetPages: 1 | 2;
    sectionOrder: SectionKey[];
  };

  basics: {
    fullName: string;
    headline?: string;
    email: string;
    phone?: string;
    location?: string;
    links: Array<{
      id: string;
      label: string; // e.g., "LinkedIn", "GitHub", "Portfolio"
      url: string;
      isVisible: boolean;
    }>;
    summary: {
      text: string;
      isVisible: boolean;
    };
  };

  sections: {
    experience: SectionGroup<ExperienceItem>;
    education: SectionGroup<EducationItem>;
    projects: SectionGroup<ProjectItem>;
    skills: SectionGroup<SkillCategory>;
    certifications: SectionGroup<CertificationItem>;
    awards: SectionGroup<AwardItem>;
    volunteering: SectionGroup<ExperienceItem>;
    languages: SectionGroup<LanguageItem>;
    customSections: CustomSection[];
  };
}

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'awards'
  | 'volunteering'
  | 'languages'
  | `custom:${string}`;

export interface SectionGroup<T> {
  title: string; // Dapat dikustomisasi oleh user
  isVisible: boolean;
  items: T[];
}

export interface BulletPoint {
  id: string;
  text: string;
  isVisible: boolean;
}

export interface ExperienceItem {
  id: string;
  isVisible: boolean;
  company: string;
  position: string;
  employmentType?: string; // e.g., "Full-time", "Internship"
  location?: string;
  startDate: string;       // e.g., "Jan 2024"
  endDate: string;         // e.g., "Present"
  bullets: BulletPoint[];
}

export interface EducationItem {
  id: string;
  isVisible: boolean;
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  bullets: BulletPoint[];
}

export interface ProjectItem {
  id: string;
  isVisible: boolean;
  name: string;
  role?: string;
  techStack?: string;
  url?: string;
  date?: string;
  bullets: BulletPoint[];
}

export interface SkillCategory {
  id: string;
  isVisible: boolean;
  category: string; // e.g., "Programming", "Frameworks", "Tools"
  skills: string;   // e.g., "React, Next.js, TypeScript"
}

export interface CertificationItem {
  id: string;
  isVisible: boolean;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface AwardItem {
  id: string;
  isVisible: boolean;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface LanguageItem {
  id: string;
  isVisible: boolean;
  language: string;
  proficiency: string; // e.g., "Native", "Fluent", "Intermediate"
}

export interface CustomSection {
  id: string;
  title: string;
  isVisible: boolean;
  items: Array<{
    id: string;
    isVisible: boolean;
    title: string;
    subtitle?: string;
    date?: string;
    bullets: BulletPoint[];
  }>;
}
```

### 7.2 Skema Koleksi Cloud Database (Fase 3 — Firebase Auth & Cloud Firestore)
* **Dokumen Workspace Pengguna (`users/{uid}`):** `uid` (Firebase Auth UID), `email`, `displayName`, `activeDocumentId`, `openTabIds` (`string[]`), `fileOrder` (`string[]`), `updatedAt`.
* **Subkoleksi Dokumen CV (`users/{uid}/resumes/{docId}`):** Menyimpan objek `ResumeDocument` penuh (`id`, `schemaVersion`, `title`, `targetRole`, `language`, `config`, `basics`, `sections`, `createdAt`, `updatedAt`).
* **Subkoleksi Riwayat Versi (`users/{uid}/resumes/{docId}/versions/{versionId}`):** `id`, `versionName`, `snapshot` (`ResumeDocument`), `createdAt`.
* **Subkoleksi Lamaran Kerja (`users/{uid}/jobApplications/{appId}` — opsional):** `id`, `cvDocumentId`, `company`, `role`, `status`, `applicationDate`, `notes`.
* *Catatan Keamanan:* Terapkan **Firestore Security Rules (`firestore.rules`)** ketat (`allow read, write: if request.auth != null && request.auth.uid == userId;`) pada seluruh path di bawah `/users/{userId}`.

---

## 8. Arsitektur Teknis & Tech Stack

### 8.1 Rekomendasi Tech Stack
| Layer | Teknologi | Tujuan |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | Routing, SSR/RSC, API routes |
| **Language** | TypeScript | Type safety & maintainability |
| **Styling & UI** | Tailwind CSS + `shadcn/ui` + `lucide-react` | Komponen UI aksesibel & responsif |
| **Forms & Validation** | `react-hook-form` + `zod` | Input terstruktur & validasi skema |
| **State Management** | `zustand` (`persist` middleware) + `zundo` | State editor, `localStorage`, dan Undo/Redo |
| **Reordering** | `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop section, item, dan bullet |
| **Rich Text (Opsional)** | TipTap | Jika butuh formatting minimal (*bold/italic*) pada bullet |
| **PDF Engine (MVP)** | `@react-pdf/renderer` (client-side, `ssr: false`) | Ekspor PDF vector cepat & nol biaya server |
| **PDF Engine (Upgrade)** | Playwright print-to-PDF / Typst (WASM) | Alternatif jika butuh kesamaan 100% *pixel-perfect* dari HTML/CSS |
| **PDF Parsing (Fase 2)** | `pdfjs-dist` (client) / `unpdf` (server) | Ekstraksi teks untuk *ATS X-Ray* & Import CV |
| **AI Integration (Fase 2)** | Vercel AI SDK (`ai`) + Gemini Flash / GPT-4o-mini | `generateObject` untuk parse CV, keyword matcher, & bullet enhancer |
| **Database & Auth (Fase 3)** | Firebase (Firebase Auth + Cloud Firestore + Security Rules) | Autentikasi Google & Email/Password, sinkronisasi multi-CV & workspace |
| **Hosting & Monitoring** | Vercel + GitHub + Sentry / PostHog (opsional) | Deployment, error tracking, & analytics (dengan consent) |

> **Catatan Strategi Render PDF:**
> Untuk MVP tanpa biaya server PDF, gunakan komponen **HTML/CSS** menyerupai kertas A4/Letter pada *Live Preview* agar mengetik terasa instan tanpa flicker, dan render PDF menggunakan **`@react-pdf/renderer`** saat tombol **Download PDF** diklik atau di tab *Preview PDF Asli*. Hindari rendering berbasis `<canvas>` karena menghasilkan teks non-selectable. Jika di fase lanjut diperlukan akurasi tata letak 100% identik antara HTML preview dan hasil cetak, migrasi mesin ekspor ke **Playwright print-to-PDF** menggunakan semantic HTML/CSS + `@media print`.

### 8.2 Rencana Routing & Struktur Folder (Next.js App Router)
**Halaman Utama:**
* `/` — Landing page & CTA langsung ke editor.
* `/templates` — Galeri template ATS.
* `/editor` (atau `/app/cv/[id]`) — Workspace utama Split-Screen Editor.
* `/app` — Dashboard manajemen multi-CV (Fase 3).
* `/settings` — Pengaturan akun, privasi, & ekspor/hapus data (Fase 3).

**Struktur Folder `src/`:**
```text
src/
├── app/
│   ├── (marketing)/          # Landing page, daftar template
│   ├── editor/               # Halaman utama Split-Screen Editor (Guest MVP)
│   ├── app/                  # Dashboard Multi-CV & Settings (Fase 3)
│   ├── api/
│   │   ├── ai/enhance/       # Endpoint AI bullet enhancer (Fase 2)
│   │   └── ai/parse-cv/      # Endpoint import PDF/DOCX ke JSON (Fase 2)
│   └── layout.tsx
├── components/
│   ├── ui/                   # Komponen shadcn/ui
│   ├── editor/               # Form per section, drag-and-drop, toolbar, ATS checker
│   ├── preview/              # Live HTML Preview & ATS X-Ray view
│   └── pdf/                  # Template @react-pdf/renderer
├── lib/
│   ├── schemas/              # Skema validasi Zod & TypeScript types
│   ├── ats-linter.ts         # Aturan deterministik ATS Readability Checker
│   └── default-resume.ts     # Data contoh awal
└── store/
    └── use-resume-store.ts   # Zustand store + localStorage persist + zundo
```

---

## 9. Metrik Keberhasilan (Success Metrics & KPIs)

| Metrik / Kriteria | Target (3 Bulan Pertama) | Cara Mengukur |
| :--- | :--- | :--- |
| **Time-to-First-Export** | < 10–15 menit sejak membuka editor | Analytics event (`editor_opened` → `pdf_downloaded`) & *user testing* |
| **Completion Rate (Guest)** | > 40% pengunjung editor berhasil mengunduh PDF | Rasio sesi editor vs event `pdf_downloaded` |
| **ATS Parse Accuracy** | 100% teks terbaca urut & *selectable* | Pengujian berkala dengan `pdftotext`, `pdfjs`, & berbagai panjang CV |
| **Return Usage / JSON Import** | > 15% pengguna kembali mengedit/membuat versi ke-2 | Event `json_imported` atau *returning user* pada `localStorage` |
| **Usability ATS Checker** | Pengguna memahami peringatan tanpa bantuan | Uji coba pengguna (*usability testing*) pada status `Good`/`Review`/`Fix` |

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| **Ketidakcocokan HTML Preview vs PDF (`@react-pdf/renderer`)** | *Page break* atau posisi teks berbeda saat dicetak. | Gunakan dimensi kertas absolut (`210mm x 297mm` untuk A4), samakan *font metrics* dan *line-height*, sediakan tombol "Preview PDF Asli", atau migrasi ke Playwright print-to-PDF di fase lanjut. |
| **CV terlihat rapi tapi gagal di-parse ATS tertentu** | Pengguna merasa tertipu jika ada ekspektasi "100% lolos". | Gunakan struktur satu kolom konvensional, uji teks ekstraksi PDF dengan *test fixtures*, dan tampilkan disclaimer edukatif. |
| **AI mengarang prestasi/metrik (Halusinasi)** | CV berisi klaim palsu yang merugikan pelamar saat wawancara. | Terapkan *prompt guardrails* agar tidak mengarang angka, tandai teks AI, dan wajibkan konfirmasi pengguna sebelum diterapkan. |
| **Biaya API AI membengkak (Fase 2)** | Beban biaya server tinggi dari pengguna gratis. | Terapkan *rate limiting* berbasis IP/akun, gunakan model hemat (Flash/Mini), dan maksimalkan *Rule-Based Checker* di browser secara gratis. |
| **Data `localStorage` terhapus oleh browser** | Pengguna kehilangan draf CV yang sudah dibuat. | Tampilkan banner pengingat halus untuk **Backup JSON**, dan hadirkan *Cloud Sync* opsional di Fase 3. |
| **Scope Creep (Terlalu banyak fitur di awal)** | Peluncuran MVP tertunda lama. | Kunci ketat lingkup MVP pada loop inti (*Editor → Preview → ATS Checker → Export PDF*); tunda AI, Import, Auth, dan Tracker ke fase berikutnya. |

---

## 11. Roadmap Pengembangan (Estimasi Solo Developer)

### Fase 1: MVP (Minggu 1–4)
* **Minggu 1 — Fondasi & Skema Data:** Setup Next.js + TypeScript + Tailwind + `shadcn/ui`, definisi skema Zod (`schemaVersion: 1`), setup Zustand store (`persist` + `zundo`), data contoh awal, dan kerangka *split-screen*.
* **Minggu 2 — Form Editor & Master Profile Controls:** Implementasi seluruh form *section* (*Personal Info, Summary, Education, Experience, Projects, Skills, Optional/Custom*), saklar `isVisible` di tiap level, serta *drag-and-drop* + tombol aksesibel dengan `@dnd-kit`.
* **Minggu 3 — Live Preview, Templates & PDF Engine:** Pembuatan 3–4 template ATS (HTML Preview + `@react-pdf/renderer`), pengaturan *density/font/paper size*, *page overflow indicator*, serta ekspor/impor `.json`.
* **Minggu 4 — ATS Checker, Polish & Rilis MVP:** Implementasi *Rule-Based ATS Readability Checker* (`Good` / `Review` / `Fix`), pengujian ekstraksi teks PDF pada berbagai skenario panjang CV, optimasi mobile, pembuatan *Landing Page*, dan *deployment* ke Vercel.

### Fase 2: ATS Intelligence, Tailoring & AI (Minggu 5–6)
* Pengembangan **ATS X-Ray Mode** (ekstraksi teks mentah PDF).
* Implementasi **JD Keyword Matcher** dan pembuatan versi CV terpisah.
* Integrasi **AI Bullet-Point Enhancer** dan **Import CV (PDF/DOCX)** dengan *factuality guardrails* dan konfirmasi pengguna.

### Fase 3: Cloud Sync, Multi-CV & Scaling (Pasca-Rilis)
* Autentikasi opsional & migrasi otomatis `localStorage` ke Firebase Auth + Cloud Firestore (`firestore.rules`).
* Dashboard `/app` untuk manajemen multi-CV dan *version history*.
* Fitur opsional: *Job Application Tracker*, *Shareable Public Link*, dan ekspor **DOCX**.
