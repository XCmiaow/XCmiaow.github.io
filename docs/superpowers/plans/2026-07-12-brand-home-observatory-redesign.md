# Brand Home Observatory Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the canonical brand home pages as a premium observation-archive experience with a restrained black-hole visual, stronger editorial hierarchy, and complete responsive/theme/accessibility behavior.

**Architecture:** Keep Astro, Content Collections, localized copy, route contracts, and the shared brand shell. Add one home-only narrative component, simplify `EmberField` into a complete CSS composition plus a particles-only canvas, and restyle existing home/chrome components without changing their public data interfaces.

**Tech Stack:** Astro 6, TypeScript, scoped Astro CSS, Canvas 2D, Node QA scripts, Playwright, Prettier, ESLint.

---

## File Map

- Create `src/components/silicon-embers/BrandManifesto.astro`: render localized thesis principles and the four-phase method rail.
- Modify `src/components/SiliconAshesHome.astro`: compose the new narrative section while retaining collection-derived recent posts.
- Modify `src/components/silicon-embers/EmberHero.astro`: establish the asymmetric observation-layout hero.
- Replace `src/components/silicon-embers/EmberField.astro`: provide the complete static black-hole scene and responsive/light/reduced-motion CSS.
- Replace `src/components/silicon-embers/emberFieldCanvas.ts`: draw sparse particles only and preserve lifecycle cleanup.
- Modify `src/components/silicon-embers/SiteCompass.astro`: convert equal cards into a numbered navigation ledger.
- Modify `src/components/silicon-embers/WritingPreview.astro`: create the two-column editorial article index.
- Modify `src/components/silicon-embers/SignalLinksSection.astro`: create the closing resources surface.
- Modify `src/components/silicon-embers/BrandNav.astro`: simplify the brand bar and add an aperture-style theme control.
- Modify `src/components/silicon-embers/SiliconEmbersFooter.astro`: remove boxed-link-farm treatment.
- Modify `src/styles/silicon-embers.css`: unify warm light/dark tokens, shared controls, grain/grid, and light-mode black-hole translation.
- Modify `scripts/silicon-embers-ui-audit.mjs`: lock the narrative composition and simplified black-hole contract.
- Modify `scripts/qa-check.mjs`: assert the canonical home has exactly one new narrative section and one complete black-hole visual.

### Task 1: Add the failing home composition contract

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `scripts/qa-check.mjs`

- [ ] **Step 1: Add static contract checks before implementation**

Add these checks after the existing `homeCopySource` declaration in `scripts/silicon-embers-ui-audit.mjs`:

```js
const homeSource = read('src/components/SiliconAshesHome.astro');
const manifestoSource = read('src/components/silicon-embers/BrandManifesto.astro');

if ((homeSource.match(/<BrandManifesto\b/g) ?? []).length !== 1) {
  failures.push('Brand home must render exactly one BrandManifesto');
}
if (!/copy=\{copy\.thesis\}/.test(homeSource) || !/method=\{copy\.operatingSystem\}/.test(homeSource)) {
  failures.push('BrandManifesto must receive localized thesis and operating-system copy');
}
for (const className of ['brand-manifesto', 'principle-list', 'method-rail']) {
  if (!manifestoSource.includes(className)) failures.push(`BrandManifesto is missing ${className}`);
}
```

In `scripts/qa-check.mjs`, immediately after the existing black-hole/canvas checks, add:

```js
if ((await page.locator('.brand-manifesto').count()) !== 1) {
  fail('Brand home lost its thesis and method section');
}
```

- [ ] **Step 2: Run the focused audit and verify the expected red state**

Run:

```powershell
node scripts/silicon-embers-ui-audit.mjs
```

Expected: exit 1 with failures for the missing `BrandManifesto` component and composition.

- [ ] **Step 3: Commit only after the green implementation in Task 2**

Do not commit the red test alone; Task 2 produces the smallest working home narrative and commits both test and implementation.

### Task 2: Add the brand manifesto and method rail

**Files:**
- Create: `src/components/silicon-embers/BrandManifesto.astro`
- Modify: `src/components/SiliconAshesHome.astro`
- Test: `scripts/silicon-embers-ui-audit.mjs`

- [ ] **Step 1: Create the localized component**

