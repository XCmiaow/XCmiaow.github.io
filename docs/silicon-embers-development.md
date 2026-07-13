# 硅基余烬长期开发规范

适用范围：`/silicon-ashes/` 与 `/en/silicon-ashes/` 品牌页面、`src/components/silicon-embers/` 组件、`src/styles/silicon-embers.css`，以及 `src/content/course/` 驱动的 Astro 课程平台。

## 1. 产品定位（A + C）

- 服务公众号读者：快速找到延伸资料、课程包、模板与清单。
- 服务维护者自己：新增内容、发布页面、部署都有固定流程。
- 个人可信度通过「关于 / 个人信息」承接，不抢内容中枢。

页面职责：

| 路径                        | 职责                                           |
| --------------------------- | ---------------------------------------------- |
| `/` 主站                    | 品牌识别与分流：博客、资源、关于               |
| `/silicon-ashes/writing/`   | 博客索引与文章                                 |
| `/silicon-ashes/resources/` | 内容中枢：课程、模板、清单、工具流、公众号延伸 |
| `/silicon-ashes/courses/`   | 课程子模块网关（不是一级导航）                 |
| `/silicon-ashes/feed/`      | 微信公众号入口（不是邮件/RSS 订阅中心）        |
| `/silicon-ashes/about/`     | 品牌说明、背景、联系方式                       |
| `/profile/`                 | 个人信息与可信背书                             |

## 2. 信息架构冻结

顶部导航固定为：

- 博客
- 资源
- 关于
- EN / 中文
- 主题切换

禁止事项：

- 把「课程」加回一级导航。
- 把 `/feed/` 伪装成邮件订阅或自动 RSS 中心。
- 在多个页面复制同一份资源列表（必须走数据源）。
- 为短期视觉效果反复搬模块。

课程入口规则：

- 一级入口：资源页 `#course-materials`
- 二级入口：`/silicon-ashes/courses/` 课程网关
- 三级入口：Astro 中文完整课程 `/silicon-ashes/courses/ai-research-efficiency/`

## 3. 设计原则

- 克制。页面只保留入口、内容和必要状态，不写解释性废话。
- 一致。主站、博客、课程、资源、关于页使用同一套暗色余烬视觉。
- 组件优先。页面负责内容和结构，组件负责可复用 UI，CSS 负责视觉。
- 可验证。新增 UI 必须能被构建、QA 脚本和浏览器截图检查。
- 数据驱动。新增资源只改数据文件，不改布局组件。

## 4. 页面结构

- `SiliconEmbersLayout` 唯一拥有 `SiliconEmbersSiteFrame`；页面内容组件不得重复渲染外壳。
- 顶部导航只用 `BrandNav`。
- 页脚只用 `SiliconEmbersFooter`。
- 单个按钮只用 `ActionButton`。
- 一组按钮只用 `ActionLinks`。
- 页面级组件可以保留局部 layout CSS，但不要重画共享控件。

推荐结构：

```astro
<SiliconEmbersLayout
  lang={lang}
  canonicalPath={routePath('resources', lang)}
  alternatePath={alternatePath('resources', lang)}
>
  <ResourcesHub lang={lang} />
</SiliconEmbersLayout>
```

## 5. 数据源规则

### 品牌与导航文案

文件：`src/data/siliconEmbersHome.ts`

- 中英文 `nav` 只含：博客 / 资源 / 关于。
- 课程链接写到 hero / signal / resources 文案时，必须指向资源锚点或课程子模块，不新增导航项。

### 联系方式

文件：`src/data/common.json`

- `person.email`、`person.github`、`person.wecomQr`
- `person.wechatPublicName`：公众号名称
- `person.wechatPublicQr`：公众号二维码路径；空字符串时 feed 页回退品牌 logo

### 资源索引

文件：`src/data/siliconAshesResources.ts`

- `resourceTemplates`：模板详情页内容
- `getResourceIndexGroups(lang)`：资源中枢分类输出

固定分类 id：

1. `course-materials`
2. `templates`
3. `checklists`
4. `workflow-tools`
5. `wechat-extensions`

资源条目最小字段：

```ts
{
  title: string;
  summary: string;
  href: string;
  meta: string[];
  external?: boolean;
}
```

新增资源流程：

1. 若是模板/清单：先加 `resourceTemplates` 条目。
2. 确认它属于哪个固定分类。
3. `getResourceIndexGroups(lang)` 自动从注册表按 category 派生分组。
4. 中英文同步。
5. `npm run build` 后打开 `/silicon-ashes/resources/` 检查。

禁止：

- 在 `ResourcesHub.astro` 硬编码列表。
- 只改中文不改英文。
- 新增第六个分类，除非先更新本文档。

## 6. 公众号联动规则

`/silicon-ashes/feed/` 是公众号入口页。

必须有：

- 公众号名称
- 搜索说明
- 复制名称按钮
- 二维码（有图就用图；没有则品牌标识 + 搜索说明）
- 明确说明：更新在微信，网站不承诺自动订阅
- 网站承接入口：博客、资源、课程资料、关于

统一入口：

- footer 默认含「公众号」
- 关于页联系区含「公众号」
- 资源页「公众号延伸」指向 feed
- 首页不把 feed 塞进一级导航

`/silicon-ashes/rss.xml` 仅服务网站博客索引，不在 feed 页冒充订阅系统。

