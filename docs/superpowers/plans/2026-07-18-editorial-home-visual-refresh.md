# Editorial Home Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the public-account editorial palette and static silicon/carbon material language to the existing homepage, then restore the black hole’s pre-performance visual restraint without losing current animation performance.

**Architecture:** Extend the existing CSS token system and pseudo-element layers; do not add assets, sections, copy, or animation loops. Characterize the older particle appearance with deterministic Canvas metrics, then tune the current cached-sprite renderer into those ranges while retaining geometry and lifecycle optimizations.

**Tech Stack:** Astro 6, scoped CSS, Canvas 2D, TypeScript, Playwright 1.60, Node.js QA scripts.

---

## File map

- Modify `src/styles/silicon-embers.css`: editorial palette, shell material layers, theme parity, light Canvas opacity.
- Modify `src/components/silicon-embers/EmberHero.astro`: static lower carbon-reflection layer.
- Modify `src/components/silicon-embers/emberFieldCanvas.ts`: restore restrained particle appearance on the optimized renderer.
- Modify `scripts/silicon-embers-ui-audit.mjs`: palette, material, particle, and retained-performance source contracts.
- Modify `scripts/visual-qa.mjs`: deterministic old-look particle ranges and existing geometry/lifecycle gates.

### Task 1: Apply the editorial palette and material layers

**Files:**

- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/styles/silicon-embers.css`
- Modify: `src/components/silicon-embers/EmberHero.astro`

- [ ] **Step 1: Add failing palette and material contracts**

Use the audit’s existing `sharedControlCss` value and add `const emberHeroSource = read('src/components/silicon-embers/EmberHero.astro');`. Replace the old four-token brand-palette loop with these checks:

```js
const editorialPalette = ['#080a0b', '#161a1d', '#c89b52', '#f0b35a', '#8e4f35', '#e6d8bc', '#26343d'];
const lowerBrandCss = sharedControlCss.toLowerCase();
for (const color of editorialPalette) {
  if (!lowerBrandCss.includes(color)) failures.push(`Brand palette is missing ${color}`);
}
for (const token of ['--amber:', '--rust:', '--steel:']) {
  if (!sharedControlCss.includes(token)) failures.push(`Brand palette is missing ${token}`);
}
for (const marker of ['.ember-hero::after', 'var(--steel)', 'var(--rust)', 'carbon-reflection']) {
  if (!emberHeroSource.includes(marker)) failures.push(`Ember hero material system is missing ${marker}`);
}
```

- [ ] **Step 2: Run the focused audit and verify RED**

Run `npm run qa:silicon-embers-ui`.

Expected: failures report the exact editorial colors/tokens and hero material markers that are absent.

- [ ] **Step 3: Replace the shared light and dark tokens**

Keep the existing variable names and add the three material tokens:

```css
.sa-shell {
  --paper: #161a1d;
  --muted: rgba(22, 26, 29, 0.62);
  --line: rgba(38, 52, 61, 0.16);
  --ember: #8e4f35;
  --ember-strong: #8e4f35;
  --amber: #f0b35a;
  --rust: #8e4f35;
  --steel: #26343d;
  --coal: #e6d8bc;
  --coal-2: #d8c7a8;
  --surface: rgba(230, 216, 188, 0.58);
  --surface-strong: rgba(230, 216, 188, 0.84);
  --primary-ink: #080a0b;
}

:root[data-theme='dark'] .sa-shell,
:root.dark .sa-shell {
  --paper: #e6d8bc;
  --muted: rgba(230, 216, 188, 0.62);
  --line: rgba(200, 155, 82, 0.15);
  --ember: #c89b52;
  --ember-strong: #f0b35a;
  --amber: #f0b35a;
  --rust: #8e4f35;
  --steel: #26343d;
  --coal: #080a0b;
  --coal-2: #161a1d;
  --surface: rgba(230, 216, 188, 0.025);
  --surface-strong: rgba(230, 216, 188, 0.055);
  --primary-ink: #080a0b;
}
```

Set `html`, `body`, and `.sa-shell` backgrounds to bone-paper gradients in light mode and obsidian-to-coal gradients in dark mode. Do not use `#fff` or `#ffffff` in the brand shell.

