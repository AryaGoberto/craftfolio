import type {
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeDocument,
  SkillCategory,
} from "@/lib/schemas/resume";
import {
  isNonEmptyAwardItem,
  isNonEmptyCertificationItem,
  isNonEmptyCustomItem,
  isNonEmptyEducationItem,
  isNonEmptyExperienceItem,
  isNonEmptyLanguageItem,
  isNonEmptyProjectItem,
  isNonEmptySkillItem,
} from "@/lib/resume-item-utils";

export interface GhostPreviewBundle {
  fullName: string;
  headline: string;
  contactItems: string[];
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: SkillCategory[];
  custom: CustomSectionItem[];
}

const GHOST_PREVIEW_BY_LANG: Record<"id" | "en", GhostPreviewBundle> = {
  id: {
    fullName: "Nama Lengkap Anda",
    headline: "Headline / Posisi Anda",
    contactItems: [
      "+62 8xx-xxxx-xxxx",
      "email.anda@domain.com",
      "linkedin.com/in/username",
      "Kota, Negara",
    ],
    summary:
      "Tulis ringkasan singkat (2–3 kalimat) mengenai profil profesional, keahlian utama, dan fokus karier Anda.",
    experience: [
      {
        id: "ghost-exp-1",
        isVisible: true,
        company: "Nama Perusahaan / Organisasi",
        position: "Posisi / Jabatan Anda",
        location: "Kota, Negara",
        startDate: "Bulan Tahun",
        endDate: "Sekarang",
        bullets: [
          {
            id: "ghost-exp-1-b1",
            isVisible: true,
            text: "Jelaskan tanggung jawab utama atau pencapaian terukur Anda dengan kata kerja aktif.",
          },
        ],
      },
    ],
    education: [
      {
        id: "ghost-edu-1",
        isVisible: true,
        institution: "Nama Universitas / Institusi",
        degree: "Gelar & Program Studi",
        location: "Kota, Negara",
        startDate: "Tahun Masuk",
        endDate: "Tahun Lulus",
        gpa: "",
        bullets: [],
      },
    ],
    projects: [
      {
        id: "ghost-proj-1",
        isVisible: true,
        name: "Nama Proyek",
        techStack: "Teknologi / Peralatan yang Digunakan",
        date: "Tahun",
        url: "",
        bullets: [
          {
            id: "ghost-proj-1-b1",
            isVisible: true,
            text: "Jelaskan secara singkat tujuan proyek serta kontribusi atau hasil yang dicapai.",
          },
        ],
      },
    ],
    skills: [
      {
        id: "ghost-skill-1",
        isVisible: true,
        category: "Kategori Keahlian",
        skills: "Daftar keahlian yang dikuasai dipisahkan dengan koma",
      },
    ],
    custom: [
      {
        id: "ghost-custom-1",
        isVisible: true,
        title: "Judul Sertifikasi / Item",
        subtitle: "Penerbit / Penyelenggara",
        date: "Tahun",
        bullets: [
          {
            id: "ghost-custom-1-b1",
            isVisible: true,
            text: "Tambahkan keterangan singkat mengenai sertifikasi atau pencapaian ini.",
          },
        ],
      },
    ],
  },
  en: {
    fullName: "Your Full Name",
    headline: "Your Headline / Target Role",
    contactItems: [
      "+62 8xx-xxxx-xxxx",
      "your.email@domain.com",
      "linkedin.com/in/username",
      "City, Country",
    ],
    summary:
      "Write a concise summary (2–3 sentences) highlighting your professional profile, core skills, and career focus.",
    experience: [
      {
        id: "ghost-exp-1",
        isVisible: true,
        company: "Company / Organization Name",
        position: "Your Job Title / Position",
        location: "City, Country",
        startDate: "Month Year",
        endDate: "Present",
        bullets: [
          {
            id: "ghost-exp-1-b1",
            isVisible: true,
            text: "Describe your key responsibilities or measurable achievements using strong action verbs.",
          },
        ],
      },
    ],
    education: [
      {
        id: "ghost-edu-1",
        isVisible: true,
        institution: "University / Institution Name",
        degree: "Degree & Major",
        location: "City, Country",
        startDate: "Start Year",
        endDate: "End Year",
        gpa: "",
        bullets: [],
      },
    ],
    projects: [
      {
        id: "ghost-proj-1",
        isVisible: true,
        name: "Project Name",
        techStack: "Tools / Technologies Used",
        date: "Year",
        url: "",
        bullets: [
          {
            id: "ghost-proj-1-b1",
            isVisible: true,
            text: "Briefly describe what you built, your role, and the outcome achieved.",
          },
        ],
      },
    ],
    skills: [
      {
        id: "ghost-skill-1",
        isVisible: true,
        category: "Skill Category",
        skills: "Comma-separated list of your core skills and tools",
      },
    ],
    custom: [
      {
        id: "ghost-custom-1",
        isVisible: true,
        title: "Certification / Item Title",
        subtitle: "Issuing Organization / Subtitle",
        date: "Year",
        bullets: [
          {
            id: "ghost-custom-1-b1",
            isVisible: true,
            text: "Add a brief note or key detail about this certification or entry.",
          },
        ],
      },
    ],
  },
};

export function getGhostPreviewData(language: "id" | "en"): GhostPreviewBundle {
  return GHOST_PREVIEW_BY_LANG[language] ?? GHOST_PREVIEW_BY_LANG.en;
}

/**
 * Returns true if the document contains any real user-authored content
 * (ignoring empty placeholders and hidden empty items).
 */
export function hasAnyRealResumeContent(doc: ResumeDocument): boolean {
  const { basics, sections } = doc;
  if (
    basics.fullName.trim() ||
    basics.headline?.trim() ||
    basics.email.trim() ||
    basics.phone?.trim() ||
    basics.location?.trim() ||
    basics.summary.text.trim() ||
    basics.links.some((l) => l.url.trim().length > 0)
  ) {
    return true;
  }

  return (
    sections.experience.items.some(isNonEmptyExperienceItem) ||
    sections.volunteering.items.some(isNonEmptyExperienceItem) ||
    sections.education.items.some(isNonEmptyEducationItem) ||
    sections.projects.items.some(isNonEmptyProjectItem) ||
    sections.skills.items.some(isNonEmptySkillItem) ||
    sections.certifications.items.some(isNonEmptyCertificationItem) ||
    sections.awards.items.some(isNonEmptyAwardItem) ||
    sections.languages.items.some(isNonEmptyLanguageItem) ||
    sections.customSections.some((cs) => cs.items.some(isNonEmptyCustomItem))
  );
}
