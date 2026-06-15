# AI-KM Evidence Loop Design

## Context

The site is an Astro bilingual academic resume and portfolio. It already has public routes for the home page, modeling case, ChemAI Lab direction, evidence gallery, materials hub, printable resumes, blog, and write page. Structured data exists for projects, public evidence, and materials. The current gap is that the `ai-km` project appears in `src/data/zh.json`, `src/data/en.json`, and `src/data/common.json`, but its link is empty and there is no route that explains the workflow.

The site also has enough structured evidence to support a stronger trust layer. Awards, resumes, evidence gallery items, and material cards exist, but reviewers still need to mentally connect each ability claim to the proof that supports it. The next phase should close that loop without adding a backend or exposing private application packets.

## Goal

Build a lightweight, public, bilingual credibility loop:

1. Add an AI-assisted learning and knowledge management case page.
2. Add a structured claim-to-evidence matrix.
3. Connect both into the home page, project links, materials hub, service worker shell, and QA checks.

Success means a reviewer can start from a project or material card, inspect the claim, see the public evidence or narrative boundary, and return to the relevant resume or project page.

## Non-Goals

- No public full application packet.
- No login, CMS, database, or admin workflow.
- No chatbot or automated recommender.
- No large new 3D scene or animation system.
- No local Obsidian vault export or private note publishing.
- No claims that require private screenshots unless they are clearly marked as narrative-only.

## Approaches Considered

### Option A: Evidence Matrix First

Add a dedicated claim matrix and connect it to existing pages. This gives the strongest credibility gain with the smallest UI surface. The downside is that it does not fully resolve the empty `ai-km` project link.

### Option B: AI-KM Case Page First

Add `/ai-km` and `/en/ai-km` as focused project pages. This resolves the most visible missing route and gives the site a stronger research-workflow story. The downside is that, by itself, it may read as a narrative page without enough proof discipline.

### Option C: Combined Small Loop

Add AI-KM pages and a claim matrix together, with shared data and QA checks. This is the recommended path because it fixes the empty project link and improves the site's review logic in one controlled increment. The scope stays small because it reuses current Astro patterns and static JSON data.

## Chosen Design

Use Option C.

The implementation will add two bilingual routes:

- `/ai-km`
- `/en/ai-km`

It will also add a claim matrix section as data-driven content. The matrix can live on the AI-KM page first, then be linked from the materials hub and evidence gallery. A separate top-level route for the matrix is not required in this phase because that would add another navigation item before the content proves useful.

## Information Architecture

The user flow is:

1. Home project card: `ai-km` links to `/ai-km` or `/en/ai-km`.
2. AI-KM page explains the workflow, tools, outputs, and public boundary.
3. Claim matrix shows ability claims and their evidence status.
4. Evidence-backed claims link to `/evidence` anchors or existing project pages.
5. Narrative-only claims are marked clearly and point to what would make them stronger later.
6. Materials hub includes an AI-KM card so reviewers can find it by scenario.

The main navigation does not need a new persistent item. The header is already dense. AI-KM should be reachable from project cards, materials hub, page trails, and contextual links.

## Data Model

Create `src/data/claims.json` with a top-level `items` array. Each item describes one public claim.

Required fields:

- `id`: stable slug.
- `category`: one of `academic`, `modeling`, `chemistry`, `workflow`, `portfolio`, `service`.
- `status`: one of `evidence-backed`, `case-backed`, `narrative-only`.
- `risk`: one of `low`, `medium`.
- `evidenceIds`: array of IDs from `src/data/evidence.json`.
- `materialIds`: array of IDs from `src/data/materials.json`.
- `routes`: array of public site routes.
- `zh.title`, `zh.claim`, `zh.boundary`.
- `en.title`, `en.claim`, `en.boundary`.

Initial claim set:

- `modeling-practice`: evidence-backed, linked to CUMCM, MCM, MathorCup, math competition evidence and `/modeling`.
- `academic-performance`: evidence-backed, linked to scholarship and merit-student evidence and academic resume.
- `chemistry-foundation`: evidence-backed, linked to chemistry olympiad evidence and ChemAI Lab.
- `research-workflow`: case-backed, linked to `/ai-km`, materials hub, and no certificate evidence by default.
- `public-portfolio-system`: case-backed, linked to the resume site project and materials hub.
- `campus-collaboration`: evidence-backed, linked to debate, volunteer, sports, and resume pages.

Rules:

- `evidence-backed` claims must have at least one `evidenceId`.
- `case-backed` claims may have zero `evidenceIds`, but must have at least one route.
- `narrative-only` claims must have a boundary note and must not be used as hard proof in resume pages.
- All `evidenceIds` must exist in `evidence.json`.
- All `materialIds` must exist in `materials.json`.
- All `routes` must start with `/`.

