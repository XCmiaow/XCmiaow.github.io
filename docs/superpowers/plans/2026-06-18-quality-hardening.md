# Quality Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the resume site catch missing stable CSS, dark-mode visual regressions, stray placeholder/debug text, and core interaction failures before release.

**Architecture:** Keep the site static and preserve the existing Astro + generated `public/styles/site.css` pipeline. Add small Node/Playwright QA helpers under `scripts/`, make `qa-check.mjs` call them or share their logic, and avoid broad visual redesign work.

**Tech Stack:** Astro 6, Node ESM scripts, Playwright Chromium, static JSON data, existing CSS tokens, GitHub Pages static output.

---

## File Structure

- Modify `scripts/generate-site-css.mjs`: centralize the stable style source list, export it for audits, and make imports side-effect-free.
- Create `scripts/style-source-audit.mjs`: fail when a rendered public route uses Astro scoped styles that are not included in `public/styles/site.css`.
- Create `scripts/visual-qa.mjs`: run focused Playwright checks for dark mode, mobile nav, lightbox, skeleton removal, and forbidden visible text.
- Modify `scripts/qa-check.mjs`: keep route lists in sync with the new visual QA expectations and call the style audit before browser checks.
- Modify `package.json`: add explicit scripts for `qa:style`, `qa:visual`, and update `check` to run them.
- Modify `src/pages/ai-km.astro` and `src/pages/en/ai-km.astro` only if the new tests reveal dark-mode or tap-target regressions.
- Regenerate `public/styles/site.css` through `npm run build`; do not hand-edit it.

## Current State Notes

- `scripts/generate-site-css.mjs` uses a manual whitelist. It now includes `ai-km`, but other styled pages such as blog, write, and ChemAI Lab can still be omitted silently.
- `scripts/generate-site-css.mjs` currently writes `public/styles/site.css` at module top level. Make this import-safe before any audit script imports `styleSources`.
- `scripts/qa-check.mjs` already covers route status, H1, CSS loading, image loading, internal links, language switch, layout toggle, evidence lightbox, mobile overflow, tap target size, and one-page PDF page count.
- Browser plugin is unavailable in this environment, so rendered validation uses Playwright.
- `scripts/qa-check.mjs` is already modified in the worktree. Treat that file as user-owned/current state; read the diff before editing.

## Development Phases

1. **QA foundation first:** complete Tasks 1-2 before touching visual code, so missing style sources fail deterministically.
2. **Rendered behavior second:** complete Tasks 3-4 after `npm run build` is stable, so browser checks exercise the committed static output instead of source assumptions.
3. **Minimal visual fixes third:** run Task 5 only against concrete `qa:visual` failures. Do not redesign pages during this phase.
4. **Content hygiene fourth:** complete Task 6 after visual checks are green, so false positives come from rendered public text rather than broken pages.
5. **Release closure last:** Task 7 is the only point where all changed files should be staged together.

## Exit Criteria

- `npm run lint`, `npm run format:check`, and `npm run check` all exit `0`.
- `/ai-km` and `/en/ai-km` render correctly in dark mode with no light cards, no horizontal overflow, no stuck skeleton, and tap targets at least 36px high.
- `/en/ai-km` mobile navigation opens at 390px width in dark mode.
- `/evidence` dark-mode lightbox opens, becomes visible, and loads a non-empty certificate image.
- All public routes load `/styles/site.css`, expose no placeholder/debug text, and do not link to local-only routes.
- Print resume routes still render to exactly one A4 page.

## Explicit Non-Goals

- Do not add new portfolio sections, blog posts, or resume content in this phase.
- Do not convert the full CSS architecture to a new framework.
- Do not broaden the dark-mode palette beyond existing tokens unless a QA failure proves a contrast or visibility issue.
- Do not hand-edit `public/styles/site.css`.

## Task 1: Export Side-Effect-Free Stable Style Sources

**Files:**
- Modify: `scripts/generate-site-css.mjs`
- Test: `node --check scripts/generate-site-css.mjs`

- [ ] **Step 1: Replace the generator with an import-safe module**

Replace `scripts/generate-site-css.mjs` with:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const styleSources = [
  'src/styles/global.css',
  'src/layouts/BaseLayout.astro',
  'src/layouts/PrintLayout.astro',
  'src/components/CompetitionTimeline.astro',
  'src/components/Lightbox.astro',
  'src/components/Molecule3D.astro',
  'src/components/ParticlesBackground.astro',
  'src/components/CursorGlow.astro',
  'src/pages/index.astro',
  'src/pages/en/index.astro',
  'src/pages/modeling.astro',
  'src/pages/en/modeling.astro',
  'src/pages/ai-km.astro',
  'src/pages/en/ai-km.astro',
  'src/pages/evidence.astro',
  'src/pages/en/evidence.astro',
  'src/pages/materials.astro',
  'src/pages/en/materials.astro',
  'src/pages/resume-onepage.astro',
  'src/pages/en/resume-onepage.astro',
  'src/pages/resume-academic.astro',
  'src/pages/en/resume-academic.astro',
  'src/pages/resume-career.astro',
  'src/pages/en/resume-career.astro',
  'src/styles/mobile.css',
];

