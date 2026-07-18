# Mobile Contact Icon Row Design

**Date:** 2026-07-17  
**Status:** Approved direction, pending written-spec review

## Goal

On the brand homepage contact stage, replace the five vertically stacked mobile contact links with one compact row of five equally spaced icons. Keep desktop and non-contact footer layouts unchanged.

## Scope

- Component: `src/components/silicon-embers/SiliconEmbersFooter.astro`
- Breakpoint: the existing mobile rule at `max-width: 720px`
- Routes: Chinese and English brand homepages, which share the same footer component
- Links: email, WeCom, GitHub, resume, and WeChat feed

## Layout and interaction

- Use a five-column grid: `repeat(5, minmax(0, 1fr))`.
- Keep all five links on one row with equal-width cells and centered icons.
- Keep the existing 17px icon artwork; do not introduce new icons or assets.
- Give every link a minimum 44px touch target.
- Hide visible text labels on mobile to keep the row compact.
- Add an explicit accessible name to every link so icon-only links remain understandable to assistive technology.
- Use separators between adjacent cells while avoiding an extra divider after the fifth item.
- Preserve the current hover, focus, color, and theme behavior.

## Out of scope

- Desktop footer layout or typography
- Contact destinations and link order
- Homepage content, black-hole animation, or other navigation
- Default footer variants used on article and course pages

## Verification

- Add a source contract for the five-column mobile grid and accessible link name.
- At 360px and 390px viewports, verify exactly five contact links:
  - occupy one row;
  - have equal widths within one pixel;
  - remain within the viewport;
  - provide at least a 44px touch target;
  - show icons without visible text labels.
- Verify the desktop contact layout and default footer variant remain unchanged.
