# Home Animation Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the current black-hole composition while removing avoidable frame-time work and making the 64-particle field visibly brighter.

**Architecture:** Keep the existing Astro/CSS/Canvas 2D layers. Cache gravity geometry outside the frame loop, replace per-particle real-time blur with pre-rendered glow sprites, and separate static CSS textures from animated compositor wrappers. Extend the existing Playwright and source audits so performance, particle energy, geometry, and lifecycle remain measurable.

**Tech Stack:** Astro 6, TypeScript, Canvas 2D, CSS compositor animations, Playwright 1.60, Node.js QA scripts.

---

## File map

- Modify `src/components/silicon-embers/emberFieldCanvas.ts`: cached geometry, allocation-free projection, glow sprite cache, brighter particle draw, ResizeObserver lifecycle.
- Modify `src/components/silicon-embers/EmberField.astro`: isolate static blur/gradient surfaces from animated wrappers.
- Modify `src/styles/silicon-embers.css`: retain light-theme parity and increase particle canvas visibility.
- Modify `scripts/visual-qa.mjs`: runtime frame/layout/particle/lifecycle checks plus exact geometry characterization.
- Modify `scripts/silicon-embers-ui-audit.mjs`: source contracts for sprite glow, cached geometry, compositor surfaces, and the 64-particle cap.

### Task 1: Remove layout reads from the animation hot path

**Files:**
- Modify: `scripts/visual-qa.mjs`
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/emberFieldCanvas.ts`

- [ ] **Step 1: Add the failing runtime layout-read probe**

Install probes with `page.addInitScript()` before the preview routes are opened. Count `getBoundingClientRect()` only for `.ember-stage` and `.black-hole-scene`, and count Canvas frames through `clearRect()`:

```js
await page.addInitScript(() => {
  const originalRect = Element.prototype.getBoundingClientRect;
  const originalClear = CanvasRenderingContext2D.prototype.clearRect;
  window.__emberProbe = { rectReads: 0, frames: 0 };

  Element.prototype.getBoundingClientRect = function (...args) {
    if (this instanceof Element && this.matches('.ember-stage, .black-hole-scene')) {
      window.__emberProbe.rectReads += 1;
    }
    return originalRect.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    if (this.canvas?.matches?.('[data-ember-canvas]')) window.__emberProbe.frames += 1;
    return originalClear.apply(this, args);
  };
});
```

After the page settles, reset the probe, sample for 800ms, and require at least five Canvas frames with zero layout reads:

```js
const hotPath = await page.evaluate(async () => {
  window.__emberProbe.rectReads = 0;
  window.__emberProbe.frames = 0;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { ...window.__emberProbe };
});
if (hotPath.frames < 5) fail('ember animation did not produce enough frames');
if (hotPath.rectReads !== 0) fail(`ember hot path performed ${hotPath.rectReads} layout reads`);
```

- [ ] **Step 2: Add failing source contracts**

Require a cached field and ResizeObserver, and reject `getBoundingClientRect()` inside `draw()` or `createParticle()`. Add this helper beside the other source-audit helpers:

```js
const sourceBetween = (source, start, end) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  return startIndex >= 0 && endIndex > startIndex ? source.slice(startIndex, endIndex) : '';
};

for (const marker of ['let gravityField:', 'const updateGravityField', 'ResizeObserver']) {
  if (!emberCanvasSource.includes(marker)) failures.push(`Ember canvas is missing ${marker}`);
}
const hotFunctions = [
  ['createParticle', 'const createParticle', 'const emit'],
  ['draw', 'const draw =', 'const renderStatic'],
];
for (const [name, start, end] of hotFunctions) {
  const body = sourceBetween(emberCanvasSource, start, end);
  if (!body || body.includes('getBoundingClientRect')) failures.push(`${name} must not read layout`);
}
```

- [ ] **Step 3: Run the focused audit and verify RED**

Run:

```powershell
npm run build
npm run qa:silicon-embers-ui
npm run qa:visual
```

Expected: UI audit reports missing cached-field markers; visual QA reports non-zero hot-path layout reads.

- [ ] **Step 4: Cache geometry and remove per-frame allocations**

Move profiles and fixed rotation values to module constants. Replace `field()` with one mutable cache updated only after a resize:

```ts
const ROTATION = -0.2;
const ROTATION_COSINE = Math.cos(ROTATION);
const ROTATION_SINE = Math.sin(ROTATION);
const PARTICLE_PROFILES: Record<ParticleBand, ParticleProfile> = {
  far: {
    angularVelocity: [0.00008, 0.00017],
    radialVelocity: [0.002, 0.006],
    size: [0.3, 0.72],
    alpha: [0.12, 0.32],
  },
  mid: {
    angularVelocity: [0.00013, 0.0003],
    radialVelocity: [0.004, 0.01],
    size: [0.48, 1.15],
    alpha: [0.2, 0.56],
  },
  near: {
    angularVelocity: [0.00018, 0.00038],
    radialVelocity: [0.006, 0.013],
    size: [0.82, 1.62],
    alpha: [0.3, 0.7],
  },
};

