# Brand Home Precision Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the brand home into a compact scientific observation archive with a five-plane black hole, smaller typography, varied editorial records, and restrained micro-interactions.

**Architecture:** Keep the existing Astro composition and data flow. `EmberField.astro` owns the complete CSS optical object, `emberFieldCanvas.ts` owns only three-band particles and lifecycle behavior, home section components own their semantic records, and `silicon-embers.css` owns shared type/spacing/theme tokens. Extend the existing static UI audit before each implementation slice so the new visual contract fails first and then passes.

**Tech Stack:** Astro 6, TypeScript, scoped Astro CSS, shared vanilla CSS, Canvas 2D, Node static audits, Playwright-based project QA.

---

## File Map

- Modify `scripts/silicon-embers-ui-audit.mjs`: protect five depth groups, deterministic reduced-motion particles, compact record markers, and reduced display caps.
- Modify `src/components/silicon-embers/EmberField.astro`: build far/rear/event/front/near optical planes and field readout.
- Modify `src/components/silicon-embers/emberFieldCanvas.ts`: add far/mid/near particle bands and deterministic static rendering.
- Modify `src/components/silicon-embers/EmberHero.astro`: compact record header, smaller hero type, and one-primary/two-text action hierarchy.
- Modify `src/components/silicon-embers/SiteCompass.astro`: replace large panels with compact navigation records.
- Modify `src/components/silicon-embers/BrandManifesto.astro`: replace poster thesis and equal grids with traces and a connected method track.
- Modify `src/components/silicon-embers/WritingPreview.astro`: tighten article typography and metadata alignment.
- Modify `src/components/silicon-embers/SignalLinksSection.astro`: replace boxed resource buttons with directory records.
- Modify `src/components/silicon-embers/BrandNav.astro`: add a restrained archive index and tighten interactions.
- Modify `src/components/silicon-embers/SiliconEmbersFooter.astro`: add one closing archive note and refine grouping.
- Modify `src/styles/silicon-embers.css`: shared type scale, spacing, themes, control hierarchy, and light-mode translation.

### Task 1: Build the five-plane black-hole scene

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/EmberField.astro`
- Modify: `src/components/silicon-embers/emberFieldCanvas.ts`

- [ ] **Step 1: Add failing black-hole depth contracts**

Add these checks after the existing `emberFieldSource` assertions:

```js
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
```

- [ ] **Step 2: Run the audit and verify the red state**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL listing the five missing depth planes, precision details, and particle-band contracts.

- [ ] **Step 3: Replace the field markup with explicit planes**

Use this semantic decorative structure inside `.ember-stage`:

```astro
<div class="depth-far">
  <div class="cosmic-grain"></div>
  <span class="orbital-guide guide-outer"></span>
  <span class="orbital-guide guide-inner"></span>
</div>
<div class="black-hole-scene">
  <div class="gravity-veil"></div>
  <div class="depth-rear">
    <div class="lensing-arc arc-back"></div>
    <div class="accretion-disc disc-back"><span class="disc-filament"></span></div>
  </div>
  <div class="depth-event">
    <div class="photon-ring"><span class="photon-caustic"></span></div>
    <div class="event-horizon"></div>
  </div>
  <div class="depth-front">
    <div class="accretion-disc disc-front"><span class="disc-filament"></span></div>
    <div class="lensing-arc arc-front"></div>
  </div>
</div>
<canvas data-ember-canvas></canvas>
<div class="depth-near"><span class="foreground-dust"></span></div>
<div class="field-caption">
  <span class="field-scale" aria-hidden="true"></span>
  <span>FIELD 01 · GRAVITY / MEMORY</span>
  <span>R 04.7 · θ 12° · STABLE</span>
</div>
```

Implement scoped CSS with an explicit z-index sequence: far `0`, rear `2`, event `4`, front `6`, canvas `8`, near/readout `9`. Use two narrow masked disc bands, a flat `#020201` horizon, an asymmetric conic photon ring, and only `transform`/`opacity` animation. Keep `.ember-stage` masking and responsive placement.

- [ ] **Step 4: Add three particle bands and deterministic static rendering**

Extend the particle type and factory:

```ts
type ParticleBand = 'far' | 'mid' | 'near';
type RandomSource = () => number;

interface OrbitParticle {
  band: ParticleBand;
  radius: number;
  spawnRadius: number;
  angle: number;
  angularVelocity: number;
  radialVelocity: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  previousX: number;
  previousY: number;
  x: number;
  y: number;
}

const createSeededRandom = (seed: number): RandomSource => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const bandFor = (value: number): ParticleBand => (value < 0.46 ? 'far' : value < 0.86 ? 'mid' : 'near');
```

Make `createParticle(random: RandomSource = Math.random)` derive size, alpha, blur, trail length, and orbital speed from `band`. Keep `PARTICLE_LIMIT = 64`, DPR cap `1.5`, visibility/intersection guards, cleanup, and one canvas. In `renderStatic`, use `const random = createSeededRandom(240713)` for repeatable positions.

