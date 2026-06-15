# AI-KM Evidence Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual AI-KM case page and claim-to-evidence matrix, then ship it through the existing GitHub Pages production pipeline.

**Architecture:** Keep the site static and data-driven. Add `claims.json` as the proof matrix, render it inside new Astro pages, connect the route through existing project/material data, and expand existing QA to validate routes, PWA shell, and cross-data references.

**Tech Stack:** Astro 6, static JSON data, TypeScript data imports, existing CSS tokens, Playwright QA, GitHub Pages Actions.

---

## File Structure

- Create `src/data/claims.json`: structured claim matrix with localized copy and proof links.
- Create `src/pages/ai-km.astro`: Chinese AI-KM case page.
- Create `src/pages/en/ai-km.astro`: English AI-KM case page.
- Modify `src/data/common.json`: set `ai-km` project link to `/ai-km`.
- Modify `src/data/materials.json`: add public AI-KM case material.
- Modify `scripts/qa-check.mjs`: add routes, headings, claim schema validation, and claim reference checks.
- Modify `public/sw.js`: cache `/ai-km` and `/en/ai-km`.

## Task 1: Add Claim Data and Static Validation

**Files:**
- Create: `src/data/claims.json`
- Modify: `scripts/qa-check.mjs`

- [ ] **Step 1: Create claim data**

Create `src/data/claims.json` with this structure:

```json
{
  "items": [
    {
      "id": "modeling-practice",
      "category": "modeling",
      "status": "evidence-backed",
      "risk": "low",
      "evidenceIds": [
        "cumcm-2024-jiangsu-first",
        "mcm-2025-honorable-mention",
        "mcm-2026-honorable-mention",
        "mathorcup-2025-second",
        "math-competition-2025-third"
      ],
      "materialIds": ["modeling-case"],
      "routes": ["/modeling", "/en/modeling", "/evidence", "/en/evidence"],
      "zh": {
        "title": "数学建模训练",
        "claim": "能把开放问题拆成变量、假设、模型、数据处理和论文表达。",
        "boundary": "证据来自公开获奖证书；具体赛题论文不在公开站点发布。"
      },
      "en": {
        "title": "Modeling Practice",
        "claim": "Able to turn open-ended problems into variables, assumptions, models, analysis, and written arguments.",
        "boundary": "Supported by public award certificates; full competition papers are not published on the public site."
      }
    },
    {
      "id": "academic-performance",
      "category": "academic",
      "status": "evidence-backed",
      "risk": "low",
      "evidenceIds": ["national-inspirational-scholarship-2025", "three-good-student-2025"],
      "materialIds": ["academic-resume", "general-resume"],
      "routes": ["/resume-academic", "/en/resume-academic", "/evidence", "/en/evidence"],
      "zh": {
        "title": "学业表现与综合荣誉",
        "claim": "GPA、排名、奖学金和校级荣誉共同支撑稳定的学习表现。",
        "boundary": "公开站点只展示脱敏结果和证书，不展示学号、出生年月或完整评审材料。"
      },
      "en": {
        "title": "Academic Performance",
        "claim": "GPA, ranking, scholarship, and university merit recognition support sustained academic performance.",
        "boundary": "The public site shows sanitized outcomes and certificates, not student ID, birth date, or full review files."
      }
    },
    {
      "id": "chemistry-foundation",
      "category": "chemistry",
      "status": "evidence-backed",
      "risk": "low",
      "evidenceIds": ["chemistry-olympiad-2022", "chemistry-olympiad-2023"],
      "materialIds": ["chem-ai-lab"],
      "routes": ["/chem-ai-lab", "/en/chem-ai-lab", "/evidence", "/en/evidence"],
      "zh": {
        "title": "化学学科基础",
        "claim": "高中阶段化学竞赛训练支撑后续有机化学、计算化学和 AI 化学方向兴趣。",
        "boundary": "证据限于公开证书；本科阶段研究项目仍以方向说明和学习路径为主。"
      },
      "en": {
        "title": "Chemistry Foundation",
        "claim": "Chemistry competition training supports later interest in organic chemistry, computational chemistry, and AI chemistry.",
        "boundary": "Evidence is limited to public certificates; undergraduate research work remains framed as direction and training."
      }
    },
    {
      "id": "research-workflow",
      "category": "workflow",
      "status": "case-backed",
      "risk": "medium",
      "evidenceIds": [],
      "materialIds": ["ai-km-case"],
      "routes": ["/ai-km", "/en/ai-km", "/materials", "/en/materials"],
      "zh": {
        "title": "AI-KM 科研学习工作流",
        "claim": "能用 AI 工具、Zotero、Obsidian、Markdown 与 LaTeX 管理文献阅读、学习复盘和科研表达。",
        "boundary": "当前是公开案例说明，不发布私人知识库、原始 PDF、账号信息或未脱敏笔记截图。"
      },
      "en": {
        "title": "AI-KM Research Workflow",
        "claim": "Uses AI tools, Zotero, Obsidian, Markdown, and LaTeX to manage reading, reflection, and research communication.",
        "boundary": "This is a public case narrative; private vault content, raw PDFs, account data, and unsanitized note screenshots stay unpublished."
      }
    },
    {
      "id": "public-portfolio-system",
      "category": "portfolio",
      "status": "case-backed",
      "risk": "low",
      "evidenceIds": [],
      "materialIds": ["general-resume", "evidence-gallery", "modeling-case", "chem-ai-lab", "ai-km-case"],
      "routes": ["/", "/en/", "/materials", "/en/materials"],
      "zh": {
        "title": "公开作品集系统",
        "claim": "能把简历、证据、项目说明、材料入口和自动化 QA 组织成可维护的双语静态站点。",
        "boundary": "站点本身是项目案例；生产源码和部署记录由仓库与 Actions 维护。"
      },
      "en": {
        "title": "Public Portfolio System",
        "claim": "Organizes resumes, evidence, project narratives, material routing, and automated QA into a maintainable bilingual static site.",
        "boundary": "The site itself is the project case; source and deployment records are maintained through the repository and Actions."
      }
    },
    {
      "id": "campus-collaboration",
      "category": "service",
      "status": "evidence-backed",
      "risk": "low",
      "evidenceIds": [
        "debate-second-2024",
        "card-house-volunteer-2024",
        "volleyball-freshman-2024-second",
        "high-jump-2025-fourth",
        "volleyball-college-2026-fourth"
      ],
      "materialIds": ["academic-resume", "general-resume"],
      "routes": ["/resume-academic", "/en/resume-academic", "/evidence", "/en/evidence"],
      "zh": {
        "title": "校园协作与综合发展",
        "claim": "辩论、志愿服务和体育活动共同支撑表达、协作、组织与长期参与能力。",
        "boundary": "公开证据只用于说明综合发展，不替代正式学生工作证明或完整活动记录。"
      },
      "en": {
        "title": "Campus Collaboration",
        "claim": "Debate, volunteer service, and sports activities support communication, collaboration, organization, and sustained participation.",
        "boundary": "Public evidence explains broader development, not a substitute for formal student-work records."
      }
    }
  ]
}
```

- [ ] **Step 2: Extend QA route list and expected headings**

In `scripts/qa-check.mjs`, add:

```js
'/ai-km',
'/en/ai-km',
```

to `routes`, and add:

```js
  '/ai-km': 'AI 辅助科研学习与知识管理',
  '/en/ai-km': 'AI-Assisted Learning & Knowledge Management',
```

to `expectedHeadings`.

- [ ] **Step 3: Add claim schema constants**

Add constants near the existing material validation constants:

```js
const requiredClaimFields = [
  'id',
  'category',
  'status',
  'risk',
  'evidenceIds',
  'materialIds',
  'routes',
  'zh',
  'en',
];
const requiredClaimLocaleFields = ['title', 'claim', 'boundary'];
const validClaimCategories = new Set(['academic', 'modeling', 'chemistry', 'workflow', 'portfolio', 'service']);
const validClaimStatuses = new Set(['evidence-backed', 'case-backed', 'narrative-only']);
const validClaimRisks = new Set(['low', 'medium']);
```

- [ ] **Step 4: Validate claims in `runStaticChecks`**

After materials validation is initialized, read `src/data/claims.json`, validate required fields, validate `evidenceIds`, validate `materialIds`, validate routes, enforce status rules, and call `hasForbiddenPublicTextDeep(item)`.