let gravityField: GravityField = {
  x: 0,
  y: 0,
  innerRadius: 22,
  outerRadius: 138,
};

const updateGravityField = () => {
  const hostRect = host.getBoundingClientRect();
  const sceneRect = scene?.getBoundingClientRect();
  const size = sceneRect?.width ?? Math.min(width * 0.48, 680);
  gravityField = {
    x: sceneRect ? sceneRect.left - hostRect.left + sceneRect.width / 2 : width * 0.5,
    y: sceneRect ? sceneRect.top - hostRect.top + sceneRect.height / 2 : height * 0.5,
    innerRadius: Math.max(22, size * 0.15),
    outerRadius: Math.max(138, size * 0.68),
  };
};

const projectInto = (particle: OrbitParticle) => {
  const planeX = Math.cos(particle.angle) * particle.radius;
  const planeY = Math.sin(particle.angle) * particle.radius * 0.38;
  particle.x = gravityField.x + planeX * ROTATION_COSINE - planeY * ROTATION_SINE;
  particle.y = gravityField.y + planeX * ROTATION_SINE + planeY * ROTATION_COSINE;
};
```

Coalesce ResizeObserver and window-resize notifications through one rAF callback. `resizeAndSync()` must call `resize()`, `updateGravityField()`, reset particles, and restart the animation. Cleanup must disconnect the observer and cancel the pending resize frame.

- [ ] **Step 5: Run focused checks and verify GREEN**

Run the same three commands. Expected: zero failures; the hot-path probe reports zero layout reads.

- [ ] **Step 6: Commit**

```powershell
git add scripts/visual-qa.mjs scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/emberFieldCanvas.ts
git commit -m "perf: cache ember field geometry"
```

### Task 2: Replace real-time particle blur and increase particle presence

**Files:**
- Modify: `scripts/visual-qa.mjs`
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/emberFieldCanvas.ts`
- Modify: `src/styles/silicon-embers.css`

- [ ] **Step 1: Add failing particle-energy checks**

Run the home page with `reducedMotion: 'reduce'`, DPR 1, and viewports 1440×900 and 390×844. Read the Canvas pixels and calculate normalized alpha energy, pixels with alpha at least 24, and maximum alpha:

```js
const particleMetrics = await page.locator('[data-ember-canvas]').evaluate((canvas) => {
  const context = canvas.getContext('2d');
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let alphaEnergy = 0;
  let vividPixels = 0;
  let maxAlpha = 0;
  for (let index = 3; index < data.length; index += 4) {
    const alpha = data[index];
    alphaEnergy += alpha;
    if (alpha >= 24) vividPixels += 1;
    maxAlpha = Math.max(maxAlpha, alpha);
  }
  return { alphaEnergy, vividPixels, maxAlpha };
});
```

Require alpha energy 9000–18000, vivid pixels 120–300, and max alpha 145–210 at both viewports.

- [ ] **Step 2: Add failing source contracts for cached glow**

Require `createGlowSprite`, `glowSprites`, and `PARTICLE_GAIN = 1.2`; reject `shadowBlur` inside `drawParticle`. Keep the existing exact `PARTICLE_LIMIT = 64` assertion.

- [ ] **Step 3: Run RED**

Run:

```powershell
npm run build
npm run qa:silicon-embers-ui
npm run qa:visual
```

Expected: source markers are absent and both particle metric cases are below their lower bounds.

- [ ] **Step 4: Implement pre-rendered glow sprites**

Create one warm and one cool radial-gradient sprite during mount:

```ts
const PARTICLE_GAIN = 1.2;
const GLOW_SIZE = 32;

const createGlowSprite = (core: string, edge: string) => {
  const sprite = document.createElement('canvas');
  sprite.width = GLOW_SIZE;
  sprite.height = GLOW_SIZE;
  const spriteContext = sprite.getContext('2d');
  if (!spriteContext) return sprite;
  const gradient = spriteContext.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.18, core);
  gradient.addColorStop(0.5, edge);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  return sprite;
};

const glowSprites = {
  warm: createGlowSprite('rgba(255, 220, 160, 1)', 'rgba(224, 139, 66, 0.28)'),
  cool: createGlowSprite('rgba(255, 244, 220, 0.92)', 'rgba(238, 219, 187, 0.2)'),
};
```

