import routesJson from '../data/routes.json';

export type SiteLang = 'zh' | 'en';

export const routeIds = [
  'brand-home',
  'profile',
  'materials',
  'evidence',
  'modeling',
  'ai-km',
  'chem-ai-lab',
  'resume-onepage',
  'resume-academic',
  'resume-career',
  'writing',
  'course-home',
  'resources',
  'feed',
  'about',
  'writing-entry',
  'resource-entry',
  'compat-brand-home',
  'compat-blog',
  'compat-blog-entry',
] as const;

export type RouteId = (typeof routeIds)[number];

export interface SiteRoute {
  id: RouteId;
  domain: 'brand' | 'resume' | 'course' | 'compatibility';
  kind: 'static' | 'pattern';
  source?: 'blog' | 'resources';
  zh: { path: string; h1: string };
  en: { path: string; h1: string };
  canonical: boolean;
  sitemap: boolean;
  pwa: boolean;
}

const domains = new Set<SiteRoute['domain']>(['brand', 'resume', 'course', 'compatibility']);
const kinds = new Set<SiteRoute['kind']>(['static', 'pattern']);
const patternSources = new Set<NonNullable<SiteRoute['source']>>(['blog', 'resources']);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function assertRouteContract(value: unknown): asserts value is SiteRoute[] {
  if (!Array.isArray(value)) throw new Error('Route contract must be an array');
  const actualIds = new Set<string>();

  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) throw new Error(`Route contract entry ${index} must be an object`);
    const label = typeof candidate.id === 'string' && candidate.id ? candidate.id : `entry ${index}`;
    if (typeof candidate.id !== 'string' || !candidate.id.trim()) throw new Error(`${label}.id must be non-empty`);
    if (actualIds.has(candidate.id)) throw new Error(`Duplicate route ID: ${candidate.id}`);
    actualIds.add(candidate.id);
    if (typeof candidate.domain !== 'string' || !domains.has(candidate.domain as SiteRoute['domain'])) {
      throw new Error(`${label}.domain is invalid`);
    }
    if (typeof candidate.kind !== 'string' || !kinds.has(candidate.kind as SiteRoute['kind'])) {
      throw new Error(`${label}.kind is invalid`);
    }
    if (candidate.kind === 'pattern') {
      if (
        typeof candidate.source !== 'string' ||
        !patternSources.has(candidate.source as NonNullable<SiteRoute['source']>)
      ) {
        throw new Error(`${label}.source is required for pattern routes`);
      }
    } else if (candidate.source !== undefined) {
      throw new Error(`${label}.source is only valid for pattern routes`);
    }
    for (const lang of ['zh', 'en'] as const) {
      const localized = candidate[lang];
      if (!isRecord(localized)) throw new Error(`${label}.${lang} must be an object`);
      if (typeof localized.path !== 'string' || !localized.path.trim() || !localized.path.startsWith('/')) {
        throw new Error(`${label}.${lang}.path must be a non-empty root-relative path`);
      }
      if (typeof localized.h1 !== 'string' || !localized.h1.trim()) {
        throw new Error(`${label}.${lang}.h1 must be non-empty`);
      }
    }
    for (const field of ['canonical', 'sitemap', 'pwa'] as const) {
      if (typeof candidate[field] !== 'boolean') throw new Error(`${label}.${field} must be boolean`);
    }
  }

  const missing = routeIds.filter((id) => !actualIds.has(id));
  const unknown = [...actualIds].filter((id) => !routeIds.includes(id as RouteId));
  if (missing.length || unknown.length) {
    throw new Error(
      `Route contract IDs do not match RouteId (missing: ${missing.join(', ') || 'none'}; unknown: ${unknown.join(', ') || 'none'})`,
    );
  }
}

assertRouteContract(routesJson);

export const siteRoutes: readonly SiteRoute[] = routesJson;
const routesById = new Map(siteRoutes.map((route) => [route.id, route]));

export function getRoute(id: RouteId): SiteRoute {
  const route = routesById.get(id);
  if (!route) throw new Error(`Unknown route ID: ${id}`);
  return route;
}

export function routePath(id: RouteId, lang: SiteLang): string {
  return getRoute(id)[lang].path;
}

export function alternatePath(id: RouteId, lang: SiteLang): string {
  return routePath(id, lang === 'zh' ? 'en' : 'zh');
}

export const canonicalRoutes = siteRoutes.filter((route) => route.canonical);
