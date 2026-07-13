# Main Site Cohesive Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the brand homepage into a coordinated editorial layout, keep the black hole fully inside every viewport, replace unreliable font declarations, and remove repeated capability copy from the resume presentation layer.

**Architecture:** Keep Astro and the existing content/data sources. Constrain the gravity field inside `EmberHero`, remove the redundant homepage compass, split the method timeline from the manifesto, and centralize typography in shared CSS variables. Resume data remains unchanged; only `ProfilePage` and `ResumePage` render less repetition.

**Tech Stack:** Astro 6, TypeScript, component-scoped CSS, shared CSS custom properties, Node QA scripts, Playwright.

---

## File map

- Create `src/components/silicon-embers/MethodStrip.astro`: render the four-step method independently after latest writing.
- Modify `src/components/SiliconAshesHome.astro`: own the new section order and stop rendering `SiteCompass`.
- Modify `src/components/silicon-embers/EmberHero.astro`: simplify hero metadata, actions, scale, and content width.
- Modify `src/components/silicon-embers/EmberField.astro`: keep every visual layer inside the hero and recenter the black hole.
- Modify `src/components/silicon-embers/BrandManifesto.astro`: render only the thesis and three principles.
- Modify `src/components/silicon-embers/WritingPreview.astro`: use the compact shared type scale and list rhythm.
- Modify `src/components/silicon-embers/SignalLinksSection.astro`: tighten the resource directory and remove decorative overflow.
- Delete `src/components/silicon-embers/SiteCompass.astro`: remove the redundant homepage-only entry component.
- Modify `src/data/siliconEmbersHome.ts`: keep two hero actions and preserve localized method data.
- Modify `src/styles/silicon-embers.css`: define real system font stacks, type tokens, container rules, and compact spacing.
- Modify the brand components that still declare `Source Han Serif SC`: replace local font lists with shared variables.
- Modify `src/components/resume/ProfilePage.astro`: retain all facts while removing repeated summaries, capability paragraphs, tags, and duplicate contact.
- Modify `src/components/resume/ResumePage.astro`: remove repeated project capabilities and tag strings from print variants.
- Modify `src/layouts/BaseLayout.astro`: pass the existing avatar as favicon.
- Modify `scripts/silicon-embers-ui-audit.mjs`: protect the new source contracts.
- Modify `scripts/visual-qa.mjs`: check black-hole bounds at five viewport widths.

### Task 1: Constrain and recenter the gravity field

**Files:**

- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `scripts/visual-qa.mjs`
- Modify: `src/components/silicon-embers/EmberField.astro`
- Modify: `src/components/silicon-embers/EmberHero.astro`

- [ ] **Step 1: Add failing source contracts for bounded geometry**

Replace the old hero precision-marker checks in `scripts/silicon-embers-ui-audit.mjs` with contracts that reject the current negative expansion and require the simplified status line:

```js
const heroSource = read('src/components/silicon-embers/EmberHero.astro');
const emberFieldSource = read('src/components/silicon-embers/EmberField.astro');

if (!heroSource.includes('hero-status')) {
  failures.push('EmberHero must use one compact hero-status line');
}
if (heroSource.includes('hero-record') || heroSource.includes('record-state')) {
  failures.push('EmberHero must remove the multi-column observation record');
}
if (!/font-size:\s*clamp\([^;]+5\.2rem\)/.test(heroSource)) {
  failures.push('Hero display text must cap at 5.2rem');
}
for (const forbidden of [/max\(-6vw/, /inset:\s*0\s+-20vw/, /inset:\s*0\s+-49vw/]) {
  if (forbidden.test(emberFieldSource)) failures.push(`EmberField contains out-of-bounds geometry: ${forbidden}`);
}
if (!/overflow:\s*clip/.test(emberFieldSource)) {
  failures.push('EmberField must clip visual layers to the hero bounds');
}
if (!/--hole-x:\s*6[2-6]%/.test(emberFieldSource)) {
  failures.push('EmberField must keep the gravity center near 62–66%');
}
```

