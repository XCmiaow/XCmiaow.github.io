import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const astroRoots = ['src/components', 'src/pages'];
const allowedSaControl = new Set([
  'src/components/silicon-embers/ActionButton.astro',
  'src/components/silicon-embers/CopyButton.astro',
]);
const shellContentComponents = [
  'src/components/AboutPage.astro',
  'src/components/CoursesHub.astro',
  'src/components/ResourcesHub.astro',
  'src/components/ResourceTemplatePage.astro',
  'src/components/SiliconAshesHome.astro',
  'src/components/WritingHub.astro',
  'src/components/silicon-embers/SiliconEmbersArticlePage.astro',
  'src/components/silicon-embers/SiliconEmbersFeedPage.astro',
];
const staticBrandPages = [
  'src/pages/index.astro',
  'src/pages/en/index.astro',
  'src/pages/silicon-ashes/about.astro',
  'src/pages/en/silicon-ashes/about.astro',
  'src/pages/silicon-ashes/courses.astro',
  'src/pages/en/silicon-ashes/courses.astro',
  'src/pages/silicon-ashes/feed.astro',
  'src/pages/en/silicon-ashes/feed.astro',
  'src/pages/silicon-ashes/resources.astro',
  'src/pages/en/silicon-ashes/resources.astro',
  'src/pages/silicon-ashes/writing.astro',
  'src/pages/en/silicon-ashes/writing.astro',
];
const compatibilityPages = [
  'src/pages/silicon-ashes.astro',
  'src/pages/en/silicon-ashes.astro',
  'src/pages/blog/index.astro',
  'src/pages/en/blog/index.astro',
  'src/pages/blog/[slug].astro',
  'src/pages/en/blog/[slug].astro',
];
const forbiddenLocalButtonSelectors = [
  '.gateway-link',
  '.primary-course-link',
  '.section-link',
  '.article-return a',
  '.template-return a',
  '.contact-board a',
  '.feed-actions a',
  '.signal-links a',
  '.resource-links a',
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith('.astro')) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    failures.push(`Missing required file: ${relative}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const failures = [];
const files = astroRoots.flatMap((dir) => walk(path.join(root, dir)));

for (const file of files) {
  const relative = rel(file);
  const source = fs.readFileSync(file, 'utf8');
  if (!allowedSaControl.has(relative) && /<[^>]+class(?::list)?=[^>]*\bsa-control\b/.test(source)) {
    failures.push(`${relative}: use ActionButton or ActionLinks instead of writing sa-control directly`);
  }

  for (const selector of forbiddenLocalButtonSelectors) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|\\n)\\s*${escaped}\\s*\\{`).test(source)) {
      failures.push(`${relative}: local button skin "${selector}" should live in src/styles/silicon-embers.css`);
    }
  }
}

for (const required of allowedSaControl) {
  if (!fs.existsSync(path.join(root, required))) failures.push(`Missing required component: ${required}`);
}

const layoutSource = read('src/layouts/SiliconEmbersLayout.astro');
const documentLayoutSource = read('src/layouts/DocumentLayout.astro');
if ((layoutSource.match(/<SiliconEmbersSiteFrame\b/g) ?? []).length !== 1) {
  failures.push('SiliconEmbersLayout must render exactly one SiliconEmbersSiteFrame');
}
if (
  !/faviconPath="\/silicon-ashes\/logo\.jpg"/.test(layoutSource) ||
  !/<link rel="icon" href=\{faviconPath\}/.test(documentLayoutSource)
) {
  failures.push('SiliconEmbersLayout must expose the existing brand mark as its favicon');
}
for (const relative of shellContentComponents) {
  if (/SiliconEmbersSiteFrame/.test(read(relative))) {
    failures.push(`${relative}: content components must not own the brand shell`);
  }
}

const siteFrameSource = read('src/components/silicon-embers/SiliconEmbersSiteFrame.astro');
if ((siteFrameSource.match(/<BrandNav\b/g) ?? []).length !== 1) {
  failures.push('SiliconEmbersSiteFrame must render exactly one BrandNav');
}
if ((siteFrameSource.match(/<SiliconEmbersFooter\b/g) ?? []).length !== 1) {
  failures.push('SiliconEmbersSiteFrame must render exactly one brand footer');
}
if (!/routePath\('writing', lang\)/.test(siteFrameSource) || !/routePath\('resources', lang\)/.test(siteFrameSource)) {
  failures.push('Brand navigation paths must be derived from the route contract');
}

const homeCopySource = read('src/data/siliconEmbersHome.ts');
const homeSource = read('src/components/SiliconAshesHome.astro');
const manifestoSource = read('src/components/silicon-embers/BrandManifesto.astro');
const heroSource = read('src/components/silicon-embers/EmberHero.astro');

if ((homeSource.match(/<BrandManifesto\b/g) ?? []).length !== 1) {
  failures.push('Brand home must render exactly one BrandManifesto');
}
if (!/copy=\{copy\.thesis\}/.test(homeSource) || !/method=\{copy\.operatingSystem\}/.test(homeSource)) {
  failures.push('BrandManifesto must receive localized thesis and operating-system copy');
}
for (const className of ['brand-manifesto', 'principle-list', 'method-rail']) {
  if (!manifestoSource.includes(className)) failures.push(`BrandManifesto is missing ${className}`);
}

