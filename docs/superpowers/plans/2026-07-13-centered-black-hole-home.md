# Centered Black Hole Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将品牌首页改为“居中黑洞首屏 + 底部联系页”，删除首页其余内容段，同时保持所有独立页面和顶部导航可用。

**Architecture:** `SiliconAshesHome.astro` 只组合首屏；`EmberHero.astro` 负责左上与右下文字象限；`EmberField.astro` 负责严格居中的黑洞视觉。`SiliconEmbersSiteFrame.astro` 根据当前路由为首页选择 `contact` Footer 变体，其他页面保持紧凑 Footer。

**Tech Stack:** Astro 5、TypeScript、组件局部 CSS、Playwright、现有 Node QA 脚本。

---

## 文件职责

- `src/components/SiliconAshesHome.astro`：首页唯一内容编排，只渲染 `EmberHero`。
- `src/components/silicon-embers/EmberHero.astro`：首屏语义、品牌文字象限和首屏高度。
- `src/components/silicon-embers/EmberField.astro`：黑洞几何、事件视界色阶和响应式尺寸。
- `src/components/silicon-embers/SiliconEmbersSiteFrame.astro`：识别品牌首页并选择 Footer 变体。
- `src/components/silicon-embers/SiliconEmbersFooter.astro`：默认 Footer 与首页联系页两种外观。
- `scripts/silicon-embers-ui-audit.mjs`：源码结构回归测试。
- `scripts/visual-qa.mjs`：真实浏览器几何、溢出和尺寸回归测试。

### Task 1: 将首页内容收束为单一首屏

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/SiliconAshesHome.astro`

- [ ] **Step 1: 写首页结构失败测试**

在 `scripts/silicon-embers-ui-audit.mjs` 中读取首页源码，并加入以下断言：

```js
const brandHomeSource = read('src/components/SiliconAshesHome.astro');
for (const removedHomeDependency of [
  'astro:content',
  'BrandManifesto',
  'WritingPreview',
  'MethodStrip',
  'SignalLinksSection',
]) {
  if (brandHomeSource.includes(removedHomeDependency)) {
    failures.push(`brand home still depends on ${removedHomeDependency}`);
  }
}
if ((brandHomeSource.match(/<EmberHero\b/g) ?? []).length !== 1) {
  failures.push('brand home must render exactly one EmberHero');
}
```

- [ ] **Step 2: 运行失败测试**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL，列出 `astro:content`、四个多余首页组件仍存在。

- [ ] **Step 3: 写最小首页组合**

将 `src/components/SiliconAshesHome.astro` 收束为：

```astro
---
import { siliconEmbersHomeCopy, type SiliconEmbersLang } from '../data/siliconEmbersHome';
import EmberHero from './silicon-embers/EmberHero.astro';

export interface Props {
  lang: SiliconEmbersLang;
}

const { lang } = Astro.props;
const copy = siliconEmbersHomeCopy[lang];
---

<EmberHero copy={copy.hero} wordmark={copy.wordmark} />
```

- [ ] **Step 4: 验证首页结构测试转绿**

Run: `npm run qa:silicon-embers-ui && npm run typecheck`

Expected: UI audit 无相关失败，Astro 诊断为 0 errors。

- [ ] **Step 5: 提交**

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/SiliconAshesHome.astro
git commit -m "refactor: reduce brand home to one stage"
```

### Task 2: 居中并放大黑洞，重排首屏文字

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `scripts/visual-qa.mjs`
- Modify: `src/components/silicon-embers/EmberHero.astro`
- Modify: `src/components/silicon-embers/EmberField.astro`

- [ ] **Step 1: 写首屏源码失败测试**

在 UI audit 中加入：

