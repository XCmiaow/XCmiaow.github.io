# 方绪杰个人简历主页 · Astro 主线

这是个人简历网站的正式工程化版本，基于 Astro 构建，面向 GitHub Pages 部署和长期维护。

## 主线定位

- `src/pages/index.astro`：中文主页
- `src/pages/en/index.astro`：英文主页
- `src/pages/modeling.astro` 与 `src/pages/en/modeling.astro`：数学建模能力案例
- `src/pages/evidence.astro` 与 `src/pages/en/evidence.astro`：证书材料墙
- `src/pages/resume-onepage.astro` 与 `src/pages/en/resume-onepage.astro`：一页投递版

## 本地开发

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:4321/
http://localhost:4321/en/
```

## 构建检查

```bash
npm run build
npm run preview
```

## 部署

`.github/workflows/deploy.yml` 已配置 GitHub Pages 自动部署。推送到 `main` 后，GitHub Actions 会执行：

```bash
npm ci
npm run build
```

并将 `dist/` 发布到 GitHub Pages。

## 隐私规则

- 公开版只展示脱敏手机号 `133****4936`。
- 不展示学号、出生年月、民族、政治面貌等敏感身份信息。
- 证书图片只从 `public/assets/evidence/public/` 引用。
- 含学号、证书编号或二维码的原始材料不要放入公开目录。

## 质量标准

- 中英文页面都必须能直接访问。
- 导航栏、语言切换、简历页、建模页、证书页互链必须无 404。
- 构建必须通过 `npm run build`。
- 发布前建议用浏览器检查桌面端和手机端首屏、导航、图片加载和控制台错误。
