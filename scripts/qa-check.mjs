import { chromium } from 'playwright';
import {
  containsEncodingCorruption,
  courseRoutes,
  hasFragmentTarget,
  localUrl,
  normalizePathname,
  pdfPageCount,
  previewBase,
  printRoutes,
  staticRouteLocales,
  withPreview,
} from './lib/contracts.mjs';

const SITE_URL = 'https://XCmiaow.github.io';
const failures = [];
const routeResults = [];
const requestCache = new Map();
const printRouteIds = new Set(['resume-onepage', 'resume-academic', 'resume-career']);

function fail(message) {
  failures.push(message);
}

async function requestStatus(page, url) {
  const key = `${url.origin}${url.pathname}${url.search}`;
  if (!requestCache.has(key)) {
    requestCache.set(
      key,
      page.request
        .get(key, { failOnStatusCode: false, timeout: 8000 })
        .then((response) => response.status())
        .catch(() => 0),
    );
  }
  return requestCache.get(key);
}

async function checkLinks(page, route) {
  const links = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      href: anchor.href,
      target: anchor.getAttribute('target') || '',
      rel: anchor.getAttribute('rel') || '',
    })),
  );

  for (const link of links) {
    if (link.target === '_blank' && (!/\bnoopener\b/i.test(link.rel) || !/\bnoreferrer\b/i.test(link.rel))) {
      fail(`${route}: target="_blank" link lacks noopener noreferrer (${link.href})`);
    }
    const url = localUrl(link.href);
    if (!url) continue;
    const status = await requestStatus(page, url);
    if (status >= 400 || status === 0) fail(`${route}: broken local link ${url.pathname} returned ${status}`);
    if (url.hash && !hasFragmentTarget(url)) fail(`${route}: missing fragment target ${url.pathname}${url.hash}`);
  }
}