const editorialComponents = [
  ['src/components/silicon-embers/SiteCompass.astro', 'compass-arrow'],
  ['src/components/silicon-embers/WritingPreview.astro', 'writing-arrow'],
  ['src/components/silicon-embers/BrandNav.astro', 'aperture'],
  ['src/components/silicon-embers/SiliconEmbersFooter.astro', 'footer-link'],
];
for (const [relative, className] of editorialComponents) {
  if (!read(relative).includes(className)) failures.push(`${relative}: missing editorial marker ${className}`);
}
for (const [relative, marker] of [
  ['src/components/silicon-embers/EmberHero.astro', 'action-primary'],
  ['src/components/silicon-embers/SiteCompass.astro', 'compass-record'],
  ['src/components/silicon-embers/SiteCompass.astro', 'record-rule'],
]) {
  if (!read(relative).includes(marker)) failures.push(`${relative}: missing precision marker ${marker}`);
}
if (!heroSource.includes('hero-status')) {
  failures.push('EmberHero must use one compact hero-status line');
}
if (heroSource.includes('hero-record') || heroSource.includes('record-state')) {
  failures.push('EmberHero must remove the multi-column observation record');
}
if (!/font-size:\s*clamp\([^;]+5\.2rem\)/.test(heroSource)) {
  failures.push('Hero display text must cap at 5.2rem');
}
for (const [relative, marker] of [
  ['src/components/silicon-embers/BrandManifesto.astro', 'principle-trace'],
  ['src/components/silicon-embers/BrandManifesto.astro', 'method-track'],
  ['src/components/silicon-embers/WritingPreview.astro', 'writing-rule'],
  ['src/components/silicon-embers/SignalLinksSection.astro', 'resource-record'],
]) {
  if (!read(relative).includes(marker)) failures.push(`${relative}: missing precision marker ${marker}`);
}
for (const forbidden of ['7.4rem', '6.3rem']) {
  if (
    [manifestoSource, read('src/components/silicon-embers/WritingPreview.astro')].some((source) =>
      source.includes(forbidden),
    )
  ) {
    failures.push(`Poster-scale section cap ${forbidden} must be removed`);
  }
}
for (const [relative, marker] of [
  ['src/components/silicon-embers/BrandNav.astro', 'archive-index'],
  ['src/components/silicon-embers/SiliconEmbersFooter.astro', 'archive-note'],
]) {
  if (!read(relative).includes(marker)) failures.push(`${relative}: missing precision marker ${marker}`);
}

const navBlocks = [...homeCopySource.matchAll(/nav:\s*\[([\s\S]*?)\],/g)].map((match) => match[1]);
const expectedNavLabels = [
  ['博客', '资源', '关于'],
  ['Blog', 'Resources', 'About'],
];
if (navBlocks.length !== expectedNavLabels.length) {
  failures.push('Brand copy must define exactly one Chinese and one English primary nav');
} else {
  navBlocks.forEach((block, index) => {
    const labels = [...block.matchAll(/label:\s*'([^']+)'/g)].map((match) => match[1]);
    if (JSON.stringify(labels) !== JSON.stringify(expectedNavLabels[index])) {
      failures.push(`Brand primary nav ${index + 1} must contain only ${expectedNavLabels[index].join('/')}`);
    }
  });
}

const actionButtonSource = read('src/components/silicon-embers/ActionButton.astro');
if (!/type ButtonVariant = 'default' \| 'primary' \| 'text';/.test(actionButtonSource)) {
  failures.push('ActionButton variants must be exactly default/primary/text');
}
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (/variant=(?:"|')?(?:quiet|secondary)/.test(source)) {
    failures.push(`${rel(file)}: quiet/secondary button variants are not supported`);
  }
}
if (/variant:\s*'(?:quiet|secondary)'/.test(homeCopySource)) {
  failures.push('Brand data must use only default/primary/text control variants');
}

for (const relative of [
  'src/components/CoursesHub.astro',
  'src/components/silicon-embers/SiliconEmbersFeedPage.astro',
]) {
  if (read(relative).includes('订阅')) failures.push(`${relative}: brand chrome must not use the literal “订阅”`);
}

