# Brand-First Site and Research AI Course Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Astro site into clear brand, resume, and course domains; rewrite the complete twelve-hour Chinese research-AI course; pass the full quality gate; and finish with a clean `main` branch only.

**Architecture:** Keep one Astro 6 application with a shared document/runtime layer and a JSON route contract. Brand and resume pages use separate layouts over that shared layer. Course prose lives in a validated MDX Content Collection and is rendered by one dynamic route plus derived home, schedule, instructor, reference, and print views.

**Tech Stack:** Astro 6, Astro Content Collections, official `@astrojs/mdx`, TypeScript, Zod through `astro/zod`, native CSS/JavaScript, Playwright, ESLint, Prettier, GitHub Pages.

---

## File Structure

### Shared platform

- Create `src/data/routes.json`: route IDs, domains, localized paths, canonical/PWA/sitemap policies, expected headings.
- Create `src/lib/siteRoutes.ts`: typed route lookup, localized path, language-switch, and canonical helpers.
- Create `src/layouts/DocumentLayout.astro`: the only shared HTML/head/security/PWA/theme document layer.
- Modify `src/layouts/BaseLayout.astro`: resume shell only; consume `DocumentLayout` and route helpers.
- Create `src/layouts/SiliconEmbersLayout.astro`: brand shell over `DocumentLayout` and `SiliconEmbersSiteFrame`.
- Modify `src/components/PwaRuntime.astro`, `src/components/ThemeRuntime.astro`, `src/components/ClientBehaviors.astro`: one owner per runtime behavior.

### Brand domain

- Modify `src/components/SiliconAshesHome.astro`: compose sections only.
- Modify `src/components/silicon-embers/SiliconEmbersSiteFrame.astro`: shared brand frame only; no document/runtime duplication.
- Modify `src/components/silicon-embers/BrandNav.astro`, `SiliconEmbersFooter.astro`, `ActionButton.astro`, `ActionLinks.astro`.
- Create `src/components/silicon-embers/CopyButton.astro`.
- Modify `src/components/AboutPage.astro`, `CoursesHub.astro`, `ResourcesHub.astro`, `ResourceTemplatePage.astro`, `WritingHub.astro`, and article/feed components to remove embedded shells and hard-coded route/copy duplication.
- Modify all `src/pages/**/silicon-ashes*.astro` route files to use `SiliconEmbersLayout`.
- Convert `/silicon-ashes/` and legacy `/blog/` routes into compatibility-only entries excluded from canonical/sitemap content.

### Resume domain

- Create `src/data/resumeCatalog.ts`: stable bilingual entities for person, education, achievements, skills, projects, experience, and research areas.
- Create `src/data/credibilityCatalog.ts`: typed evidence/material/claim links built from existing reviewed public assets.
- Create `src/lib/resumeData.ts`: language and variant selectors with derived counts.
- Create shared page components: `ProfilePage.astro`, `EvidencePage.astro`, `MaterialsPage.astro`, `ModelingCasePage.astro`, `ChemAiCasePage.astro`, `AiKmPage.astro`, and `ResumePage.astro`.
- Reduce localized route files to language/variant adapters.
- Remove superseded duplicate JSON fields only after all consumers migrate.

### Course domain

- Modify `astro.config.mjs`: add the official MDX integration.
- Modify `src/content.config.ts`: add the validated `course` collection.
- Create `src/content/course/*.mdx`: six complete teaching units totaling 720 minutes.
- Create `src/data/courseCatalog.ts`: module labels, course metadata, product/method ratio, English overview copy.
- Create `src/lib/course.ts`: sorted entry lookup, duration validation, prerequisite validation, previous/next navigation, source review checks.
- Create `src/layouts/CourseLayout.astro`.
- Create `src/components/course/` blocks: `CourseNav`, `CourseMeta`, `LearningObjectives`, `Analogy`, `ResearchExample`, `ProductDemo`, `Exercise`, `Checkpoint`, `InstructorNote`, `SafetyWarning`, `SourceList`, and `Deliverables`.
- Create course routes under `src/pages/silicon-ashes/courses/ai-research-efficiency/` and the English overview route.
- Remove `public/silicon-ashes/courses/ai-research-efficiency/` after replacement verification.

### Quality and deployment

