# XCmiaow.github.io — 项目规范

## 项目概述

方绪杰的个人学术简历网站，基于 Astro 构建的中英双语静态站点，部署在 GitHub Pages。

## 技术栈

- **框架**: Astro 5.x (static output)
- **样式**: 单文件 CSS (`public/styles/site.css`)，由 `scripts/generate-site-css.mjs` 从源文件合并生成
- **数据**: JSON 驱动 (`src/data/`)
- **部署**: GitHub Actions (push 到 main 自动构建部署)
- **离线**: Service Worker + APP_SHELL 缓存

## 目录结构

```
/
├── src/
│   ├── pages/           # 页面路由
│   │   ├── index.astro  # 中文首页 (根路径 /)
│   │   ├── en/          # 英文页面 (/en/)
│   │   └── *.astro      # 其它页面
│   ├── components/      # 可复用 Astro 组件
│   ├── layouts/         # 页面布局
│   │   └── BaseLayout.astro  # 所有页面的公共布局
│   ├── data/            # JSON 数据文件
│   │   ├── common.json  # GPA、邮箱、GitHub 等跨语言共用数据
│   │   ├── zh.json      # 中文内容
│   │   ├── en.json      # 英文内容
│   │   └── i18n.json    # UI 标签 (导航、页脚等)
│   └── styles/          # CSS 源文件 (构建时合并到 site.css)
│       ├── global.css   # 全局 CSS 变量、基础样式
│       └── mobile.css   # 移动端响应式样式
├── public/
│   ├── styles/site.css  # 统一样式表 (由 generate-site-css.mjs 生成)
│   ├── manifest.json    # PWA 清单
│   ├── sw.js            # Service Worker
│   └── robots.txt       # 爬虫规则
├── scripts/
│   ├── generate-site-css.mjs  # CSS 合并脚本 (构建前自动运行)
│   └── qa-check.mjs       # QA 检查脚本
├── astro.config.mjs     # Astro 配置 (i18n、站点 URL)
├── CLAUDE.md            # 本文件 — 项目规范
└── package.json
```

## 数据流

```
zh.json / en.json
  → 页面 frontmatter 中 import
  → 组件 props 传递
  → 渲染文本内容

common.json
  → 跨语言共用数据 (GPA、邮箱、GitHub)
  → 项目和标签的共享字段

i18n.json
  → BaseLayout.astro 中注入
  → 导航、页脚等 UI 标签
```

## 中英文体系

| 语言 | 数据文件 | 路由前缀 |
|------|----------|----------|
| 中文 | `src/data/zh.json` | `/` (根路径) |
| 英文 | `src/data/en.json` | `/en/` |

- 中文页面 import `zh.json` + `common.json`，不用 import `en.json`
- 英文页面 import `en.json` + `common.json`，不用 import `zh.json`
- 数据路径：`zh.json` 里 `zh.person.name`，不用写 `.zh` 后缀

## 组件使用规范

所有页面优先使用原子组件，而不是手写 HTML：

| 组件 | 用途 | 示例 |
|------|------|------|
| `SectionHead` | 区域标题 + 可选的描述 | `<SectionHead title="..." description="..." />` |
| `Card` | 卡片容器 | `<Card pad animate><slot /></Card>` |
| `TagRow` | 标签列表 | `<TagRow tags={['A','B']} />` |

### 已有组件

| 组件 | 路径 | 说明 |
|------|------|------|
| BaseLayout | `src/layouts/` | 全局布局 (导航、页脚、主题、进度条、Ripple) |
| Card | `src/components/` | 通用卡片，支持 `pad` `animate` `animateDir` `class` |
| TagRow | `src/components/` | 标签行 |
| SectionHead | `src/components/` | 区域标题 |
| CompetitionTimeline | `src/components/` | 竞赛时间线 (接收 `lang` 和 `competitions` props) |
| ParticlesBackground | `src/components/` | Hero 粒子星空 |
| CursorGlow | `src/components/` | 鼠标光标光晕 |
| Lightbox | `src/components/` | 证书图片放大弹窗 (接收 `images` props) |

## 添加页面的步骤