- [ ] **Step 5: Run static syntax check**

Run: `node --check scripts/qa-check.mjs`

Expected: exit code `0`.

## Task 2: Build AI-KM Pages

**Files:**
- Create: `src/pages/ai-km.astro`
- Create: `src/pages/en/ai-km.astro`

- [ ] **Step 1: Create the Chinese page**

Create `src/pages/ai-km.astro` using `BaseLayout`, `PageTrail`, `SectionHead`, and `claims.json`. The H1 must be exactly:

```text
AI 辅助科研学习与知识管理
```

Render sections for hero, workflow, tool stack, outputs, claim matrix, and public boundary. Keep CSS scoped inside the Astro file.

- [ ] **Step 2: Create the English page**

Create `src/pages/en/ai-km.astro` with the same structure and localized copy. The H1 must be exactly:

```text
AI-Assisted Learning & Knowledge Management
```

- [ ] **Step 3: Use only public-safe content**

Do not include local vault paths, raw PDFs, screenshots, phone numbers, birth dates, private accounts, or private note text.

- [ ] **Step 4: Build once**

Run: `npm run build`

Expected: exit code `0` and generated pages under `dist/ai-km` and `dist/en/ai-km`.

## Task 3: Connect Project and Materials Data

**Files:**
- Modify: `src/data/common.json`
- Modify: `src/data/materials.json`

- [ ] **Step 1: Connect project link**

Set the `ai-km` project entry in `src/data/common.json` to:

```json
{ "id": "ai-km", "tags": ["AI Workflow", "Zotero", "Obsidian"], "link": "/ai-km" }
```

- [ ] **Step 2: Add AI-KM material item**

Add a material item:

```json
{
  "id": "ai-km-case",
  "audience": "portfolio",
  "access": "public",
  "kind": "project-case",
  "status": "needs-evidence",
  "evidenceIds": [],
  "riskNote": "Workflow narrative is public, but private vault contents and raw literature files must stay unpublished.",
  "lastReviewed": "2026-06-15",
  "href": { "zh": "/ai-km", "en": "/en/ai-km" },
  "zh": {
    "title": "AI 辅助科研学习与知识管理案例",
    "desc": "说明如何使用 AI 工具、Zotero、Obsidian、Markdown 与 LaTeX 组织文献阅读和研究表达。",
    "action": "查看案例",
    "usage": "科研兴趣说明、项目作品集、AI 工具链展示、学习方法复盘。",
    "status": "工作流案例，待补公开证据"
  },
  "en": {
    "title": "AI-KM Workflow Case",
    "desc": "Explains how AI tools, Zotero, Obsidian, Markdown, and LaTeX support literature reading and research communication.",
    "action": "View case",
    "usage": "Research-interest explanation, portfolio review, AI workflow showcase, and learning reflection.",
    "status": "Workflow case; public evidence pending"
  }
}
```

- [ ] **Step 3: Build once**

Run: `npm run build`

Expected: exit code `0`.

## Task 4: Update PWA Shell and Full QA

**Files:**
- Modify: `public/sw.js`
- Modify: `scripts/qa-check.mjs`

- [ ] **Step 1: Add new shell routes**

Add to `APP_SHELL` in `public/sw.js`:

```js
  '/ai-km',
  '/en/ai-km',
```

- [ ] **Step 2: Run JS syntax checks**

Run:

```bash
node --check public/sw.js
node --check scripts/qa-check.mjs
```

Expected: both exit code `0`.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run lint
npm run format:check
npm run build
npm run qa
```

Expected: all exit code `0`.

## Task 5: Production Sync

**Files:**
- Commit all implementation and relevant existing verified changes.

- [ ] **Step 1: Review diff**

Run: `git status --short` and inspect the net changed files.

- [ ] **Step 2: Commit**

Run:

```bash
git add -A
git commit -m "feat: add ai km evidence loop"
```

Expected: commit succeeds.

- [ ] **Step 3: Push production branch**

Run:

```bash
git push origin main
```

Expected: push succeeds and triggers `.github/workflows/deploy.yml`.

- [ ] **Step 4: Verify remote deployment trigger**

Run:

```bash
git status --short
git log -1 --oneline
```

Expected: local `main` has the new commit and no uncommitted implementation files remain.
