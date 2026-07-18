# Editorial Home Visual Refresh Design

**Date:** 2026-07-17

**Status:** Approved direction, pending written-spec review

## Goal

Translate the visual language of the “硅基余烬编辑与视觉手册” into the existing brand homepage without adding photography, sections, copy, routes, or animation load. Restore the centered black hole to its pre-performance visual balance while keeping the current optimized rendering architecture.

## Source visual language

The homepage will use the manual’s core palette and contrast:

- Obsidian: `#080A0B`
- Coal: `#161A1D`
- Ember gold: `#C89B52`
- Amber signal: `#F0B35A`
- Rust brown: `#8E4F35`
- Bone white: `#E6D8BC`
- Cold steel blue: `#26343D`

Gold represents signal and residual warmth, not a full-page filter. Its visible area must stay below roughly 20%. Blue-purple neon, glossy holograms, additional people imagery, and generic cyberpunk decoration are excluded.

## Scope

### 1. Shared material system

Update the existing brand tokens rather than creating a second theme system:

- Dark mode uses obsidian as the primary ground, coal for depth, bone white for text, and ember gold for selected signals.
- Light mode remains available as a bone-paper interpretation with coal text; it must not use pure white.
- Rust brown appears in low-level boundaries and contact-stage transitions.
- Cold steel blue appears only in low-opacity technical annotations, focus details, or distant geometry.

Existing navigation, footer, typography structure, content, and spacing remain intact.

### 2. Silicon / carbon layering

Use static CSS layers only:

- The upper hero receives precise, low-opacity geometric rails and sparse circuit-like nodes—the “silicon” layer.
- The lower hero and contact transition receive coal grain, restrained rust warmth, and a faint wet-reflection gradient—the “carbon” layer.
- The two materials overlap gradually instead of forming a literal split screen.
- Existing pseudo-elements and tokens should be reused where possible; no extra animation loop or image asset is introduced.

### 3. Black-hole visual rollback

Use commit `da02ef0` as the visual reference, but do not restore its implementation wholesale.

Preserve:

- the current centered scene geometry and exact responsive widths;
- the 64-particle cap and 1.5 DPR ceiling;
- cached gravity geometry, allocation-free projection, ResizeObserver lifecycle, offscreen pause, reduced motion, and pagehide cleanup;
- pre-rendered glow sprites instead of per-particle `shadowBlur`.

Restore visually:

- one restrained trail rather than the newer broad double-trail presence;
- no `1.2` particle opacity gain;
- the earlier, softer halo and lower particle prominence;
- light-theme Canvas opacity from `0.36` back to `0.30`.

The deterministic reduced-motion particle targets are:

- alpha energy: `6000–7500`;
- vivid pixels (`alpha >= 24`): `80–110`;
- maximum alpha: `110–135` on desktop and mobile.

These ranges characterize the pre-performance appearance while allowing the cached sprite implementation to remain.

## Component boundaries

- `src/styles/silicon-embers.css`: palette tokens, shell materials, light/dark parity, and Canvas theme opacity.
- `src/components/silicon-embers/EmberHero.astro`: static silicon/carbon hero detailing only if the shared shell layers cannot express it cleanly.
- `src/components/silicon-embers/emberFieldCanvas.ts`: particle visual tuning without undoing performance or lifecycle work.
- `scripts/silicon-embers-ui-audit.mjs`: source contracts for the palette and retained animation architecture.
- `scripts/visual-qa.mjs`: deterministic particle ranges, geometry, theme, overflow, lifecycle, and draw-cost checks.

No changes are planned for homepage content data, routes, navigation structure, footer structure, or contact destinations.

## Accessibility and performance

- Existing text contrast and focus visibility must remain valid in both themes.
- Decorative material layers remain `pointer-events: none` and hidden from assistive technology through CSS-only rendering.
- Reduced motion continues to render one deterministic static Canvas frame.
- Canvas draw p95 remains below the existing 2ms budget.
- No animation-time layout reads are reintroduced.

## Verification

- Run the particle characterization test in RED before tuning, then GREEN inside the restored ranges.
- Verify exact black-hole widths at 360, 390, 768, 1024, and 1440px.
- Capture internal screenshots for Chinese and English homepages in dark and light themes at desktop and mobile widths.
- Confirm the five-icon mobile contact row remains unchanged.
- Run the full project release gate before any push or deployment.

## Non-goals

- Adding public-account cover images or worker photography
- Adding homepage sections, cards, article feeds, or marketing copy
- Repositioning or resizing the centered black hole
- Reverting animation performance, lifecycle, or accessibility improvements
- Rebuilding unrelated brand, course, blog, or resume pages