## 7. 按钮规范

### Astro 主站

使用：

```astro
<ActionButton href="/silicon-ashes/resources/" variant="primary">资源</ActionButton>
<ActionButton href="/silicon-ashes/writing/">博客</ActionButton>
<ActionButton href="/silicon-ashes/feed/" variant="text">公众号</ActionButton>
```

按钮组使用：

```astro
<ActionLinks links={links} className="actions" />
```

允许的按钮语义：

- `default`：普通入口
- `primary`：一个区域内唯一主操作
- `text`：弱入口或次要导航
- `size="compact"`：密集入口
- `block`：移动端或窄容器满宽按钮

禁止：

- 在页面里直接写 `class="sa-control"`（复制按钮等极少数交互控件除外，且必须复用 `sa-control` 视觉类）
- 在页面局部 `<style>` 里写按钮皮肤
- 为单页临时新增按钮颜色、圆角、阴影
- 用按钮承载文章卡片、资源行、导航 tab

### Astro 课程

课程正文使用 MDX 教学块：`Concept`、`Analogy`、`Checkpoint`、`Exercise`、`ProductDemo`、`InstructorNote`。章节导航、元数据、前后单元与参考来源由 `CourseLayout` 统一渲染，不在正文里手写外壳或按钮皮肤。

## 8. CSS 分层

`src/styles/silicon-embers.css` 拥有：

- 颜色 token：`--paper`、`--muted`、`--line`、`--ember`、`--ember-strong`、`--moss`
- 全局背景、文字基线、链接基线
- `ActionButton` 的 `.sa-control` 全部视觉状态

页面组件 `<style>` 只负责网格、间距、分栏、当前页标题尺度、卡片列表表格、响应式排布。

## 9. 组件边界

`src/components/silicon-embers/`：

- 品牌站专用组件
- 组件名 PascalCase
- props 只传内容、链接、语言和状态，不传颜色

`src/components/` 根目录：

- 跨站或页面级组件
- 只服务硅基余烬时优先移入 `silicon-embers/`

`src/data/`：

- 可复用文案和资源数据
- 中英文结构对称

课程平台：

- `src/content/course/`：六个中文 MDX 单元与 frontmatter
- `src/components/course/`：统一教学块
- `src/layouts/CourseLayout.astro`：章节、导航与来源外壳
- `src/styles/course.css`：课程视觉与打印样式

## 10. 内容生产工作流

目标：一篇新内容从发布到网站归档不超过 10 分钟。

| 内容类型        | 主发布位置                   | 网站动作                                          |
| --------------- | ---------------------------- | ------------------------------------------------- |
| 日常更新 / 短文 | 微信公众号                   | feed 页保持入口；必要时在资源「公众号延伸」加索引 |
| 长文沉淀        | 网站博客 `src/content/blog/` | 写文章 + 构建                                     |
| 课程资料        | `src/content/course/`        | 更新 MDX + 发布门禁；确认资源页课程入口仍有效     |
| 模板 / 清单     | `siliconAshesResources.ts`   | 加 template + 分类入口                            |
| 个人信息        | `/profile/`                  | 只改简历站，不塞进资源中枢                        |

推荐顺序：

1. 公众号发布或本地写完文章
2. 判断是否需要网站沉淀
3. 改对应数据或 content 文件
4. `npm run build`
5. 打开资源 / 博客 / feed 三页确认入口

详细清单见：`docs/content-workflow.md`

## 11. 开发流程

每次改 UI：

1. 先确认目标页面属于品牌、简历还是课程域
2. Astro 页面先找现有组件，不够再新增组件
3. 共享视觉先改 `silicon-embers.css`
4. 课程视觉统一修改 `course.css`，正文只写语义内容
5. 删除重复局部样式
6. 跑构建和 UI 审计
7. 对关键页面做桌面与移动截图

推荐验证：

```bash
npm run build
npm run qa:silicon-embers-ui
$env:COURSE_RELEASE='1'; node scripts/course-content-qa.mjs
node scripts/course-route-qa.mjs
```

截图至少覆盖：

- `/`
- `/silicon-ashes/resources/`
- `/silicon-ashes/feed/`
- `/silicon-ashes/about/`
- `/silicon-ashes/courses/`
- `/silicon-ashes/courses/ai-research-efficiency/`

## 12. 部署门禁（GitHub Pages）

- 输出：`astro build` → `dist/`
- 失败不部署
- 部署前检查：路由、404、移动端、暗色/亮色、联系方式、公众号入口
- 保留：`qa:silicon-embers-ui`、`qa:perf-security`
- 对外发布前清理临时截图、旧 public 构建残留、重复资产

## 13. 完成标准

一个改动完成，必须满足：

- 导航仍是：博客 / 资源 / 关于 / 语言 / 主题
- 课程不在一级导航
- 资源页由 `getResourceIndexGroups` 驱动
- feed 页明确是公众号入口，不承诺自动订阅
- footer / 关于 / 资源延伸 的公众号入口一致
- 没有新增局部按钮皮肤
- 移动端无横向溢出
- `npm run build` 通过
- 相关 QA 通过

## 14. 不做事项

- 不做不稳定的公众号自动爬取
- 不做邮件订阅系统
- 不把视觉动效当主线
- 不为单页临时发明新的信息架构
- 不在非自有设备迁移个人记忆/历史桥接配置
