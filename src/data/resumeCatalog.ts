import commonSource from './common.json';
import enSource from './en.json';
import zhSource from './zh.json';

export type SiteLang = 'zh' | 'en';
export type LocalizedText<T> = { zh: T; en: T };
export type AchievementLevel = 'international' | 'national' | 'provincial' | 'university' | 'college';

export interface Person {
  id: 'xujie-fang';
  name: LocalizedText<string>;
  brandMark: LocalizedText<string>;
  tagline: LocalizedText<string>;
  location: LocalizedText<string>;
  publicContact: { email: string; github: string; githubUser: string };
  avatar: string;
}

export interface Education {
  id: 'njfu-chemical-engineering';
  school: LocalizedText<string>;
  college: LocalizedText<string>;
  major: LocalizedText<string>;
  period: LocalizedText<string>;
  degree: LocalizedText<string>;
  year: LocalizedText<string>;
  gpa: number;
  rankClass: number;
  rankMajor: number;
}

export interface Achievement {
  id: string;
  year: number;
  period: LocalizedText<string>;
  level: AchievementLevel;
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
  evidenceIds: string[];
}

export interface SkillGroup {
  id: string;
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
  items: LocalizedText<string[]>;
}

export interface Project {
  id: string;
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
  abilities: LocalizedText<string>;
  tags: string[];
  href: LocalizedText<string>;
}

export interface Experience {
  id: string;
  period: LocalizedText<string>;
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
}

export interface ResearchArea {
  id: string;
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
}

export const person: Person = {
  id: 'xujie-fang',
  name: { zh: zhSource.person.name, en: enSource.person.name },
  brandMark: { zh: zhSource.person.brandMark, en: enSource.person.brandMark },
  tagline: { zh: zhSource.person.tagline, en: enSource.person.tagline },
  location: { zh: zhSource.person.location, en: enSource.person.location },
  publicContact: {
    email: commonSource.person.email,
    github: commonSource.person.github,
    githubUser: commonSource.person.githubUser,
  },
  avatar: commonSource.person.avatar,
};

export const education: Education = {
  id: 'njfu-chemical-engineering',
  school: { zh: zhSource.education.school, en: enSource.education.school },
  college: { zh: zhSource.education.college, en: enSource.education.college },
  major: { zh: zhSource.education.major, en: enSource.education.major },
  period: { zh: zhSource.education.period, en: enSource.education.period },
  degree: { zh: zhSource.education.degree, en: enSource.education.degree },
  year: { zh: zhSource.education.year, en: enSource.education.year },
  gpa: commonSource.education.gpa,
  rankClass: commonSource.education.rankClass,
  rankMajor: commonSource.education.rankMajor,
};

const achievementEvidence: Record<string, string[]> = {
  'mcm-2026-honorable-mention': ['mcm-2026-honorable-mention'],
  'mcm-2025-honorable-mention': ['mcm-2025-honorable-mention'],
  'national-inspirational-scholarship-2025': ['national-inspirational-scholarship-2025'],
  'cumcm-2024-jiangsu-first': ['cumcm-2024-jiangsu-first'],
  'math-competition-2025-third': ['math-competition-2025-third'],
  'mathorcup-2025-second': ['mathorcup-2025-second'],
  'chemistry-olympiad-2023': ['chemistry-olympiad-2023'],
  'chemistry-olympiad-2022': ['chemistry-olympiad-2022'],
  'three-good-student-2025': ['three-good-student-2025'],
  'academic-competition-individual-2025': [],
  'volleyball-freshman-2024-second': ['volleyball-freshman-2024-second'],
  'debate-second-2024': ['debate-second-2024'],
};

const normalizeLevel = (level: string): AchievementLevel =>
  level === 'school' ? 'university' : (level as AchievementLevel);
const yearFromPeriod = (period: string) => Number(period.match(/\d{4}(?!.*\d{4})/)?.[0] ?? period.slice(0, 4));
const byId = <T extends { id: string }>(items: readonly T[], id: string, label: string): T => {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`${label} is missing bilingual entry: ${id}`);
  return item;
};

export const achievements: Achievement[] = zhSource.competitions.map((zh) => {
  const en = byId(enSource.competitions, zh.id, 'English achievement');
  return {
    id: zh.id,
    year: yearFromPeriod(zh.year),
    period: { zh: zh.year, en: en.year },
    level: normalizeLevel(zh.level),
    title: { zh: zh.title, en: en.title },
    summary: { zh: zh.note, en: en.note },
    evidenceIds: achievementEvidence[zh.id] ?? [],
  };
});

export const skills: SkillGroup[] = zhSource.skills.map((zh) => {
  const en = byId(enSource.skills, zh.id, 'English skill');
  return {
    id: zh.id,
    title: { zh: zh.category, en: en.category },
    summary: { zh: zh.desc, en: en.desc },
    items: { zh: zh.items, en: en.items },
  };
});

export const projects: Project[] = zhSource.projects.map((project) => {
  const enProject = byId(enSource.projects, project.id, 'English project');
  const commonProject = commonSource.projects.find((item) => item.id === project.id);
  const hrefZh = commonProject?.link ?? '/profile/#projects';
  const hrefEn = hrefZh.startsWith('/') ? `/en${hrefZh}` : hrefZh;
  return {
    id: project.id,
    title: { zh: project.title, en: enProject.title },
    summary: { zh: project.desc, en: enProject.desc },
    abilities: { zh: project.abilities, en: enProject.abilities },
    tags: commonProject?.tags ?? [],
    href: { zh: hrefZh, en: hrefEn },
  };
});

export const experience: Experience[] = zhSource.experience.map((zh) => {
  const en = byId(enSource.experience, zh.id, 'English experience');
  return {
    id: zh.id,
    period: { zh: zh.period, en: en.period },
    title: { zh: zh.title, en: en.title },
    summary: { zh: zh.desc, en: en.desc },
  };
});

export const researchAreas: ResearchArea[] = zhSource.researchInterests.areas.map((zh) => {
  const en = byId(enSource.researchInterests.areas, zh.id, 'English research area');
  return { id: zh.id, title: { zh: zh.name, en: en.name }, summary: { zh: zh.note, en: en.note } };
});

export const researchOverview = {
  tagline: { zh: zhSource.researchInterests.tagline, en: enSource.researchInterests.tagline },
  summary: { zh: zhSource.researchInterests.summary, en: enSource.researchInterests.summary },
};

export const service = zhSource.volunteer.map((zh) => ({
  id: zh.id,
  summary: {
    zh: zh.summary,
    en: byId(enSource.volunteer, zh.id, 'English service').summary,
  },
}));

export const highlights = zhSource.highlights.map((highlight) => {
  const en = byId(enSource.highlights, highlight.id, 'English highlight');
  return {
    id: highlight.id,
    title: { zh: highlight.title, en: en.title },
    summary: { zh: highlight.desc, en: en.desc },
  };
});

export const chemAiModuleIds = [
  'data',
  'features',
  'models',
  'nn',
  'pipeline',
  'qm',
  'automl',
  'evaluation',
  'xai',
  'viz',
  'hub',
  'pretrained',
  'cli',
  'config',
  'utils',
] as const;
export const chemAiModuleCount = chemAiModuleIds.length;

export const resumeSectionIds = [
  'about',
  'education',
  'honors',
  'skills',
  'projects',
  'experience',
  'research',
  'contact',
] as const;
