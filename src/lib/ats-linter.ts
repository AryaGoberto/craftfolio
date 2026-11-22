import type { ResumeDocument, SectionKey } from "@/lib/schemas/resume";

export type LintStatus = "good" | "review" | "fix";

export interface LintItem {
  id: string;
  status: LintStatus;
  title: string;
  description: string;
  targetSection?: SectionKey | "basics";
}

export interface AtsLintReport {
  summary: { good: number; review: number; fix: number };
  items: LintItem[];
}

const STANDARD_HEADING_KEYWORDS = [
  "summary",
  "profile",
  "objective",
  "ringkasan",
  "profil",
  "experience",
  "work",
  "pengalaman",
  "education",
  "pendidikan",
  "project",
  "proyek",
  "skill",
  "keahlian",
  "certification",
  "sertifikasi",
  "award",
  "penghargaan",
  "volunteer",
  "relawan",
  "language",
  "bahasa",
];

function detectDatePattern(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(present|sekarang|current)$/i.test(trimmed)) return null;
  if (/^\d{4}$/.test(trimmed)) return "YYYY";
  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(trimmed)) return "MMM YYYY";
  if (/^\d{2}\/\d{4}$/.test(trimmed)) return "MM/YYYY";
  if (/^\d{4}-\d{2}$/.test(trimmed)) return "YYYY-MM";
  return "OTHER";
}

