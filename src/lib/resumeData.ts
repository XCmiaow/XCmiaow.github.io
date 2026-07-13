import {
  achievements,
  education,
  experience,
  highlights,
  person,
  projects,
  researchAreas,
  researchOverview,
  resumeSectionIds,
  service,
  skills,
  type Achievement,
  type SiteLang,
} from '../data/resumeCatalog.ts';
import {
  claimCatalog,
  evidenceCatalog,
  evidenceCategories,
  materialCatalog,
  type EvidenceItem,
  type MaterialItem,
} from '../data/credibilityCatalog.ts';

export type ResumeVariant = 'general' | 'academic' | 'career';

const localize = <T>(value: { zh: T; en: T }, lang: SiteLang): T => value[lang];

const localizeAchievement = (item: Achievement, lang: SiteLang) => ({
  id: item.id,
  year: item.year,
  period: localize(item.period, lang),
  level: item.level,
  title: localize(item.title, lang),
  summary: localize(item.summary, lang),
  evidenceIds: item.evidenceIds,
});

export type AchievementViewModel = ReturnType<typeof localizeAchievement>;

export interface ProfileViewModel {
  lang: SiteLang;
  sectionIds: readonly string[];
  person: {
    id: string;
    name: string;
    brandMark: string;
    tagline: string;
    location: string;
    email: string;
    github: string;
    githubUser: string;
    avatar: string;
  };
  education: {
    id: string;
    school: string;
    college: string;
    major: string;
    period: string;
    degree: string;
    year: string;
    gpa: number;
    rankClass: number;
    rankMajor: number;
  };
  highlights: Array<{ id: string; title: string; summary: string }>;
  achievements: AchievementViewModel[];
  skills: Array<{ id: string; title: string; summary: string; items: string[] }>;
  projects: Array<{
    id: string;
    title: string;
    summary: string;
    abilities: string;
    tags: string[];
    href: string;
  }>;
  experience: Array<{ id: string; period: string; title: string; summary: string }>;
  service: Array<{ id: string; summary: string }>;
  research: {
    tagline: string;
    summary: string;
    areas: Array<{ id: string; title: string; summary: string }>;
  };
}

export interface EvidenceViewModel {
  id: string;
  year: string;
  category: string;
  categoryLabel: string;
  file: string;
  image: string;
  access: EvidenceItem['access'];
  level: string;
  issuer: string;
  proofType: string;
  title: string;
  claim: string;
  accessLabel: string;
}

export interface MaterialViewModel {
  id: string;
  audience: MaterialItem['audience'];
  access: MaterialItem['access'];
  kind: string;
  status: MaterialItem['status'];
  evidenceIds: string[];
  riskNote: string;
  lastReviewed: string;
  href?: string;
  title: string;
  summary: string;
  action: string;
  usage: string;
  statusLabel: string;
}

export interface ResumeViewModel extends ProfileViewModel {
  variant: ResumeVariant;
  achievements: AchievementViewModel[];
  evidenceCount: number;
  provincialOrHigherCount: number;
}

export function getProfile(lang: SiteLang): ProfileViewModel {
  return {
    lang,
    sectionIds: resumeSectionIds,
    person: {
      id: person.id,
      name: localize(person.name, lang),
      brandMark: localize(person.brandMark, lang),
      tagline: localize(person.tagline, lang),
      location: localize(person.location, lang),
      email: person.publicContact.email,
      github: person.publicContact.github,
      githubUser: person.publicContact.githubUser,
      avatar: person.avatar,
    },
    education: {
      id: education.id,
      school: localize(education.school, lang),
      college: localize(education.college, lang),
      major: localize(education.major, lang),
      period: localize(education.period, lang),
      degree: localize(education.degree, lang),
      year: localize(education.year, lang),
      gpa: education.gpa,
      rankClass: education.rankClass,
      rankMajor: education.rankMajor,
    },
    highlights: highlights.map((item) => ({
      id: item.id,
      title: localize(item.title, lang),
      summary: localize(item.summary, lang),
    })),
    achievements: achievements.map((item) => localizeAchievement(item, lang)),
    skills: skills.map((item) => ({
      id: item.id,
      title: localize(item.title, lang),
      summary: localize(item.summary, lang),
      items: localize(item.items, lang),
    })),
    projects: projects.map((item) => ({
      id: item.id,
      title: localize(item.title, lang),
      summary: localize(item.summary, lang),
      abilities: localize(item.abilities, lang),
      tags: item.tags,
      href: localize(item.href, lang),
    })),
    experience: experience.map((item) => ({
      id: item.id,
      period: localize(item.period, lang),
      title: localize(item.title, lang),
      summary: localize(item.summary, lang),
    })),
    service: service.map((item) => ({ id: item.id, summary: localize(item.summary, lang) })),
    research: {
      tagline: localize(researchOverview.tagline, lang),
      summary: localize(researchOverview.summary, lang),
      areas: researchAreas.map((item) => ({
        id: item.id,
        title: localize(item.title, lang),
        summary: localize(item.summary, lang),
      })),
    },
  };
}