- Create `scripts/lib/contracts.mjs`, `scripts/route-contract-qa.mjs`, `scripts/data-contract-qa.mjs`, `scripts/course-content-qa.mjs`, and `scripts/accessibility-qa.mjs`.
- Reduce `scripts/qa-check.mjs` to browser-route behavior not covered by focused scripts.
- Modify `scripts/pwa-qa.mjs`, `scripts/visual-qa.mjs`, `scripts/silicon-embers-ui-audit.mjs`, and `scripts/perf-security-qa.mjs` to consume shared contracts.
- Modify `.github/workflows/deploy.yml` so deployment depends on the complete gate.
- Modify `README.md`, `CLAUDE.md`, `PUBLIC_ASSETS.md`, `docs/content-workflow.md`, and `docs/silicon-embers-development.md` to describe the final architecture.

## Task 1: Protect Product Sources and Establish the Baseline

**Files:**
- Modify: `.gitignore`
- Create: `docs/refactor-baseline-2026-07-12.md`

- [ ] **Step 1: Add reproducible artifacts to `.gitignore`**

Append exactly:

```gitignore
.superpowers/
.codex-*.png
output/
security_best_practices_report.md
```

Keep reviewed public images under `public/` trackable.

- [ ] **Step 2: Record the source/artifact boundary**

Create `docs/refactor-baseline-2026-07-12.md` with these facts:

```markdown
# Refactor baseline — 2026-07-12

- Canonical product decision: brand at `/`, resume at `/profile/`.
- Git topology before integration: `codex/quality-hardening` is 17 commits ahead of `main`; `main` and `origin/main` point to `2e8c78b`.
- Valid work to preserve: source, content, docs, reviewed public images, QA scripts, security headers, and package changes.
- Reproducible artifacts to exclude: `.codex-*.png`, `output/`, `.superpowers/`, logs, caches, `dist/`, and generated local reports.
- Baseline checks: ESLint passes; Prettier fails in `AboutPage.astro` and `SiliconEmbersFeedPage.astro`; build passes; full check stops at route/tap-target failures.
```

- [ ] **Step 3: Verify ignore behavior without deleting files**

Run:

```powershell
git status --short --ignored | Select-String -Pattern '.superpowers|.codex-|output/'
```

Expected: those paths are marked `!!`, and reviewed `public/` assets remain visible as source changes.

- [ ] **Step 4: Commit the boundary**

```bash
git add .gitignore docs/refactor-baseline-2026-07-12.md
git commit -m "chore: define refactor source boundary"
```

## Task 2: Add Official Astro MDX and Type Gates

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `astro.config.mjs`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install only the official required integrations**

Run:

```bash
npm install --save-dev @astrojs/mdx @astrojs/check typescript
```

Verify package purpose against:

- `https://v6.docs.astro.build/en/guides/integrations-guide/mdx/`
- `https://docs.astro.build/en/guides/typescript/`

- [ ] **Step 2: Configure MDX**

Change `astro.config.mjs` to:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://XCmiaow.github.io',
  base: '/',
  integrations: [mdx()],
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  build: { assets: 'assets' },
});
```

- [ ] **Step 3: Add explicit type scripts**

Add to `package.json`:

```json
"typecheck": "astro check",
"check:fast": "npm run format:check && npm run lint && npm run typecheck && npm run build"
```

Do not place `astro check` inside `build`; keep the commands separately diagnosable.

- [ ] **Step 4: Run the new gate and record real failures**

Run:

```bash
npm run typecheck
```

Expected initially: failures may expose current implicit-any, unused, or invalid Astro props. Fix only configuration errors in this task; code errors become explicit inputs to later tasks.

- [ ] **Step 5: Commit dependency and configuration changes**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json
git commit -m "build: add mdx and astro type checks"
```

## Task 3: Create the Single Route Contract

**Files:**
- Create: `src/data/routes.json`
- Create: `src/lib/siteRoutes.ts`
- Create: `scripts/route-contract-qa.mjs`
- Modify: `src/pages/sitemap.xml.ts`
- Modify: `public/sw.js`

- [ ] **Step 1: Write the failing route-contract QA**

The script must assert:

```js
const requiredIds = ['brand-home', 'profile', 'writing', 'resources', 'about', 'feed', 'course-home'];
const allowedDomains = new Set(['brand', 'resume', 'course', 'compatibility']);
```

For every entry, require `id`, `domain`, `zh`, `en`, `canonical`, `sitemap`, `pwa`, and localized `h1`. Require unique localized paths and exactly one canonical Chinese and English brand home.

Run:

```bash
node scripts/route-contract-qa.mjs
```

Expected: FAIL because `src/data/routes.json` does not exist.

- [ ] **Step 2: Create the route JSON**

Include every public route currently listed in `README.md`, plus brand writing/resources/about/feed/course routes. Mark `/silicon-ashes/` and old `/blog/` as `domain: "compatibility"`, `canonical: false`, `sitemap: false`, `pwa: false`.

- [ ] **Step 3: Add typed helpers**

Export these exact functions from `src/lib/siteRoutes.ts`:

```ts
export type SiteLang = 'zh' | 'en';
export type RouteId = (typeof routes)[number]['id'];
export function getRoute(id: RouteId): SiteRoute;
export function routePath(id: RouteId, lang: SiteLang): string;
export function alternatePath(id: RouteId, lang: SiteLang): string;
export function canonicalRoutes(): SiteRoute[];
```

- [ ] **Step 4: Generate sitemap and PWA lists from the contract**

Replace hard-coded sitemap route arrays with `canonicalRoutes()`. Keep course lesson URLs appended from the course collection in Task 8. Replace duplicated APP_SHELL route literals with the contract's `pwa: true` routes at generation time; `public/sw.js` should receive a generated JSON array from `scripts/generate-build-meta.mjs` or a dedicated generator, not import TypeScript at runtime.

- [ ] **Step 5: Verify**

Run:

```bash
node scripts/route-contract-qa.mjs
npm run build
```

Expected: route contract passes and all existing pages still build.

- [ ] **Step 6: Commit**

```bash
git add src/data/routes.json src/lib/siteRoutes.ts scripts/route-contract-qa.mjs src/pages/sitemap.xml.ts public/sw.js scripts/generate-build-meta.mjs
git commit -m "refactor: centralize public route contracts"
```

## Task 4: Consolidate Document, Theme, and PWA Runtime

**Files:**
- Create: `src/layouts/DocumentLayout.astro`
- Create: `src/layouts/SiliconEmbersLayout.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/PwaRuntime.astro`
- Modify: `src/components/ThemeRuntime.astro`
- Modify: `src/components/ClientBehaviors.astro`
- Modify: all full-document brand route files

- [ ] **Step 1: Extend QA to fail on duplicate runtime registration**

In `scripts/silicon-embers-ui-audit.mjs`, assert each rendered canonical page has exactly one:

```js
document.querySelectorAll('link[rel="manifest"]').length === 1;
document.querySelectorAll('[data-theme-runtime]').length === 1;
```

Run `npm run qa:silicon-embers-ui` and confirm the current implementation fails.

- [ ] **Step 2: Implement `DocumentLayout.astro`**

Props:

```ts
interface Props {
  lang: 'zh' | 'en';
  title: string;
  description: string;
  canonicalPath: string;
  alternatePath?: string;
  themeColor?: string;
  bodyClass?: string;
}
```

It owns the doctype, `<html>`, complete `<head>`, `SecurityMeta`, canonical/alternate tags, one stylesheet, one manifest, one `PwaRuntime`, one `ThemeRuntime`, and the body slot.

- [ ] **Step 3: Convert `BaseLayout` and create `SiliconEmbersLayout`**

`BaseLayout` keeps resume navigation/footer only. `SiliconEmbersLayout` wraps `SiliconEmbersSiteFrame` and accepts `routeId`, `title`, `description`, and `lang`.

- [ ] **Step 4: Remove full-document duplication from brand route files**

Route files must contain only imports, localized metadata, and one layout/component call. No route file under `src/pages/**/silicon-ashes*` may contain `<!doctype html>` after this step.

- [ ] **Step 5: Verify**

Run:

```bash
npm run typecheck
npm run build
npm run qa:pwa
npm run qa:silicon-embers-ui
```

Expected: one runtime per page; no route regression.

- [ ] **Step 6: Commit**

```bash
git add src/layouts src/components/PwaRuntime.astro src/components/ThemeRuntime.astro src/components/ClientBehaviors.astro src/pages
git commit -m "refactor: unify document and client runtimes"
```

## Task 5: Consolidate the Brand Domain

**Files:**
- Modify: `src/components/SiliconAshesHome.astro`
- Modify: `src/components/silicon-embers/SiliconEmbersSiteFrame.astro`
- Modify: `src/data/siliconEmbersHome.ts`
- Modify: `src/data/siliconAshesResources.ts`
- Create: `src/components/silicon-embers/CopyButton.astro`
- Modify: brand hub, article, feed, about, resource, and course-gateway components

