# 硅基余烬｜品牌内容与科研课程平台

这是一个基于 Astro 6 的双语品牌站、公开简历与科研课程平台。

- `/` 与 `/en/`：品牌首页，连接文章、资源、课程与关于页面。
- `/profile/` 与 `/en/profile/`：独立的公开简历入口。
- `/silicon-ashes/courses/ai-research-efficiency/`：12 小时中文完整课程。
- 英文课程入口明确说明：完整教学内容为中文。

## 产品定位

- 品牌优先：硅基余烬是站点主叙事，课程与资源服务于长期内容沉淀。
- 方法优先：课程约 60% 讲方法、40% 做产品实践，不做工具功能堆砌。
- 科研通用：面向广泛科研人员，案例与练习以化学、化工教师为主。
- 证据可核验：公开简历、材料、证书与项目说明通过结构化引用关联。
- 线下优先：课程适合 12 小时线下授课，同时保留自学目录、答案、讲师提示与打印讲义。

## 技术栈

- Astro 6 + TypeScript
- Astro Content Collections + MDX
- 统一品牌、文档与课程 Layout
- Playwright 浏览器 QA
- ESLint、Prettier、Husky、lint-staged
- GitHub Pages / GitHub Actions

## 目录结构

```text
src/
  components/
    course/                    # 统一教学块
    silicon-embers/            # 品牌站组件
  content/
    blog/                      # 双语文章
    course/                    # 六个中文课程单元（MDX）
  data/                        # 路由、品牌、课程、简历与证据目录
  layouts/                     # Document / Brand / Course / Print Layout
  pages/                       # 品牌、简历、课程与兼容路由
  styles/                      # 全局、品牌与课程样式
scripts/
  course-content-qa.mjs        # 720 分钟、产品比例、来源与发布门禁
  course-route-qa.mjs          # 课程路由、首页链接与 sitemap
  route-contract-qa.mjs        # 公共路由契约
  qa-check.mjs                 # 浏览器行为检查
public/
  assets/                      # 经审核的公开图片与证明材料
```

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run format:check
npm run typecheck
npm run check
```

课程发布前额外运行：

```powershell
$env:COURSE_RELEASE='1'; node scripts/course-content-qa.mjs
node scripts/course-route-qa.mjs
```

## 主要页面

| 领域     | 中文路径                                         | 英文路径                                            | 用途                         |
| -------- | ------------------------------------------------ | --------------------------------------------------- | ---------------------------- |
| 品牌首页 | `/`                                              | `/en/`                                              | 文章、资源、课程、关于分流   |
| 文章     | `/silicon-ashes/writing/`                        | `/en/silicon-ashes/writing/`                        | 长期内容沉淀                 |
| 资源     | `/silicon-ashes/resources/`                      | `/en/silicon-ashes/resources/`                      | 模板、清单、课程与工作流入口 |
| 课程网关 | `/silicon-ashes/courses/`                        | `/en/silicon-ashes/courses/`                        | 课程结构与入口               |
| 完整课程 | `/silicon-ashes/courses/ai-research-efficiency/` | `/en/silicon-ashes/courses/ai-research-efficiency/` | 中文正文 / 英文说明入口      |
| 关于     | `/silicon-ashes/about/`                          | `/en/silicon-ashes/about/`                          | 品牌、背景与联系             |
| 公开简历 | `/profile/`                                      | `/en/profile/`                                      | 教育、项目、荣誉与能力       |
| 证据     | `/evidence/`                                     | `/en/evidence/`                                     | 公开证书与证明材料           |
| 材料     | `/materials/`                                    | `/en/materials/`                                    | 场景化公开材料入口           |

旧 `/silicon-ashes/` 与 `/blog/` 仅保留无重复正文的兼容入口；旧静态课程 `.html` 不再保留。

## 内容维护

### 文章

在 `src/content/blog/` 新增 Markdown；文章 canonical 位于 `/silicon-ashes/writing/`。

### 课程

在 `src/content/course/` 维护六个 MDX 单元。frontmatter 记录时长、产品时间、前置单元、目标、交付物、官方来源与复核日期。正文教学块复用：

- `Concept`
- `Analogy`
- `Checkpoint`
- `Exercise`
- `ProductDemo`
- `InstructorNote`

### 品牌资源

在 `src/data/siliconAshesResources.ts` 的统一注册表维护。每条资源必须属于固定 category；`getResourceIndexGroups(lang)` 自动派生分组，不维护第二份列表。

### 简历与证据

公开页面只使用脱敏数据。禁止提交学号、证件号、出生日期、私人联系方式、未公开论文与未脱敏实验数据。

## QA 覆盖

最终门禁覆盖：

- Astro 构建、ESLint、Prettier 与类型检查
- 路由契约、canonical、sitemap 与 PWA
- 课程 6 单元 / 720 分钟 / 产品时间 240–300 分钟
- WorkBuddy 专属时间不超过 60 分钟
- 产品内容官方来源与复核日期
- 品牌 shell、导航、复制按钮与动画生命周期
- 内部链接、移动端溢出、点击目标、打印与公开隐私

## 部署

GitHub Actions 只有在完整门禁通过后才构建并发布 `dist/`。本地发布前运行：

```bash
npm ci
npm run check
npm run build
```

更详细的维护规则见 `docs/content-workflow.md` 与 `docs/silicon-embers-development.md`。