- [ ] **Step 2: Add a failing five-viewport browser check**

Add this helper to `scripts/visual-qa.mjs` and call it after the existing route checks:

```js
async function checkBrandHomeBounds(page) {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await waitForSettledPage(page);
    const geometry = await page.evaluate(() => {
      const hero = document.querySelector('.ember-hero')?.getBoundingClientRect();
      const stage = document.querySelector('.ember-stage')?.getBoundingClientRect();
      const scene = document.querySelector('.black-hole-scene')?.getBoundingClientRect();
      return {
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hero: hero && { left: hero.left, right: hero.right },
        stage: stage && { left: stage.left, right: stage.right },
        scene: scene && { left: scene.left, right: scene.right },
      };
    });
    if (!geometry.hero || !geometry.stage || !geometry.scene) fail(`brand home ${width}px is missing gravity geometry`);
    if (geometry.scrollWidth > geometry.viewport + 1) fail(`brand home ${width}px has horizontal overflow`);
    if (geometry.stage.left < geometry.hero.left - 1 || geometry.stage.right > geometry.hero.right + 1) {
      fail(`brand home ${width}px gravity stage leaves the hero`);
    }
    if (geometry.scene.left < geometry.hero.left - 1 || geometry.scene.right > geometry.hero.right + 1) {
      fail(`brand home ${width}px black-hole scene leaves the hero`);
    }
    checks.push({ route: '/', width, gravityBounds: 'ok' });
  }
}
```

- [ ] **Step 3: Run the new checks and verify RED**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL mentioning `hero-status`, out-of-bounds geometry, and missing `overflow: clip`.

Run: `npm run build && npm run qa:visual`

Expected: FAIL because the gravity stage or black-hole scene leaves the hero at one or more target widths.

- [ ] **Step 4: Implement bounded gravity geometry**

In `EmberField.astro`, replace the stage geometry with:

```css
.ember-stage {
  --hole-x: 65%;
  --hole-y: 48%;
  --hole-size: min(34vw, 480px);
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: clip;
  pointer-events: none;
  mask-image: linear-gradient(90deg, transparent 0%, #000 10%, #000 94%, transparent 100%);
}

@media (max-width: 960px) {
  .ember-stage {
    --hole-x: 64%;
    --hole-size: min(44vw, 420px);
  }
}

@media (max-width: 720px) {
  .ember-stage {
    --hole-x: 63%;
    --hole-y: 27%;
    --hole-size: min(70vw, 300px);
    opacity: 0.74;
    mask-image: linear-gradient(180deg, #000 0%, #000 50%, transparent 76%);
  }
}
```

Keep the five depth planes, particle canvas, deterministic particle limit, observer cleanup, and reduced-motion rules unchanged. Reduce orbital guide and field-caption opacity instead of adding new layers.

- [ ] **Step 5: Simplify and rescale the hero**

Replace the three-column observation record in `EmberHero.astro` with:

```astro
<p class="hero-status" aria-hidden="true">
  <span>silicon—carbon archive</span>
  <span>field / active</span>
</p>
```

Cap the title and copy with:

```css
.hero-copy { position: relative; z-index: 2; width: min(48%, 40rem); }
.hero-status { display: flex; gap: 0.8rem; color: var(--muted); font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.08em; }
h1 { max-width: 8ch; font-size: clamp(3.25rem, 6.4vw, 5.2rem); line-height: 0.94; letter-spacing: -0.045em; }

@media (max-width: 720px) {
  .hero-copy { width: 100%; max-width: 31rem; }
  .hero-status { margin-bottom: 8.5rem; }
  h1 { max-width: 7ch; font-size: clamp(2.8rem, 14vw, 4.2rem); }
}
```

- [ ] **Step 6: Verify GREEN and commit**

Run: `npm run build && npm run qa:silicon-embers-ui && npm run qa:visual`

Expected: PASS with five `gravityBounds` checks and no horizontal overflow.

Commit:

```bash
git add scripts/silicon-embers-ui-audit.mjs scripts/visual-qa.mjs src/components/silicon-embers/EmberField.astro src/components/silicon-embers/EmberHero.astro
git commit -m "fix: contain brand gravity field"
```

### Task 2: Remove redundant homepage navigation and separate the method

**Files:**

- Create: `src/components/silicon-embers/MethodStrip.astro`
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/SiliconAshesHome.astro`
- Modify: `src/components/silicon-embers/BrandManifesto.astro`
- Modify: `src/data/siliconEmbersHome.ts`
- Delete: `src/components/silicon-embers/SiteCompass.astro`

- [ ] **Step 1: Add failing homepage architecture contracts**

Use these source assertions:

```js
const methodSource = read('src/components/silicon-embers/MethodStrip.astro');
if (/SiteCompass/.test(homeSource)) failures.push('Brand home must not render the redundant SiteCompass');
if ((homeSource.match(/<MethodStrip\b/g) ?? []).length !== 1) failures.push('Brand home must render one MethodStrip');
if (!/copy=\{copy\.operatingSystem\}/.test(homeSource)) failures.push('MethodStrip must receive localized method copy');
if (!methodSource.includes('method-track') || !methodSource.includes('method-step')) {
  failures.push('MethodStrip must expose the connected method path');
}
if (/method-section|method-track/.test(manifestoSource)) {
  failures.push('BrandManifesto must contain principles only');
}
```

- [ ] **Step 2: Verify RED**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL because `SiteCompass` is still rendered and `MethodStrip.astro` does not exist.

- [ ] **Step 3: Create `MethodStrip.astro`**

Create the component with the existing localized type:

```astro
---
import type { SiliconEmbersOperatingSystemCopy } from '../../data/siliconEmbersHome';
interface Props { copy: SiliconEmbersOperatingSystemCopy; }
const { copy } = Astro.props;
---

<section class="method-strip" aria-labelledby="method-title">
  <header class="method-head section-copy">
    <p class="kicker">{copy.kicker}</p>
    <h2 id="method-title">{copy.title}</h2>
    <p>{copy.body}</p>
  </header>
  <ol class="method-track" aria-label={copy.railLabel}>
    {copy.phases.map((phase, index) => (
      <li class="method-step">
        <span class="phase-index">{String(index + 1).padStart(2, '0')}</span>
        <span class="phase-code">{phase.code}</span>
        <strong>{phase.title}</strong>
        <p>{phase.body}</p>
        <em>{phase.output}</em>
      </li>
    ))}
  </ol>
</section>
```

Style it as four connected columns on desktop, two columns below 820px, and a one-column left-rail timeline below 720px. Use `var(--space-section)`, `var(--line)`, `var(--font-mono)`, and `var(--display-section-max)`.

- [ ] **Step 4: Recompose the homepage**

Make `SiliconAshesHome.astro` render exactly:

```astro
<div class="home-content">
  <EmberHero copy={copy.hero} wordmark={copy.wordmark} />
  <BrandManifesto copy={copy.thesis} />
  <WritingPreview copy={copy.writing} lang={lang} posts={latestPosts} />
  <MethodStrip copy={copy.operatingSystem} />
  <SignalLinksSection id="resources" titleId="resources-title" variant="resource-band" copy={copy.resources} />
</div>
```

Change `BrandManifesto.astro` to accept only `copy: SiliconEmbersThesisCopy`, keep all three principles, and remove the nested method section. Delete `SiteCompass.astro` after its import and render are gone.

In both language variants of `siliconEmbersHome.ts`, keep only the blog and resource hero actions. Course materials remain available in the resource section.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm run qa:silicon-embers-ui && npm run typecheck && npm run build`

Expected: PASS; the built homepage contains one manifesto, one writing preview, one method strip, and one resource section.

