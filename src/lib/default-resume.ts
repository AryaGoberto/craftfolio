import type {
  BuiltinSectionKey,
  CustomSectionItem,
  ResumeDocument,
} from "@/lib/schemas/resume";

export function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSampleResume(timestamp?: string): ResumeDocument {
  const now = timestamp ?? new Date().toISOString();
  return {
    id: "resume-default-1",
    schemaVersion: 1,
    title: "CV Frontend Engineer 2026",
    targetRole: "Frontend Engineer",
    language: "en",
    createdAt: now,
    updatedAt: now,
    config: {
      templateId: "classic-latex",
      paperSize: "A4",
      density: "normal",
      fontFamily: "serif",
      targetPages: 1,
      sectionOrder: [
        "summary",
        "education",
        "experience",
        "projects",
        "skills",
      ],
    },
    basics: {
      fullName: "Raka Pratama",
      headline: "Frontend Engineer",
      email: "raka.pratama@email.com",
      phone: "+62 812-3456-7890",
      location: "Jakarta, Indonesia",
      links: [
        {
          id: "link-1",
          label: "LinkedIn",
          url: "linkedin.com/in/rakapratama",
          isVisible: true,
        },
        {
          id: "link-2",
          label: "GitHub",
          url: "github.com/rakapratama",
          isVisible: true,
        },
      ],
      summary: {
        isVisible: true,
        text: "Frontend Engineer with 3+ years of experience building high-performance web applications using React, Next.js, and TypeScript. Focused on scalable UI architecture, Core Web Vitals optimization, and accessible design systems for modern SaaS products.",
      },
    },
    sections: {
      experience: {
        title: "Experience",
        isVisible: true,
        items: [
          {
            id: "exp-1",
            isVisible: true,
            company: "PT Teknologi Nusantara",
            position: "Frontend Engineer",
            location: "Jakarta, Indonesia",
            startDate: "Jan 2023",
            endDate: "Present",
            bullets: [
              {
                id: "exp-1-b1",
                isVisible: true,
                text: "Developed real-time analytics dashboards using Next.js and TypeScript, improving page render speed by 40%.",
              },
              {
                id: "exp-1-b2",
                isVisible: true,
                text: "Architected a modular design system with Tailwind CSS adopted across 4 core product engineering squads.",
              },
              {
                id: "exp-1-b3",
                isVisible: true,
                text: "Optimized Core Web Vitals (LCP < 1.2s) and established end-to-end automated testing with Playwright.",
              },
            ],
          },
          {
            id: "exp-2",
            isVisible: true,
            company: "Startup Edukasi ID",
            position: "Frontend Developer Intern",
            location: "Bandung, Indonesia",
            startDate: "Jun 2022",
            endDate: "Dec 2022",
            bullets: [
              {
                id: "exp-2-b1",
                isVisible: true,
                text: "Built interactive student quiz modules in React, serving over 15,000 monthly active learners.",
              },
              {
                id: "exp-2-b2",
                isVisible: true,
                text: "Collaborated with UI/UX designers to translate Figma prototypes into responsive, accessible components.",
              },
            ],
          },
        ],
      },
      education: {
        title: "Education",
        isVisible: true,
        items: [
          {
            id: "edu-1",
            isVisible: true,
            institution: "Institut Teknologi Bandung",
            degree: "S.T. Teknik Informatika",
            location: "Bandung, Indonesia",
            startDate: "2018",
            endDate: "2022",
            gpa: "3.78 / 4.00",
            bullets: [],
          },
        ],
      },
      projects: {
        title: "Projects",
        isVisible: true,
        items: [
          {
            id: "proj-1",
            isVisible: true,
            name: "FormaCV Builder",
            techStack: "Next.js, TypeScript, Tailwind CSS",
            date: "2025",
            url: "github.com/rakapratama/formacv",
            bullets: [
              {
                id: "proj-1-b1",
                isVisible: true,
                text: "Open-source split-screen ATS resume builder with real-time pagination and JSON export/import.",
              },
              {
                id: "proj-1-b2",
                isVisible: true,
                text: "Implemented client-side PDF generation and automated ATS readability diagnostics.",
              },
            ],
          },
        ],
      },
      skills: {
        title: "Skills",
        isVisible: true,
        items: [
          {
            id: "skill-1",
            isVisible: true,
            category: "Frontend",
            skills: "React, Next.js, TypeScript, Tailwind CSS, Zustand, Zod",
          },
          {
            id: "skill-2",
            isVisible: true,
            category: "Tools & Testing",
            skills: "Git, Docker, Playwright, Vitest, Figma, Vercel",
          },
        ],
      },
      certifications: {
        title: "Certifications",
        isVisible: false,
        items: [],
      },
      awards: {
        title: "Awards",
        isVisible: false,
        items: [],
      },
      volunteering: {
        title: "Volunteering",
        isVisible: false,
        items: [],
      },
      languages: {
        title: "Languages",
        isVisible: false,
        items: [],
      },
      customSections: [],
    },
  };
}

export function createEmptyResume(id: string, title = "CV Baru"): ResumeDocument {
  const now = new Date().toISOString();
  return {
    id,
    schemaVersion: 1,
    title,
    language: "id",
    createdAt: now,
    updatedAt: now,
    config: {
      templateId: "classic-latex",
      paperSize: "A4",
      density: "normal",
      fontFamily: "serif",
      targetPages: 1,
      sectionOrder: ["summary", "education", "experience", "projects", "skills"],
    },
    basics: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      links: [],
      summary: { isVisible: true, text: "" },
    },
    sections: {
      experience: { title: "Pengalaman Kerja", isVisible: true, items: [] },
      education: { title: "Pendidikan", isVisible: true, items: [] },
      projects: { title: "Proyek", isVisible: true, items: [] },
      skills: { title: "Keahlian", isVisible: true, items: [] },
      certifications: { title: "Sertifikasi", isVisible: false, items: [] },
      awards: { title: "Penghargaan", isVisible: false, items: [] },
      volunteering: { title: "Pengalaman Relawan", isVisible: false, items: [] },
      languages: { title: "Bahasa", isVisible: false, items: [] },
      customSections: [],
    },
  };
}

export function createEmptyItemForSection(
  key: BuiltinSectionKey | `custom:${string}`
) {
  const id = generateId("item");
  if (key.startsWith("custom:")) {
    const item: CustomSectionItem = {
      id,
      isVisible: true,
      title: "",
      subtitle: "",
      date: "",
      bullets: [{ id: generateId("b"), isVisible: true, text: "" }],
    };
    return item;
  }

  switch (key as BuiltinSectionKey) {
    case "experience":
    case "volunteering":
      return {
        id,
        isVisible: true,
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        bullets: [{ id: generateId("b"), isVisible: true, text: "" }],
      };
    case "education":
      return {
        id,
        isVisible: true,
        institution: "",
        degree: "",
        location: "",
        startDate: "",
        endDate: "",
        gpa: "",
        bullets: [],
      };
    case "projects":
      return {
        id,
        isVisible: true,
        name: "",
        techStack: "",
        date: "",
        url: "",
        bullets: [{ id: generateId("b"), isVisible: true, text: "" }],
      };
    case "skills":
      return { id, isVisible: true, category: "", skills: "" };
    case "certifications":
      return { id, isVisible: true, name: "", issuer: "", date: "", url: "" };
    case "awards":
      return {
        id,
        isVisible: true,
        title: "",
        issuer: "",
        date: "",
        description: "",
      };
    case "languages":
      return { id, isVisible: true, language: "", proficiency: "" };
  }
}
