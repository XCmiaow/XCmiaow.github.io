# Brand-First Site and Research AI Course Refactor Design

## Context

The repository is no longer a single resume site. It now contains two public products inside one Astro application:

- `silicon-embers`, a content brand for essays, resources, courses, and WeChat follow-up;
- Xujie Fang's bilingual academic resume, evidence, materials, cases, and printable resumes.

The implementation has moved the brand home page to `/` and the resume home page to `/profile/`, but the documentation, route contracts, PWA manifest, SEO links, and parts of the resume data still assume that `/` is the resume home page. The brand product also exists in several overlapping forms: `/` and `/silicon-ashes/` duplicate the home page, `/blog/` and `/silicon-ashes/writing/` duplicate articles, and every localized brand route repeats a complete HTML document.

The course package is the largest architectural break. It contains 26 hand-written HTML pages, shared CSS and JavaScript, duplicated navigation, broken links, unreachable pages, placeholder pages presented as active material, and at least one corrupted reference page. Its historical requirements also conflict: one overview promises an eight-hour course, while the WorkBuddy track promises five two-hour sessions.

The current dirty branch contains 17 commits beyond `main` plus a large uncommitted redesign and hardening pass. Before this refactor, ESLint passes and the Astro build succeeds, but formatting fails in two files and the full QA gate stops at route/tap-target failures. The final repository must preserve all valid source, content, documentation, and reviewed public assets, while excluding temporary screenshots, Playwright output, visual-companion state, caches, and other reproducible audit artifacts.

## Confirmed Product Decisions

1. The product is brand-first.
   - `/` is the canonical Chinese `silicon-embers` home page.
   - `/en/` is the canonical English brand home page.
   - `/profile/` and `/en/profile/` are the resume home pages.
2. The brand's primary navigation remains Blog / Resources / About / language / theme.
3. Courses are a resource submodule and never return to the primary navigation.
4. The old course `.html` URLs do not require compatibility redirects.
5. The static course package will be completely migrated to Astro and its content rewritten.
6. The new course is twelve hours.
7. The course targets non-computing researchers broadly, while examples and exercises primarily use chemistry and chemical-engineering teaching/research scenarios.
8. The course is designed for in-person teaching first and independent review second.
9. Durable methods occupy about 60% of teaching time; concrete products occupy about 40%.
10. WorkBuddy is a short practice vehicle rather than the organizing principle of the course.
11. The complete course is Chinese. English pages provide an accurate overview and clearly state that the course content is Chinese.
12. Course prose is stored in an Astro Content Collection and rendered through unified components.

## Goals

- Make the actual brand-first product architecture explicit in code, content, SEO, PWA behavior, documentation, and tests.
- Give brand, resume, and course code clear domain boundaries while sharing infrastructure.
- Replace duplicated route declarations with one typed route manifest.
- Replace duplicated localized page templates with shared components that accept language and stable entity IDs.
- Normalize resume facts so GPA, ranking, awards, projects, evidence, materials, and claims are defined once and referenced consistently.
- Replace the hand-written static course package with a structured Astro course domain.
- Rewrite the course as an accurate, teachable twelve-hour curriculum.
- Make every public route keyboard-accessible, mobile-safe, secure, and testable.
- Make `npm run check` a real deployment gate.
- Finish with a clean `main` branch and no other local branches.

## Non-Goals

- No framework migration away from Astro 6.
- No React/Vue/Svelte island layer or general-purpose state library.
- No backend, database, authentication system, learning-management system, or learner progress account.
- No automatic scraping of WeChat content.
- No public exposure of private evidence, raw PDFs, Obsidian vault data, tokens, student IDs, birth dates, or application packets.
- No promise to preserve old course `.html` routes.
- No product-specific claim, version, flag, package, or command that has not been checked against current official documentation during implementation.
- No visual rewrite of the resume merely to match the brand; the two products retain distinct visual identities.

## Information Architecture

### Brand Domain