- [ ] **Step 4: Refine the existing static shell materials**

Reuse `.sa-shell::before` for sparse steel/gold geometric rails and `.sa-shell::after` for coal grain. The dark declarations must include the exact palette variables and remain non-interactive:

```css
:root[data-theme='dark'] .sa-shell::before,
:root.dark .sa-shell::before {
  opacity: 0.24;
  background-image:
    linear-gradient(color-mix(in srgb, var(--steel) 32%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--ember) 18%, transparent) 1px, transparent 1px);
}

:root[data-theme='dark'] .sa-shell::after,
:root.dark .sa-shell::after {
  opacity: 0.07;
  background-image: repeating-radial-gradient(circle at 30% 20%, var(--paper) 0 0.35px, transparent 0.75px 3px);
  mix-blend-mode: screen;
}
```

Keep both pseudo-elements fixed, `pointer-events: none`, and below all interactive content.

- [ ] **Step 5: Add the static carbon-reflection layer**

Add one non-animated hero pseudo-element below the text layers:

```css
.ember-hero::after {
  content: '';
  position: absolute;
  inset: 48% 0 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent 0 22%, color-mix(in srgb, var(--rust) 10%, transparent) 68%, transparent),
    repeating-linear-gradient(
      96deg,
      transparent 0 3rem,
      color-mix(in srgb, var(--steel) 14%, transparent) 3rem calc(3rem + 1px),
      transparent calc(3rem + 1px) 6rem
    );
  mask-image: linear-gradient(180deg, transparent, #000 34%, transparent 94%);
  opacity: 0.42;
}
```

Add a nearby comment containing `carbon-reflection` so the source contract documents the layer’s purpose.

- [ ] **Step 6: Run GREEN checks**

Run:

```powershell
npx prettier --write src/styles/silicon-embers.css src/components/silicon-embers/EmberHero.astro scripts/silicon-embers-ui-audit.mjs
npm run build
npm run qa:silicon-embers-ui
npm run qa:accessibility
```

Expected: build exits 0; the 96+ brand contracts and accessibility checks report no failures.

- [ ] **Step 7: Commit**

```powershell
git add src/styles/silicon-embers.css src/components/silicon-embers/EmberHero.astro scripts/silicon-embers-ui-audit.mjs
git commit -m "style: align brand home with editorial palette"
```

### Task 2: Restore the older black-hole particle balance

**Files:**

- Modify: `scripts/visual-qa.mjs`
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/emberFieldCanvas.ts`
- Modify: `src/styles/silicon-embers.css`

- [ ] **Step 1: Change the deterministic particle checks to the approved old-look ranges**

Replace the current particle limits in `checkEmberParticlePresence()`:

```js
if (metrics.alphaEnergy < 6000 || metrics.alphaEnergy > 7500) {
  fail(`${viewport.width}px ember particle alpha energy is ${metrics.alphaEnergy.toFixed(1)}`);
}
if (metrics.vividPixels < 80 || metrics.vividPixels > 110) {
  fail(`${viewport.width}px ember particle vivid pixel count is ${metrics.vividPixels}`);
}
if (metrics.maxAlpha < 110 || metrics.maxAlpha > 135) {
  fail(`${viewport.width}px ember particle max alpha is ${metrics.maxAlpha}`);
}
```

Update the source audit to require `PARTICLE_GAIN = 1`, reject `lineWidth = trailWidth * 2.4`, and continue rejecting `shadowBlur` inside `drawParticle()`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
npm run build
npm run qa:silicon-embers-ui
$env:VISUAL_QA_PORT='49201'; npm run qa:visual
```

Expected: the source audit reports the current `1.2` gain/double trail, and both particle cases exceed the new visual ranges.

- [ ] **Step 3: Tune the optimized renderer to the old appearance**

Keep `createGlowSprite`, `glowSprites`, cached geometry, ResizeObserver, and lifecycle code. Make only these visual changes:

```ts
const PARTICLE_GAIN = 1;

const drawParticle = (particle: OrbitParticle, opacity: number, pull: number) => {
  const warm = particle.angle % 1.8 > 0.46;
  const depth = particle.band === 'far' ? 0.7 : particle.band === 'near' ? 1.18 : 1;
  const trailAlpha = opacity * (warm ? 0.28 : 0.16) * depth;
  const trailWidth = Math.max(0.4, particle.size * (0.58 + pull * 0.42));
  context.strokeStyle = warm ? 'rgb(211, 125, 60)' : 'rgb(232, 215, 186)';
  context.globalAlpha = trailAlpha;
  context.lineWidth = trailWidth;
  context.beginPath();
  context.moveTo(particle.previousX, particle.previousY);
  context.lineTo(particle.x, particle.y);
  context.stroke();

  const radius = particle.size * (1 + pull * 0.65);
  const glowRadius = radius * (particle.band === 'near' ? 3.35 : particle.band === 'mid' ? 2.95 : 2.55);
  context.globalAlpha = opacity * depth * (warm ? 0.32 : 0.26);
  context.drawImage(
    warm ? glowSprites.warm : glowSprites.cool,
    particle.x - glowRadius,
    particle.y - glowRadius,
    glowRadius * 2,
    glowRadius * 2,
  );

  context.globalAlpha = opacity * (warm ? 1 : 0.72);
  context.fillStyle = warm ? 'rgb(239, 169, 91)' : 'rgb(239, 224, 197)';
  context.beginPath();
  context.arc(particle.x, particle.y, radius, 0, TAU);
  context.fill();
  context.globalAlpha = 1;
};
```

Restore the light-theme Canvas declaration to `opacity: 0.3`. If deterministic metrics fall outside the approved ranges, adjust only the warm/cool sprite global-alpha multipliers; do not change particle count, size, geometry, DPR, or lifecycle behavior.

- [ ] **Step 4: Run GREEN checks**

Run:

```powershell
npx prettier --write src/components/silicon-embers/emberFieldCanvas.ts src/styles/silicon-embers.css scripts/visual-qa.mjs scripts/silicon-embers-ui-audit.mjs
npm run build
npm run qa:silicon-embers-ui
$env:VISUAL_QA_PORT='49202'; npm run qa:visual
npm run qa:perf-security
```

Expected: particle metrics at 1440×900 and 390×844 are inside every approved range; scene geometry, lifecycle, draw-cost, and security checks remain green.

- [ ] **Step 5: Commit**

```powershell
git add src/components/silicon-embers/emberFieldCanvas.ts src/styles/silicon-embers.css scripts/visual-qa.mjs scripts/silicon-embers-ui-audit.mjs
git commit -m "style: restore restrained black hole particles"
```

### Task 3: Visual and release verification

**Files:**

- No additional production files expected.

- [ ] **Step 1: Capture internal visual comparisons**

Use the local preview and Playwright CLI. Capture `/` and `/en/` in dark and light themes at 1440×1100 and 390×844 under `output/playwright/`. Confirm:

- the black hole stays centered at its current size;
- the particle field matches the softer `da02ef0` balance;
- gold remains a signal rather than a page-wide filter;
- steel blue and rust are subordinate;
- the mobile five-icon contact row remains one line;
- no text, route, or section changed.

- [ ] **Step 2: Run the complete release gate**

Run `npm run check` and require exit code 0.

- [ ] **Step 3: Verify repository state**

Run:

```powershell
git status --short --branch
git branch --format='%(refname:short)'
git rev-list --left-right --count origin/main...main
git diff --check origin/main...HEAD
```

Expected: clean `main`, no other local branch, local commits ahead only, and no diff-check output.

- [ ] **Step 4: Push and deploy**

Push `main`, watch the `Deploy to GitHub Pages` run for the pushed HEAD until both `build` and `deploy` succeed, then fetch the Chinese and English homepages with cache-busting queries. Require HTTP 200, the current asset hashes, five named footer links, and the deployed editorial palette markers.
