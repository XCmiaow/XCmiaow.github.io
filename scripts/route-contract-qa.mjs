import fs from 'node:fs';
import path from 'node:path';

const contractPath = path.join(process.cwd(), 'src/data/routes.json');
const requiredIds = [
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
];
const expectedStaticPaths = {
  'brand-home': { zh: '/', en: '/en/' },
  profile: { zh: '/profile', en: '/en/profile' },
  materials: { zh: '/materials', en: '/en/materials' },
  evidence: { zh: '/evidence', en: '/en/evidence' },
  modeling: { zh: '/modeling', en: '/en/modeling' },
  'ai-km': { zh: '/ai-km', en: '/en/ai-km' },
  'chem-ai-lab': { zh: '/chem-ai-lab', en: '/en/chem-ai-lab' },
  'resume-onepage': { zh: '/resume-onepage', en: '/en/resume-onepage' },
  'resume-academic': { zh: '/resume-academic', en: '/en/resume-academic' },
  'resume-career': { zh: '/resume-career', en: '/en/resume-career' },
  writing: { zh: '/silicon-ashes/writing/', en: '/en/silicon-ashes/writing/' },
  'course-home': { zh: '/silicon-ashes/courses/', en: '/en/silicon-ashes/courses/' },
  resources: { zh: '/silicon-ashes/resources/', en: '/en/silicon-ashes/resources/' },
  feed: { zh: '/silicon-ashes/feed/', en: '/en/silicon-ashes/feed/' },
  about: { zh: '/silicon-ashes/about/', en: '/en/silicon-ashes/about/' },
  'compat-brand-home': { zh: '/silicon-ashes/', en: '/en/silicon-ashes/' },
  'compat-blog': { zh: '/blog/', en: '/en/blog/' },
};
const expectedPatternRoutes = {
  'writing-entry': {
    domain: 'brand',
    source: 'blog',
    zh: '/silicon-ashes/writing/:slug/',
    en: '/en/silicon-ashes/writing/:slug/',
  },
  'resource-entry': {
    domain: 'brand',
    source: 'resources',
    zh: '/silicon-ashes/resources/:slug/',
    en: '/en/silicon-ashes/resources/:slug/',
  },
  'compat-blog-entry': {
    domain: 'compatibility',
    source: 'blog',
    zh: '/blog/:slug/',
    en: '/en/blog/:slug/',
  },
};
const domains = new Set(['brand', 'resume', 'course', 'compatibility']);
const kinds = new Set(['static', 'pattern']);
const patternSources = new Set(['blog', 'resources']);

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateRoutes(value) {
  const failures = [];
  const fail = (message) => failures.push(message);
  if (!Array.isArray(value)) return ['route contract must be an array'];

  const ids = new Set();
  const paths = new Set();
  const routesById = new Map();
  const brandHomes = [];

  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      fail(`route[${index}] must be an object`);
      continue;
    }
    const route = candidate;
    const label = typeof route.id === 'string' && route.id ? route.id : `route[${index}]`;
    for (const field of ['id', 'domain', 'kind', 'zh', 'en', 'canonical', 'sitemap', 'pwa']) {
      if (!(field in route)) fail(`${label} is missing ${field}`);
    }
    if (typeof route.id !== 'string' || !route.id.trim()) {
      fail(`${label} has an invalid id`);
    } else {
      if (ids.has(route.id)) fail(`duplicate route id: ${route.id}`);
      ids.add(route.id);
      routesById.set(route.id, route);
    }
    if (!domains.has(route.domain)) fail(`${label} has invalid domain: ${route.domain}`);
    if (!kinds.has(route.kind)) fail(`${label} has invalid kind: ${route.kind}`);
    for (const field of ['canonical', 'sitemap', 'pwa']) {
      if (typeof route[field] !== 'boolean') fail(`${label}.${field} must be boolean`);
    }
    for (const lang of ['zh', 'en']) {
      const localized = route[lang];
      if (!isRecord(localized)) {
        fail(`${label}.${lang} must be an object`);
        continue;
      }
      if (typeof localized.path !== 'string' || !localized.path.startsWith('/')) {
        fail(`${label}.${lang}.path must be a root-relative path`);
      } else {
        if (paths.has(localized.path)) fail(`duplicate localized path: ${localized.path}`);
        paths.add(localized.path);
      }
      if (typeof localized.h1 !== 'string' || !localized.h1.trim()) {
        fail(`${label}.${lang}.h1 must be non-empty`);
      }
    }
    if (route.kind === 'pattern') {
      if (!patternSources.has(route.source)) fail(`${label} pattern route has invalid source: ${route.source}`);
      if (!route.zh?.path?.includes(':slug') || !route.en?.path?.includes(':slug')) {
        fail(`${label} pattern paths must contain :slug`);
      }
      if (route.pwa) fail(`${label} pattern route must not be precached by the PWA`);
    } else if (route.source !== undefined) {
      fail(`${label} static route must not declare source`);
    }
    if (
      route.domain === 'compatibility' &&
      (route.canonical !== false || route.sitemap !== false || route.pwa !== false)
    ) {
      fail(`${label} compatibility routes must set canonical/sitemap/pwa to false`);
    }
    if (route.canonical && route.domain === 'brand' && route.zh?.path === '/' && route.en?.path === '/en/') {
      brandHomes.push(route.id);
    }
  }

  for (const id of requiredIds) if (!ids.has(id)) fail(`missing required route id: ${id}`);
  for (const id of ids) if (!requiredIds.includes(id)) fail(`unexpected route id: ${id}`);

  for (const [id, expected] of Object.entries(expectedStaticPaths)) {
    const route = routesById.get(id);
    if (!route) continue;
    if (route.kind !== 'static') fail(`${id} must be kind=static`);
    if (route.zh?.path !== expected.zh || route.en?.path !== expected.en) {
      fail(`${id} must map ${expected.zh} and ${expected.en}`);
    }
  }
  if (brandHomes.length !== 1) {
    fail(`expected exactly one canonical bilingual brand homepage, got ${brandHomes.length}`);
  }

  const requireCompat = (id, zhPath, enPath) => {
    const route = routesById.get(id);
    if (!route) return;
    if (route.domain !== 'compatibility') fail(`${id} must use compatibility domain`);
    if (route.kind !== 'static') fail(`${id} must be static`);
    if (route.zh?.path !== zhPath || route.en?.path !== enPath) {
      fail(`${id} must map ${zhPath} and ${enPath}`);
    }
    if (route.canonical !== false || route.sitemap !== false || route.pwa !== false) {
      fail(`${id} canonical/sitemap/pwa must all be false`);
    }
  };
  requireCompat(
    'compat-brand-home',
    expectedStaticPaths['compat-brand-home'].zh,
    expectedStaticPaths['compat-brand-home'].en,
  );
  requireCompat('compat-blog', expectedStaticPaths['compat-blog'].zh, expectedStaticPaths['compat-blog'].en);

  const requirePattern = (id, expected) => {
    const route = routesById.get(id);
    if (!route) return;
    if (route.kind !== 'pattern') fail(`${id} must be kind=pattern`);
    if (route.domain !== expected.domain) fail(`${id} must use domain=${expected.domain}`);
    if (route.source !== expected.source) fail(`${id} must use source=${expected.source}`);
    if (route.zh?.path !== expected.zh || route.en?.path !== expected.en) {
      fail(`${id} must map ${expected.zh} and ${expected.en}`);
    }
  };
  for (const [id, expected] of Object.entries(expectedPatternRoutes)) requirePattern(id, expected);

  const dynamicParents = [
    ['/silicon-ashes/writing/', '/en/silicon-ashes/writing/'],
    ['/silicon-ashes/resources/', '/en/silicon-ashes/resources/'],
  ];
  for (const route of value.filter(isRecord)) {
    if (route.kind !== 'static') continue;
    for (const [zhParent, enParent] of dynamicParents) {
      const hasIndividualStaticPath =
        (typeof route.zh?.path === 'string' && route.zh.path.startsWith(zhParent) && route.zh.path !== zhParent) ||
        (typeof route.en?.path === 'string' && route.en.path.startsWith(enParent) && route.en.path !== enParent);
      if (hasIndividualStaticPath) fail(`${route.id || 'unnamed route'} must not hard-code a dynamic entry as static`);
    }
  }

  return failures;
}

