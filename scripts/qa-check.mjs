import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.QA_PORT || 4322);
const base = `http://${host}:${port}`;
const routes = [
  '/',
  '/en/',
  '/modeling',
  '/en/modeling',
  '/chem-ai-lab',
  '/en/chem-ai-lab',
  '/evidence',
  '/en/evidence',
  '/materials',
  '/en/materials',
  '/resume-onepage',
  '/en/resume-onepage',
  '/resume-academic',
  '/en/resume-academic',
  '/resume-career',
  '/en/resume-career',
  '/blog',
  '/blog/hello-world',
  '/en/blog',
  '/en/blog/getting-started',
];

const responsiveViewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'small-android', width: 360, height: 740 },
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'large-phone', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
];

const expectedHeadings = {
  '/': '\u65b9\u7eea\u6770',
  '/en/': 'Xujie Fang',
  '/modeling': '\u6570\u5b66\u5efa\u6a21\u7ade\u8d5b\u5b9e\u8df5',
  '/en/modeling': 'Mathematical Modeling in Practice',
  '/chem-ai-lab': 'ChemAI Lab',
  '/en/chem-ai-lab': 'ChemAI Lab',
  '/evidence': '\u8bc1\u660e\u6750\u6599\u5899',
  '/en/evidence': 'Certificate Gallery',
  '/materials': '\u6750\u6599\u4e0b\u8f7d\u4e2d\u5fc3',
  '/en/materials': 'Materials Hub',
  '/resume-onepage': '\u65b9\u7eea\u6770',
  '/en/resume-onepage': 'Xujie Fang',
  '/resume-academic': '\u65b9\u7eea\u6770',
  '/en/resume-academic': 'Xujie Fang',
  '/resume-career': '\u65b9\u7eea\u6770',
  '/en/resume-career': 'Xujie Fang',
  '/blog': '\u535a\u5ba2',
  '/blog/hello-world': '\u535a\u5ba2\u5f00\u59cb',
  '/en/blog': 'Blog',
  '/en/blog/getting-started': 'Getting Started',
};

const printRoutes = [
  '/resume-onepage',
  '/en/resume-onepage',
  '/resume-academic',
  '/en/resume-academic',
  '/resume-career',
  '/en/resume-career',
];

const forbiddenPublicPatterns = [
  { label: 'mobile phone number', re: /(?:^|\D)1[3-9]\d{9}(?:\D|$)/ },
  { label: 'specific birth month', re: /(?:^|\D)2006(?:[.\-/\s]?0?4|年\s*0?4\s*月)(?:\D|$)/ },
];

const localOnlyHrefPatterns = [{ label: 'SIOC local packet route', re: /resume-sioc-summer/i }];

const requiredEvidenceFields = [
  'id',
  'file',
  'year',
  'category',
  'levelZh',
  'levelEn',
  'issuerZh',
  'issuerEn',
  'proofTypeZh',
  'proofTypeEn',
  'titleZh',
  'titleEn',
  'claimZh',
  'claimEn',
  'accessZh',
  'accessEn',
];

const requiredMaterialFields = [
  'id',
  'audience',
  'access',
  'kind',
  'status',
  'evidenceIds',
  'riskNote',
  'lastReviewed',
  'zh',
  'en',
];

const requiredMaterialLocaleFields = ['title', 'desc', 'action', 'usage', 'status'];
const validMaterialAudiences = new Set(['academic', 'career', 'review', 'portfolio', 'local']);
const validMaterialAccess = new Set(['public', 'restricted', 'local']);
const validMaterialStatuses = new Set(['ready', 'review-first', 'local-only', 'needs-evidence']);

function previewCommand() {
  return {
    cmd: `npm run preview -- --host ${host} --port ${port}`,
    args: [],
  };
}