```js
const emberHeroSource = read('src/components/silicon-embers/EmberHero.astro');
const emberFieldSource = read('src/components/silicon-embers/EmberField.astro');

for (const forbiddenHeroPattern of ['ActionButton', 'hero-actions', 'scroll-cue']) {
  if (emberHeroSource.includes(forbiddenHeroPattern)) {
    failures.push(`EmberHero still includes ${forbiddenHeroPattern}`);
  }
}
for (const requiredHeroMarker of ['hero-primary', 'hero-secondary']) {
  if (!emberHeroSource.includes(requiredHeroMarker)) {
    failures.push(`EmberHero is missing ${requiredHeroMarker}`);
  }
}
if (!/--hole-x:\s*50%/.test(emberFieldSource) || !/--hole-y:\s*50%/.test(emberFieldSource)) {
  failures.push('black hole must be centered at 50% / 50%');
}
if (!/--hole-size:\s*min\(42vw,\s*560px\)/.test(emberFieldSource)) {
  failures.push('desktop black hole must use the larger 560px cap');
}
if (!/radial-gradient[\s\S]*inset[\s\S]*event-horizon/.test(emberFieldSource)) {
  failures.push('event horizon must include tonal depth instead of a flat black center');
}
```

- [ ] **Step 2: 扩展真实浏览器失败测试**

在 `checkBrandHomeBounds()` 的每个视口中同时读取首屏和黑洞矩形：

```js
const heroCenterX = (geometry.hero.left + geometry.hero.right) / 2;
const heroCenterY = (geometry.hero.top + geometry.hero.bottom) / 2;
const sceneCenterX = (geometry.scene.left + geometry.scene.right) / 2;
const sceneCenterY = (geometry.scene.top + geometry.scene.bottom) / 2;

if (Math.abs(heroCenterX - sceneCenterX) > 2 || Math.abs(heroCenterY - sceneCenterY) > 2) {
  fail(`brand home ${width}px black hole is not centered`);
}
const minimumSceneWidth = width >= 1200 ? 540 : width <= 420 ? 285 : 0;
if (minimumSceneWidth && geometry.scene.width < minimumSceneWidth) {
  fail(`brand home ${width}px black hole is too small`);
}
```

为 `hero` 与 `scene` 的几何对象补充 `top`、`bottom`、`width` 字段。

- [ ] **Step 3: 运行失败测试**

Run: `npm run qa:silicon-embers-ui && npm run build && npm run qa:visual`

Expected: FAIL，原因包括旧按钮/滚动提示、黑洞仍位于 65% / 48%、尺寸不足或未居中。

- [ ] **Step 4: 实现两象限首屏**

在 `EmberHero.astro` 中删除 `ActionButton` 导入、按钮导航和滚动提示，使用以下结构：

```astro
<section class="ember-hero" aria-labelledby="sa-title">
  <EmberField />
  <div class="hero-primary">
    <p class="hero-status" aria-hidden="true">
      <span>silicon—carbon archive</span><span>field / active</span>
    </p>
    <p class="wordmark">{wordmark}</p>
    <h1 id="sa-title">{copy.title}</h1>
    <p class="lead">{copy.lead}</p>
  </div>
  <div class="hero-secondary">
    <p class="sublead">{copy.sublead}</p>
    <p class="field-note" aria-hidden="true">FIELD 01 · GRAVITY / MEMORY</p>
  </div>
</section>
```

局部 CSS 使用绝对象限布局：桌面 `.hero-primary` 位于左上、`.hero-secondary` 位于右下；手机端保留同一对角关系并压缩宽度。首屏最小高度使用 `calc(100dvh - 72px)`，不设置首页按钮。

- [ ] **Step 5: 实现黑洞几何与色阶**

在 `EmberField.astro` 中采用：

```css
.ember-stage {
  --hole-x: 50%;
  --hole-y: 50%;
  --hole-size: min(42vw, 560px);
}

.event-horizon {
  background: radial-gradient(circle at 38% 34%, #100b07 0 8%, #060403 38%, #010101 78%);
  box-shadow:
    inset 9px 7px 18px rgba(137, 78, 38, 0.08),
    inset -14px -16px 28px rgba(0, 0, 0, 0.96),
    0 0 0 1px rgba(238, 183, 111, 0.14),
    0 0 38px rgba(0, 0, 0, 0.9);
}
```

手机端使用 `--hole-size: min(78vw, 320px)`，并把吸积盘宽度压至约 `126%`，避免放大后明显裁切。移除原有所有 63%–65% 的 `--hole-x` 覆盖。

- [ ] **Step 6: 验证首屏测试转绿**

Run: `npm run qa:silicon-embers-ui && npm run build && npm run qa:visual`