async function checkMetadataAndShell(page, route) {
  const canonicalLinks = await page
    .locator('link[rel="canonical"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  if (canonicalLinks.length !== 1) fail(`${route.path}: expected one canonical link, found ${canonicalLinks.length}`);

  const expectedCanonical = new URL(route.path, SITE_URL).toString();
  const samePublicUrl = (actual, expected) => {
    if (!actual) return false;
    const actualUrl = new URL(actual);
    const expectedUrl = new URL(expected);
    return (
      actualUrl.origin.toLowerCase() === expectedUrl.origin.toLowerCase() &&
      normalizePathname(actualUrl) === normalizePathname(expectedUrl)
    );
  };
  if (route.canonical && !samePublicUrl(canonicalLinks[0], expectedCanonical)) {
    fail(`${route.path}: canonical is ${canonicalLinks[0]}; expected ${expectedCanonical}`);
  }
  if (!route.canonical && samePublicUrl(canonicalLinks[0], expectedCanonical)) {
    fail(`${route.path}: compatibility page must canonicalize to its maintained destination`);
  }

  const alternates = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((links) =>
      links.map((link) => ({ lang: link.getAttribute('hreflang'), href: link.getAttribute('href') })),
    );
  for (const lang of [route.lang, route.alternateLang]) {
    if (alternates.filter((alternate) => alternate.lang === lang).length !== 1) {
      fail(`${route.path}: expected one ${lang} alternate link`);
    }
  }
  if (route.canonical) {
    const expectedAlternate = new URL(route.alternatePath, SITE_URL).toString();
    if (!alternates.some(({ lang, href }) => lang === route.alternateLang && samePublicUrl(href, expectedAlternate))) {
      fail(`${route.path}: ${route.alternateLang} alternate does not match ${expectedAlternate}`);
    }
  }

  for (const [selector, label] of [
    ['script[data-theme-init]', 'theme initializer'],
    ['script[data-pwa-runtime]', 'PWA runtime'],
    ['link[rel="manifest"]', 'manifest link'],
  ]) {
    const count = await page.locator(selector).count();
    if (count !== 1) fail(`${route.path}: expected one ${label}, found ${count}`);
  }

  if (printRouteIds.has(route.id)) return;
  const brandShell = route.domain !== 'resume';
  const navSelector = brandShell ? '.sa-nav' : '.site-header';
  const footerSelector = brandShell ? '.sa-footer' : 'footer[role="contentinfo"]';
  const navCount = await page.locator(navSelector).count();
  const footerCount = await page.locator(footerSelector).count();
  if (navCount !== 1) fail(`${route.path}: expected one shared navigation, found ${navCount}`);
  if (footerCount !== 1) fail(`${route.path}: expected one shared footer, found ${footerCount}`);
}

async function checkRoute(page, route) {
  const response = await page.goto(`${previewBase}${route.path}`, { waitUntil: 'load' });
  await page.waitForTimeout(120);
  const status = response?.status() ?? 0;
  const h1 = await page
    .locator('h1')
    .first()
    .innerText()
    .catch(() => '');
  const bodyText = await page
    .locator('body')
    .innerText()
    .catch(() => '');
  const brokenImages = await page
    .locator('img')
    .evaluateAll((images) =>
      images
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
    );
  routeResults.push({ route: route.path, status, h1: h1.trim(), brokenImages: brokenImages.length });
  if (status >= 400 || status === 0) fail(`${route.path}: returned HTTP ${status}`);
  if (!h1.trim()) fail(`${route.path}: visible h1 is missing`);
  if (bodyText.trim().length < 80) fail(`${route.path}: rendered too little text`);
  if (containsEncodingCorruption(bodyText)) fail(`${route.path}: rendered text contains an encoding corruption marker`);
  brokenImages.forEach((source) => fail(`${route.path}: broken image ${source}`));
  await checkMetadataAndShell(page, route);
  await checkLinks(page, route.path);
}

async function checkXml(page) {
  for (const route of ['/sitemap.xml', '/silicon-ashes/rss.xml', '/en/silicon-ashes/rss.xml']) {
    const response = await page.request.get(`${previewBase}${route}`, { failOnStatusCode: false });
    const body = await response.text();
    if (!response.ok()) fail(`${route}: returned HTTP ${response.status()}`);
    if (!(response.headers()['content-type'] || '').includes('xml')) fail(`${route}: content type is not XML`);
    if (containsEncodingCorruption(body)) fail(`${route}: contains an encoding corruption marker`);
    if (route === '/sitemap.xml') {
      if (!/<urlset\b[\s\S]*<url>/i.test(body)) fail(`${route}: missing urlset/url structure`);
      for (const path of ['https://xcmiaow.github.io/', '/profile', '/silicon-ashes/courses/ai-research-efficiency/']) {
        if (!body.toLowerCase().includes(path.toLowerCase())) fail(`${route}: missing required location ${path}`);
      }
    } else {
      if (!/<rss\b[\s\S]*<channel>[\s\S]*<item>/i.test(body)) fail(`${route}: missing rss/channel/item structure`);
    }
  }
}

async function checkCourse(page) {
  await page.goto(`${previewBase}/silicon-ashes/courses/`, { waitUntil: 'load' });
  const courseHref = await page.locator('.primary-course-link').first().getAttribute('href');
  if (normalizePathname(courseHref || '/') !== normalizePathname(courseRoutes[0])) {
    fail(`Course CTA points to ${courseHref}; expected ${courseRoutes[0]}`);
  }
  const pathCount = await page.locator('.path-step').count();
  if (pathCount !== 6) fail(`Course learning path exposes ${pathCount} units; expected 6`);

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of courseRoutes) {
    const response = await page.goto(`${previewBase}${route}`, { waitUntil: 'load' });
    const shellCount = await page.locator('.course-program').count();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (!response?.ok()) fail(`${route}: course route returned HTTP ${response?.status() ?? 0}`);
    if (shellCount !== 1) fail(`${route}: expected one unified course shell, found ${shellCount}`);
    if (overflow) fail(`${route}: course shell overflows at 390px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function checkMobileContactRow(page) {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${previewBase}/`, { waitUntil: 'load' });
    const layout = await page.locator('.sa-footer.contact nav .footer-link').evaluateAll((links) => {
      const boxes = links.map((link) => link.getBoundingClientRect());
      const visibleLabels = links.filter((link) => {
        const label = link.querySelector('span');
        return label && getComputedStyle(label).display !== 'none' && label.getBoundingClientRect().width > 0;
      }).length;
      return {
        count: links.length,
        rowCount: new Set(boxes.map((box) => Math.round(box.top))).size,
        widths: boxes.map((box) => box.width),
        minHeight: Math.min(...boxes.map((box) => box.height)),
        overflow: boxes.some((box) => box.left < -1 || box.right > innerWidth + 1),
        visibleLabels,
        missingNames: links.filter((link) => !link.getAttribute('aria-label')?.trim()).length,
      };
    });
    if (layout.count !== 5) fail(`Mobile contact footer exposes ${layout.count} links at ${width}px; expected 5`);
    if (layout.rowCount !== 1) fail(`Mobile contact links use ${layout.rowCount} rows at ${width}px; expected 1`);
    if (Math.max(...layout.widths) - Math.min(...layout.widths) > 1) {
      fail(`Mobile contact links are not equally sized at ${width}px`);
    }
    if (layout.minHeight < 44) fail(`Mobile contact targets are shorter than 44px at ${width}px`);
    if (layout.overflow) fail(`Mobile contact row overflows at ${width}px`);
    if (layout.visibleLabels !== 0) fail(`Mobile contact row still shows ${layout.visibleLabels} labels at ${width}px`);
    if (layout.missingNames !== 0) fail(`Mobile contact row has ${layout.missingNames} unnamed links at ${width}px`);
  }
}