In `drawParticle()`, draw a wide low-alpha trail, then the narrow trail, cached sprite, and solid core. Keep `globalCompositeOperation = 'lighter'`; never set `shadowBlur`.

Apply the gain only to the final opacity:

```ts
const opacity = Math.min(1, particle.alpha * fadeIn * fadeOut * inwardFade * flicker * PARTICLE_GAIN);
```

Change the light-theme Canvas opacity from `0.3` to `0.36`.

- [ ] **Step 5: Run GREEN and confirm the upper bounds**

Run the same focused commands. Expected: both viewports fall inside every particle metric range, the 64 cap remains, and no source/runtime failures occur.

- [ ] **Step 6: Commit**

```powershell
git add scripts/visual-qa.mjs scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/emberFieldCanvas.ts src/styles/silicon-embers.css
git commit -m "perf: pre-render ember particle glow"
```

### Task 3: Keep complex CSS textures static during animation

**Files:**
- Modify: `scripts/visual-qa.mjs`
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/EmberField.astro`
- Modify: `src/styles/silicon-embers.css`

- [ ] **Step 1: Add the failing frame-budget and surface contracts**

Sample 180 rAF intervals in normal mode and reduced-motion mode on the same 1440×900 context. Sort the intervals and calculate p50, p95, and the ratio above 34ms. Require:

```js
const p50Limit = Math.max(20, staticFrames.p50 * 1.25);
const p95Limit = Math.max(34, staticFrames.p95 * 2);
if (animatedFrames.p50 > p50Limit) fail('ember p50 frame budget exceeded');
if (animatedFrames.p95 > p95Limit) fail('ember p95 frame budget exceeded');
if (animatedFrames.over34Ratio > 0.05) fail('ember long-frame ratio exceeded');
```

Require `.gravity-veil::before`, `.accretion-disc::before`, and `will-change: transform, opacity` in the component source.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run build
npm run qa:silicon-embers-ui
npm run qa:visual
```

Expected: compositor surface markers are absent and at least one normal-mode frame threshold fails.

- [ ] **Step 3: Split static surfaces from animated wrappers**

Make `.gravity-veil` the animated wrapper and move its unchanged background/filter to `::before`:

```css
.gravity-veil {
  inset: -28%;
  z-index: -1;
  border-radius: 50%;
  opacity: 0.9;
  transform: rotate(-12deg) scale(1.2, 0.82);
  animation: gravity-breathe 18s ease-in-out infinite;
  will-change: transform, opacity;
}

.gravity-veil::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle, rgba(0, 0, 0, 0.95) 0 14%, rgba(0, 0, 0, 0.48) 24%, transparent 45%),
    radial-gradient(ellipse, rgba(178, 100, 45, 0.14) 0 13%, rgba(74, 42, 23, 0.1) 34%, transparent 67%);
  filter: blur(23px);
}
```

Make each `.accretion-disc` an animated geometry wrapper. Its surface must use these exact declarations; keep clip-path, opacity, and animation on `.disc-back`/`.disc-front`:

```css
.accretion-disc {
  will-change: transform, opacity;
}

.accretion-disc::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(
      ellipse at center,
      transparent 0 31%,
      rgba(255, 226, 167, 0.72) 34%,
      rgba(213, 126, 57, 0.36) 39%,
      transparent 55%
    ),
    conic-gradient(
      from 193deg,
      transparent 0 8%,
      rgba(152, 77, 34, 0.08) 16%,
      rgba(236, 159, 82, 0.5) 29%,
      rgba(255, 226, 159, 0.86) 38%,
      rgba(145, 72, 32, 0.12) 53%,
      transparent 63% 82%,
      rgba(210, 119, 50, 0.2) 91%,
      transparent
    );
  mix-blend-mode: screen;
  mask-image: radial-gradient(ellipse at center, transparent 0 30%, #000 34% 47%, transparent 57%);
}

.disc-back::before {
  filter: blur(1.3px);
}

.disc-front::before {
  filter: blur(0.45px) drop-shadow(0 4px 9px rgba(215, 128, 54, 0.18));
}

.disc-filament {
  z-index: 1;
}
```

Move light-theme `mix-blend-mode: multiply` to `.accretion-disc::before`. Move light-theme gravity gradients to `.gravity-veil::before`.

- [ ] **Step 4: Run GREEN**

