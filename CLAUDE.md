# 硅基余烬项目规范

## 项目边界

Astro 6 静态站，部署到 GitHub Pages。站点包含三个清晰领域：

- 品牌：`/`、`/silicon-ashes/**`，中文为主、英文对称入口。
- 课程：`/silicon-ashes/courses/ai-research-efficiency/**`，完整内容为中文。
- 简历：`/profile/**` 及证据、材料、项目页面。

根路径是品牌首页，不是简历；简历固定放在 `/profile/`。

## 架构

- `src/layouts/DocumentLayout.astro`：唯一文档 head/runtime 基线。
- `src/layouts/SiliconEmbersLayout.astro`：唯一品牌 shell 所有者。
- `src/layouts/CourseLayout.astro`：课程章节、目录、来源与前后导航。
- `src/content/blog/`：文章 Content Collection。
- `src/content/course/`：六个课程 MDX 单元。
- `src/data/routes.json` + `src/lib/siteRoutes.ts`：公共静态/兼容路由契约。
- `src/data/siliconAshesResources.ts`：统一资源注册表。
- `src/components/course/`：课程教学块。

页面组件只渲染内容，不重复品牌导航、页脚、主题或 PWA runtime。

## 内容规则

### 品牌

顶部导航固定为博客 / 资源 / 关于 / 语言 / 主题。课程不进入一级导航。旧 `/blog/**` 只做 canonical 兼容入口，文章正文 canonical 位于 `/silicon-ashes/writing/**`。

### 课程

课程总时长 720 分钟；产品演示 240–300 分钟；WorkBuddy 专属时间不超过 60 分钟。产品功能必须有官方来源和复核日期，无法核验时只写“本地复核”及边界。

课程正文使用 `Concept`、`Analogy`、`Checkpoint`、`Exercise`、`ProductDemo`、`InstructorNote`，不在 MDX 里重画页面结构。

### 简历与证据

公开站只使用脱敏字段。禁止手机号、学号、证件号、出生日期、私人 token、未公开论文、私人知识库和未脱敏实验数据。

## 修改原则

- 先读 route/data/layout，再改页面。
- 静态路由从 `routePath()` / `alternatePath()` 派生；不要散落硬编码 canonical。
- 资源分组从统一 registry 派生；不要维护第二份列表。
- 共享控件使用 `ActionButton` / `CopyButton`；不要直接写 `.sa-control`。
- `public/styles/site.css` 是生成物，只改 `src/styles/`。
- 旧静态课程包已退役，不得重新加入 `.html` 课程页。

## 验证

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run check
```

课程发布门禁：

```powershell
$env:COURSE_RELEASE='1'; node scripts/course-content-qa.mjs
node scripts/course-route-qa.mjs
```

提交使用 `type: description`，保持提交内容单一。完整内容/品牌维护说明见 `docs/content-workflow.md` 与 `docs/silicon-embers-development.md`。