export function getEvidence(lang: SiteLang): EvidenceViewModel[] {
  const categoryLabels = new Map(evidenceCategories.map((item) => [item.id, localize(item.title, lang)]));
  return evidenceCatalog.map((item) => ({
    id: item.id,
    year: item.year,
    category: item.category,
    categoryLabel: categoryLabels.get(item.category) ?? item.category,
    file: item.file,
    image: item.image,
    access: item.access,
    level: localize(item.level, lang),
    issuer: localize(item.issuer, lang),
    proofType: localize(item.proofType, lang),
    title: localize(item.title, lang),
    claim: localize(item.claim, lang),
    accessLabel: localize(item.accessLabel, lang),
  }));
}

export function getMaterials(lang: SiteLang): MaterialViewModel[] {
  return materialCatalog.map((item) => ({
    id: item.id,
    audience: item.audience,
    access: item.access,
    kind: item.kind,
    status: item.status,
    evidenceIds: item.evidenceIds,
    riskNote: item.riskNote,
    lastReviewed: item.lastReviewed,
    ...(item.href ? { href: localize(item.href, lang) } : {}),
    title: localize(item.title, lang),
    summary: localize(item.summary, lang),
    action: localize(item.action, lang),
    usage: localize(item.usage, lang),
    statusLabel: localize(item.statusLabel, lang),
  }));
}

const achievementIdsByVariant: Record<ResumeVariant, string[]> = {
  general: [
    'mcm-2026-honorable-mention',
    'mcm-2025-honorable-mention',
    'national-inspirational-scholarship-2025',
    'cumcm-2024-jiangsu-first',
    'math-competition-2025-third',
    'mathorcup-2025-second',
    'chemistry-olympiad-2023',
    'chemistry-olympiad-2022',
  ],
  academic: [
    'mcm-2026-honorable-mention',
    'mcm-2025-honorable-mention',
    'national-inspirational-scholarship-2025',
    'cumcm-2024-jiangsu-first',
    'math-competition-2025-third',
    'mathorcup-2025-second',
    'three-good-student-2025',
    'debate-second-2024',
  ],
  career: [
    'mcm-2026-honorable-mention',
    'mcm-2025-honorable-mention',
    'cumcm-2024-jiangsu-first',
    'mathorcup-2025-second',
  ],
};

export function getResume(lang: SiteLang, variant: ResumeVariant): ResumeViewModel {
  const profile = getProfile(lang);
  const selectedIds = new Set(achievementIdsByVariant[variant]);
  const selectedAchievements = profile.achievements.filter((item) => selectedIds.has(item.id));
  const evidenceIds = new Set(selectedAchievements.flatMap((item) => item.evidenceIds));
  return {
    ...profile,
    variant,
    achievements: selectedAchievements,
    evidenceCount: evidenceIds.size,
    provincialOrHigherCount: selectedAchievements.filter(
      (item) => item.level !== 'university' && item.level !== 'college',
    ).length,
  };
}

export function getClaims(lang: SiteLang) {
  return claimCatalog.map((item) => ({
    ...item,
    title: localize(item.title, lang),
    claim: localize(item.claim, lang),
    boundary: localize(item.boundary, lang),
  }));
}