Create `BrandManifesto.astro` with this public interface and semantic structure:

```astro
---
import type { SiliconEmbersOperatingSystemCopy, SiliconEmbersThesisCopy } from '../../data/siliconEmbersHome';

interface Props {
  copy: SiliconEmbersThesisCopy;
  method: SiliconEmbersOperatingSystemCopy;
}

const { copy, method } = Astro.props;
---

<section class="brand-manifesto" aria-labelledby="manifesto-title">
  <div class="manifesto-copy">
    <p class="kicker">{copy.kicker}</p>
    <h2 id="manifesto-title">{copy.title}</h2>
    <p>{copy.body}</p>
  </div>
  <ol class="principle-list">
    {copy.principles.map((principle, index) => (
      <li>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <strong>{principle.title}</strong>
        <p>{principle.body}</p>
      </li>
    ))}
  </ol>
  <div class="method-head">
    <p class="kicker">{method.kicker}</p>
    <h2>{method.title}</h2>
    <p>{method.body}</p>
  </div>
  <ol class="method-rail" aria-label={method.railLabel}>
    {method.phases.map((phase, index) => (
      <li>
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

Use scoped CSS with these exact layout rules:

```css
.brand-manifesto { border-bottom: 1px solid var(--line); padding: clamp(88px, 11vw, 148px) 0; }
.manifesto-copy { display: grid; max-width: 72rem; grid-template-columns: minmax(0, 1.2fr) minmax(16rem, .55fr); gap: 2rem 6vw; }
.manifesto-copy .kicker, .manifesto-copy h2 { grid-column: 1; }
.manifesto-copy > p:last-child { grid-column: 2; grid-row: 2; margin: .45rem 0 0; color: var(--muted); line-height: 1.75; }
.manifesto-copy h2 { max-width: 11ch; margin-top: 1rem; font-size: clamp(3rem, 7vw, 7.4rem); line-height: .94; }
.principle-list { display: grid; grid-template-columns: repeat(3, 1fr); margin: clamp(3.5rem, 8vw, 7rem) 0 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
.principle-list li { display: grid; min-height: 12rem; align-content: start; border-right: 1px solid var(--line); padding: 1.4rem 1.6rem 1.8rem 0; }
.principle-list li + li { padding-left: 1.6rem; }
.principle-list li:last-child { border-right: 0; }
.principle-list span, .phase-index, .phase-code { color: var(--ember-strong); font-family: Consolas, 'SFMono-Regular', monospace; font-size: .72rem; letter-spacing: .08em; }
.principle-list strong { margin-top: 2.6rem; color: var(--paper); font-family: 'Source Han Serif SC', 'Noto Serif SC', 'Songti SC', serif; font-size: 1.7rem; }
.principle-list p { max-width: 24ch; margin: .8rem 0 0; color: var(--muted); line-height: 1.7; }
.method-head { display: grid; grid-template-columns: minmax(0, .75fr) minmax(18rem, .45fr); gap: 1rem 6vw; margin-top: clamp(6rem, 11vw, 10rem); }
.method-head .kicker, .method-head h2 { grid-column: 1; }
.method-head h2 { margin-top: .9rem; font-size: clamp(2.4rem, 5vw, 5.2rem); line-height: .98; }
.method-head > p:last-child { grid-column: 2; grid-row: 2; margin: .35rem 0 0; color: var(--muted); line-height: 1.75; }
.method-rail { display: grid; grid-template-columns: repeat(4, 1fr); margin: 3.5rem 0 0; padding: 0; list-style: none; border-block: 1px solid var(--line); }
.method-rail li { position: relative; display: grid; min-height: 18rem; align-content: start; padding: 1.3rem 1.4rem 1.6rem; border-right: 1px solid var(--line); }
.method-rail li:last-child { border-right: 0; }
.phase-code { justify-self: end; margin-top: -1rem; color: var(--muted); }
.method-rail strong { margin-top: 4rem; color: var(--paper); font-size: 1.25rem; }
.method-rail p { margin: .75rem 0 0; color: var(--muted); font-size: .9rem; line-height: 1.65; }
.method-rail em { align-self: end; margin-top: 2rem; color: var(--ember-strong); font-size: .75rem; font-style: normal; }
@media (max-width: 720px) {
  .brand-manifesto { padding: 4rem 0; }
  .manifesto-copy, .method-head { grid-template-columns: 1fr; }
  .manifesto-copy > p:last-child, .method-head > p:last-child { grid-column: 1; grid-row: auto; }
  .principle-list, .method-rail { grid-template-columns: 1fr; }
  .principle-list li, .principle-list li + li, .method-rail li { min-height: auto; border-right: 0; border-bottom: 1px solid var(--line); padding: 1.3rem 0 1.5rem; }
  .principle-list li:last-child, .method-rail li:last-child { border-bottom: 0; }
  .principle-list strong, .method-rail strong { margin-top: 1.5rem; }
}
```

- [ ] **Step 2: Wire the component into the home composition**

Import `BrandManifesto` in `SiliconAshesHome.astro` and place it between `SiteCompass` and `WritingPreview`:

```astro
<BrandManifesto copy={copy.thesis} method={copy.operatingSystem} />
```

- [ ] **Step 3: Run focused checks and format**

Run:

```powershell
npx prettier --write src/components/SiliconAshesHome.astro src/components/silicon-embers/BrandManifesto.astro scripts/silicon-embers-ui-audit.mjs scripts/qa-check.mjs
node scripts/silicon-embers-ui-audit.mjs
```

Expected: Prettier succeeds and the UI audit exits 0.

- [ ] **Step 4: Commit the narrative slice**

```powershell
git add src/components/SiliconAshesHome.astro src/components/silicon-embers/BrandManifesto.astro scripts/silicon-embers-ui-audit.mjs scripts/qa-check.mjs
git commit -m "feat: add brand manifesto sequence"
```

### Task 3: Rebuild the black-hole scene and particle renderer

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Replace: `src/components/silicon-embers/EmberField.astro`
- Replace: `src/components/silicon-embers/emberFieldCanvas.ts`

- [ ] **Step 1: Add the failing visual-structure contract**

Extend the audit with:

```js
const emberFieldSource = read('src/components/silicon-embers/EmberField.astro');
for (const className of ['gravity-veil', 'accretion-disc', 'photon-ring', 'event-horizon', 'lensing-arc']) {
  if (!emberFieldSource.includes(className)) failures.push(`EmberField is missing ${className}`);
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
```

Run `node scripts/silicon-embers-ui-audit.mjs` and expect the particles-only checks to fail against the old renderer.

- [ ] **Step 2: Replace the visual markup**

Use this scene order in `EmberField.astro`:

```astro
<div class="ember-stage" aria-hidden="true">
  <div class="cosmic-grain"></div>
  <div class="black-hole-scene">
    <div class="gravity-veil"></div>
    <div class="lensing-arc arc-back"></div>
    <div class="accretion-disc disc-back"></div>
    <div class="photon-ring"></div>
    <div class="event-horizon"></div>
    <div class="accretion-disc disc-front"></div>
    <div class="lensing-arc arc-front"></div>
  </div>
  <canvas data-ember-canvas></canvas>
  <div class="field-caption"><span>FIELD 01</span><span>gravity / memory</span></div>
</div>
```

The scoped CSS must set `--hole-x`, `--hole-y`, and `--hole-size`; use one asymmetric conic/radial gradient for `.photon-ring`, two clipped elliptical `.accretion-disc` layers, a solid near-black `.event-horizon`, and two low-opacity `.lensing-arc` borders. Keep all animation on `transform`/`opacity`; under `prefers-reduced-motion: reduce`, set every scene animation to `none`.

- [ ] **Step 3: Replace the canvas with a particles-only lifecycle**

The new TypeScript must use these exact limits and responsibilities:

```ts
interface Field { x: number; y: number; innerRadius: number; outerRadius: number }
interface Particle {
  radius: number; angle: number; speed: number; drift: number; size: number;
  alpha: number; life: number; maxLife: number; previousX: number; previousY: number;
}
const TAU = Math.PI * 2;
const PARTICLE_LIMIT = 64;
```

`field()` reads the `.black-hole-scene` rectangle. `createParticle()` spawns between 55% and 100% of `outerRadius`. `tick()` clears the canvas, emits at most two particles per frame, spirals particles inward, draws a short warm trail plus a small core, removes expired/inner particles, and requests the next frame only when visible, intersecting, and motion is allowed. `renderStatic()` creates 28 deterministic-looking particles and draws one frame. `cleanup()` must cancel the frame, remove resize/visibility/motion listeners, disconnect `IntersectionObserver`, and remove the ready attribute.

The file must retain these literal lifecycle features so existing audits stay meaningful:

```ts
window.cancelAnimationFrame(frame);
document.addEventListener('visibilitychange', handleVisibilityChange);
const intersectionObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        syncAnimation();
      })
    : undefined;