- [ ] **Step 5: Verify the black-hole slice**

Run: `npm run qa:silicon-embers-ui && npm run typecheck && npm run qa:perf-security`

Expected: all commands exit 0; the UI audit reports no failures and the lifecycle check remains true.

- [ ] **Step 6: Commit the slice**

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/EmberField.astro src/components/silicon-embers/emberFieldCanvas.ts
git commit -m "feat: deepen brand gravity field"
```

### Task 2: Compact the hero and navigation ledger

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/EmberHero.astro`
- Modify: `src/components/silicon-embers/SiteCompass.astro`
- Modify: `src/styles/silicon-embers.css`

- [ ] **Step 1: Add failing compact-layout contracts**

Add component markers and reject the previous hero cap:

```js
for (const [relative, marker] of [
  ['src/components/silicon-embers/EmberHero.astro', 'hero-record'],
  ['src/components/silicon-embers/EmberHero.astro', 'action-primary'],
  ['src/components/silicon-embers/SiteCompass.astro', 'compass-record'],
  ['src/components/silicon-embers/SiteCompass.astro', 'record-rule'],
]) {
  if (!read(relative).includes(marker)) failures.push(`${relative}: missing precision marker ${marker}`);
}
if (/10\.8rem/.test(read('src/components/silicon-embers/EmberHero.astro'))) {
  failures.push('Hero display cap must be reduced below the poster-scale 10.8rem');
}
```

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL for missing markers and the old `10.8rem` cap.

- [ ] **Step 2: Rebuild the hero reading block**

Use a single record header and an action hierarchy derived from existing localized data:

```astro
<header class="hero-record" aria-hidden="true">
  <span class="record-index">OBS.01</span>
  <span class="record-axis">SILICON—CARBON</span>
  <span class="record-state">ARCHIVE / ACTIVE</span>
</header>
<div class="hero-title-block">
  <p class="wordmark">{wordmark}</p>
  <h1 id="sa-title">{copy.title}</h1>
</div>
<div class="hero-statement">
  <p class="lead">{copy.lead}</p>
  <p class="sublead">{copy.sublead}</p>
</div>
<div class="hero-actions">
  {copy.actions.map((action, index) => (
    <ActionButton
      href={action.href}
      label={action.label}
      variant={index === 0 ? 'primary' : 'text'}
      className={index === 0 ? 'action-primary' : 'action-text'}
    />
  ))}
</div>
```

Set desktop H1 to `clamp(3.8rem, 7.8vw, 7rem)`, mobile H1 to `clamp(3.1rem, 16vw, 5.2rem)`, desktop hero minimum height to `min(46rem, calc(100dvh - 4.5rem))`, and reduce bottom padding so the first compass rule appears in the initial viewport.

- [ ] **Step 3: Convert compass panels to records**

Keep the same localized items and destinations, but use:

```astro
<ol class="compass-grid">
  {items.map((item, index) => (
    <li class="compass-record">
      <a class="compass-link" href={item.href}>
        <span class="compass-index">{String(index + 1).padStart(2, '0')}</span>
        <span class="record-rule" aria-hidden="true"></span>
        <span class="compass-copy"><strong>{item.label}</strong><span>{item.description}</span></span>
        <span class="compass-arrow" aria-hidden="true">↗</span>
      </a>
    </li>
  ))}
</ol>
```

Desktop records use one horizontal ruled grid with `min-height: 7.5rem`; mobile records stack with aligned indices and no card background. Hover lengthens `.record-rule` and moves the arrow no more than `2px`.

- [ ] **Step 4: Verify and commit**

Run: `npm run format:check && npm run qa:silicon-embers-ui && npm run typecheck && npm run qa:routes`

Expected: all commands exit 0; browser interactions and print checks remain `ok`.

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/EmberHero.astro src/components/silicon-embers/SiteCompass.astro src/styles/silicon-embers.css
git commit -m "style: refine brand hero hierarchy"
```

### Task 3: Replace poster sections with editorial traces

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/BrandManifesto.astro`
- Modify: `src/components/silicon-embers/WritingPreview.astro`
- Modify: `src/components/silicon-embers/SignalLinksSection.astro`

- [ ] **Step 1: Add failing section-variation contracts**

```js
for (const [relative, marker] of [
  ['src/components/silicon-embers/BrandManifesto.astro', 'principle-trace'],
  ['src/components/silicon-embers/BrandManifesto.astro', 'method-track'],
  ['src/components/silicon-embers/WritingPreview.astro', 'writing-rule'],
  ['src/components/silicon-embers/SignalLinksSection.astro', 'resource-record'],
]) {
  if (!read(relative).includes(marker)) failures.push(`${relative}: missing precision marker ${marker}`);
}
for (const forbidden of ['7.4rem', '6.3rem']) {
  if ([manifestoSource, read('src/components/silicon-embers/WritingPreview.astro')].some((source) => source.includes(forbidden))) {
    failures.push(`Poster-scale section cap ${forbidden} must be removed`);
  }
}
```

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL for all four markers and both old display caps.