async function checkInteractions(page) {
  await page.goto(`${previewBase}/`, { waitUntil: 'load' });
  await page.locator('.sa-nav a[href="/en/"]').click();
  await page.waitForURL(`${previewBase}/en/`);

  await page.goto(`${previewBase}/profile`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.removeItem('resume-layout'));
  await page.locator('#layoutToggle').click();
  const minimal = await page.evaluate(() => ({
    className: document.documentElement.classList.contains('minimal-mode'),
    stored: localStorage.getItem('resume-layout'),
  }));
  if (!minimal.className || minimal.stored !== 'minimal') fail('Profile layout toggle did not persist minimal mode');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${previewBase}/en/profile`, { waitUntil: 'load' });
  await page.locator('#menuToggle').click();
  if ((await page.locator('#menuToggle').getAttribute('aria-expanded')) !== 'true') fail('Mobile menu did not open');
  await page.keyboard.press('Escape');
  if ((await page.locator('#menuToggle').getAttribute('aria-expanded')) !== 'false') fail('Escape did not close menu');

  await page.goto(`${previewBase}/evidence`, { waitUntil: 'load' });
  await page.locator('a.cert-card').first().click();
  if ((await page.locator('#lightbox[open]').count()) !== 1) fail('Evidence lightbox did not open');
  await page.keyboard.press('Escape');
  if ((await page.locator('#lightbox[open]').count()) !== 0) fail('Escape did not close evidence lightbox');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
  });
  await page.goto(`${previewBase}/silicon-ashes/feed/`, { waitUntil: 'load' });
  const copy = page.locator('[data-copy-control]').first();
  if ((await copy.count()) !== 1) {
    fail('Feed page is missing the shared copy control');
  } else {
    const copiedLabel = await copy.getAttribute('data-copied-label');
    await copy.click();
    if ((await copy.innerText()).trim() !== copiedLabel) fail('Copy control did not expose its copied status');
  }

  await page.goto(`${previewBase}/`, { waitUntil: 'load' });
  if ((await page.locator('.ember-hero .black-hole-scene').count()) !== 1)
    fail('Brand home lost its black-hole visual');
  if ((await page.locator('canvas[data-ember-canvas]').count()) !== 1) fail('Brand home lost its ember canvas');
  const homeChildren = page.locator('#main > *');
  if (
    (await homeChildren.count()) !== 1 ||
    !(await homeChildren.first().evaluate((element) => element.matches('.ember-hero')))
  ) {
    fail('Brand home must contain only the gravity hero before the contact footer');
  }
  if ((await page.locator('.sa-footer.contact').count()) !== 1) {
    fail('Brand home lost its contact footer stage');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function checkPrint(page) {
  for (const route of printRoutes) {
    await page.goto(`${previewBase}${route}`, { waitUntil: 'load' });
    const pages = pdfPageCount(await page.pdf({ format: 'A4', printBackground: true }));
    if (pages !== 1) fail(`${route}: prints to ${pages} pages instead of one`);
  }

  const handout = '/silicon-ashes/courses/ai-research-efficiency/handout/';
  await page.emulateMedia({ media: 'print' });
  await page.goto(`${previewBase}${handout}`, { waitUntil: 'load' });
  const printStyle = await page.evaluate(() => {
    const nav = document.querySelector('.sa-nav');
    const prose = document.querySelector('.course-prose');
    return {
      navDisplay: nav ? getComputedStyle(nav).display : 'missing',
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      proseColor: prose ? getComputedStyle(prose).color : 'missing',
    };
  });
  if (printStyle.navDisplay !== 'none') fail(`${handout}: brand navigation remains visible when printing`);
  if (printStyle.bodyBackground !== 'rgb(255, 255, 255)') fail(`${handout}: print background is not white`);
  if (printStyle.proseColor !== 'rgb(17, 17, 17)') fail(`${handout}: print prose is not dark and readable`);
  const handoutPages = pdfPageCount(await page.pdf({ format: 'A4', printBackground: true }));
  if (handoutPages < 6 || handoutPages > 100) fail(`${handout}: unexpected PDF length (${handoutPages} pages)`);
  await page.emulateMedia({ media: 'screen' });
}

await withPreview(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(12000);
  page.on('console', (message) => {
    if (message.type() === 'error') fail(`Console error on ${page.url()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => fail(`Page error on ${page.url()}: ${error.message}`));
  try {
    for (const route of staticRouteLocales()) await checkRoute(page, route);
    await checkXml(page);
    await checkCourse(page);
    await checkMobileContactRow(page);
    await checkInteractions(page);
    await checkPrint(page);
  } finally {
    await browser.close();
  }
});

if (failures.length) {
  console.error(JSON.stringify({ failures, routeResults }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ browserRoutes: 'ok', routes: routeResults.length, interactions: 'ok', print: 'ok' }));
