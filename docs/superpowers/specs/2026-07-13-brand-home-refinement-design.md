# Brand Home Precision Refinement

## Context

The observation-archive redesign established the correct brand language, route structure, warm palette, and Astro component boundaries. Its first implementation is visually coherent but overuses display-scale typography and repeated equal grids. The long page reads as a sequence of posters rather than a carefully edited archive. The black hole is recognizable, yet its accretion disc, photon ring, lensing arcs, and particulate field do not create enough front-to-back depth.

This pass refines the existing design without changing the information architecture, localized copy, primary navigation, course placement, content collections, or static Astro delivery.

## Chosen Direction

The approved direction is **scientific observation archive with restrained editorial whitespace**. The page should feel like a compact research journal: precise, tactile, and quiet enough to reward close reading. Approximately eighty percent of the visual language comes from scientific records—indices, coordinates, scale marks, registration lines, and measured motion—while twenty percent comes from premium editorial design—controlled serif typography, optical spacing, and asymmetric composition.

The interface must not become a dashboard. Technical annotations remain sparse and meaningful. The page must not return to a cinematic poster treatment: no section heading should dominate an entire viewport, and no decorative label should compete with content.

## Goals

- Reduce display-heading scale by roughly 25–35 percent while preserving a distinctive brand voice.
- Shorten excessive vertical gaps and give each section a different but related editorial composition.
- Replace repeated equal-column layouts with compact ledgers, staggered records, and connected method steps.
- Increase black-hole depth using clearly separated optical and particulate layers.
- Add small, repeatable details—coordinates, observation state, registration ticks, sequence numbers, and rule transitions—without adding visual noise.
- Preserve dark/light themes, Chinese/English routes, keyboard access, reduced motion, and existing performance budgets.

## Non-goals

- No new routes, navigation entries, content claims, data sources, fonts, libraries, WebGL, video, or raster hero background.
- No rewrite of shared article, course, resource, or resume templates.
- No changes to course duration, lesson structure, blog ordering, or resource destinations.
- No pointer-following spectacle, smooth-scroll library, or animation that affects layout.

## Black-Hole Composition

`EmberField.astro` remains a CSS-first scene and `emberFieldCanvas.ts` remains a lightweight particle enhancement. The complete static object must exist without canvas.

The scene uses five perceptual depth groups:

1. **Far field** — a very soft gravity well, sparse star dust, and two low-contrast orbital guides establish scale behind the object.
2. **Rear lensing plane** — the rear half of the accretion disc bends upward around the event horizon, paired with a thin upper lensing arc.
3. **Event plane** — a near-black event horizon, narrow photon ring, and asymmetric hot spot define the focal object without turning it into a shaded sphere.
4. **Front lensing plane** — a sharper lower disc edge crosses in front of the horizon, with one short highlight and a faint chromatic falloff.
5. **Near field** — a small number of brighter particles, dust streaks, and one foreground occlusion produce parallax without covering text.

The disc is narrower than the current version and uses multiple masked bands rather than one broad glow. Brightness is intentionally uneven: the left/lower approach side is warmer and more luminous, while the receding side is dimmer. Fine registration ticks and a compact field readout sit outside the object and never overlap the title.

Canvas particles use three depth bands with different size, opacity, blur, and orbital speed. Particle count remains capped; DPR remains capped; animation pauses offscreen and while the document is hidden. Reduced motion renders one deterministic frame and disables CSS rotation or breathing.

In light mode the horizon stays optically flat and near-black. Surrounding lensing layers translate to graphite, umber, and low-opacity gold; the composition must not resemble a floating ball with a drop shadow.

## Page Refinement

### Navigation

The navigation keeps its current links and compact height. The wordmark becomes slightly smaller and receives a restrained archive index. Link spacing tightens. Active, hover, and focus states use rule length, opacity, and a one-pixel optical shift rather than filled surfaces.

### Hero

The hero retains the two-field composition but reduces the H1 maximum size and gives the black hole a little more room. The title, lead, and supporting sentence form one compact reading block. Calls to action become one quiet primary control plus two text actions, avoiding a three-button row. Observation metadata becomes a narrow vertical rail or compact record header rather than two disconnected labels.

The first viewport must reveal the hero and the beginning of the navigation ledger at standard desktop heights. Mobile keeps the black hole above and behind the copy but removes nonessential field annotations.

### Navigation ledger