- `/` and `/en/`: canonical brand home pages.
- `/silicon-ashes/writing/` and `/en/silicon-ashes/writing/`: canonical blog indexes and articles.
- `/silicon-ashes/resources/` and `/en/silicon-ashes/resources/`: resource hubs.
- `/silicon-ashes/about/` and `/en/silicon-ashes/about/`: brand and contact context.
- `/silicon-ashes/feed/` and `/en/silicon-ashes/feed/`: WeChat entry pages, not subscription systems.
- `/silicon-ashes/courses/`: course gateway.
- `/silicon-ashes/courses/ai-research-efficiency/`: Chinese course home.
- `/en/silicon-ashes/courses/ai-research-efficiency/`: English overview that states the full course is Chinese.

`/silicon-ashes/` becomes a compatibility entry that points to `/` and is not independently indexed. Old `/blog/` content is no longer an independently indexed copy; the brand writing routes are canonical.

### Resume and Credibility Domain

The existing stable public routes remain available to avoid unrelated churn:

- `/profile/`, `/en/profile/`
- `/evidence`, `/en/evidence`
- `/materials`, `/en/materials`
- `/modeling`, `/en/modeling`
- `/chem-ai-lab`, `/en/chem-ai-lab`
- `/ai-km`, `/en/ai-km`
- `/resume-onepage`, `/en/resume-onepage`
- `/resume-academic`, `/en/resume-academic`
- `/resume-career`, `/en/resume-career`

All links that previously targeted missing root-page anchors are updated to the correct `/profile/` anchors.

## Shared Platform Architecture

### Route Manifest

Create one typed route manifest that records:

- route ID;
- domain;
- localized paths;
- canonical policy;
- sitemap inclusion;
- PWA shell inclusion;
- expected page title/H1;
- whether the route is public, local-only, generated, or compatibility-only.

Navigation, language switching, sitemap generation, service-worker shell validation, browser QA, and documentation checks consume this manifest. Course lesson routes are derived from the course collection and joined to the manifest at build time.

### Document and Runtime Layers

Create a shared document layer responsible for:

- charset and viewport;
- title, description, canonical, alternate-language links, Open Graph, and Twitter metadata;
- `SecurityMeta`;
- theme color and stylesheet loading;
- the single PWA registration path;
- the single theme runtime.

Brand and resume layouts wrap this shared document layer but retain their own navigation, footer, and visual tokens.

Client behavior is split into small, purpose-specific modules rather than one implicit script. Theme, mobile menu, copy controls, lightbox behavior, and external-link hardening each have an explicit owner. Event listeners are registered once, support keyboard use, and cleanly handle missing optional elements.

## Brand Domain Design

- `SiliconEmbersLayout` becomes the only complete brand document shell.
- `SiliconEmbersSiteFrame` owns the brand navigation, main frame, and footer.
- `SiliconAshesHome` only composes home-page sections.
- Brand navigation and footer contact links come from one localized copy/config source.
- Resource entries include their category in the registry; indexes are derived instead of manually duplicated.
- Templates must appear in exactly one resource category.
- Blog collection queries, sorting, canonical paths, previous/next navigation, RSS, and language behavior use shared helpers.
- `/feed/` consistently means WeChat. It contains a real keyboard-accessible copy button and never promises email/RSS subscription.
- Unused brand components, obsolete visual experiments, duplicate copy blocks, and dead data fields are removed after reference checks.

## Resume and Credibility Domain Design

Normalize the resume data around stable IDs and localized fields. GPA, ranks, projects, achievements, evidence, materials, and claims are not copied into six page templates.

The schema enforces:

- unique IDs;
- complete required Chinese and English fields;
- valid evidence/material/project references;
- evidence-backed claims with at least one public evidence item;
- case-backed claims with at least one valid public route;
- privacy-safe public text;
- consistent achievement selection across printable variants;
- consistent ChemAI module counts and other derived metrics.

Shared page components render profile, evidence, materials, modeling, ChemAI, AI-KM, blog index/article, and resume variants. Route files provide only language, variant, and route metadata. Print CSS stays specialized, but the six printable routes use one `ResumePage` implementation.

## Course Content Architecture

### Collection Contract

Add a `course` Content Collection. Each entry contains:

- `id`: stable identifier;
- `module`: one of the six teaching units or a support group;
- `order`: unique order within the course;
- `durationMinutes`: planned teaching duration;
- `kind`: lesson, lab, instructor guide, reference, or handout section;
- `title` and `summary`;
- `objectives`;
- `prerequisites`;
- `deliverables`;
- `sources` with titles and official URLs where applicable;
- `reviewedAt` for time-sensitive product information;
- optional instructor timing and common-mistake notes.