export function collectSiteCss(root = process.cwd()) {
  let css = [
    '/* Generated by scripts/generate-site-css.mjs. */',
    '/* Keep this file committed so GitHub Pages always has a stable stylesheet. */',
    '',
  ].join('\n');

  for (const source of styleSources) {
    const filename = path.join(root, source);
    if (!fs.existsSync(filename)) continue;

    const content = fs.readFileSync(filename, 'utf8');
    if (source.endsWith('.css')) {
      css += `\n/* ${source} */\n${content}\n`;
      continue;
    }

    const blocks = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    blocks.forEach((block, index) => {
      css += `\n/* ${source} style ${index + 1} */\n${block[1].trim()}\n`;
    });
  }

  return css;
}

export function writeSiteCss(root = process.cwd()) {
  const outDir = path.join(root, 'public', 'styles');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'site.css'), collectSiteCss(root), 'utf8');
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) writeSiteCss();
```

- [ ] **Step 2: Run syntax check**

Run: `node --check scripts/generate-site-css.mjs`

Expected: exit code `0`.

- [ ] **Step 3: Prove importing the module does not write files**

Run:

```bash
node -e "import('./scripts/generate-site-css.mjs').then((m) => { if (!Array.isArray(m.styleSources)) process.exit(1); })"
```

Expected: exit code `0`, no generated CSS output printed.

- [ ] **Step 4: Run build to prove generated CSS still works**

Run: `npm run build`

Expected: exit code `0`, and `public/styles/site.css` begins with `Generated by scripts/generate-site-css.mjs`.

## Task 2: Add Style Source Audit

**Files:**
- Create: `scripts/style-source-audit.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the audit script**

Create `scripts/style-source-audit.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { styleSources } from './generate-site-css.mjs';

const root = process.cwd();
const publicRoutes = [
  'src/pages/index.astro',
  'src/pages/en/index.astro',
  'src/pages/modeling.astro',
  'src/pages/en/modeling.astro',
  'src/pages/ai-km.astro',
  'src/pages/en/ai-km.astro',
  'src/pages/chem-ai-lab.astro',
  'src/pages/en/chem-ai-lab.astro',
  'src/pages/evidence.astro',
  'src/pages/en/evidence.astro',
  'src/pages/materials.astro',
  'src/pages/en/materials.astro',
  'src/pages/resume-onepage.astro',
  'src/pages/en/resume-onepage.astro',
  'src/pages/resume-academic.astro',
  'src/pages/en/resume-academic.astro',
  'src/pages/resume-career.astro',
  'src/pages/en/resume-career.astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/[slug].astro',
  'src/pages/en/blog/index.astro',
  'src/pages/en/blog/[slug].astro',
  'src/pages/write.astro',
];
const renderedComponents = [
  'src/layouts/BaseLayout.astro',
  'src/layouts/PrintLayout.astro',
  'src/components/CompetitionTimeline.astro',
  'src/components/Gallery3D.astro',
  'src/components/Lightbox.astro',
  'src/components/Molecule3D.astro',
  'src/components/ParticlesBackground.astro',
  'src/components/CursorGlow.astro',
];
const allowedExternalStyles = new Set([
  'src/pages/chem-ai-lab.astro',
  'src/pages/en/chem-ai-lab.astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/[slug].astro',
  'src/pages/en/blog/index.astro',
  'src/pages/en/blog/[slug].astro',
  'src/pages/write.astro',
  'src/components/Gallery3D.astro',
]);

function hasStyleBlock(source) {
  const file = path.join(root, source);
  return fs.existsSync(file) && /<style\b/i.test(fs.readFileSync(file, 'utf8'));
}

function assertExisting(source, failures) {
  if (!fs.existsSync(path.join(root, source))) failures.push(`Configured style source does not exist: ${source}`);
}

const failures = [];
const sourceSet = new Set(styleSources);
styleSources.forEach((source) => assertExisting(source, failures));

for (const source of [...publicRoutes, ...renderedComponents]) {
  if (!hasStyleBlock(source)) continue;
  if (sourceSet.has(source)) continue;
  if (allowedExternalStyles.has(source)) continue;
  failures.push(`Styled public surface is missing from stable CSS sources: ${source}`);
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ failures: [], checked: styleSources.length }, null, 2));
```

- [ ] **Step 2: Add package script**

In `package.json`, add:

```json
"qa:style": "node scripts/style-source-audit.mjs"
```

Keep the comma placement valid for JSON.

- [ ] **Step 3: Run the audit**

Run: `npm run qa:style`

Expected: exit code `0`, JSON output with `"failures": []`.

## Task 3: Add Focused Dark-Mode Visual QA

