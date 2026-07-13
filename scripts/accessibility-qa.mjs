import { chromium } from 'playwright';
import { accessibilityRoutes, accessibilityViewports, previewBase, withPreview } from './lib/contracts.mjs';

const failures = [];
const checks = [];
const targetFailures = new Map();

function fail(message) {
  failures.push(message);
}

async function auditPage(page, route, viewport) {
  const response = await page.goto(`${previewBase}${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(180);
  if (!response?.ok()) {
    fail(`${route} at ${viewport.name}: returned HTTP ${response?.status() ?? 0}`);
    return;
  }

  const result = await page.evaluate(() => {
    const visible = (element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        box.width > 0 &&
        box.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    };
    const label = (element) =>
      (
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent ||
        element.getAttribute('href') ||
        element.tagName
      )
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 72);

    const targets = [
      ...document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [role="button"]',
      ),
    ].filter(visible);
    const smallTargets = targets
      .map((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const isInlineTextLink =
          element instanceof HTMLAnchorElement &&
          style.display === 'inline' &&
          Boolean(element.closest('p, li, dd, dt, figcaption'));
        const signature = [
          element.tagName.toLowerCase(),
          element.id ? `#${element.id}` : '',
          ...[...element.classList].map((name) => `.${name}`),
        ].join('');
        return !isInlineTextLink && (box.width < 24 || box.height < 24)
          ? { label: label(element), signature, width: Math.round(box.width), height: Math.round(box.height) }
          : null;
      })
      .filter(Boolean);
    const unnamedTargets = targets
      .filter((element) => !label(element))
      .map((element) => element.outerHTML.slice(0, 120));
    const imagesWithoutAlt = [...document.querySelectorAll('img:not([alt])')].map((image) => image.src);
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const h1Count = [...document.querySelectorAll('h1')].filter(visible).length;
    const mainCount = document.querySelectorAll('main').length;
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;

    return { smallTargets, unnamedTargets, imagesWithoutAlt, duplicateIds, h1Count, mainCount, overflow };
  });

  result.smallTargets.forEach((target) => {
    const key = `${route}|${target.signature}|${target.label}`;
    const details = targetFailures.get(key) || [];
    details.push(`${viewport.name} ${target.width}x${target.height}`);
    targetFailures.set(key, details);
  });
  result.unnamedTargets.forEach((target) =>
    fail(`${route} at ${viewport.name}: interactive target has no name (${target})`),
  );
  result.imagesWithoutAlt.forEach((source) => fail(`${route} at ${viewport.name}: image lacks alt (${source})`));
  result.duplicateIds.forEach((id) => fail(`${route} at ${viewport.name}: duplicate id "${id}"`));
  if (result.h1Count !== 1) fail(`${route} at ${viewport.name}: expected one visible h1, found ${result.h1Count}`);
  if (result.mainCount !== 1)
    fail(`${route} at ${viewport.name}: expected one main landmark, found ${result.mainCount}`);
  if (result.overflow) fail(`${route} at ${viewport.name}: page has horizontal overflow`);
  checks.push({ route, viewport: viewport.name, targets: result.smallTargets.length, overflow: result.overflow });
}

async function auditReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  for (const route of accessibilityRoutes) {
    await page.goto(`${previewBase}${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(1100);
    const result = await page.evaluate(() => ({
      preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
      runningAnimations: document
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'running')
        .map((animation) => animation.effect?.target?.className || animation.effect?.target?.tagName || 'unknown'),
    }));
    if (!result.preference) fail(`${route}: reduced-motion browser preference was not applied`);
    if (result.runningAnimations.length) {
      fail(`${route}: animations still run with reduced motion (${result.runningAnimations.join(', ')})`);
    }
  }
  await context.close();
}

async function auditEvidenceDialog(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(`${previewBase}/evidence`, { waitUntil: 'load' });
  const firstCard = page.locator('a.cert-card').first();
  await firstCard.focus();
  await firstCard.click();
  const state = await page.evaluate(() => {
    const dialog = document.getElementById('lightbox');
    const image = document.getElementById('lb-img');
    return {
      open: dialog instanceof HTMLDialogElement && dialog.open,
      focusInside: dialog instanceof HTMLDialogElement && dialog.contains(document.activeElement),
      imageAlt: image instanceof HTMLImageElement ? image.alt : '',
    };
  });
  if (!state.open) fail('/evidence: certificate dialog did not open');
  if (!state.focusInside) fail('/evidence: focus did not move into the certificate dialog');
  if (!state.imageAlt) fail('/evidence: enlarged certificate image has no alternative text');
  await page.keyboard.press('Escape');
  const focusReturned = await firstCard.evaluate((element) => document.activeElement === element);
  if (!focusReturned) fail('/evidence: focus did not return to the certificate card after close');
  await context.close();
}

await withPreview(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(12000);
  try {
    for (const viewport of accessibilityViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of accessibilityRoutes) await auditPage(page, route, viewport);
    }
    await auditReducedMotion(browser);
    await auditEvidenceDialog(browser);
  } finally {
    await context.close();
    await browser.close();
  }
});

for (const [key, details] of targetFailures) {
  const [route, signature, label] = key.split('|');
  fail(`${route}: target ${signature} "${label}" is below 24x24 (${details.join(', ')})`);
}

if (failures.length) {
  console.error(JSON.stringify({ failures, checks: checks.length }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ accessibility: 'ok', checks: checks.length, reducedMotion: 'ok' }));