Commit:

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/SiliconAshesHome.astro src/components/silicon-embers/BrandManifesto.astro src/components/silicon-embers/MethodStrip.astro src/components/silicon-embers/SiteCompass.astro src/data/siliconEmbersHome.ts
git commit -m "refactor: simplify brand home flow"
```

### Task 3: Unify typography and compact editorial sections

**Files:**

- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/styles/silicon-embers.css`
- Modify: `src/styles/course.css`
- Modify: brand `.astro` components containing `Source Han Serif SC` or local `Consolas` font lists
- Modify: `src/components/silicon-embers/WritingPreview.astro`
- Modify: `src/components/silicon-embers/SignalLinksSection.astro`

- [ ] **Step 1: Add failing typography contracts**

Add:

```js
const brandStyleSource = read('src/styles/silicon-embers.css');
for (const token of ['--font-sans:', '--font-display:', '--font-mono:', '--display-section-max: 3.4rem']) {
  if (!brandStyleSource.includes(token)) failures.push(`Brand typography is missing ${token}`);
}
for (const relative of [
  'src/styles/silicon-embers.css',
  'src/styles/course.css',
  ...shellContentComponents,
  ...files.map(rel).filter((relative) => relative.startsWith('src/components/silicon-embers/')),
]) {
  const source = read(relative);
  if (/Satoshi|Source Han Serif SC|Songti SC/.test(source)) {
    failures.push(`${relative}: declares an unavailable brand font`);
  }
}
```

- [ ] **Step 2: Verify RED**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL with unavailable-font and missing-token messages.

- [ ] **Step 3: Define real shared font and scale tokens**

Add to both light and dark `.sa-shell` token blocks:

```css
--font-sans: 'Avenir Next', 'Segoe UI Variable', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
--font-display: 'Segoe UI Variable', 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
--font-mono: ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
--display-section-max: 3.4rem;
--space-section: clamp(4.5rem, 7vw, 7rem);
```

Use `var(--font-sans)` on the body, `var(--font-display)` on headings and editorial titles, and `var(--font-mono)` on metadata. Replace the unavailable local font lists in all brand components and `course.css` with these variables or an equivalent reliable system stack.

- [ ] **Step 4: Tighten writing and resource sections**

Apply these layout caps:

```css
.writing-preview { grid-template-columns: minmax(9rem, 0.32fr) minmax(0, 1.68fr); gap: clamp(2.5rem, 6vw, 6rem); padding: var(--space-section) 0; }
.writing-head { min-height: 11rem; }
.writing-head h2 { font-size: clamp(2.1rem, 3.4vw, var(--display-section-max)); }
.writing-card strong { font-family: var(--font-display); font-size: clamp(1.08rem, 1.55vw, 1.55rem); }

.resource-band { grid-template-columns: minmax(0, 0.7fr) minmax(18rem, 0.55fr); gap: clamp(2.5rem, 7vw, 7rem); padding: var(--space-section) 0; }
```

Remove the resource section pseudo-element that extends beyond its bounds. Keep all links, focus states, and 44px touch targets.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm run format && npm run qa:silicon-embers-ui && npm run lint && npm run typecheck && npm run build`

Expected: PASS with no unavailable font declarations and no type or format errors.

Commit:

```bash
git add src scripts/silicon-embers-ui-audit.mjs
git commit -m "style: unify brand editorial typography"
```

### Task 4: Remove repeated capability copy from resume views

**Files:**

- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/resume/ProfilePage.astro`
- Modify: `src/components/resume/ResumePage.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add failing resume presentation contracts**

Add:

```js
const profileSource = read('src/components/resume/ProfilePage.astro');
const resumeSource = read('src/components/resume/ResumePage.astro');
for (const [relative, source] of [
  ['src/components/resume/ProfilePage.astro', profileSource],
  ['src/components/resume/ResumePage.astro', resumeSource],
]) {
  if (/copy\.abilities|item\.abilities|class="tags"/.test(source)) {
    failures.push(`${relative}: repeats project capabilities or tags`);
  }
}
for (const marker of ['compact-award', 'skill-line', 'research-tags']) {
  if (!profileSource.includes(marker)) failures.push(`ProfilePage is missing ${marker}`);
}
if ((profileSource.match(/id="contact"/g) ?? []).length !== 0) {
  failures.push('ProfilePage must keep contact in the hero only');
}
const baseLayoutSource = read('src/layouts/BaseLayout.astro');
if (!/faviconPath="\/assets\/avatar\.jpg"/.test(baseLayoutSource)) {
  failures.push('BaseLayout must provide the existing avatar favicon');
}
```

- [ ] **Step 2: Verify RED**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL with repeated capability, missing compact marker, duplicate contact, and favicon messages.

- [ ] **Step 3: Simplify the profile rendering without deleting data**

Keep every `.map()` over `data.achievements`, `data.skills`, `data.projects`, `data.experience`, `data.service`, and `data.research.areas`.

Render awards as:

```astro
<article class="compact-award">
  <p class="eyebrow">{item.period} · {copy.level[item.level]}</p>
  <h3>{item.title}</h3>
