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