function expectInvalid(name, routes, expectedMessages) {
  const failures = validateRoutes(routes);
  for (const expected of expectedMessages) {
    if (!failures.some((failure) => failure.includes(expected))) {
      throw new Error(`${name} negative case did not fail with "${expected}": ${failures.join('; ')}`);
    }
  }
}

const failures = [];
if (!fs.existsSync(contractPath)) {
  failures.push('src/data/routes.json does not exist');
} else {
  const routes = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  failures.push(...validateRoutes(routes));

  const badCompat = structuredClone(routes);
  const compat = badCompat.find((route) => route.id === 'compat-brand-home');
  compat.domain = 'brand';
  compat.canonical = true;
  expectInvalid('compat contract', badCompat, [
    'compat-brand-home must use compatibility domain',
    'compat-brand-home canonical/sitemap/pwa must all be false',
  ]);

  const badDynamic = structuredClone(routes);
  badDynamic.find((route) => route.id === 'writing-entry').kind = 'static';
  expectInvalid('dynamic contract', badDynamic, ['writing-entry must be kind=pattern']);

  const missingLocale = structuredClone(routes);
  delete missingLocale.find((route) => route.id === 'profile').en;
  expectInvalid('locale contract', missingLocale, ['profile is missing en', 'profile.en must be an object']);

  const swappedPaths = structuredClone(routes);
  const profile = swappedPaths.find((route) => route.id === 'profile');
  const materials = swappedPaths.find((route) => route.id === 'materials');
  [profile.zh, materials.zh] = [materials.zh, profile.zh];
  [profile.en, materials.en] = [materials.en, profile.en];
  expectInvalid('semantic path contract', swappedPaths, ['profile must map /profile and /en/profile']);

  const driftedId = structuredClone(routes);
  driftedId.find((route) => route.id === 'profile').id = 'profile-drift';
  expectInvalid('route ID contract', driftedId, [
    'missing required route id: profile',
    'unexpected route id: profile-drift',
  ]);

  const badCompatPattern = structuredClone(routes);
  badCompatPattern.find((route) => route.id === 'compat-blog-entry').canonical = true;
  expectInvalid('compatibility pattern contract', badCompatPattern, [
    'compat-blog-entry compatibility routes must set canonical/sitemap/pwa to false',
  ]);
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ routeContract: 'ok', negativeCases: 6 }, null, 2));