- [ ] **Step 1: Add failing structural assertions**

Extend `scripts/silicon-embers-ui-audit.mjs` to require:

- one `BrandNav`-rendered header and one brand footer per page;
- nav labels exactly Blog/Resources/About plus language/theme controls;
- no course item in primary nav;
- no literal “订阅” on feed/course brand chrome;
- all `.sa-control` elements originate from `ActionButton` or `CopyButton`.

- [ ] **Step 2: Make home composition-only**

Remove shell, duplicated contacts, footer, and theme runtime from `SiliconAshesHome.astro`. Render its sections inside `SiliconEmbersLayout` at the route level.

- [ ] **Step 3: Fix control semantics**

Constrain `ActionButton` variants to:

```ts
type ButtonVariant = 'default' | 'primary' | 'text';
```

Replace `quiet` with `default`. Implement `CopyButton` as a real `<button>` with the same shared control states, visible focus, localized success text, and no `window.alert()`.

- [ ] **Step 4: Derive resource groups**

Every resource registry entry gets one `category` from:

```ts
type ResourceCategory = 'course-materials' | 'templates' | 'checklists' | 'workflow-tools' | 'wechat-extensions';
```

`getResourceIndexGroups(lang)` groups registry entries; it never maintains a second manual list. Add a QA assertion that every template appears exactly once.

- [ ] **Step 5: Remove duplicate canonical content**

Keep brand articles canonical under `/silicon-ashes/writing/`. Compatibility routes render a canonical link and immediate accessible navigation to the canonical route, and are excluded from sitemap/PWA.

- [ ] **Step 6: Verify and commit**

```bash
npm run format
npm run typecheck
npm run build
npm run qa:silicon-embers-ui
git add src/components src/data src/pages scripts/silicon-embers-ui-audit.mjs
git commit -m "refactor: consolidate silicon embers domain"
```

## Task 6: Normalize Resume and Credibility Data

**Files:**
- Create: `src/data/resumeCatalog.ts`
- Create: `src/data/credibilityCatalog.ts`
- Create: `src/lib/resumeData.ts`
- Create: `scripts/data-contract-qa.mjs`
- Create shared resume-domain page components
- Modify localized route adapters

- [ ] **Step 1: Write failing data-contract checks**

Assert unique IDs, complete `zh`/`en` localized fields, valid evidence/material/project/claim references, evidence-backed claims with evidence, case-backed claims with routes, consistent ChemAI module count, and no forbidden private text.

Run:

```bash
node scripts/data-contract-qa.mjs
```

Expected: FAIL until the new catalogs exist.

- [ ] **Step 2: Create one bilingual entity shape**

Use this pattern for every localized entity:

```ts
interface LocalizedText<T> {
  zh: T;
  en: T;
}

interface Achievement {
  id: string;
  year: number;
  level: 'international' | 'national' | 'provincial' | 'university' | 'college';
  title: LocalizedText<string>;
  summary: LocalizedText<string>;
  evidenceIds: string[];
}
```

Move facts from `common.json`, `zh.json`, `en.json`, `evidence.json`, `materials.json`, and `claims.json` without changing reviewed public meaning.

- [ ] **Step 3: Add variant selectors**

Export:

```ts
export function getProfile(lang: SiteLang): ProfileViewModel;
export function getEvidence(lang: SiteLang): EvidenceViewModel[];
export function getMaterials(lang: SiteLang): MaterialViewModel[];
export function getResume(lang: SiteLang, variant: 'general' | 'academic' | 'career'): ResumeViewModel;
```

All counts and achievement subsets are derived from IDs, not separately hard-coded by language.

- [ ] **Step 4: Replace duplicated localized templates**

Create shared components and reduce every localized route file to a thin adapter. Each Chinese/English route pair must render the same semantic section IDs.

- [ ] **Step 5: Fix semantic links**

Replace root fragment links such as `/#projects` and `/#honors` with `/profile/#projects` and `/profile/#honors` (and English equivalents). Add fragment-target crawling to route QA.

- [ ] **Step 6: Verify and commit**

```bash
node scripts/data-contract-qa.mjs
npm run typecheck
npm run build
node scripts/route-contract-qa.mjs
git add src/data src/lib src/components src/pages scripts/data-contract-qa.mjs scripts/qa-check.mjs
git commit -m "refactor: normalize resume credibility data"
```