The complete lesson sequence must total 720 minutes. Duplicate order values, missing required fields, missing sources for time-sensitive product facts, or invalid prerequisites fail the build.

MDX contains the teaching narrative and explicit semantic teaching blocks. Frontmatter contains contract data. Course structure is never inferred from arbitrary headings inside prose. The implementation uses Astro's official MDX integration so entries can call the shared `Analogy`, `ResearchExample`, `ProductDemo`, `Exercise`, `Checkpoint`, `InstructorNote`, and `SafetyWarning` components without inventing a custom parser.

### Rendering

- A single catch-all Astro route renders lesson entries by slug.
- `CourseLayout` provides document metadata, brand context, course navigation, module progress, previous/next links, and print behavior.
- Shared components render objectives, analogies, examples, product demonstrations, exercises, checkpoints, instructor notes, warnings, source lists, and deliverables.
- The course home, schedule, instructor guide, reference, and printable handout are derived from collection metadata and entries rather than duplicated.
- The old static course HTML, CSS, theme JavaScript, placeholder pages, and stale PDF are removed after the Astro equivalents pass verification.

## Twelve-Hour Curriculum

### Unit 1 — AI History and Capability Map (120 minutes)

Explain expert systems, machine learning, deep learning, Transformers, generative AI, retrieval systems, and agents. Learners distinguish generation, retrieval, reasoning, and action. The deliverable is a personal AI tool map and plain-language terminology sheet.

### Unit 2 — A Practical Mental Model of LLMs (120 minutes)

Explain tokens, context windows, probabilistic generation, hallucination, reasoning models, temperature, knowledge limits, retrieval-augmented generation, and source verification. Chemistry naming, reaction conditions, and academic citations demonstrate plausible-looking errors. The deliverable is an answer-risk diagnostic card.

### Unit 3 — Task, Prompt, Context, and Acceptance (120 minutes)

Teach goals, source materials, constraints, examples, output formats, and acceptance criteria. Learners convert vague requests into task briefs for literature reading, experimental planning, academic writing, data work, and teaching material. The deliverables are three reusable task templates and a context-material checklist.

### Unit 4 — Web, API, Files, Cost, and Safety (120 minutes)

Explain web apps, clients, APIs, API keys, servers, proxy/relay concepts, CLI versus GUI, files, cost, rate limits, and network boundaries. Windows is the primary operating-system path, with macOS notes where behavior differs. Privacy, unpublished research data, copyright, credentials, and institutional policy are explicit. The deliverables are a safe-configuration checklist and a data/tool boundary matrix.

### Unit 5 — From Chat to Controlled Agents (120 minutes)

Teach plans, permissions, commands, logs, human confirmation, harnesses, loops, and Git checkpoints. WorkBuddy, Claude Code, and Codex are replaceable comparisons rather than permanent assumptions. WorkBuddy-specific instruction is about 45 minutes. The deliverable is one recorded plan-execute-verify task.

### Unit 6 — Research Workflow Studio (120 minutes)

Learners choose a real literature, writing, data, teaching, or proposal task and define input, tool, AI output, human review, storage, and reuse. Chemistry and chemical-engineering examples are provided, but other disciplines can substitute their own materials. The final package includes a workflow diagram, tool choice table, three task templates, context checklist, and safety/acceptance checklist.

## Teaching Pattern

Every lesson follows the same progression:

1. familiar intuition or research pain;
2. accurate terminology and mechanism;
3. a chemistry/chemical-engineering example;
4. a minimal product demonstration;
5. learner practice;
6. an observable acceptance check.

The main prose must be sufficient for independent review. Instructor notes add timing, classroom prompts, common mistakes, and fallback demonstrations without hiding required knowledge from self-study readers. Each MDX entry imports teaching blocks from one stable module; the blocks own markup and accessibility while the entry owns only content.

## Visual and Interaction Design

The course inherits the dark ember editorial identity but optimizes for long reading and classroom projection:

- maximum prose width around 72 characters;
- stable heading hierarchy and generous line height;
- desktop chapter rail and mobile expandable table of contents;
- visible duration, objectives, deliverables, and progress;
- visually distinct analogy, example, exercise, checkpoint, instructor-note, warning, and source blocks;
- at least 44 by 44 CSS-pixel interactive targets;
- keyboard-operable navigation, copy, disclosure, dialog, and menu behavior;
- visible focus states;
- reduced-motion support;
- a light print treatment generated from the same course source.

Course prose pages do not load the particle canvas. `EmberField` remains an optional brand-home enhancement, caches geometry, and pauses when offscreen or when the document is hidden.

## Accuracy, Security, and Error Handling

- Current product descriptions, commands, packages, versions, flags, limitations, and security advice are checked against official documentation during implementation.
- Durable method sections and time-sensitive product sections remain visibly separate.
- Product sources and review dates are shown in the reference layer.
- No unsourced efficiency percentages or fabricated product capabilities are allowed.
- Missing course entries produce the branded 404 rather than silently redirecting to unrelated content.
- External links use safe target/rel behavior.
- CSP remains centralized; course migration removes Google Fonts and Font Awesome CDN dependencies.
- Service Worker caching remains allowlisted and excludes admin/write paths and query-string requests.
- Public-content validation rejects private-looking identifiers, debug placeholders, encoding corruption, and invalid cross-references.

## QA and Deployment

Split the current monolithic QA surface into focused contracts:

- route/canonical/sitemap/alternate-language checks;
- anchor and internal-link checks;
- data-schema and cross-reference checks;
- course duration/order/prerequisite/source checks;
- content encoding and forbidden-text checks;
- accessibility and keyboard interaction checks;
- responsive overflow and tap-target checks;
- visual smoke checks;
- print checks;
- PWA/offline checks;
- performance/security checks.

All route-aware checks consume the route manifest. Tests must detect missing anchor targets rather than only confirming the path returns HTTP 200.

The deployment workflow runs install, lint, format check, Astro type check, build, and the full project check before deployment. Deployment never runs when a gate fails.

## Migration and Git Strategy

1. Record the dirty-worktree inventory and classify valid source/content/assets versus reproducible temporary artifacts.
2. Commit the approved design and implementation plan without staging unrelated work.
3. Stabilize shared route/document/runtime contracts.
4. Consolidate the brand domain.
5. Normalize the resume/credibility domain and shared localized templates.
6. Add the course collection, layout, derived routes, and validation.
7. Rewrite all course content and build the instructor/reference/print views.
8. Remove the old static course package and duplicate/dead code after replacement verification.
9. Modularize QA and update CI/deployment.
10. Run the complete gate on the final integrated tree.
11. Commit all valid changes on the existing feature branch, fast-forward `main`, verify again on `main`, and delete every other local branch.

No hard reset, force push, or silent discard of user-authored source/content is allowed. Temporary `.codex-*.png`, `output/playwright/`, visual-companion state, logs, caches, and other reproducible audit artifacts are excluded from Git rather than merged as product files.

## Acceptance Criteria

- `/` and `/en/` are the only canonical brand home pages.
- `/profile/` and `/en/profile/` are the resume homes, and all resume-domain anchors resolve.
- Primary brand navigation is Blog / Resources / About / language / theme.
- The course is only exposed through resources/course context, not primary navigation.
- There is one canonical blog route per article.
- Brand pages use one document shell, navigation, footer, theme runtime, and PWA runtime.
- Resume page pairs share templates and localized data rather than duplicated structures.
- Resume facts and cross-references pass schema validation.
- The Chinese course contains six units totaling 720 minutes.
- WorkBuddy-specific instruction is approximately 45 minutes.
- Every course lesson has objectives, practice, an acceptance check, deliverables, and applicable sources.
- The English course entry clearly states that the full course is Chinese.
- Course old `.html` pages, broken links, placeholders, corrupted text, duplicated static shell, and stale PDF are gone.
- Course navigation reaches every active lesson.
- No external font/icon CDN is required for the course.
- Keyboard, reduced-motion, 390px, 768px, 1440px, and print checks pass.
- `npm run lint`, `npm run format:check`, Astro type checking, `npm run build`, and `npm run check` all exit successfully.
- GitHub Actions runs the full gate before deployment.
- The final worktree is clean on `main` and no other local branches remain.