Blog, Resources, and About stay as the three main entries. Instead of three large equal panels, the ledger becomes three compact records separated by rules. Each record contains an index, title, description, and directional mark aligned to a consistent baseline. One record may be wider on desktop, but none should read as a large card.

### Brand thesis

The thesis heading is reduced to an editorial statement rather than a poster. It sits beside a compact introductory paragraph and a numbered list of principles. Principles use short rules and staggered indentation instead of three equal columns. The section should fit comfortably within approximately one desktop viewport.

### Method sequence

The four-step method becomes a connected horizontal record on wide screens and a numbered vertical timeline on mobile. Each step exposes one verb, one Chinese title, one sentence, and one small output label. Connector lines and progress ticks provide continuity. Equal card borders are removed.

### Writing index

The writing section keeps a left label and right article index, but both the section title and article titles shrink. Dates and reading times align in a narrow metadata column. Hover and keyboard focus reveal a short underline and move the directional mark by no more than two pixels.

### Resource close and footer

Resources become a compact annotated directory rather than four boxed buttons. The background gravity glow is reduced. The footer keeps the existing destinations but uses smaller type, clearer grouping, and one closing archive note.

## Typography and Spacing

- Hero H1: fluid range approximately `3.2rem` to `7rem`, with Chinese line-height near `0.9`.
- Major section headings: fluid range approximately `2.4rem` to `5rem`; no full-width heading larger than the content it introduces.
- Article titles: fluid range approximately `1.35rem` to `2.2rem`.
- Body copy: `0.95rem` to `1.08rem`, line-height `1.75` to `1.9`, and a maximum line length near 60 Chinese characters or 65 Latin characters.
- Metadata: `0.68rem` to `0.76rem`, tabular figures, moderate tracking, and subdued contrast.
- Section spacing is optically varied. Typical desktop blocks use 7–11rem rather than the current oversized gaps; mobile blocks use 5–7rem.

## Interaction and Motion

- Interactive transitions use only `transform`, `opacity`, `color`, and border-related properties.
- Hover effects stay within two pixels of movement and 200–280ms duration.
- Black-hole motion is slow enough to be perceived as drift, not rotation UI.
- Focus indicators remain clearly visible in both themes and are never replaced by hover-only styling.
- Touch targets remain at least 44px for navigation and primary actions.

## Component Boundaries

- `EmberField.astro`: CSS optical layers, readout, and scoped visual behavior.
- `emberFieldCanvas.ts`: three-band particles, deterministic reduced-motion frame, lifecycle, and cleanup.
- `EmberHero.astro`: hero reading block, record metadata, and action hierarchy.
- `SiteCompass.astro`: compact three-record navigation ledger.
- `BrandManifesto.astro`: thesis, principles, and method sequence.
- `WritingPreview.astro`: compact article index.
- `SignalLinksSection.astro`: annotated resource directory.
- `BrandNav.astro` and `SiliconEmbersFooter.astro`: shared chrome refinements.
- `src/styles/silicon-embers.css`: shared palette, type scale, spacing, controls, theme translation, and responsive behavior.
- `scripts/silicon-embers-ui-audit.mjs`: contracts for required depth layers, lifecycle guards, refined type caps, and forbidden light-mode hiding.

## Responsive and Accessibility Requirements

- No horizontal overflow at 320, 390, 768, 1024, or 1440px.
- At 960px and below, black-hole annotations reduce and layouts collapse without changing reading order.
- At 720px and below, the method becomes a vertical sequence, navigation records stack, and decorative near-field particles reduce.
- The page retains one H1 and ordered H2/H3 hierarchy.
- Decorative scene layers and canvas remain hidden from assistive technology.
- Both themes preserve text contrast, visible focus, and a recognizable black-hole composition.
- Reduced-motion mode has no continuously running CSS or canvas animation.

## Acceptance Criteria

- The home page no longer reads as consecutive large-title posters in desktop or mobile full-page screenshots.
- The black hole visibly contains far field, rear lensing, event, front lensing, and near-field depth groups.
- The event horizon reads as a flat void, not a shaded sphere, in both themes.
- Hero actions present one primary control and two quieter text actions.
- Navigation, principles, method, writing, and resources do not repeat the same equal-card layout.
- Existing localized copy, destinations, route contracts, content collections, theme controls, and PWA behavior remain intact.
- Static UI contracts verify the new depth markers and typography caps.
- `npm run check` passes, including browser routes, accessibility, reduced motion, visual QA, and performance/security budgets.
- Final desktop/mobile screenshots show balanced first-view hierarchy and coherent full-page rhythm in dark and light themes.