</article>
```

Render skills as:

```astro
<article class="skill-line">
  <h3>{item.title}</h3>
  <p>{item.items.join(' · ')}</p>
</article>
```

Render projects with the linked title and `item.summary` only. Remove `copy.abilities`, `item.abilities`, and the tags paragraph. Keep experience descriptions and volunteer items.

Render research as one overall summary plus a title-only list:

```astro
<ul class="research-tags">
  {data.research.areas.map((item) => <li>{item.title}</li>)}
</ul>
```

Remove the bottom `#contact` section because the hero profile card already exposes email and GitHub. Restyle awards, skills, and projects as editorial rows rather than equal card walls.

- [ ] **Step 4: Simplify printable resume variants and add favicon**

In `ResumePage.astro`, make each selected project contain only its title and `item.summary`; remove the tag span and capability paragraph. Do not change project selection or any source data.

In `BaseLayout.astro`, pass:

```astro
faviconPath="/assets/avatar.jpg"
```

to `DocumentLayout` beside `ogImagePath`.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm run format && npm run qa:silicon-embers-ui && npm run typecheck && npm run build && npm run qa:routes && npm run qa:accessibility`

Expected: PASS; all resume routes build, remain keyboard accessible, and no favicon request returns 404.

Commit:

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/resume/ProfilePage.astro src/components/resume/ResumePage.astro src/layouts/BaseLayout.astro
git commit -m "refactor: remove repeated resume capability copy"
```

### Task 5: Final visual review and release gate

**Files:**

- Modify only files required by failures discovered in this task.

- [ ] **Step 1: Format and inspect the net diff**

Run: `npm run format`

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; only planned source, QA, spec, and plan files appear.

- [ ] **Step 2: Run the complete release gate**

Run: `npm run check`

Expected: exit code 0; format, lint, typecheck, 71-page build, routes, accessibility, visual QA, UI audit, PWA, performance, and security checks all pass.

- [ ] **Step 3: Inspect real browser output**

Use Playwright at 1440×900, 1024×768, 768×900, 390×844, and 360×800 for `/`, `/profile`, and `/resume-onepage`.

Verify:

- black hole center is visibly left of the old position and its event horizon is not cut off;
- no visible content crosses the viewport edge;
- hero title and body use one coherent sans-serif family;
- homepage reads in the specified five-section order;
- profile retains every award, project, skill category, experience, service item, and research direction;
- repeated capability paragraphs and project tag rows are absent;
- light mode, dark mode, and reduced-motion mode remain legible.

- [ ] **Step 4: Commit any verified final polish**

If Step 3 requires a scoped correction, rerun the relevant failing check, apply the smallest change, rerun `npm run check`, then commit:

```bash
git add src scripts
git commit -m "style: polish cohesive site layout"
```

If no correction is required, do not create an empty commit.

- [ ] **Step 5: Confirm repository state**

Run: `git status --short && git branch --show-current && git rev-list --left-right --count origin/main...main`

Expected: clean working tree on `main`; local commits may be ahead of `origin/main` and remain unpushed until explicitly requested.
