import type {
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
}

const GHOST_PREVIEW_BY_LANG: Record<"id" | "en", GhostPreviewBundle> = {
  id: {
    fullName: "Nama Lengkap Anda",
    headline: "Contoh: Software Engineer / Product Designer",
    contactItems: [
      "+62 812-3456-7890",
      "nama.anda@email.com",
      "linkedin.com/in/username",
      "Jakarta, Indonesia",
    ],
    summary:
      "Contoh ringkasan profesional: Software Engineer berpengalaman dalam membangun aplikasi web modern menggunakan TypeScript dan React. Berfokus pada arsitektur antarmuka yang cepat, mudah dipelihara, serta kolaborasi lintas tim untuk mencapai target bisnis.",
    experience: [
      {
        id: "ghost-exp-1",
        isVisible: true,
        company: "PT Contoh Teknologi Nusantara",
        position: "Software Engineer",
        location: "Jakarta, Indonesia",
        startDate: "Jan 2023",
        endDate: "Sekarang",
        bullets: [
          {
            id: "ghost-exp-1-b1",
            isVisible: true,
            text: "Mengembangkan fitur inti aplikasi web menggunakan Next.js dan TypeScript untuk meningkatkan kecepatan akses pengguna.",
          },
          {
            id: "ghost-exp-1-b2",
            isVisible: true,
            text: "Berkolaborasi dengan tim produk dan desain dalam merancang komponen UI yang konsisten dan mudah digunakan.",
          },
        ],
      },
    ],
    education: [
      {
        id: "ghost-edu-1",
        isVisible: true,
        institution: "Universitas Contoh Indonesia",
        degree: "S1 Teknik Informatika",
        location: "Bandung, Indonesia",
        startDate: "2019",
        endDate: "2023",
        gpa: "3.75 / 4.00",
        bullets: [],
      },
    ],
    projects: [
      {
        id: "ghost-proj-1",
        isVisible: true,
        name: "Nama Proyek Unggulan",
        techStack: "Next.js, TypeScript, Tailwind CSS",
        date: "2025",
        url: "github.com/username/proyek",
        bullets: [
          {
            id: "ghost-proj-1-b1",
            isVisible: true,
            text: "Membangun aplikasi berbasis web untuk menyelesaikan masalah spesifik dengan pengujian otomatis.",
          },
        ],
      },
    ],
    skills: [
      {
        id: "ghost-skill-1",
        isVisible: true,
        category: "Bahasa & Framework",
        skills: "TypeScript, JavaScript, React, Next.js, Tailwind CSS",
      },
      {
        id: "ghost-skill-2",
        isVisible: true,
        category: "Tools & Lainnya",
        skills: "Git, Docker, PostgreSQL, REST API, Figma",
      },
    ],
  },
  en: {
    fullName: "Your Full Name",
    headline: "Example: Software Engineer / Product Designer",
    contactItems: [
      "+62 812-3456-7890",
      "your.name@email.com",
      "linkedin.com/in/username",
      "Jakarta, Indonesia",
    ],
    summary:
      "Example professional summary: Software Engineer experienced in building scalable web applications with TypeScript and React. Focused on clean architecture, accessible user interfaces, and cross-functional collaboration to deliver measurable product outcomes.",
    experience: [
      {
        id: "ghost-exp-1",
        isVisible: true,
        company: "Example Tech Corp",
        position: "Software Engineer",
        location: "Jakarta, Indonesia",
        startDate: "Jan 2023",
        endDate: "Present",
        bullets: [
          {
            id: "ghost-exp-1-b1",
            isVisible: true,
            text: "Developed core web features using Next.js and TypeScript to improve application responsiveness and reliability.",
          },
          {
            id: "ghost-exp-1-b2",
            isVisible: true,
            text: "Collaborated with product and design teams to ship reusable, accessible UI components across key workflows.",
          },
        ],
      },
    ],
    education: [
      {
        id: "ghost-edu-1",
        isVisible: true,
        institution: "Example University",
        degree: "B.Sc. in Computer Science",
        location: "Bandung, Indonesia",
        startDate: "2019",
        endDate: "2023",
        gpa: "3.75 / 4.00",
        bullets: [],
      },
    ],
    projects: [
      {
        id: "ghost-proj-1",
        isVisible: true,
        name: "Featured Project Name",
        techStack: "Next.js, TypeScript, Tailwind CSS",
        date: "2025",
        url: "github.com/username/project",
        bullets: [
          {
            id: "ghost-proj-1-b1",
            isVisible: true,
            text: "Built an end-to-end web application solving a focused user workflow with automated test coverage.",
          },
        ],
      },
    ],
    skills: [
      {
        id: "ghost-skill-1",
        isVisible: true,
        category: "Languages & Frameworks",
        skills: "TypeScript, JavaScript, React, Next.js, Tailwind CSS",
      },
      {
        id: "ghost-skill-2",
        isVisible: true,
        category: "Tools & Platforms",
        skills: "Git, Docker, PostgreSQL, REST API, Figma",
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
