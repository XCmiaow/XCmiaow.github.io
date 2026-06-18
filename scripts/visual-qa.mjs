import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.VISUAL_QA_PORT || 4339);
const base = `http://${host}:${port}`;
const screenshotDir = path.join(root, 'local-only', 'qa-screenshots');
const failures = [];
const checks = [];

fs.mkdirSync(screenshotDir, { recursive: true });

function startPreview() {
  return spawn(`npm run preview -- --host ${host} --port ${port}`, [], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
    windowsHide: true,
  });
}

function stopPreview(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

async function waitForPreview(child) {
  let lastError = '';
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null) throw new Error(`Preview exited early with code ${child.exitCode}`);
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

async function waitForSettledPage(page) {
  await page.waitForLoadState('load');
  await page.locator('#skeleton').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(150);
}

function fail(message) {
  failures.push(message);
}

async function checkDarkRoute(page, route, options = {}) {
  await page.setViewportSize({ width: options.width || 1440, height: options.height || 1000 });
  await page.goto(`${base}${route}`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await waitForSettledPage(page);
  const check = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const h1 = document.querySelector('h1');
    const cards = [...document.querySelectorAll('.card, .material-card, .blog-card, .legend-item')];
    const lightCards = cards
      .map((card) => getComputedStyle(card).backgroundColor)
      .filter((color) => color === 'rgb(255, 255, 255)');
    const bodyText = document.body.innerText;
    return {
      route: location.pathname,
      theme: document.documentElement.getAttribute('data-theme'),
      h1: h1?.textContent?.trim() || '',
      paper: rootStyle.getPropertyValue('--paper').trim(),
      cardCount: cards.length,
      lightCardCount: lightCards.length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      skeletonVisible: !!document.querySelector('#skeleton'),
      forbiddenText: /\b(?:lorem ipsum|todo|debug|placeholder|undefined|null|NaN)\b/i.test(bodyText),
    };
  });
  if (check.theme !== 'dark') fail(`${route} did not keep dark theme`);
  if (!check.h1) fail(`${route} rendered without H1`);
  if (check.paper === '#ffffff') fail(`${route} kept a light paper token in dark mode`);
  if (check.lightCardCount) fail(`${route} has ${check.lightCardCount} light cards in dark mode`);
  if (check.overflow) fail(`${route} has horizontal overflow`);
  if (check.skeletonVisible) fail(`${route} skeleton remained visible`);
  if (check.forbiddenText) fail(`${route} includes forbidden placeholder/debug text`);
  checks.push(check);
}

const child = startPreview();

try {
  await waitForPreview(child);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => localStorage.setItem('resume-theme', 'dark'));
  await page.route('https://cloud.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('https://gateway.umami.is/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  page.on('console', (msg) => {
    if (msg.type() === 'error') fail(`console error on ${page.url()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => fail(`page error on ${page.url()}: ${error.message}`));

  for (const route of ['/ai-km', '/en/ai-km']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}${route}`, { waitUntil: 'load' });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await waitForSettledPage(page);
    const check = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const card = document.querySelector('.claim-card');
      const h1 = document.querySelector('h1');
      const linkHeights = [...document.querySelectorAll('.claim-links a')].map((a) =>
        Math.round(a.getBoundingClientRect().height),
      );
      const bodyText = document.body.innerText;
      return {
        route: location.pathname,
        theme: document.documentElement.getAttribute('data-theme'),
        h1: h1?.textContent?.trim() || '',
        h1Color: h1 ? getComputedStyle(h1).color : '',
        paper: rootStyle.getPropertyValue('--paper').trim(),
        cardBg: card ? getComputedStyle(card).backgroundColor : '',
        minLinkHeight: Math.min(...linkHeights),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        skeletonVisible: !!document.querySelector('#skeleton'),
        forbiddenText: /\b(?:lorem ipsum|todo|debug|placeholder|undefined|null|NaN)\b/i.test(bodyText),
      };
    });
    if (check.theme !== 'dark') fail(`${route} did not keep dark theme`);
    if (!check.h1) fail(`${route} rendered without H1`);
    if (check.paper === '#ffffff' || check.cardBg === 'rgb(255, 255, 255)') fail(`${route} has light card background`);
    if (check.minLinkHeight < 36) fail(`${route} claim links are below 36px`);
    if (check.overflow) fail(`${route} has horizontal overflow`);
    if (check.skeletonVisible) fail(`${route} skeleton remained visible`);
    if (check.forbiddenText) fail(`${route} includes forbidden placeholder/debug text`);
    checks.push(check);
  }

  for (const route of [
    '/materials',
    '/en/materials',
    '/chem-ai-lab',
    '/en/chem-ai-lab',
    '/blog',
    '/en/blog',
  ]) {
    await checkDarkRoute(page, route);
  }

  await page.screenshot({ path: path.join(screenshotDir, 'ai-km-dark-desktop.png'), fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/en/ai-km`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await waitForSettledPage(page);
  await page.locator('#menuToggle').click();
  const mobileMenuOpen = await page.locator('#navLinks').evaluate((el) => getComputedStyle(el).display === 'flex');
  if (!mobileMenuOpen) fail('/en/ai-km mobile menu did not open in dark mode');
  checks.push({ route: '/en/ai-km', viewport: '390x844', mobileMenuOpen });
  await page.screenshot({ path: path.join(screenshotDir, 'en-ai-km-dark-mobile-menu.png'), fullPage: false });

  await page.goto(`${base}/evidence`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await waitForSettledPage(page);
  await page.locator('a.cert-card').first().click();
  await page.waitForSelector('#lightbox.active');
  await page.waitForFunction(
    () => {
      const lb = document.querySelector('#lightbox');
      const img = document.querySelector('#lb-img');
      return !!lb && !!img && img.complete && img.naturalWidth > 1 && getComputedStyle(lb).opacity === '1';
    },
    { timeout: 10000 },
  );
  checks.push({ route: '/evidence', lightboxReady: true });
  await page.screenshot({ path: path.join(screenshotDir, 'evidence-dark-lightbox.png'), fullPage: false });

  await browser.close();
} finally {
  stopPreview(child);
}

const result = { failures, checks, screenshotDir };
if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