Expected: UI audit 0 failures；360、390、768、1024、1440px 均居中、无横向溢出，尺寸门槛通过。

- [ ] **Step 7: 提交**

```bash
git add scripts/silicon-embers-ui-audit.mjs scripts/visual-qa.mjs src/components/silicon-embers/EmberHero.astro src/components/silicon-embers/EmberField.astro
git commit -m "style: center the brand gravity field"
```

### Task 3: 将首页 Footer 升级为联系页

**Files:**
- Modify: `scripts/silicon-embers-ui-audit.mjs`
- Modify: `src/components/silicon-embers/SiliconEmbersSiteFrame.astro`
- Modify: `src/components/silicon-embers/SiliconEmbersFooter.astro`

- [ ] **Step 1: 写联系页失败测试**

在 UI audit 中加入：

```js
const siteFrameSource = read('src/components/silicon-embers/SiliconEmbersSiteFrame.astro');
const footerSource = read('src/components/silicon-embers/SiliconEmbersFooter.astro');
if (!siteFrameSource.includes("variant={isHome ? 'contact' : 'default'}")) {
  failures.push('site frame must select the contact footer on the brand home');
}
for (const marker of ["variant?: 'default' | 'contact'", "class:list={['sa-footer', variant]}", 'contact-heading']) {
  if (!footerSource.includes(marker)) failures.push(`SiliconEmbersFooter is missing ${marker}`);
}
```

- [ ] **Step 2: 运行失败测试**

Run: `npm run qa:silicon-embers-ui`

Expected: FAIL，首页尚未选择 `contact` Footer 且 Footer 尚无变体。

- [ ] **Step 3: 在 SiteFrame 选择 Footer 变体**

根据 `Astro.url.pathname` 与 `routePath('brand-home', lang)` 计算 `isHome`，并调用：

```astro
<SiliconEmbersFooter
  note={copy.footer.note}
  title={copy.footer.contact}
  links={links}
  variant={isHome ? 'contact' : 'default'}
/>
```

- [ ] **Step 4: 实现联系 Footer**

为 Footer props 增加：

```ts
title: string;
variant?: 'default' | 'contact';
```

在 Footer 中加入 `contact-heading`，并用 `class:list={['sa-footer', variant]}` 选择样式。`.sa-footer.contact` 使用两列布局、顶部细线和 `min-height: 48dvh`；手机改为单列。`.sa-footer.default` 保持现有紧凑间距，避免改变独立页面长度。

- [ ] **Step 5: 验证 Footer 测试转绿**

Run: `npm run qa:silicon-embers-ui && npm run typecheck && npm run build && npm run qa:routes && npm run qa:accessibility`

Expected: UI audit 无失败；123 个 Astro 文件无诊断；71 页构建；34 条路由、90 项无障碍检查通过。

- [ ] **Step 6: 提交**

```bash
git add scripts/silicon-embers-ui-audit.mjs src/components/silicon-embers/SiliconEmbersSiteFrame.astro src/components/silicon-embers/SiliconEmbersFooter.astro
git commit -m "feat: turn the home footer into contact stage"
```

### Task 4: 最终视觉验收与发布门禁

**Files:**
- Verify only unless visual inspection finds a spec violation.

- [ ] **Step 1: 启动本地生产预览**

Run: `npm run preview -- --host 127.0.0.1 --port 4322`

Expected: `/` 与 `/en/` 返回 200。

- [ ] **Step 2: 截图并核对关键视口**

用 Playwright 检查 1440×1100、768×1024、390×844、360×800：

- 黑洞位于首屏中心且事件视界轮廓可辨。
- 左上主信息和右下副信息不覆盖事件视界。
- 首页只有首屏与联系 Footer。
- 手机导航可横向访问，不遮挡标题。
- 深浅主题都无横向溢出。

- [ ] **Step 3: 运行完整质量门禁**

Run: `npm run check`

Expected: exit code 0，包括格式、Lint、类型检查、71 页构建、路由、无障碍、视觉、UI 与性能安全检查全部通过。

- [ ] **Step 4: 检查仓库状态**

Run: `git status --short && git branch --show-current`

Expected: 工作区干净，当前分支为 `main`。
