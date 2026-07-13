# 硅基余烬内容工作流

目标：公众号更新与网站沉淀形成闭环；新增一条内容不超过 10 分钟。

## 分工

- 公众号：更新源。短文、通知、连载、即时观点。
- 网站博客：需要长期检索的文章。
- 资源中枢：课程、模板、清单、工具流、公众号延伸入口。
- 关于 / 个人信息：可信度与联系，不承载日常更新。

## 新增公众号更新（通常无需改站）

1. 在微信公众号发布。
2. 若只是日常更新：网站可不改，feed 页已承接关注入口。
3. 若需要网站资料：进入「新增资源」或「新增博客」。

## 新增博客文章

1. 在 `src/content/blog/` 新增 markdown（中英文如需则对称）。
2. 填 title / description / date / lang。
3. `npm run build`
4. 打开 `/silicon-ashes/writing/` 确认列表出现。

## 新增模板或清单

1. 打开 `src/data/siliconAshesResources.ts`
2. 在 `resourceTemplates` 增加完整 zh/en 内容并设置固定 `category`
3. `getResourceIndexGroups(lang)` 会从统一注册表自动派生分组，不再维护第二份列表
4. 构建并检查：
   - `/silicon-ashes/resources/`
   - `/silicon-ashes/resources/<slug>/`
   - 英文对应路径

## 更新课程资料

1. 在 `src/content/course/` 修改六个 MDX 单元；教学块复用 `src/components/course/`
2. 若调整时长、产品演示或前置关系：同步 frontmatter，并运行发布内容门禁
3. 确认一级入口仍是资源页 `#course-materials`，英文入口明确提示完整课程为中文
4. 构建后打开：
   - `/silicon-ashes/resources/#course-materials`
   - `/silicon-ashes/courses/`
   - `/silicon-ashes/courses/ai-research-efficiency/`

发布课程正文前运行：

```powershell
$env:COURSE_RELEASE='1'; node scripts/course-content-qa.mjs
node scripts/course-route-qa.mjs
```

## 更新公众号二维码

1. 把二维码图片放到 `public/silicon-ashes/`
2. 在 `src/data/common.json` 设置 `person.wechatPublicQr`
3. 打开 `/silicon-ashes/feed/` 确认显示二维码而不是 logo 回退

## 发布前 1 分钟检查

- [ ] 导航仍是博客 / 资源 / 关于
- [ ] 资源页分类可读
- [ ] feed 页名称可复制
- [ ] 关于页有公众号入口
- [ ] footer 有公众号入口
- [ ] 中英文关键链接未 404

## 验证命令

```bash
npm run build
npm run qa:silicon-embers-ui
node scripts/course-route-qa.mjs
```