- [ ] **Step 2: Recompose thesis and method**

Keep the existing `copy.principles` and `method.phases` loops. Add `.principle-trace` to each principle item and render the method list as `.method-track`. Set thesis H2 to `clamp(2.9rem, 5.1vw, 5rem)`, method H2 to `clamp(2.4rem, 4vw, 4rem)`, and change the three principles from equal columns to staggered rows with widths `76%`, `68%`, and `74%`. The method track uses a single top rule and four flexible steps; mobile uses a left rule and vertical steps.

- [ ] **Step 3: Tighten writing and resources**

Add a `.writing-rule` within each article row and reduce article titles to `clamp(1.25rem, 2vw, 2rem)`. Keep dates and reading time in the metadata column.

Render resource links as an ordered directory:

```astro
<ol class="signal-links">
  {copy.links.map((link, index) => (
    <li class="resource-record">
      <ActionButton href={link.href} label={link.label} variant="text" className="resource-link" />
      <span aria-hidden="true">R.{String(index + 1).padStart(2, '0')}</span>
    </li>
  ))}
</ol>
```

Remove boxed button backgrounds from this section. Separate records with rules and use one short hover underline.

- [ ] **Step 4: Verify and commit**

Run: `npm run format:check && npm run qa:silicon-embers-ui && npm run typecheck && npm run qa:accessibility`

Expected: all commands exit 0; accessibility reports reduced motion `ok`.

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/BrandManifesto.astro src/components/silicon-embers/WritingPreview.astro src/components/silicon-embers/SignalLinksSection.astro
git commit -m "style: refine brand editorial sections"
```

### Task 4: Unify chrome, themes, and final visual rhythm

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/BrandNav.astro`
- Modify: `src/components/silicon-embers/SiliconEmbersFooter.astro`
- Modify: `src/styles/silicon-embers.css`

- [ ] **Step 1: Add failing chrome contracts**

```js
for (const [relative, marker] of [
  ['src/components/silicon-embers/BrandNav.astro', 'archive-index'],
  ['src/components/silicon-embers/SiliconEmbersFooter.astro', 'archive-note'],
]) {
  if (!read(relative).includes(marker)) failures.push(`${relative}: missing precision marker ${marker}`);
}
if (!/--display-section-max:\s*5rem/.test(sharedControlCss)) {
  failures.push('Shared brand type scale must cap section display text at 5rem');
}
```

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL for both chrome markers and the shared type token.

- [ ] **Step 2: Refine shared chrome**

Add `<span class="archive-index" aria-hidden="true">A/01</span>` beside the wordmark without changing navigation destinations. Add `<p class="archive-note">OBSERVATIONS ON TECHNOLOGY, RESEARCH &amp; PRACTICE.</p>` to the footer. Keep visible focus, active page indication, language switch, and aperture theme control.

- [ ] **Step 3: Add shared precision tokens and light translation**

Add these tokens to both theme blocks and apply them to shared section styles:

```css
--display-section-max: 5rem;
--space-section: clamp(5.5rem, 8vw, 8.5rem);
--rule-fine: color-mix(in srgb, var(--paper) 13%, transparent);
--meta-size: 0.72rem;
```

Use `var(--space-section)` for home section padding. Ensure the light event horizon remains a flat `#0d0b09` void with no directional drop shadow. Translate far/rear/front fields to graphite and umber with lower opacity. Under reduced motion, disable every field animation and keep a deterministic static canvas frame.

- [ ] **Step 4: Run focused verification**

Run: `npm run format:check && npm run lint && npm run typecheck && npm run build && npm run qa:silicon-embers-ui && npm run qa:routes && npm run qa:accessibility && npm run qa:perf-security`

Expected: all commands exit 0; 71 static pages build; browser, accessibility, and lifecycle checks report `ok`.

- [ ] **Step 5: Capture and inspect final screenshots**

Start the production preview, then capture `/` at desktop dark `1440×1000`, desktop light `1440×1000`, and mobile dark `390×844`. Inspect these acceptance points:

- first viewport shows hero plus the beginning of the navigation ledger;
- no title dominates an entire viewport;
- black-hole rear/event/front planes remain visually separable;
- light mode reads as an eclipse rather than a shaded sphere;
- no horizontal overflow or clipped controls.

- [ ] **Step 6: Run the complete release gate**

Run: `npm run check`

Expected: exit 0 with no format, lint, type, build, route, data, course, PWA, browser, accessibility, visual, UI, performance, or security failures.

- [ ] **Step 7: Commit the final refinement**

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/BrandNav.astro src/components/silicon-embers/SiliconEmbersFooter.astro src/styles/silicon-embers.css
git commit -m "style: polish brand archive details"
```
