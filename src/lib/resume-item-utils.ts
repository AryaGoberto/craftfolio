import type {
  AwardItem,
  BulletPoint,
  CertificationItem,
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  SkillCategory,
} from "@/lib/schemas/resume";

export function getVisibleNonEmptyBullets(bullets: BulletPoint[]): BulletPoint[] {
  return bullets.filter((b) => b.isVisible && b.text.trim().length > 0);
}

/**
 * Normalizes single hard line breaks (common when pasting text from a PDF)
 * into single spaces so paragraphs reflow cleanly across the full page width,
 * while preserving intentional double-newline (`\n\n`) paragraph breaks.
 */
export function normalizeParagraphText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/[\n\t ]+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

/**
 * Normalizes all-uppercase headings (e.g. "EXPERIENCE" or "TECHNICAL SKILLS")
 * into Title Case ("Experience", "Technical Skills") so Small Caps (`\scshape`
 * and `<SmallCapsHeading />`) render initial capitals taller than inner letters,
 * while preserving existing mixed-case acronyms such as "UI/UX Experience".
 */
export function normalizeSmallCapsTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const lettersOnly = trimmed.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  const isAllUpper =
    lettersOnly.length > 1 && lettersOnly === lettersOnly.toUpperCase();

  if (!isAllUpper) {
    return trimmed;
  }

  return trimmed
    .toLowerCase()
    .replace(/(^|[\s/-])([a-zà-öø-ÿ])/g, (_match, sep: string, ch: string) => {
      return `${sep}${ch.toUpperCase()}`;
    });
}

export function isNonEmptyExperienceItem(item: ExperienceItem): boolean {
  return Boolean(
    item.company.trim() ||
      item.position.trim() ||
      item.location?.trim() ||
      item.startDate.trim() ||
      item.endDate.trim() ||
      getVisibleNonEmptyBullets(item.bullets).length > 0
  );
}

export function isNonEmptyEducationItem(item: EducationItem): boolean {
  return Boolean(
    item.institution.trim() ||
      item.degree.trim() ||
      item.field?.trim() ||
      item.location?.trim() ||
      item.startDate.trim() ||
      item.endDate.trim() ||
      item.gpa?.trim() ||
      getVisibleNonEmptyBullets(item.bullets).length > 0
  );
}

export function isNonEmptyProjectItem(item: ProjectItem): boolean {
  return Boolean(
    item.name.trim() ||
      item.role?.trim() ||
      item.techStack?.trim() ||
      item.url?.trim() ||
      item.date?.trim() ||
      getVisibleNonEmptyBullets(item.bullets).length > 0
  );
}

export function isNonEmptySkillItem(item: SkillCategory): boolean {
  return Boolean(item.category.trim() || item.skills.trim());
}

export function isNonEmptyCertificationItem(item: CertificationItem): boolean {
  return Boolean(
    item.name.trim() ||
      item.issuer.trim() ||
      item.date.trim() ||
      item.url?.trim()
  );
}

export function isNonEmptyAwardItem(item: AwardItem): boolean {
  return Boolean(
    item.title.trim() ||
      item.issuer?.trim() ||
      item.date?.trim() ||
      item.description?.trim()
  );
}

export function isNonEmptyLanguageItem(item: LanguageItem): boolean {
  return Boolean(item.language.trim() || item.proficiency.trim());
}

export function isNonEmptyCustomItem(item: CustomSectionItem): boolean {
  return Boolean(
    item.title.trim() ||
      item.subtitle?.trim() ||
      item.date?.trim() ||
      getVisibleNonEmptyBullets(item.bullets).length > 0
  );
}