const resourceSource = read('src/data/siliconAshesResources.ts');
const templateDefinitions = [
  ...resourceSource.matchAll(/slug:\s*'([^']+)',\s*\r?\n\s*category:\s*'(templates|checklists)'/g),
].map((match) => match[1]);
if (templateDefinitions.length !== new Set(templateDefinitions).size || templateDefinitions.length === 0) {
  failures.push('Every resource template must define one unique category');
}
for (const slug of templateDefinitions) {
  const occurrences = (resourceSource.match(new RegExp(`'${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g')) ?? [])
    .length;
  if (occurrences !== 1) failures.push(`Resource template ${slug} must be registered exactly once`);
}
if (!/resourceCategories\.map/.test(resourceSource) || !/resourceRegistry\.filter/.test(resourceSource)) {
  failures.push('getResourceIndexGroups must be derived from resourceCategories and resourceRegistry');
}

for (const relative of staticBrandPages) {
  const source = read(relative);
  if (!/routePath\(routeId, lang\)/.test(source) || !/routeAlternatePath\(routeId, lang\)/.test(source)) {
    failures.push(`${relative}: static canonical and alternate paths must come from RouteId`);
  }
}

for (const relative of compatibilityPages) {
  const source = read(relative);
  if (!/CompatibilityEntry/.test(source) || !/canonicalPath=\{canonicalPath\}/.test(source)) {
    failures.push(`${relative}: compatibility pages need canonical metadata and accessible canonical navigation`);
  }
  if (/\brender\s*\(/.test(source)) failures.push(`${relative}: compatibility pages must not render duplicate content`);
}

const routes = JSON.parse(read('src/data/routes.json'));
for (const route of routes.filter((entry) => entry.domain === 'compatibility')) {
  if (route.canonical || route.sitemap || route.pwa) {
    failures.push(`${route.id}: compatibility routes must be excluded from canonical, sitemap, and PWA lists`);
  }
}

const sharedControlCss = read('src/styles/silicon-embers.css');
if (!/\.sa-shell \.sa-control\s*\{/.test(sharedControlCss) || !/\.sa-control:focus-visible/.test(sharedControlCss)) {
  failures.push('ActionButton and CopyButton must share themed control and visible focus styles');
}
for (const token of ['--paper: #241c14', '--coal: #f4efe5', '--paper: #f0dfbf', '--coal: #080705']) {
  if (!sharedControlCss.includes(token)) failures.push(`Brand palette is missing ${token}`);
}
if (sharedControlCss.includes('visibility: hidden !important')) {
  failures.push('Light mode must translate the gravity field instead of hiding it');
}
if (!/--display-section-max:\s*5rem/.test(sharedControlCss)) {
  failures.push('Shared brand type scale must cap section display text at 5rem');
}
if (!/\.event-horizon::after\s*\{[^}]*background:\s*#0d0b09/s.test(sharedControlCss)) {
  failures.push('Light-mode event horizon must remain one flat near-black plane');
}

const emberCanvasSource = read('src/components/silicon-embers/emberFieldCanvas.ts');
const emberFieldSource = read('src/components/silicon-embers/EmberField.astro');
for (const forbidden of [/max\(-6vw/, /inset:\s*0\s+-20vw/, /inset:\s*0\s+-49vw/]) {
  if (forbidden.test(emberFieldSource)) failures.push(`EmberField contains out-of-bounds geometry: ${forbidden}`);
}
if (!/overflow:\s*clip/.test(emberFieldSource)) {
  failures.push('EmberField must clip visual layers to the hero bounds');
}
if (!/--hole-x:\s*6[2-6]%/.test(emberFieldSource)) {
  failures.push('EmberField must keep the gravity center near 62–66%');
}
for (const className of ['gravity-veil', 'accretion-disc', 'photon-ring', 'event-horizon', 'lensing-arc']) {
  if (!emberFieldSource.includes(className)) failures.push(`EmberField is missing ${className}`);
}
for (const className of ['depth-far', 'depth-rear', 'depth-event', 'depth-front', 'depth-near']) {
  if (!emberFieldSource.includes(className)) failures.push(`EmberField is missing depth plane ${className}`);
}
for (const className of ['orbital-guide', 'disc-filament', 'photon-caustic', 'field-scale']) {
  if (!emberFieldSource.includes(className)) failures.push(`EmberField is missing precision detail ${className}`);
}
for (const contract of [
  "type ParticleBand = 'far' | 'mid' | 'near'",
  'const createSeededRandom',
  'band: ParticleBand',
]) {
  if (!emberCanvasSource.includes(contract)) failures.push(`Ember canvas is missing ${contract}`);
}
if ((emberFieldSource.match(/data-ember-canvas/g) ?? []).length !== 1) {
  failures.push('EmberField must render exactly one particle canvas');
}
if (/drawGravityLens|drawEventHorizon/.test(emberCanvasSource)) {
  failures.push('Ember canvas must draw particles only; CSS owns the gravity lens and event horizon');
}
if (!/const PARTICLE_LIMIT = 64;/.test(emberCanvasSource)) {
  failures.push('Ember canvas particle budget must remain at 64');
}
if (
  !/visibilitychange/.test(emberCanvasSource) ||
  !/IntersectionObserver/.test(emberCanvasSource) ||
  !/cleanup/.test(emberCanvasSource)
) {
  failures.push('Ember canvas must pause offscreen/hidden animation and clean up observers');
}

const notFoundSource = read('src/pages/404.astro');
if (
  !/SiliconEmbersLayout/.test(notFoundSource) ||
  /SiliconEmbersSiteFrame|<!doctype html>|<html\b/.test(notFoundSource)
) {
  failures.push('404 page must use the shared SiliconEmbersLayout document/runtime shell');
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ failures: [], checked: files.length }, null, 2));
