import { z } from "zod";

export const RESUME_LIMITS = {
  MAX_ID_LEN: 128,
  MAX_SHORT_TEXT_LEN: 100,
  MAX_LABEL_TEXT_LEN: 300,
  MAX_URL_LEN: 1024,
  MAX_LONG_TEXT_LEN: 2000,
  MAX_SUMMARY_LEN: 8000,
  MAX_LINKS: 20,
  MAX_BULLETS_PER_ITEM: 30,
  MAX_ITEMS_PER_SECTION: 50,
  MAX_CUSTOM_SECTIONS: 20,
  MAX_SECTION_ORDER: 30,
} as const;

export const BulletPointSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  text: z.string().max(RESUME_LIMITS.MAX_LONG_TEXT_LEN),
  isVisible: z.boolean(),
});

export const LinkItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  label: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  url: z.string().max(RESUME_LIMITS.MAX_URL_LEN),
  isVisible: z.boolean(),
});

export const ExperienceItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  company: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  position: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  employmentType: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN).optional(),
  location: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  startDate: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),
  endDate: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),
  bullets: z.array(BulletPointSchema).max(RESUME_LIMITS.MAX_BULLETS_PER_ITEM),
});

export const EducationItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  institution: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  degree: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  field: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  location: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  startDate: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),
  endDate: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),
  gpa: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN).optional(),
  bullets: z.array(BulletPointSchema).max(RESUME_LIMITS.MAX_BULLETS_PER_ITEM),
});

export const ProjectItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  name: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  role: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  techStack: z.string().max(RESUME_LIMITS.MAX_LONG_TEXT_LEN).optional(),
  url: z.string().max(RESUME_LIMITS.MAX_URL_LEN).optional(),
  date: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN).optional(),
  bullets: z.array(BulletPointSchema).max(RESUME_LIMITS.MAX_BULLETS_PER_ITEM),
});

export const SkillCategorySchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  category: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  skills: z.string().max(RESUME_LIMITS.MAX_LONG_TEXT_LEN),
});

export const CertificationItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  name: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  issuer: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  date: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),
  url: z.string().max(RESUME_LIMITS.MAX_URL_LEN).optional(),
});

export const AwardItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  title: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  issuer: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  date: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN).optional(),
  description: z.string().max(RESUME_LIMITS.MAX_LONG_TEXT_LEN).optional(),
});

export const LanguageItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  language: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  proficiency: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
});

export const CustomSectionItemSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  isVisible: z.boolean(),
  title: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  subtitle: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  date: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN).optional(),
  bullets: z.array(BulletPointSchema).max(RESUME_LIMITS.MAX_BULLETS_PER_ITEM),
});

export const CustomSectionSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  title: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  isVisible: z.boolean(),
  items: z.array(CustomSectionItemSchema).max(RESUME_LIMITS.MAX_ITEMS_PER_SECTION),
});

function createSectionGroupSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    title: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
    isVisible: z.boolean(),
    items: z.array(itemSchema).max(RESUME_LIMITS.MAX_ITEMS_PER_SECTION),
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
    (val) =>
      typeof val === "string" &&
      val.startsWith("custom:") &&
      val.length <= RESUME_LIMITS.MAX_ID_LEN + 7
  ),
]);

export const ResumeDocumentSchema = z.object({
  id: z.string().max(RESUME_LIMITS.MAX_ID_LEN),
  schemaVersion: z.number().int().default(1),
  userId: z.string().max(RESUME_LIMITS.MAX_ID_LEN).optional(),
  title: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
  targetRole: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
  language: z.enum(["id", "en"]),
  createdAt: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),
  updatedAt: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN),

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
    sectionOrder: z.array(SectionKeySchema).max(RESUME_LIMITS.MAX_SECTION_ORDER),
  }),

  basics: z.object({
    fullName: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN),
    headline: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
    email: z.string().max(RESUME_LIMITS.MAX_URL_LEN),
    phone: z.string().max(RESUME_LIMITS.MAX_SHORT_TEXT_LEN).optional(),
    location: z.string().max(RESUME_LIMITS.MAX_LABEL_TEXT_LEN).optional(),
    links: z.array(LinkItemSchema).max(RESUME_LIMITS.MAX_LINKS),
    summary: z.object({
      text: z.string().max(RESUME_LIMITS.MAX_SUMMARY_LEN),
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
    customSections: z
      .array(CustomSectionSchema)
      .max(RESUME_LIMITS.MAX_CUSTOM_SECTIONS),
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
