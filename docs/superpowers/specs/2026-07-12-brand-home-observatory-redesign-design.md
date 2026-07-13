# Brand Home Observatory Redesign

## Context

The canonical Chinese and English brand homes live at `/` and `/en/`. They already use Astro, the shared `SiliconEmbersLayout`, localized copy, Content Collections, a CSS black-hole composition, and a canvas particle layer. The current page is functional but visually overworked: the black hole is assembled from many overlapping glow layers, the hero copy and visual compete for attention, repeated bordered controls weaken hierarchy, the three equal navigation cells feel generic, and light mode removes most of the signature visual instead of translating it.

The redesign keeps the existing brand architecture and routes. It improves the home page and shared brand chrome without changing the course, resume, blog data, canonical paths, or content collection contracts.

## Chosen Direction: Observation Archive

The page should feel like an independent research journal observing technology from a human point of view: cinematic but restrained, editorial rather than dashboard-like, and precise rather than futuristic. The dominant visual metaphor is a gravity well rendered with a clear event horizon, one asymmetric photon ring, a thin accretion disc, sparse orbiting matter, and subtle technical annotations.

Two alternatives were rejected:

- A full-screen cinematic black hole would create stronger spectacle but reduce copy legibility and increase animation cost.
- A purely typographic academic journal would improve clarity but lose the site's most distinctive brand asset.

The selected direction keeps the black hole as a signature object while letting typography and negative space lead the page.

## Goals

- Give the canonical home pages a distinctive, premium visual identity.
- Rebuild the black-hole scene with fewer, clearer layers and more physical depth.
- Establish one restrained color system: carbon black, warm paper, graphite, and ember gold.
- Improve hierarchy from hero to navigation, brand thesis, recent writing, method, and resources.
- Preserve localized content, canonical routes, shared controls, theme switching, PWA behavior, and static rendering.
- Keep motion optional, cheap, and safe under reduced-motion, offscreen, and hidden-document states.
- Maintain usable layouts from 320px mobile widths through wide desktop screens.

## Non-goals

- No framework migration, client-side application shell, animation library, remote font, or image CDN.
- No new primary navigation item. Courses remain under Resources.
- No changes to course lessons, resume content, blog entries, resource registry, or route contracts.
- No decorative video, WebGL renderer, or large generated raster background.
- No redesign of every brand interior page in this pass; shared palette, controls, navigation, and footer may improve, but content templates keep their structure.

## Visual System

### Color and surface

Dark mode is the signature presentation. The base uses warm carbon rather than pure black. Text uses bone and warm-gray values; ember gold is the only active accent. Green/blue accents are removed from the home composition. Surfaces use thin low-contrast rules, local radial illumination, and a very low-opacity grain/grid texture instead of generic card shadows.

Light mode translates the same system into an archival-paper treatment. The black hole remains visible as a graphite eclipse with a restrained gold ring; it is not hidden. Light mode uses warm ivory and ink rather than the existing cool blue dashboard palette.

### Typography

The existing local font fallbacks remain. Chinese display headings use the serif stack, interface copy uses the sans stack, and dates/indices use the monospace stack. Hero and section headings use tighter line-height and balanced wrapping; body copy stays within approximately 65 characters. Small metadata uses tracked uppercase or short English codes without becoming the dominant visual language.

### Motion

The CSS black hole supplies the complete static composition. Canvas renders only sparse orbiting dust and ember particles; it no longer redraws a second gravity lens or event horizon. Animation pauses when the hero is offscreen or the document is hidden, caps device pixel ratio, cleans up listeners, and renders a static frame for reduced-motion users. CSS animations are disabled under reduced motion.

## Page Structure

### Shared navigation

The navigation becomes quieter and more editorial: a compact logo/wordmark, primary links with a simple active rule, a language entry, and an aperture-style theme control. It keeps 44px interaction targets and visible focus rings. The mobile layout wraps predictably without a new menu system.

### Hero

The hero uses an asymmetric two-field composition. Copy occupies the left visual field and the black hole is offset to the right, partially cropped by the viewport. A small observation label and the `silicon-embers` wordmark establish rhythm before the large title. The lead remains the emotional statement; the sublead stays supporting copy. Calls to action retain the shared `ActionButton` implementation, but the primary action is visually dominant and tertiary actions are quieter.

The black hole consists of:

- a deep gravity veil;
- one rear accretion arc;
- one photon ring with asymmetric brightness;
- a black event horizon;
- one front accretion arc;
- two faint lensing arcs;
- sparse canvas particles that spiral toward the center.

If canvas initialization fails, the CSS composition remains complete.

### Navigation ledger

The equal card grid becomes a numbered navigation ledger. Blog, Resources, and About remain the only entries. Each row/column exposes an index, title, short description, and directional mark. Desktop uses deliberately unequal column proportions; mobile uses one vertical sequence.

### Brand thesis and method

A new `BrandManifesto` section uses the existing localized `thesis` and `operatingSystem` copy. The thesis pairs one large statement with three principles. The method rail presents Observe, Compose, Transfer, and Return as a connected editorial sequence rather than four cards. No new claims or product data are introduced.

### Writing preview

Recent writing becomes a two-column editorial section: a stable section heading on the left and a ruled article index on the right. Dates and reading times remain visible, titles receive stronger hierarchy, and hover/focus states shift a rule and directional mark rather than moving the whole row abruptly.

### Resources close

The resource section becomes the closing action surface. Its title, description, and links remain data-driven. Controls align as an ordered set rather than floating pills. The footer then resolves into a simple note and text/icon links with no boxed link farm.

## Component and File Boundaries

- `src/components/SiliconAshesHome.astro` composes the home-only sections and queries recent posts.
- `src/components/silicon-embers/EmberHero.astro` owns hero copy layout and calls the visual/control components.
- `src/components/silicon-embers/EmberField.astro` owns only black-hole markup and scoped visual CSS.
- `src/components/silicon-embers/emberFieldCanvas.ts` owns particles, resize behavior, motion preference, observation lifecycle, and cleanup.
- `src/components/silicon-embers/SiteCompass.astro` owns the three-entry navigation ledger.
- `src/components/silicon-embers/BrandManifesto.astro` owns the thesis and method sequence.
- `src/components/silicon-embers/WritingPreview.astro` owns the latest-post editorial index.
- `src/components/silicon-embers/SignalLinksSection.astro` owns the closing resource band.
- `src/components/silicon-embers/BrandNav.astro` and `SiliconEmbersFooter.astro` own shared chrome.
- `src/styles/silicon-embers.css` owns shared brand tokens, page background, controls, theme translation, and global responsive rules. `public/styles/site.css` remains generated.
- `scripts/silicon-embers-ui-audit.mjs` protects the home composition and canvas lifecycle contract.
- `scripts/qa-check.mjs`, `scripts/accessibility-qa.mjs`, and `scripts/perf-security-qa.mjs` continue to provide browser, reduced-motion, lifecycle, and budget coverage.

## Responsive Behavior

- At 960px and below, the hero visual moves further behind/right of the copy and loses nonessential annotations.
- At 720px and below, the black hole becomes a smaller static-weight backdrop in the upper-right, the ledger stacks, manifesto/method layouts become one column, and article rows simplify.
- At 390px and 320px, no heading, control, or decorative layer may cause horizontal overflow. Tap targets remain at least 44px in shared navigation and primary actions.
- The design uses `min-height` with dynamic viewport units rather than fixed viewport height.

## Accessibility and Failure Handling

- Decorative black-hole markup and canvas remain `aria-hidden`.
- The hero has one H1; all following sections use ordered H2/H3 hierarchy.
- Focus indicators remain visible against both themes.
- Text and controls meet the existing contrast and target-size QA gates.
- Reduced-motion produces no running CSS or canvas animation.
- Canvas absence, a null 2D context, or unsupported IntersectionObserver leaves the CSS scene and content usable.
- Existing skip link, canonical metadata, language alternate, theme runtime, and service worker remain unchanged.

## Verification

The implementation is accepted when:

- `/` and `/en/` render the redesigned hero, black-hole scene, navigation ledger, manifesto/method, writing preview, and resource close.
- Primary navigation remains Blog / Resources / About / language / theme.
- The black-hole scene and canvas each appear exactly once on brand homes.
- The canvas contains reduced-motion, visibility, intersection, cancellation, and cleanup handling.
- Dark and light themes both retain a visible, legible hero composition.
- No horizontal overflow occurs at 320, 390, 768, or 1440px.
- All existing route, content, data, PWA, browser, accessibility, visual, UI, performance, and security checks pass.
- The final screenshots show a readable first viewport and a coherent full-page rhythm in desktop and mobile layouts.
