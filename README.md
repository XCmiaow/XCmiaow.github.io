# 方绪杰个人学术简历主页

这是一个基于 Astro 构建的中英双语个人简历网站，用于展示教育背景、获奖经历、证明材料、项目作品、一页简历和长期学习方向。

## 项目定位

- 公开主页：适合 GitHub Pages、个人主页链接和合作展示。
- 保研评优：突出 GPA、排名、奖学金、竞赛奖项、学生工作和志愿服务。
- 求职实习：突出数学建模、Python、Astro 网站、AI 工具链和项目落地能力。
- 证据材料：通过证书墙、项目详情页和材料中心支撑核心经历。

## 技术栈

- Astro 6
- HTML / CSS / JavaScript
- TypeScript 数据文件
- Playwright QA
- Prettier / ESLint / Husky / lint-staged

## 目录结构

```text
src/
  components/        # 可复用组件
  data/              # 简历、项目、材料中心等结构化数据
  layouts/           # BaseLayout 与 PrintLayout
  pages/             # 中文页面与英文页面
  styles/            # 全局与移动端样式
scripts/
  generate-site-css.mjs   # 生成稳定 CSS，供 GitHub Pages 使用
  generate-build-meta.mjs # 生成构建元信息
  qa-check.mjs            # 浏览器、路由、移动端、打印页数 QA
public/
  assets/            # 头像、证书图片、站点资源
  styles/site.css    # 构建前生成的稳定样式文件
```

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run format
npm run format:check
npm run lint
npm run check
```

推荐在提交前运行：

```bash
npm run format
npm run check
```

## 页面清单

| 页面       | 中文路径           | 英文路径              | 用途                         |
| ---------- | ------------------ | --------------------- | ---------------------------- |
| 首页       | `/`                | `/en/`                | 公开展示与核心入口           |
| 材料中心   | `/materials`       | `/en/materials`       | 集中选择简历、证据、项目材料 |
| 证据墙     | `/evidence`        | `/en/evidence`        | 奖项证书与证明材料           |
| 数学建模   | `/modeling`        | `/en/modeling`        | 建模竞赛能力说明             |
| ChemAI Lab | `/chem-ai-lab`     | `/en/chem-ai-lab`     | AI 化学方向说明              |
| 通用简历   | `/resume-onepage`  | `/en/resume-onepage`  | 通用一页 PDF                 |
| 保研评优版 | `/resume-academic` | `/en/resume-academic` | 学业评审场景                 |
| 求职实习版 | `/resume-career`   | `/en/resume-career`   | 实习和项目合作场景           |
| 博客       | `/blog`            | `/en/blog`            | 长期笔记和文章入口           |

## 内容维护

主要内容优先从数据文件维护：

- `src/data/common.json`：通用个人信息、GPA、排名、项目标签与链接。
- `src/data/zh.json`：中文个人简介、获奖、技能、项目、经历。
- `src/data/en.json`：英文页面内容。
- `src/data/materials.ts`：材料中心清单与场景说明。
- `src/data/i18n.json`：导航、页脚和通用文案。

新增奖项时，优先更新 `src/data/zh.json` 和 `src/data/en.json` 的 `competitions`。

新增材料入口时，优先更新 `src/data/materials.ts`，再确认是否需要新增页面。

新增页面后，需要同步更新：

- `src/layouts/BaseLayout.astro` 的导航入口。
- `scripts/generate-site-css.mjs` 的样式来源。
- `scripts/qa-check.mjs` 的路由和标题检查。

## 隐私策略

公开站点默认使用脱敏信息：

- 不展示学号。
- 不展示出生年月、民族、政治面貌等非必要身份信息。
- 联系方式使用公开邮箱。
- 证书图片如包含敏感字段，应优先使用脱敏版。

正式投递材料可以在本地保留完整信息，但不建议直接公开部署。

## QA 覆盖

`npm run check` 会执行：

- Astro 静态构建。
- 主要页面 HTTP 状态检查。
- H1 标题检查。
- CSS 加载检查。
- 图片加载检查。
- 内部链接检查。
- 中英文切换检查。
- 证据墙灯箱检查。
- 多视口移动端横向溢出检查。
- 移动端点击目标尺寸检查。
- 六个一页简历页面的 A4 PDF 页数检查。

## 部署

项目可直接部署到 GitHub Pages。

发布前建议：

```bash
npm ci
npm run check
npm run build
```

如果使用 GitHub Pages，请确保发布目录指向 `dist/`，或使用仓库已有的 GitHub Actions 工作流。

## 下一步路线

- 深化数学建模项目详情页。
- 为证据墙补充奖项级别、主办方、时间、能力映射。
- 生成正式 PDF 文件并放入材料中心。
- 将项目经历继续数据化，减少页面内硬编码。
