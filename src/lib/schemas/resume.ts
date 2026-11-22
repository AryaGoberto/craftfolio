import { z } from "zod";

export const BulletPointSchema = z.object({
  id: z.string(),
  text: z.string(),
  isVisible: z.boolean(),
});

export const LinkItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  isVisible: z.boolean(),
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  company: z.string(),
  position: z.string(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(BulletPointSchema),
});

export const EducationItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.string().optional(),
  bullets: z.array(BulletPointSchema),
});

export const ProjectItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  name: z.string(),
  role: z.string().optional(),
  techStack: z.string().optional(),
  url: z.string().optional(),
  date: z.string().optional(),
  bullets: z.array(BulletPointSchema),
});

export const SkillCategorySchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  category: z.string(),
  skills: z.string(),
});

export const CertificationItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: z.string().optional(),
});

export const AwardItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  title: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
});

export const LanguageItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  language: z.string(),
  proficiency: z.string(),
});

export const CustomSectionItemSchema = z.object({
  id: z.string(),
  isVisible: z.boolean(),
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  bullets: z.array(BulletPointSchema),
});

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  isVisible: z.boolean(),
  items: z.array(CustomSectionItemSchema),
});

function createSectionGroupSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    title: z.string(),
    isVisible: z.boolean(),
    items: z.array(itemSchema),
  });
}

export const SectionKeySchema = z.union([
  z.enum([
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "awards",
    "volunteering",
    "languages",
  ]),
  z.custom<`custom:${string}`>(
    (val) => typeof val === "string" && val.startsWith("custom:")
  ),
]);

export const ResumeDocumentSchema = z.object({
  id: z.string(),
  schemaVersion: z.number().int().default(1),
  userId: z.string().optional(),
  title: z.string(),
  targetRole: z.string().optional(),
  language: z.enum(["id", "en"]),
  createdAt: z.string(),
  updatedAt: z.string(),

  config: z.object({
    templateId: z.enum([
      "classic-latex",
      "modern-minimal",
      "compact",
      "executive",
    ]),
    paperSize: z.enum(["A4", "LETTER"]),
    density: z.enum(["compact", "normal", "relaxed"]),
    fontFamily: z.enum(["inter", "roboto", "serif", "georgia"]),
    targetPages: z.union([z.literal(1), z.literal(2)]),
    sectionOrder: z.array(SectionKeySchema),
  }),

  basics: z.object({
    fullName: z.string(),
    headline: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(LinkItemSchema),
    summary: z.object({
      text: z.string(),
      isVisible: z.boolean(),
    }),
  }),

  sections: z.object({
    experience: createSectionGroupSchema(ExperienceItemSchema),
    education: createSectionGroupSchema(EducationItemSchema),
    projects: createSectionGroupSchema(ProjectItemSchema),
    skills: createSectionGroupSchema(SkillCategorySchema),
    certifications: createSectionGroupSchema(CertificationItemSchema),
    awards: createSectionGroupSchema(AwardItemSchema),
    volunteering: createSectionGroupSchema(ExperienceItemSchema),
    languages: createSectionGroupSchema(LanguageItemSchema),
    customSections: z.array(CustomSectionSchema),
  }),
});

export type BulletPoint = z.infer<typeof BulletPointSchema>;
export type LinkItem = z.infer<typeof LinkItemSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type CertificationItem = z.infer<typeof CertificationItemSchema>;
export type AwardItem = z.infer<typeof AwardItemSchema>;
export type LanguageItem = z.infer<typeof LanguageItemSchema>;
export type CustomSectionItem = z.infer<typeof CustomSectionItemSchema>;
export type CustomSection = z.infer<typeof CustomSectionSchema>;
export type BuiltinSectionKey =
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "awards"
  | "volunteering"
  | "languages";

export type SectionKey = "summary" | BuiltinSectionKey | `custom:${string}`;
export type ResumeDocument = z.infer<typeof ResumeDocumentSchema>;
export type TemplateId = ResumeDocument["config"]["templateId"];
export type PaperSize = ResumeDocument["config"]["paperSize"];
export type DensityPreset = ResumeDocument["config"]["density"];
export type FontFamilyPreset = ResumeDocument["config"]["fontFamily"];