Run the focused commands. Expected: runtime budgets and surface source contracts pass without changing existing geometry checks.

- [ ] **Step 5: Commit**

```powershell
git add scripts/visual-qa.mjs scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/EmberField.astro src/styles/silicon-embers.css
git commit -m "perf: isolate gravity animation surfaces"
```

### Task 4: Lock geometry and lifecycle behavior

**Files:**
- Modify: `scripts/visual-qa.mjs`
- Modify: `scripts/perf-security-qa.mjs`

- [ ] **Step 1: Add exact geometry characterization**

Extend the existing five viewport cases with expected black-hole widths and require ±2px:

```js
const expectedSceneWidths = new Map([
  [360, 280.8],
  [390, 304.2],
  [768, 384],
  [1024, 430.08],
  [1440, 560],
]);
const expected = expectedSceneWidths.get(width);
if (expected && Math.abs(geometry.scene.width - expected) > 2) {
  fail(`${route} ${width}px changed the black-hole scene width`);
}
```

- [ ] **Step 2: Add lifecycle behavior checks**

Using the frame probe, add a reusable sampler and verify each lifecycle transition:

```js
const sampleFrameCount = async (page, duration = 350) => {
  await page.evaluate(() => {
    window.__emberProbe.frames = 0;
  });
  await page.waitForTimeout(duration);
  return page.evaluate(() => window.__emberProbe.frames);
};

await page.locator('.ember-hero').scrollIntoViewIfNeeded();
if ((await sampleFrameCount(page)) < 2) fail('ember canvas does not animate while visible');

await page.locator('.sa-footer').scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
if ((await sampleFrameCount(page)) !== 0) fail('ember canvas keeps drawing while offscreen');

await page.locator('.ember-hero').scrollIntoViewIfNeeded();
await page.waitForTimeout(100);
if ((await sampleFrameCount(page)) < 2) fail('ember canvas does not resume after returning onscreen');

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'load' });
await waitForSettledPage(page);
if ((await sampleFrameCount(page)) !== 0) fail('reduced-motion ember canvas keeps animating');

await page.emulateMedia({ reducedMotion: 'no-preference' });
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
if ((await sampleFrameCount(page)) !== 0) fail('pagehide did not stop ember canvas');
if ((await page.locator('[data-ember-ready]').count()) !== 0) fail('pagehide did not clear ember readiness');
```

Extend `perf-security-qa.mjs` to require `ResizeObserver`, `cancelAnimationFrame(resizeFrame)`, and `resizeObserver?.disconnect()`.

- [ ] **Step 3: Run the characterization tests**

Run:

```powershell
npm run build
npm run qa:visual
npm run qa:perf-security
```

Expected: all checks pass. If a lifecycle case fails, change only the relevant cleanup/resume branch in `emberFieldCanvas.ts`, then rerun until green.

- [ ] **Step 4: Capture internal visual comparisons**

At `/` and `/en/`, capture dark/light screenshots at 1440×1100 and 390×844. Confirm black-hole size and center are unchanged, accretion layers retain their depth, and particles are clearer without dominating the disc. Keep screenshots under ignored `output/playwright/`.

- [ ] **Step 5: Commit**

```powershell
git add scripts/visual-qa.mjs scripts/perf-security-qa.mjs src/components/silicon-embers/emberFieldCanvas.ts
git commit -m "test: lock ember animation behavior"
```

### Task 5: Verify, push, and deploy

**Files:**
- No production files expected.

- [ ] **Step 1: Format changed source and scripts**

```powershell
npx prettier --write scripts/visual-qa.mjs scripts/silicon-embers-ui-audit.mjs scripts/perf-security-qa.mjs src/components/silicon-embers/emberFieldCanvas.ts src/components/silicon-embers/EmberField.astro src/styles/silicon-embers.css
```

- [ ] **Step 2: Run the full release gate**

```powershell
npm run check
```

Expected: exit code 0, all Astro diagnostics and QA failures at zero.

- [ ] **Step 3: Confirm repository state**

```powershell
git status -sb
git branch --format='%(refname:short)'
git rev-list --left-right --count origin/main...main
```

Expected: clean `main`, no other local branch, and local commits ahead of `origin/main` only.

- [ ] **Step 4: Push main**

```powershell
git push origin main
```

- [ ] **Step 5: Verify GitHub Pages**

Watch the `Deploy to GitHub Pages` run for the pushed HEAD until both `build` and `deploy` succeed. Fetch `https://xcmiaow.github.io/?deploy=<short-sha>` with `Cache-Control: no-cache`; require HTTP 200 and the current black-hole/Canvas markers.