**Files:**
- Create: `scripts/visual-qa.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create visual QA script**

Create `scripts/visual-qa.mjs`:

```js
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
        forbiddenText: /lorem ipsum|todo|debug|placeholder|undefined|null|NaN/i.test(bodyText),
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
```

- [ ] **Step 2: Add package script**

In `package.json`, add:

```json
"qa:visual": "node scripts/visual-qa.mjs"
```

- [ ] **Step 3: Run visual QA after a build**

Run:

```bash
npm run build
npm run qa:visual
```

Expected: both exit code `0`, screenshots written under `local-only/qa-screenshots`.

## Task 4: Wire Quality Gates Into `check`

**Files:**
- Modify: `package.json`
- Modify: `scripts/qa-check.mjs`

- [ ] **Step 1: Update `check` script**

Change `package.json` scripts so the relevant part is:

```json
"qa": "node scripts/qa-check.mjs",
"qa:style": "node scripts/style-source-audit.mjs",
"qa:visual": "node scripts/visual-qa.mjs",
"check": "npm run build && npm run qa:style && npm run qa && npm run qa:visual",
```

- [ ] **Step 2: Add a route contract comment to `qa-check.mjs`**

Near the `routes` constant in `scripts/qa-check.mjs`, add:

```js
// Public route list: keep this in sync with service worker APP_SHELL and visual QA critical routes.
```

- [ ] **Step 3: Run complete check**

Run: `npm run check`

Expected: exit code `0`.

## Task 5: Normalize Dark-Mode Public Surfaces

**Files:**
- Modify only files that fail `npm run qa:visual` or have public route dark-mode mismatches:
  - `src/styles/global.css`
  - `src/pages/ai-km.astro`
  - `src/pages/en/ai-km.astro`
  - `src/pages/evidence.astro`
  - `src/pages/en/evidence.astro`

- [ ] **Step 1: Inspect failed visual QA output**

Run: `npm run qa:visual`

Expected if no regressions: exit code `0`. If it fails, use the JSON `failures` list as the only source for edits.

- [ ] **Step 2: Apply minimal dark-mode CSS fixes**

For white chips or cards in dark mode, use the existing token pattern:

```css
:root[data-theme='dark'] .class-name,
:root.dark .class-name {
  background: rgba(255, 255, 255, 0.05);
}
```

For yellow case-backed text that is too dark, use:

```css
:root[data-theme='dark'] .class-name,
:root.dark .class-name {
  color: var(--accent);
}
```

- [ ] **Step 3: Verify the exact failing path**

Run: `npm run qa:visual`

Expected: exit code `0`.

## Task 6: Content Hygiene Gate

**Files:**
- Modify: `scripts/qa-check.mjs`

- [ ] **Step 1: Add public forbidden text patterns**

Extend the existing rendered body-text check in `scripts/qa-check.mjs` by adding this array near `forbiddenPublicPatterns`:

```js
const forbiddenRenderedPatterns = [
  { label: 'debug placeholder', re: /\b(?:todo|debug|placeholder|lorem ipsum)\b/i },
  { label: 'undefined/null text', re: /\b(?:undefined|null|NaN)\b/ },
];
```

- [ ] **Step 2: Check rendered route body text**

Inside the route loop in `runBrowserChecks`, after `bodyText` is assigned, add:

```js
for (const pattern of forbiddenRenderedPatterns) {
  if (pattern.re.test(bodyText)) failures.push(`${route} exposes ${pattern.label}`);
}
```

- [ ] **Step 3: Verify no false positives**

Run: `npm run qa`

Expected: exit code `0`. If it fails on intended public text, narrow the regex instead of deleting the check.

## Task 7: Final Verification and Commit

**Files:**
- All files changed by Tasks 1-6.

- [ ] **Step 1: Run all verification commands**

Run:

```bash
npm run lint
npm run format:check
npm run check
```

Expected: all exit code `0`.

- [ ] **Step 2: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected changed files:

```text
package.json
scripts/generate-site-css.mjs
scripts/style-source-audit.mjs
scripts/visual-qa.mjs
scripts/qa-check.mjs
public/styles/site.css
```

Plus any minimal CSS files touched by Task 5 if visual QA found an issue.

- [ ] **Step 3: Commit**

Run:

```bash
git add package.json scripts/generate-site-css.mjs scripts/style-source-audit.mjs scripts/visual-qa.mjs scripts/qa-check.mjs public/styles/site.css
git commit -m "test: harden visual and style qa"
```

Expected: commit succeeds. If Task 5 changed page or CSS files, include those exact files in `git add`.

## Self-Review

- Spec coverage: The plan covers style-source regressions, dark-mode visual regressions, mobile menu interaction, evidence lightbox interaction, skeleton timing, tap-target height, and placeholder/debug text.
- Placeholder scan: No `TBD`, `TODO`, or vague "handle edge cases" steps remain.
- Type consistency: Script names are `qa:style`, `qa:visual`, `style-source-audit.mjs`, and `visual-qa.mjs` consistently across tasks.
