import claimSource from './claims.json';
import evidenceSource from './evidence.json';
import materialSource from './materials.json';
import type { LocalizedText } from './resumeCatalog.ts';

export type EvidenceAccess = 'public';
export type ClaimStatus = 'evidence-backed' | 'case-backed';

export interface EvidenceItem {
  id: string;
  year: string;
  category: string;
  file: string;
  image: string;
  access: EvidenceAccess;
  level: LocalizedText<string>;
  issuer: LocalizedText<string>;
  proofType: LocalizedText<string>;
  title: LocalizedText<string>;
  claim: LocalizedText<string>;
  accessLabel: LocalizedText<string>;
}

export interface MaterialItem {
  id: string;
  audience: 'academic' | 'career' | 'review' | 'portfolio' | 'local';
  access: 'public' | 'restricted' | 'local';
  kind: string;
  status: 'ready' | 'review-first' | 'local-only' | 'needs-evidence';
  evidenceIds: string[];
  riskNote: string;
  lastReviewed: string;
  href?: LocalizedText<string>;
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
  action: LocalizedText<string>;
  usage: LocalizedText<string>;
  statusLabel: LocalizedText<string>;
}

export interface ClaimItem {
  id: string;
  category: string;
  status: ClaimStatus;
  risk: 'low' | 'medium' | 'high';
  evidenceIds: string[];
  materialIds: string[];
  projectIds: string[];
  routes: string[];
  title: LocalizedText<string>;
  claim: LocalizedText<string>;
  boundary: LocalizedText<string>;
}

export const evidenceCategories = evidenceSource.categories.map((category) => ({
  id: category.id,
  title: { zh: category.zh, en: category.en },
}));

export const evidenceCatalog: EvidenceItem[] = evidenceSource.items.map((item) => ({
  id: item.id,
  year: item.year,
  category: item.category,
  file: item.file,
  image: `${evidenceSource.imageBase}${item.file}`,
  access: 'public',
  level: { zh: item.levelZh, en: item.levelEn },
  issuer: { zh: item.issuerZh, en: item.issuerEn },
  proofType: { zh: item.proofTypeZh, en: item.proofTypeEn },
  title: { zh: item.titleZh, en: item.titleEn },
  claim: { zh: item.claimZh, en: item.claimEn },
  accessLabel: { zh: item.accessZh, en: item.accessEn },
}));

export const evidenceById = new Map(evidenceCatalog.map((item) => [item.id, item]));

export const materialCatalog: MaterialItem[] = materialSource.items.map((item) => ({
  id: item.id,
  audience: item.audience as MaterialItem['audience'],
  access: item.access as MaterialItem['access'],
  kind: item.kind,
  status: item.status as MaterialItem['status'],
  evidenceIds: item.evidenceIds,
  riskNote: item.riskNote,
  lastReviewed: item.lastReviewed,
  ...('href' in item && item.href ? { href: item.href } : {}),
  title: { zh: item.zh.title, en: item.en.title },
  summary: { zh: item.zh.desc, en: item.en.desc },
  action: { zh: item.zh.action, en: item.en.action },
  usage: { zh: item.zh.usage, en: item.en.usage },
  statusLabel: { zh: item.zh.status, en: item.en.status },
}));

export const materialById = new Map(materialCatalog.map((item) => [item.id, item]));

const claimProjectIds: Record<string, string[]> = {
  'modeling-practice': ['modeling'],
  'academic-performance': [],
  'chemistry-foundation': ['chem-ai-lab'],
  'research-workflow': ['ai-km'],
  'public-portfolio-system': ['resume-site'],
  'campus-collaboration': [],
};

export const claimCatalog: ClaimItem[] = claimSource.items.map((item) => ({
  id: item.id,
  category: item.category,
  status: item.status as ClaimStatus,
  risk: item.risk as ClaimItem['risk'],
  evidenceIds: item.evidenceIds,
  materialIds: item.materialIds,
  projectIds: claimProjectIds[item.id] ?? [],
  routes: item.routes,
  title: { zh: item.zh.title, en: item.en.title },
  claim: { zh: item.zh.claim, en: item.en.claim },
  boundary: { zh: item.zh.boundary, en: item.en.boundary },
}));

export const claimById = new Map(claimCatalog.map((item) => [item.id, item]));