const cleanup = () => {
  window.cancelAnimationFrame(frame);
  window.removeEventListener('resize', resizeAndSync);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  reducedMotion.removeEventListener('change', syncAnimation);
  intersectionObserver?.disconnect();
  canvas.removeAttribute('data-ember-ready');
};
```

- [ ] **Step 4: Run type, UI, lifecycle, and formatting checks**

```powershell
npx prettier --write src/components/silicon-embers/EmberField.astro src/components/silicon-embers/emberFieldCanvas.ts scripts/silicon-embers-ui-audit.mjs
npm run typecheck
npm run qa:silicon-embers-ui
npm run qa:perf-security
```

Expected: 0 type errors; UI and performance/security checks pass.

- [ ] **Step 5: Commit the visual engine**

```powershell
git add src/components/silicon-embers/EmberField.astro src/components/silicon-embers/emberFieldCanvas.ts scripts/silicon-embers-ui-audit.mjs
git commit -m "feat: rebuild brand gravity field"
```

### Task 4: Apply the editorial home and shared chrome styling

**Files:**
- Modify: `src/components/silicon-embers/EmberHero.astro`
- Modify: `src/components/silicon-embers/SiteCompass.astro`
- Modify: `src/components/silicon-embers/WritingPreview.astro`
- Modify: `src/components/silicon-embers/SignalLinksSection.astro`
- Modify: `src/components/silicon-embers/BrandNav.astro`
- Modify: `src/components/silicon-embers/SiliconEmbersFooter.astro`
- Modify: `src/styles/silicon-embers.css`

- [ ] **Step 1: Refine the hero without changing its props**

Keep `copy` and `wordmark`. Add a decorative observation label before the wordmark:

```astro
<p class="observation-label" aria-hidden="true"><span>OBSERVATION</span><span>01 / SILICON—CARBON</span></p>
```

Use a left-aligned copy field, `min-height: min(52rem, calc(100dvh - 4.5rem))`, a maximum copy width of 62rem, title size `clamp(4.8rem, 10.5vw, 10.8rem)`, restrained action spacing, and a bottom rule. At mobile widths, use `min-height: 42rem`, title `clamp(3.5rem, 19vw, 6rem)`, and keep the black hole behind/right of the title without reducing contrast.

- [ ] **Step 2: Convert the compass to a navigation ledger**

Add `<span class="compass-arrow" aria-hidden="true">↗</span>` to each link. Use unequal desktop columns (`.9fr 1.15fr .95fr`), a top observation label, large two-digit indices, and one-column mobile layout. Remove card-like box shadows and background fills; hover/focus should illuminate a top rule and translate the arrow only.

- [ ] **Step 3: Convert recent writing to an editorial index**

Use a desktop grid with a `minmax(13rem, .55fr)` heading column and a `minmax(0, 1.45fr)` article column. Add an arrow span to each article row. Keep dates and reading time, but group them in a metadata column. Hover/focus changes the rule color and arrow position without shifting row padding.

- [ ] **Step 4: Refine the resources close and footer**

The resource band gets a subtle local ember radial gradient, a large bordered top/bottom surface, and a two-column title/action layout. The footer links become borderless text/icon links with an underline/rule hover state; the footer note and navigation remain semantic.

- [ ] **Step 5: Simplify navigation and theme control**

Keep the exact Blog / Resources / About / language order. Replace the theme toggle's text glyph with:

```astro
<span class="aperture" aria-hidden="true"><span></span></span>
```

Draw the aperture with CSS borders and a rotating inner half-disc. Keep `aria-pressed`, `data-theme-toggle`, and a 44px target. Active nav state uses a single bottom rule rather than a boxed background.

- [ ] **Step 6: Clean shared tokens and light-mode translation**

Set the shared tokens to a warm archive palette:

```css
.sa-shell {
  --paper: #241c14;
  --muted: #71675b;
  --line: rgba(51, 39, 27, .14);
  --ember: #9f5f2d;
  --ember-strong: #7b421f;
  --moss: #7b421f;
  --coal: #f4efe5;
  --coal-2: #ebe3d5;
}
:root[data-theme='dark'] .sa-shell,
:root.dark .sa-shell {
  --paper: #f0dfbf;
  --muted: rgba(232, 219, 195, .62);
  --line: rgba(237, 216, 180, .13);
  --ember: #c7773d;
  --ember-strong: #e5ad67;
  --moss: #c69255;
  --coal: #080705;
  --coal-2: #0d0b08;
}
```

Remove cool blue/green home gradients and the light-theme rules that hide `.black-hole-scene`, `.event-horizon`, `.photon-ring`, `.accretion-disc`, and the canvas. In light mode, use graphite event-horizon surfaces, a low-saturation amber ring, and reduced canvas opacity. Shared controls keep their public variants and focus behavior but lose excessive inset/gloss layers.

- [ ] **Step 7: Format and run focused checks**

```powershell
npx prettier --write src/components/silicon-embers/EmberHero.astro src/components/silicon-embers/SiteCompass.astro src/components/silicon-embers/WritingPreview.astro src/components/silicon-embers/SignalLinksSection.astro src/components/silicon-embers/BrandNav.astro src/components/silicon-embers/SiliconEmbersFooter.astro src/styles/silicon-embers.css
npm run lint
npm run typecheck
npm run build
npm run qa:silicon-embers-ui
npm run qa:routes
```

Expected: all commands exit 0; 71 static pages still build; browser route and interaction checks pass.

- [ ] **Step 8: Commit the editorial interface**

```powershell
git add src/components/silicon-embers/EmberHero.astro src/components/silicon-embers/SiteCompass.astro src/components/silicon-embers/WritingPreview.astro src/components/silicon-embers/SignalLinksSection.astro src/components/silicon-embers/BrandNav.astro src/components/silicon-embers/SiliconEmbersFooter.astro src/styles/silicon-embers.css
git commit -m "style: refine brand observatory interface"
```

### Task 5: Verify responsive, theme, motion, and release behavior

**Files:**
- Modify after a reproduced visual failure: the specific source file named by the failing check or screenshot inspection
- Test: `scripts/qa-check.mjs`
- Test: `scripts/accessibility-qa.mjs`
- Test: `scripts/visual-qa.mjs`
- Test: `scripts/perf-security-qa.mjs`

- [ ] **Step 1: Run the complete release gate**

```powershell
npm run check
```

Expected: formatting, lint, typecheck, 71-page build, route/data/course/content/writer/PWA/browser/accessibility/visual/UI/performance/security checks all exit 0.

- [ ] **Step 2: Capture fresh desktop and mobile home screenshots**

Start a production preview on an unused local port, then use Playwright to capture:

- `/` at 1440×1000, full page, dark theme;
- `/` at 390×844, full page, dark theme;
- `/` at 1440×1000, first viewport, light theme;
- `/en/` at 390×844, first viewport, dark theme.

Store these under `local-only/qa-screenshots/` so they remain untracked. Inspect for title/black-hole collision, clipped navigation, illegible text, excessive glow, broken rhythm, and horizontal overflow.

- [ ] **Step 3: Re-run targeted checks after any visual correction**

For every correction, run at least:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run qa:routes
npm run qa:accessibility
npm run qa:silicon-embers-ui
npm run qa:perf-security
```

Expected: all commands exit 0 with no new warnings or failures.

- [ ] **Step 4: Commit only verified corrections**

```powershell
git add src scripts
git commit -m "fix: harden brand home responsive polish"
```

Skip this commit if no correction was required and the working tree is already clean.

- [ ] **Step 5: Confirm repository state**

```powershell
git status --short --branch
git branch -a
git log -5 --oneline --decorate
```

Expected: clean `main`, no additional local branches, and the redesign commits at the tip.