async function waitForServer(child) {
  let lastError = '';
  for (let i = 0; i < 40; i += 1) {
    if (child.exitCode !== null) throw new Error(`Preview server exited early with code ${child.exitCode}`);
    try {
      const res = await fetch(base);
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(250);
  }
  throw new Error(`Preview server did not become ready: ${lastError}`);
}

function localUrl(href) {
  try {
    const url = new URL(href, base);
    if (url.origin !== base || url.protocol !== 'http:') return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function pdfPageCount(buffer) {
  const text = buffer.toString('latin1');
  return (text.match(/\/Type\s*\/Page\b/g) || []).length;
}

function hasForbiddenPublicText(value) {
  if (typeof value !== 'string') return false;
  return forbiddenPublicPatterns.some((pattern) => pattern.re.test(value));
}

function hasForbiddenPublicTextDeep(value) {
  if (hasForbiddenPublicText(value)) return true;
  if (Array.isArray(value)) return value.some((item) => hasForbiddenPublicTextDeep(item));
  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => hasForbiddenPublicTextDeep(item));
  }
  return false;
}

function runStaticChecks() {
  const failures = [];
  const localOnlyPublicPage = path.join(root, 'src', 'pages', 'resume-sioc-summer.astro');
  const localOnlyDistRoute = path.join(root, 'dist', 'resume-sioc-summer');
  if (fs.existsSync(localOnlyPublicPage)) {
    failures.push('Local-only SIOC source page must not live under src/pages');
  }
  if (fs.existsSync(localOnlyDistRoute)) {
    failures.push('Local-only SIOC route was generated into dist/resume-sioc-summer');
  }

  const evidencePath = path.join(root, 'src', 'data', 'evidence.json');
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const categoryIds = new Set(evidence.categories.map((category) => category.id));
  const seenIds = new Set();
  const seenFiles = new Set();

  if (!evidence.imageBase?.startsWith('/assets/evidence/public/')) {
    failures.push(`Evidence imageBase must point to public evidence assets: ${evidence.imageBase}`);
  }
  if (!Array.isArray(evidence.items) || evidence.items.length < 1) {
    failures.push('Evidence data must contain at least one item');
  }

  evidence.items.forEach((item, index) => {
    requiredEvidenceFields.forEach((field) => {
      if (!item[field]) failures.push(`Evidence item ${index + 1} is missing ${field}`);
    });
    if (seenIds.has(item.id)) failures.push(`Duplicate evidence id: ${item.id}`);
    seenIds.add(item.id);
    if (seenFiles.has(item.file)) failures.push(`Duplicate evidence file: ${item.file}`);
    seenFiles.add(item.file);
    if (!categoryIds.has(item.category)) failures.push(`Evidence item ${item.id} uses unknown category: ${item.category}`);
    if (item.file?.includes('private') || item.file?.includes('..')) {
      failures.push(`Evidence item ${item.id} points outside public evidence assets: ${item.file}`);
    }
    const imagePath = path.join(root, 'public', 'assets', 'evidence', 'public', item.file || '');
    if (!fs.existsSync(imagePath)) failures.push(`Evidence image is missing for ${item.id}: ${item.file}`);
    Object.values(item).forEach((value) => {
      if (hasForbiddenPublicText(value)) failures.push(`Evidence item ${item.id} exposes private-looking text`);
    });
  });

  const materialsPath = path.join(root, 'src', 'data', 'materials.json');
  if (!fs.existsSync(materialsPath)) {
    failures.push('Materials data must live in src/data/materials.json');
    return failures;
  }

  const materials = JSON.parse(fs.readFileSync(materialsPath, 'utf8'));
  const evidenceIds = new Set(evidence.items.map((item) => item.id));
  const materialIds = new Set();
  if (!Array.isArray(materials.items) || materials.items.length < 1) {
    failures.push('Materials data must contain at least one item');
  }

  materials.items?.forEach((item, index) => {
    requiredMaterialFields.forEach((field) => {
      if (item[field] === undefined || item[field] === null || item[field] === '') {
        failures.push(`Material item ${index + 1} is missing ${field}`);
      }
    });
    if (materialIds.has(item.id)) failures.push(`Duplicate material id: ${item.id}`);
    materialIds.add(item.id);
    if (!validMaterialAudiences.has(item.audience)) failures.push(`Material ${item.id} has invalid audience: ${item.audience}`);
    if (!validMaterialAccess.has(item.access)) failures.push(`Material ${item.id} has invalid access: ${item.access}`);
    if (!validMaterialStatuses.has(item.status)) failures.push(`Material ${item.id} has invalid status: ${item.status}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.lastReviewed || '')) {
      failures.push(`Material ${item.id} must use YYYY-MM-DD lastReviewed`);
    }
    if (!Array.isArray(item.evidenceIds)) failures.push(`Material ${item.id} evidenceIds must be an array`);
    item.evidenceIds?.forEach((evidenceId) => {
      if (!evidenceIds.has(evidenceId)) failures.push(`Material ${item.id} references unknown evidence id: ${evidenceId}`);
    });
    ['zh', 'en'].forEach((locale) => {
      requiredMaterialLocaleFields.forEach((field) => {
        if (!item[locale]?.[field]) failures.push(`Material ${item.id} is missing ${locale}.${field}`);
      });
    });
    if (item.access === 'local' && item.href) failures.push(`Local-only material ${item.id} must not define href`);
    if (item.access !== 'local' && !item.href) failures.push(`Public material ${item.id} must define href`);
    if (item.href) {
      Object.values(item.href).forEach((href) => {
        if (!href?.startsWith('/')) failures.push(`Material ${item.id} href must be site-root relative: ${href}`);
        if (localOnlyHrefPatterns.some((pattern) => pattern.re.test(href))) {
          failures.push(`Material ${item.id} links to local-only route: ${href}`);
        }
      });
    }
    if (hasForbiddenPublicTextDeep(item)) failures.push(`Material ${item.id} exposes private-looking text`);
  });

  return failures;
}

async function runBrowserChecks() {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const routeResults = [];

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(12000);
  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('https://cloud.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('https://gateway.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));

  page.on('console', (msg) => {
    if (msg.type() === 'error') failures.push(`Console error on ${page.url()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`Page error on ${page.url()}: ${error.message}`));

  for (const route of routes) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const expectedH1 = expectedHeadings[route];
    if (expectedH1) {
      await page
        .waitForFunction(
          ([selector, expected]) => document.querySelector(selector)?.textContent?.trim() === expected,
          ['h1', expectedH1],
          { timeout: 3000 },
        )
        .catch(() => failures.push(`${route} h1 did not settle to expected heading: ${expectedH1}`));
    }

    const status = response?.status() ?? 0;
    const h1 = await page
      .locator('h1')
      .first()
      .textContent()
      .then((text) => text.trim())
      .catch(() => '');
    const bodyText = await page
      .locator('body')
      .innerText()
      .catch(() => '');
    const textLength = bodyText.length;
    const cssLoaded = await page.evaluate(async () => {
      const link = document.querySelector('link[href="/styles/site.css"]');
      if (!link) return false;
      const response = await fetch('/styles/site.css', { cache: 'no-store' });
      if (!response.ok) return false;
      const css = await response.text();
      return css.includes('Generated by scripts/generate-site-css.mjs');
    });
    const brokenImages = await page.evaluate(() =>
      [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src),
    );

    routeResults.push({ route, status, h1, textLength, cssLoaded, brokenImages: brokenImages.length });
    if (status >= 400) failures.push(`${route} returned HTTP ${status}`);
    if (!h1) failures.push(`${route} has no visible h1`);
    if (expectedH1 && h1 !== expectedH1) failures.push(`${route} rendered unexpected h1: ${h1}`);
    if (textLength < 100) failures.push(`${route} rendered too little text (${textLength} chars)`);
    if (!cssLoaded) failures.push(`${route} did not load site CSS`);
    brokenImages.forEach((src) => failures.push(`${route} has broken image: ${src}`));

    const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((a) => a.href));
    for (const pattern of forbiddenPublicPatterns) {
      if (pattern.re.test(bodyText)) failures.push(`${route} exposes ${pattern.label}`);
    }
    for (const href of hrefs) {
      for (const pattern of localOnlyHrefPatterns) {
        if (pattern.re.test(href)) failures.push(`${route} links to local-only ${pattern.label}: ${href}`);
      }
    }
    for (const href of hrefs) {
      const url = localUrl(href);
      if (!url) continue;
      const linkResponse = await page.request.get(url, { failOnStatusCode: false, timeout: 8000 });
      if (linkResponse.status() >= 400) failures.push(`Broken link from ${route}: ${url} -> ${linkResponse.status()}`);
    }
  }

  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.locator('.lang-switch a[data-lang="en"]').click();
  await page.waitForURL(`${base}/en/`);
  await page.waitForTimeout(1200);
  const enH1 = await page
    .locator('h1')
    .first()
    .textContent()
    .then((text) => text.trim());
  if (enH1 !== expectedHeadings['/en/']) failures.push(`Language switch to English landed on unexpected h1: ${enH1}`);

  await page.locator('.lang-switch a[data-lang="zh"]').click();
  await page.waitForURL(`${base}/`);
  await page.waitForTimeout(900);
  const zhH1 = await page
    .locator('h1')
    .first()
    .textContent()
    .then((text) => text.trim());
  if (zhH1 !== expectedHeadings['/']) failures.push(`Language switch to Chinese landed on unexpected h1: ${zhH1}`);

  await page.goto(`${base}/evidence`, { waitUntil: 'load' });
  await page.locator('a.cert-card').first().click();
  await page
    .waitForSelector('#lightbox.active', { timeout: 5000 })
    .catch(() => failures.push('Evidence lightbox did not open'));
  await page
    .waitForFunction(
      () => {
        const img = document.querySelector('#lb-img');
        return !!img && img.complete && img.naturalWidth > 1;
      },
      { timeout: 8000 },
    )
    .catch(() => failures.push('Evidence lightbox image did not load'));
  await page
    .waitForFunction(() => getComputedStyle(document.querySelector('#lightbox')).opacity === '1', { timeout: 2000 })
    .catch(() => failures.push('Evidence lightbox did not become visually visible'));
  const lightboxState = await page.evaluate(() => ({
    active: !!document.querySelector('#lightbox.active'),
    visible: getComputedStyle(document.querySelector('#lightbox')).opacity === '1',
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    imageReady: (() => {
      const img = document.querySelector('#lb-img');
      return !!img && img.complete && img.naturalWidth > 1;
    })(),
  }));
  if (!lightboxState.active) failures.push('Evidence lightbox is not active after clicking a certificate');
  if (!lightboxState.visible) failures.push('Evidence lightbox is active but visually hidden');
  if (lightboxState.overflow) failures.push('Evidence lightbox causes horizontal overflow');
  await page.locator('#lb-close').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/resume-onepage`, { waitUntil: 'load' });
  const onePageMobile = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    const h1 = document.querySelector('h1');
    const sheetBox = sheet?.getBoundingClientRect();
    const h1Box = h1?.getBoundingClientRect();
    return {
      sheetLeft: sheetBox ? Math.round(sheetBox.left) : -1,
      h1Left: h1Box ? Math.round(h1Box.left) : -1,
      sheetPaddingLeft: sheet ? parseFloat(getComputedStyle(sheet).paddingLeft) : 0,
      bodyPaddingLeft: parseFloat(getComputedStyle(document.body).paddingLeft),
    };
  });
  if (onePageMobile.sheetLeft < 8 || onePageMobile.h1Left < 16 || onePageMobile.sheetPaddingLeft < 12) {
    failures.push(`One-page mobile layout is too close to the viewport edge: ${JSON.stringify(onePageMobile)}`);
  }

  const overflowChecks = [];
  const tapTargetChecks = [];
  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of routes) {
      await page.goto(`${base}${route}`, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      const overflow = metrics.scrollWidth > metrics.innerWidth + 1;
      overflowChecks.push({ viewport: viewport.name, route, overflow });
      if (overflow)
        failures.push(`${route} overflows on ${viewport.name}: ${metrics.scrollWidth}px > ${metrics.innerWidth}px`);

      const smallTargets =
        viewport.width <= 980
          ? await page.evaluate(() =>
              [...document.querySelectorAll('a[href], button, [role="button"]')]
                .map((el) => {
                  const box = el.getBoundingClientRect();
                  const style = getComputedStyle(el);
                  if (box.width === 0 || box.height === 0 || style.display === 'none' || style.visibility === 'hidden')
                    return null;
                  if (box.width < 36 || box.height < 36) {
                    return {
                      text: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('href') || el.tagName)
                        .trim()
                        .replace(/\s+/g, ' ')
                        .slice(0, 60),
                      width: Math.round(box.width),
                      height: Math.round(box.height),
                    };
                  }
                  return null;
                })
                .filter(Boolean),
            )
          : [];
      tapTargetChecks.push({ viewport: viewport.name, route, smallTargets: smallTargets.length });
      smallTargets.forEach((target) =>
        failures.push(
          `${route} has small tap target on ${viewport.name}: ${target.text} (${target.width}x${target.height})`,
        ),
      );
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/en/`, { waitUntil: 'load' });
  await page.locator('#menuToggle').click();
  const menuDisplay = await page.locator('#navLinks').evaluate((el) => getComputedStyle(el).display);
  if (menuDisplay !== 'flex') failures.push(`Mobile menu did not open; display=${menuDisplay}`);

  const printResults = [];
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of printRoutes) {
    await page.goto(`${base}${route}`, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    const pages = pdfPageCount(pdf);
    printResults.push({ route, pages });
    if (pages !== 1) failures.push(`${route} prints to ${pages} pages instead of 1`);
  }

  await browser.close();
  return { failures, routeResults, overflowChecks, tapTargetChecks, printResults };
}

const { cmd, args } = previewCommand();
const child = spawn(cmd, args, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  windowsHide: true,
});
const killPreview = () => {
  if (child.exitCode === null) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
    } else {
      child.kill('SIGTERM');
    }
  }
};

try {
  const staticFailures = runStaticChecks();
  await waitForServer(child);
  const result = await runBrowserChecks();
  result.failures.unshift(...staticFailures);
  if (result.failures.length) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
} finally {
  killPreview();
}
