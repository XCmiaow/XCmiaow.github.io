# Black Hole Optics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the approved warm-gold, centered black hole: a visible close photon ring, curved lensing light, textured accretion flow, and particles that do not shine through the shadow.

**Architecture:** Keep the existing CSS optical layers and the single cached-sprite particle Canvas. Retain scene dimensions, homepage copy, navigation, theme handling, particle cap, reduced-motion behavior, and offscreen cleanup. No new runtime, asset, or dependency.

**Tech Stack:** Astro, scoped CSS, TypeScript Canvas 2D, existing Playwright QA.

**Status:** Implementation and local release gate complete. Pages deployment follows the verified commit.

---

## Approved design

The user confirmed this direction on 2026-09-11. Keep the current composition and warm palette. Move lensing arcs close to the shadow, reveal the photon ring outside the horizon, add fine radial disc strands with slow material motion, and keep the central shadow dark. Desktop and mobile must remain free of clipping and text overlap. Light theme translates the same optical structure with darker copper contrast.

## Task 1: Characterize the missing optical behavior

**Files:** `scripts/visual-qa.mjs`

- [x] Add optical assertions to the existing home geometry checks. The photon mask must use an explicit closest-side radius; its annulus must lie outside the shadow. Lensing arc width must stay below twice the horizon width, so it reads as bent light rather than a detached orbital guide.

```js
if (!optics.mask.includes('closest-side')) fail('photon mask needs an explicit closest-side radius');
if (optics.lensWidth / optics.horizonWidth > 2) fail('lensing arc is detached from the horizon');
```

- [x] Sample the existing static particle Canvas inside 90% of the horizon radius and require zero nontransparent pixels. This verifies real occlusion rather than checking a source string. Keep existing particle-presence, lifecycle, geometry, and draw-cost tests.
- [x] Run `npm run qa:visual` against the existing build and observe the missing optical behavior fail before production edits.

## Task 2: Refine the optical layers

**Files:** `src/components/silicon-embers/EmberField.astro`, `src/styles/silicon-embers.css`

- [x] Keep the 29% horizon width and 38% photon-ring width. Replace the photon mask with `radial-gradient(circle closest-side, transparent 0 79%, #000 82% 86%, transparent 91%)`; the first opaque radius is 15.58% of the scene, outside the 14.5% shadow radius.
- [x] Reduce the lensing layer from 69% of the scene to 42%, replace thin detached borders with a masked warm-light arc, and retain the existing front/back layer order.
- [x] Use repeated radial strands inside the existing disc mask. Move only the inner conic texture with slow CSS rotation; keep the disc plane and its illuminated side stable. Stop the texture animation under reduced motion.
- [x] Reduce the decorative orbital guides and internal brown highlight so the dark center is not read as a reflective sphere. Preserve a subtle tonal gradient for existing contrast contracts.
- [x] Adjust only the light-theme overrides for these layers so the close ring remains visible against paper.

## Task 3: Respect the shadow in particle rendering

**File:** `src/components/silicon-embers/emberFieldCanvas.ts`

- [x] Before drawing particles, clip the existing frame to the region outside the cached inner radius. No additional layout reads or animation loops:

```ts
context.beginPath();
context.rect(0, 0, width, height);
context.arc(gravity.x, gravity.y, gravity.innerRadius, 0, TAU, true);
context.clip('evenodd');
```

- [x] Keep the existing inward acceleration, maximum of 64 particles, 1.5 DPR ceiling, cached glow sprites, and lifecycle management.
- [x] Update the static visible-particle envelope from 120–300 to 90–200 bright pixels: the shadow now hides approximately 30 previously visible bright pixels. Keep the alpha-energy and maximum-alpha budgets unchanged and require zero pixels inside the core.

## Task 4: Verify and release

- [x] Build and run `npm run qa:visual`; check Chinese/English geometry, inspect desktop and mobile in both themes, plus reduced motion. Refine only the approved layers if the screenshots reveal clipping, a detached ring, or unreadable contrast.
- [x] Run `npm run check`. Require all route, data, accessibility, printing, visual, and performance gates to pass; the Canvas draw p95 budget remains 2 ms.

Release procedure: commit the reviewed change, push through the existing Pages workflow, and verify the live build identifier and homepage optics.

## Verification record

- RED: the old build exposed 143/135 particle pixels inside the desktop/mobile shadow, hid the photon annulus, and placed the lensing arc more than three horizon widths away.
- GREEN: zero core pixels, visible annulus outside the horizon, unchanged centered geometry across five viewport widths and both languages.
- `npm run check` passed on 2026-09-11, including all 73 built pages and one-page printing.
- Canvas draw p95 was 0.4 ms in the final local release run. Full-page headless frame pacing remains diagnostic; this does not establish a device-wide 60 fps claim.
- Manual deep/light-theme desktop/mobile checks showed no horizontal overflow. The disc texture reports `animation-name: none` under reduced motion.