## Task 7: Add the Course Collection Contract

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/data/courseCatalog.ts`
- Create: `src/lib/course.ts`
- Create: `scripts/course-content-qa.mjs`
- Create: `src/content/course/01-ai-history.mdx` with frontmatter only for the initial red test

- [ ] **Step 1: Define the course schema**

Use `glob({ pattern: '**/*.mdx', base: './src/content/course' })` and require:

```ts
const course = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/course' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    module: z.enum(['foundations-1', 'foundations-2', 'task-design', 'tool-systems', 'agents', 'workflow-lab']),
    order: z.number().int().positive(),
    durationMinutes: z.number().int().positive(),
    kind: z.enum(['lesson', 'lab']),
    objectives: z.array(z.string()).min(2),
    prerequisites: z.array(z.string()),
    deliverables: z.array(z.string()).min(1),
    sources: z.array(z.object({ title: z.string(), url: z.string().url(), reviewedAt: z.coerce.date() })),
    productMinutes: z.number().int().nonnegative(),
    draftBody: z.boolean().default(false),
  }),
});
```

- [ ] **Step 2: Write course validation**

`validateCourse(entries)` must reject duplicate order, invalid prerequisites, total duration other than 720, total product time outside 240–300 minutes, missing official sources for product lessons, and WorkBuddy-specific time above 60 minutes.

- [ ] **Step 3: Verify the red state**

Run:

```bash
node scripts/course-content-qa.mjs
```

Expected: FAIL because only one incomplete course entry exists and total duration is not 720.

- [ ] **Step 4: Commit the contract while keeping the main build green**

Do not leave intentionally invalid content in a commit. Add all six valid frontmatter stubs with `draftBody: true`, make the QA reject `draftBody` only when `COURSE_RELEASE=1`, and ensure normal build succeeds. The release gate added in Task 11 runs with `COURSE_RELEASE=1`.

```bash
git add src/content.config.ts src/data/courseCatalog.ts src/lib/course.ts scripts/course-content-qa.mjs src/content/course
git commit -m "feat: add typed course content contract"
```

## Task 8: Build Unified Course Components and Routes

**Files:**
- Create: `src/components/course/*.astro`
- Create: `src/layouts/CourseLayout.astro`
- Create: `src/pages/silicon-ashes/courses/ai-research-efficiency/index.astro`
- Create: `src/pages/silicon-ashes/courses/ai-research-efficiency/[...slug].astro`
- Create: derived schedule, instructor, reference, and handout routes
- Create: English course overview route
- Create: `src/styles/course.css`

- [ ] **Step 1: Add route expectations before implementation**

Add the course home, six unit slugs, schedule, instructor guide, reference, and handout routes to contract QA. Run it and confirm failure.

- [ ] **Step 2: Implement semantic teaching blocks**

Each block accepts only content props and renders a heading/region with a stable class. `Exercise` requires `title`, `instructions`, and `acceptance`. `ProductDemo` requires `product`, `goal`, and `verifiedAt`. `InstructorNote` uses `<details>` so self-study readers can skip it and keyboard users can open it.

- [ ] **Step 3: Implement `CourseLayout`**

It renders a desktop chapter rail, mobile `<details>` table of contents, duration/objectives/deliverables, previous/next navigation, and source review date. It uses `SiliconEmbersLayout` and never loads `EmberField`.

- [ ] **Step 4: Implement dynamic lesson generation**

Use:

```ts
export async function getStaticPaths() {
  const entries = await getCollection('course', ({ data }) => data.kind === 'lesson' || data.kind === 'lab');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
```

Render with `const { Content } = await render(entry)` and pass the shared MDX components.

- [ ] **Step 5: Derive support views**

The schedule reads order/duration/objectives. The instructor guide aggregates instructor notes. The reference aggregates sources by unit and product. The handout renders all six units in order with print CSS.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run build
node scripts/route-contract-qa.mjs
git add src/components/course src/layouts/CourseLayout.astro src/pages/silicon-ashes/courses src/pages/en/silicon-ashes/courses src/styles/course.css
git commit -m "feat: build unified astro course pages"
```

## Task 9: Rewrite the Complete Twelve-Hour Course

**Files:**
- Modify: six `src/content/course/*.mdx` entries
- Modify: `src/data/courseCatalog.ts`

- [ ] **Step 1: Research current product facts from primary sources**

For OpenAI/Codex, Anthropic/Claude Code, GitHub/Git, and any WorkBuddy feature described, use current official documentation. Record each official page in the relevant entry's `sources`. If WorkBuddy lacks an authoritative public source for a claimed feature, omit the claim or label the demonstration as locally verified on the review date.

- [ ] **Step 2: Write Unit 1 — AI history and capability map (120 minutes, product time ≤ 20 minutes)**

Required sections: expert systems; statistical ML; deep learning; Transformers; generative models; retrieval; reasoning; agents; generation/retrieval/reasoning/action comparison; chemistry information example; tool-map exercise; terminology acceptance check.

- [ ] **Step 3: Write Unit 2 — LLM mental model (120 minutes, product time ≤ 20 minutes)**

Required sections: tokens; context; probabilistic generation; temperature; hallucination; knowledge limits; reasoning models; RAG; citations; chemistry naming/reaction/citation failure cases; answer-risk card exercise and acceptance check.

- [ ] **Step 4: Write Unit 3 — task, prompt, context, and acceptance (120 minutes, product time 40–50 minutes)**

Required sections: goal; inputs; constraints; examples; output schema; acceptance criteria; task brief; literature, experiment, writing, data, and teaching examples; three-template exercise; peer-review checkpoint.

- [ ] **Step 5: Write Unit 4 — web, API, files, cost, and safety (120 minutes, product time 55–65 minutes)**

Required sections: browser/client/server; API and key; proxy/relay concept without vendor promotion; CLI/GUI; files and permissions; cost/rate limits; Windows primary setup and macOS differences; credentials; unpublished data; copyright; institutional policy; safe-configuration exercise.

- [ ] **Step 6: Write Unit 5 — controlled agents (120 minutes, product time 90–100 minutes)**

Required sections: chat versus agent; plan; permission; command; log; human confirmation; harness; loop; Git checkpoint; WorkBuddy/Claude Code/Codex comparison; WorkBuddy-specific demonstration capped at 45 minutes; plan-execute-verify lab.

- [ ] **Step 7: Write Unit 6 — research workflow studio (120 minutes, product time 55–65 minutes)**

Required sections: select a real task; define input/tool/output/human review/storage/reuse; literature workflow; writing workflow; data workflow; teaching workflow; proposal workflow; chemistry/chemical-engineering example set; final workflow package rubric.

- [ ] **Step 8: Run the release content gate**

```powershell
$env:COURSE_RELEASE='1'; node scripts/course-content-qa.mjs
```

Expected: six complete units, 720 total minutes, 240–300 product minutes, WorkBuddy ≤ 60 minutes, no draft markers, no encoding corruption, all time-sensitive product claims sourced.

- [ ] **Step 9: Commit**

```bash
git add src/content/course src/data/courseCatalog.ts
git commit -m "content: rewrite research ai course"
```

## Task 10: Remove the Static Course Package and Dead Code

**Files:**
- Delete: `public/silicon-ashes/courses/ai-research-efficiency/`
- Delete: unused brand/resume components proven unreferenced
- Modify: course/resource links, PWA, sitemap, docs

- [ ] **Step 1: Prove replacements exist**

Run build and request every new course route. Confirm all return 200 and all active lesson links are reachable from the course home.

- [ ] **Step 2: Remove the static package**

Delete the old HTML/CSS/JS/PDF only after Step 1 passes. Update every resource/course link to extensionless Astro routes.

- [ ] **Step 3: Remove proven dead code**

Use Git search to verify zero imports before deleting unused experiments such as old burning-circuit/unused brand components and obsolete resume utilities. Do not delete a component merely because it is absent from one page.

- [ ] **Step 4: Verify zero stale links**

Run internal-link and sitemap checks. Search for `.html` under course URLs and for the deleted static base path.

- [ ] **Step 5: Commit**

```bash
git add -A public/silicon-ashes/courses src scripts docs
git commit -m "refactor: retire static course package"
```

## Task 11: Modularize QA and Gate Deployment

**Files:**
- Create focused QA scripts listed in File Structure
- Modify: `scripts/qa-check.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Split contract checks**

Keep each script below 350 lines. Shared JSON/file/url helpers live in `scripts/lib/contracts.mjs`. No script imports TypeScript directly.

- [ ] **Step 2: Add missing behavioral checks**

Cover canonical/alternate tags, real fragment targets, one nav/footer/runtime, keyboard menu/Escape, copy-button status, 44px targets, reduced motion, course reachability, print rendering, and corrupt UTF-8 markers.

- [ ] **Step 3: Make the full check explicit**

Set `check` to run, in order:

```text
format:check → lint → typecheck → build → route contract → data contract → course content release → content → writer → PWA → browser routes → accessibility → visual → silicon-embers UI → performance/security
```

Use a small cross-platform Node runner to set `COURSE_RELEASE=1`; do not place PowerShell syntax in `package.json`.

- [ ] **Step 4: Gate deployment**

The workflow runs `npm ci` then `npm run check`; upload/deploy steps depend on that job succeeding. Keep GitHub Pages output at `dist/`.

- [ ] **Step 5: Prove gates detect regressions**

Temporarily introduce and revert, one at a time: a missing anchor, duplicate route, 43px target, missing course source, and 719-minute total. Confirm the relevant gate fails before restoring the valid file.

- [ ] **Step 6: Commit**

```bash
git add scripts package.json .github/workflows/deploy.yml
git commit -m "test: modularize and gate site qa"
```

## Task 12: Accessibility, Performance, Security, and Documentation Pass

**Files:**
- Modify relevant layouts/components/styles
- Modify docs listed in File Structure

- [ ] **Step 1: Fix current tap-target failures**

Ensure interactive anchors/buttons have `min-height: 44px` and sufficient inline padding without applying minimum height to non-interactive text. Re-run accessibility QA at 320, 360, 390, 768, and 1440 widths.

- [ ] **Step 2: Optimize `EmberField`**

Cache geometry once per animation frame, pause RAF when offscreen or `document.hidden`, respect `prefers-reduced-motion`, and do not mount it on course or resume pages.

- [ ] **Step 3: Recheck CSP/PWA/security**

Confirm no course CDN fonts/icons, no unsafe HTML injection, no admin/write caching, no query-string caching, and no secret-like strings in public output.

- [ ] **Step 4: Synchronize documentation**

Update product identity, Astro version, routes, content workflows, course authoring, validation commands, and public/private boundaries. Remove statements that `/` is the resume home or that course pages are edited under `public/`.

- [ ] **Step 5: Commit**

```bash
git add src public scripts README.md CLAUDE.md PUBLIC_ASSETS.md docs .github package.json package-lock.json
git commit -m "docs: align brand course and release workflow"
```

## Task 13: Final Verification, Main Integration, and Branch Cleanup

**Files:**
- All valid changed files.

- [ ] **Step 1: Format only scoped source files**

Run:

```bash
npm run format
```

Review the diff and revert no user work. If formatting touches unrelated legacy files, narrow the format command and restore only formatter-created changes using a patch, never `git reset --hard`.

- [ ] **Step 2: Run the complete fresh gate**

```bash
npm run check
```

Expected: exit code 0 with zero failures.

- [ ] **Step 3: Inspect final Git state**

```bash
git status --short
git diff --check
git log --oneline main..HEAD
```

Expected: only intended unstaged changes, no whitespace errors, and all feature commits visible.

- [ ] **Step 4: Commit remaining valid changes**

Stage reviewed source/content/docs/public assets explicitly. Do not stage ignored screenshots/output. Commit with a scoped message; repeat until `git status --short` is empty.

- [ ] **Step 5: Fast-forward `main`**

Because `main` has no unique commits, switch to `main` and fast-forward:

```bash
git switch main
git merge --ff-only codex/quality-hardening
```

- [ ] **Step 6: Verify again on `main`**

```bash
npm run check
git status --short --branch
```

Expected: full gate passes and branch is `main` with a clean worktree.

- [ ] **Step 7: Delete every other local branch**

```bash
git branch -d codex/quality-hardening
git branch --format='%(refname:short)'
```

Expected: only `main` remains locally. Do not delete remote branches unless the user explicitly asks; none currently exist besides `origin/main`.

## Plan Self-Review

- Spec coverage: product routes, shared platform, brand domain, resume domain, complete course rewrite, accessibility, security, performance, QA, deployment, Git integration, and branch cleanup are all mapped to tasks.
- Completeness scan: every task names concrete files, commands, expected results, and failure behavior.
- Type consistency: route language is always `SiteLang`; course modules, route IDs, resume variants, resource categories, and control variants use one declared vocabulary.
- Safety: valid dirty-worktree content is preserved; only reproducible artifacts are ignored; static course files are deleted only after replacement verification; integration uses fast-forward only.
