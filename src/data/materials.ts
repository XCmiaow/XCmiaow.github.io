import materialsData from './materials.json';

export type MaterialAudience = 'academic' | 'career' | 'review' | 'portfolio' | 'local';
export type MaterialAccess = 'public' | 'local' | 'restricted';
export type MaterialStatus = 'ready' | 'review-first' | 'local-only' | 'needs-evidence';

export interface MaterialItem {
  id: string;
  audience: MaterialAudience;
  access: MaterialAccess;
  kind: string;
  status: MaterialStatus;
  evidenceIds: string[];
  riskNote: string;
  lastReviewed: string;
  href?: {
    zh: string;
    en: string;
  };
  zh: {
    title: string;
    desc: string;
    action: string;
    usage: string;
    status: string;
  };
  en: {
    title: string;
    desc: string;
    action: string;
    usage: string;
    status: string;
  };
}

export const materials = materialsData.items as MaterialItem[];