## AI-KM Page Design

The AI-KM page should be an actual case page, not a landing page.

Sections:

1. Hero: title, short positioning, and three compact tags: AI workflow, Zotero, Obsidian.
2. Page trail: links back to home projects, materials hub, and claim matrix section.
3. Workflow map: four stages: collect literature, read and annotate, organize notes, turn notes into research writing.
4. Tool stack: AI tools, Zotero, Obsidian, Markdown, LaTeX, and paper-reading habits.
5. Outputs: reading note templates, literature map, weekly review, research-expression drafts. These are described as workflow outputs, not published private notes.
6. Claim matrix preview: data-driven cards from `claims.json`.
7. Public boundary: states that private vault content, raw PDFs, and application-specific materials are not published.

Visual tone:

- Quiet academic tool surface.
- Dense but readable.
- No oversized hero illustration.
- No extra 3D object.
- Reuse cards, grid layouts, `PageTrail`, `SectionHead`, and existing CSS tokens.

## Materials Hub Changes

Add a public portfolio material item:

- `id`: `ai-km-case`
- `audience`: `portfolio`
- `access`: `public`
- `kind`: `project-case`
- `status`: `needs-evidence`
- `href.zh`: `/ai-km`
- `href.en`: `/en/ai-km`

The status should stay `needs-evidence` until sanitized screenshots or public note samples exist. This prevents the page from overclaiming.

Do not add a second material item for the claim matrix in this phase. Link to `#claim-matrix` on the AI-KM page instead.

## Existing Data Changes

Update `src/data/common.json`:

- Set the `ai-km` project link from empty string to `/ai-km`.

Update localized project descriptions only if the wording currently implies proof that is not public. The English description already says "built a personal workflow"; the Chinese text should keep the same narrative boundary.

## QA and Validation

Static checks in `scripts/qa-check.mjs` should be expanded:

- Add `/ai-km` and `/en/ai-km` to route checks.
- Add expected H1 values for both routes.
- Require both routes in the service worker APP_SHELL.
- Validate `claims.json` exists and has non-empty `items`.
- Validate required claim fields.
- Validate claim status values.
- Validate `evidenceIds` against `evidence.json`.
- Validate `materialIds` against `materials.json`.
- Validate routes are site-root relative.
- Enforce that `evidence-backed` claims have evidence.
- Enforce that `case-backed` claims have routes.
- Enforce no private-looking phone or birth date text in claim data.

Browser checks:

- Existing responsive overflow checks should automatically include the new routes.
- Existing link crawling should catch broken links from AI-KM page and materials hub.
- Existing small tap target checks should cover new buttons and chips.

Manual verification:

- Open `/ai-km` and `/en/ai-km`.
- Confirm the page does not overlap with the right-top molecule.
- Confirm mobile layout keeps cards single-column.
- Confirm materials hub links to both localized AI-KM routes.
- Confirm language switch maps `/ai-km` to `/en/ai-km` and back.

## Privacy and Risk Handling

The AI-KM page must not expose:

- Phone number.
- Birth date.
- Student ID.
- Private email threads.
- Full Obsidian vault paths.
- Raw literature PDFs.
- Screenshots containing unpublished notes, school account data, or personal IDs.

Any AI-KM content without public proof should be labeled as workflow narrative or case-backed. The page can describe the process, but it should not pretend that private note content is public evidence.

## Implementation Boundaries

Files expected to change:

- `src/pages/ai-km.astro`
- `src/pages/en/ai-km.astro`
- `src/data/claims.json`
- `src/data/common.json`
- `src/data/materials.json`
- `scripts/qa-check.mjs`
- `public/sw.js`

Files not expected to change:

- Existing resume print pages.
- Existing evidence images.
- Existing 3D molecule or gallery components.
- Existing global navigation layout.
- Generated `public/styles/site.css` directly. It should be regenerated through the existing build pipeline if styles are added in Astro files.

## Acceptance Criteria

- `/ai-km` renders with Chinese content and the localized `ai-km` project title as its H1.
- `/en/ai-km` renders with English content and H1 `AI-Assisted Learning & Knowledge Management`.
- Home project card for `ai-km` links to the localized AI-KM page.
- Materials hub includes the AI-KM case card in the portfolio group.
- Claim matrix renders at least six claims.
- Evidence-backed claims link only to existing evidence IDs.
- Narrative or case-backed claims are visibly marked and bounded.
- Service worker APP_SHELL includes both AI-KM routes.
- `npm run lint`, `npm run format:check`, `npm run build`, and `npm run qa` pass.
- No public page exposes private-looking phone numbers or birth month fields.

## Rollout

Implement in one feature batch because the routes, data, and QA checks are tightly coupled. Keep the commit focused on AI-KM and claim-evidence loop changes. Do not include unrelated visual redesigns or refactors.
