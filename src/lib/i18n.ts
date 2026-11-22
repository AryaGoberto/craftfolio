import type { SectionKey } from "@/lib/schemas/resume";

export type AppLanguage = "id" | "en";

export const DEFAULT_SECTION_TITLES: Record<
  AppLanguage,
  Record<Exclude<SectionKey, `custom:${string}`>, string>
> = {
  en: {
    summary: "Summary",
    experience: "Experience",
    education: "Education",
    projects: "Projects",
    skills: "Skills",
    certifications: "Certifications",
    awards: "Awards",
    volunteering: "Volunteering",
    languages: "Languages",
  },
  id: {
    summary: "Ringkasan Profesional",
    experience: "Pengalaman Kerja",
    education: "Pendidikan",
    projects: "Proyek",
    skills: "Keahlian",
    certifications: "Sertifikasi",
    awards: "Penghargaan",
    volunteering: "Pengalaman Relawan",
    languages: "Bahasa",
  },
};

export const EDITOR_SECTION_LABELS: Record<
  Exclude<SectionKey, `custom:${string}`>,
  string
> = {
  summary: "Ringkasan Profesional",
  experience: "Pengalaman Kerja",
  education: "Pendidikan",
  projects: "Proyek",
  skills: "Keahlian",
  certifications: "Sertifikasi",
  awards: "Penghargaan",
  volunteering: "Pengalaman Relawan",
  languages: "Bahasa",
};

export const PRESENT_LABEL: Record<AppLanguage, string> = {
  en: "Present",
  id: "Sekarang",
};