export function runAtsLint(
  doc: ResumeDocument,
  pageCount = 1,
  lastPageFillRatio = 1
): AtsLintReport {
  const items: LintItem[] = [];
  const { basics, sections, config } = doc;

  // 1. Contact completeness
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basics.email.trim());
  if (!basics.fullName.trim() || !emailValid || !basics.phone?.trim()) {
    items.push({
      id: "contact-completeness",
      status: "fix",
      title: "Informasi kontak belum lengkap",
      description:
        "Pastikan Nama Lengkap, Email valid, dan Nomor Telepon terisi agar perekrut dapat menghubungi Anda.",
      targetSection: "basics",
    });
  }

  // 2. Placeholder detection
  const combinedText = [
    basics.fullName,
    basics.summary.text,
    ...sections.experience.items.flatMap((i) => [
      i.company,
      ...i.bullets.map((b) => b.text),
    ]),
  ]
    .join(" ")
    .toLowerCase();

  if (
    combinedText.includes("lorem ipsum") ||
    combinedText.includes("[isi di sini]")
  ) {
    items.push({
      id: "placeholder-text",
      status: "fix",
      title: "Masih ada teks placeholder",
      description:
        "Hapus atau ganti teks placeholder ('lorem ipsum' / '[isi di sini]') sebelum mengekspor CV.",
      targetSection: "basics",
    });
  }

  // 3. Summary length check
  if (basics.summary.isVisible && basics.summary.text.trim()) {
    const wordCount = basics.summary.text.trim().split(/\s+/).length;
    if (wordCount < 15 || wordCount > 80) {
      items.push({
        id: "summary-word-count",
        status: "review",
        title: `Ringkasan ${wordCount} kata (disarankan 30–60 kata)`,
        description:
          "Ringkasan yang terlalu pendek atau terlalu panjang kurang efektif saat dipindai cepat oleh perekrut.",
        targetSection: "summary",
      });
    }
  }

  // 4. Empty visible sections & non-standard headings
  const builtinKeys = [
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "awards",
    "volunteering",
    "languages",
  ] as const;

  for (const key of builtinKeys) {
    const group = sections[key];
    if (!group.isVisible) continue;
    const visibleItems = group.items.filter((it) => it.isVisible);
    if (visibleItems.length === 0) {
      items.push({
        id: `empty-section-${key}`,
        status: "review",
        title: `Bagian "${group.title}" aktif tetapi kosong`,
        description:
          "Tambahkan minimal satu item atau matikan visibilitas bagian ini agar tidak membingungkan.",
        targetSection: key,
      });
    }

    const lowerTitle = group.title.toLowerCase();
    const isStandard = STANDARD_HEADING_KEYWORDS.some((kw) =>
      lowerTitle.includes(kw)
    );
    if (!isStandard && group.title.trim()) {
      items.push({
        id: `non-standard-heading-${key}`,
        status: "review",
        title: `Judul "${group.title}" kurang konvensional`,
        description:
          "Gunakan judul standar (mis. Experience, Education, Skills) agar parser ATS mudah mengenali bagian ini.",
        targetSection: key,
      });
    }
  }

  // 5. Missing dates & inconsistent date formats
  const datePatterns = new Set<string>();
  let hasMissingDate = false;

  for (const item of sections.experience.items) {
    if (!item.isVisible) continue;
    if (!item.startDate.trim() || !item.endDate.trim()) {
      hasMissingDate = true;
    }
    const p1 = detectDatePattern(item.startDate);
    const p2 = detectDatePattern(item.endDate);
    if (p1) datePatterns.add(p1);
    if (p2) datePatterns.add(p2);
  }

  for (const item of sections.education.items) {
    if (!item.isVisible) continue;
    if (!item.startDate.trim() || !item.endDate.trim()) {
      hasMissingDate = true;
    }
    const p1 = detectDatePattern(item.startDate);
    const p2 = detectDatePattern(item.endDate);
    if (p1) datePatterns.add(p1);
    if (p2) datePatterns.add(p2);
  }

  if (hasMissingDate) {
    items.push({
      id: "missing-dates",
      status: "review",
      title: "Ada tanggal yang belum lengkap",
      description:
        "Lengkapi tanggal mulai dan selesai (atau 'Present'/'Sekarang') pada Pengalaman Kerja dan Pendidikan.",
      targetSection: "experience",
    });
  }

  if (datePatterns.size > 1) {
    items.push({
      id: "inconsistent-dates",
      status: "review",
      title: "Format tanggal tidak seragam",
      description:
        "Gunakan satu format tanggal yang konsisten di seluruh CV (misalnya 'Jan 2024' atau '2024').",
      targetSection: "experience",
    });
  }

  // 6. Long bullets & first-person pronouns
  const activeBullets = [
    ...sections.experience.items.filter((i) => i.isVisible),
    ...sections.projects.items.filter((i) => i.isVisible),
    ...sections.volunteering.items.filter((i) => i.isVisible),
  ].flatMap((i) => i.bullets.filter((b) => b.isVisible));

  const hasLongBullet = activeBullets.some((b) => b.text.trim().length > 220);
  if (hasLongBullet) {
    items.push({
      id: "long-bullet",
      status: "review",
      title: "Terdapat bullet point > 220 karakter",
      description:
        "Bullet yang terlalu panjang (> 2–3 baris) sulit dipindai cepat. Ringkas menjadi poin yang lebih padat.",
      targetSection: "experience",
    });
  }

  const pronounRegex = /\b(saya|aku|kami|i|me|my|we)\b/i;
  const hasPronoun =
    (basics.summary.isVisible && pronounRegex.test(basics.summary.text)) ||
    activeBullets.some((b) => pronounRegex.test(b.text));
  if (hasPronoun) {
    items.push({
      id: "first-person-pronoun",
      status: "review",
      title: "Terdeteksi kata ganti orang pertama",
      description:
        "Hindari kata 'Saya', 'Aku', 'I', atau 'My'. Mulai kalimat langsung dengan kata kerja aktif.",
      targetSection: "experience",
    });
  }

  // 7. Page overflow
  if (
    pageCount > config.targetPages ||
    (pageCount > 1 && lastPageFillRatio > 0 && lastPageFillRatio < 0.15)
  ) {
    items.push({
      id: "page-overflow",
      status: "review",
      title: `Halaman (${pageCount}) melebihi target (${config.targetPages} halaman)`,
      description:
        "Pertimbangkan preset spasi 'Compact' atau sembunyikan beberapa poin yang kurang relevan.",
    });
  }

  // 8. Core structure OK
  const fixCount = items.filter((i) => i.status === "fix").length;
  const reviewCount = items.filter((i) => i.status === "review").length;

  if (fixCount === 0) {
    items.unshift({
      id: "core-structure-ok",
      status: "good",
      title: "Struktur dasar & keterbacaan ATS baik",
      description:
        "Layout satu kolom, teks dapat diseleksi, dan urutan baca linear. (Catatan: setiap sistem ATS memiliki parser berbeda).",
    });
  }

  return {
    summary: {
      good: items.filter((i) => i.status === "good").length,
      review: reviewCount,
      fix: fixCount,
    },
    items,
  };
}