1. 在 `src/data/zh.json` 和 `src/data/en.json` 中添加内容数据
2. 在 `src/pages/` 创建 `.astro` 文件
3. 使用 `BaseLayout` 包裹，设置 `lang="zh"` 或 `lang="en"`
4. 数据引用路径：中文页用 `zh.xxx`，英文页用 `en.xxx`
5. 在 `src/data/common.json` 中添加共享数据 (如 tags、links)
6. 更新 `BaseLayout` 的导航链接和 `i18n.json` 的标签 (如需)
7. 更新 `public/sw.js` 的 APP_SHELL 缓存列表

## CSS 规范

- 所有 CSS 变量定义在 `src/styles/global.css` 的 `:root` 中
- 页面专属样式写在对应 `.astro` 文件的 `<style>` 块内 (Astro 自动 scoped)
- 不要直接在 `<style>` 中使用 `/src/styles/` 路径的 `@import` — CSS 已合并到 `site.css`
- 颜色使用 CSS 变量: `var(--primary)`, `var(--accent)`, `var(--muted)` 等
- 所有 `.astro` 文件的 `<style>` 块中的 `.card`、`.grid-*` 等基础类已在 `site.css` 定义

## 变量名约定

- **数据引用**: `zh.competitions`, `en.projects`, `c.person.email` (`c` = common)
- **页面 frontmatter**: `const p = zh.person; const edu = zh.education; const c = common;`
- **CSS 类名**: kebab-case (`.portrait-card`, `.tag-row`, `.interest-card`)

## 构建与部署

```bash
# 本地开发
npm run dev

# 构建 (自动运行 generate-site-css.mjs → astro build)
npm run build

# 代码检查
npm run lint          # ESLint 检查
npm run format:check  # Prettier 格式检查
npm run format        # Prettier 自动格式化

# QA 检查 (启动预览服务器后运行)
npm run build && npm run qa  # Playwright 测试所有页面

# 部署
git push origin main  # GitHub Actions 自动构建部署
```

## 提交规范

- 提交前自动运行 `lint-staged`（ESLint + Prettier）
- 提交信息格式：`type: description`（如 `feat: add OG tags`、`fix: repair import path`）
- 如果 husky 未安装：`npm install` 会自动安装

## 代码规范

| 工具 | 用途 | 配置文件 |
|------|------|----------|
| ESLint | JS/TS 代码检查 | `eslint.config.mjs` |
| Prettier | 代码格式化 | `.prettierrc` |
| lint-staged | 暂存文件自动检查 | `package.json` 中的 `lint-staged` 字段 |
| Husky | Git 钩子管理 | `.husky/pre-commit` |

## 智能体开发指南

1. **添加内容** → 修改 `zh.json` / `en.json` / `common.json`，不要碰 `.astro` 模板
2. **修改导航/UI 文本** → 改 `i18n.json`
3. **新增页面** → 按上方"添加页面的步骤"操作
4. **阅读页面逻辑** → 先读 `src/layouts/BaseLayout.astro` 理解整体结构，再读具体页面
5. **修改样式** → 组件样式写在对应 `.astro` 的 `<style>` 中，全局变量在 `global.css`
6. **新增组件** → 放在 `src/components/`，用 `export interface Props` 声明类型
7. **提交前** → 确认 `npm run build` 通过
8. **不要修改** → `public/styles/site.css` 是自动生成的，改 `src/styles/` 下的源文件

## CMS 使用

项目使用 Decap CMS（`/admin/`）进行内容管理。配置在 `public/admin/config.yml`。

- 只能由 GitHub 仓库所有者（XCmiaow）通过 OAuth 登录后编辑
- 编辑内容会直接 commit 到 main 分支并触发自动部署
- 编辑界面在 `https://XCmiaow.github.io/admin/`
- OAuth 代理服务器在 `scripts/oauth-worker.js`（部署在 Cloudflare Workers）

## 隐私规则

- 手机号全站已移除
- 邮箱使用 `2332797170@njfu.edu.cn`
- 证书图片放在 `public/assets/evidence/public/`，原始证书在 `.gitignore` 排除
- 不要在代码中硬编码用户的 GitHub token 或 deploy_key
