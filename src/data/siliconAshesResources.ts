export type ResourceTemplateLocale = {
  title: string;
  summary: string;
  eyebrow: string;
  meta: string[];
  purpose: string;
  sections: string[];
  checklist: string[];
  template: string;
};

export type ResourceTemplate = {
  slug: string;
  zh: ResourceTemplateLocale;
  en: ResourceTemplateLocale;
};

export const resourceTemplates: ResourceTemplate[] = [
  {
    slug: 'task-brief',
    zh: {
      title: '任务说明模板',
      summary: '把一个模糊需求改写成 AI 可以执行、你可以验收的任务说明。',
      eyebrow: 'template / brief',
      meta: ['科研任务', '课程任务', 'AI 协作'],
      purpose: '适合在交给 AI、助教或协作者之前使用。它把目标、输入、边界和验收方式先写清楚，减少反复解释。',
      sections: ['背景', '目标', '输入材料', '输出格式', '限制条件', '验收标准'],
      checklist: [
        '任务是否只有一个主要目标',
        '输入材料是否可追溯',
        '输出格式是否明确',
        '不可做的事是否写清楚',
        '验收方式是否能逐项打勾',
      ],
      template: `# 任务说明

## 背景
我要解决的问题是：

## 目标
这次任务完成后，应该得到：

## 输入材料
可以使用的材料：
- 

不能自行补充或猜测的内容：
- 

## 输出格式
请输出为：
- Markdown / 表格 / 列表 / 脚本 / 图表

## 限制条件
- 字数：
- 语气：
- 范围：
- 不要：

## 验收标准
我会用以下标准判断结果是否可用：
1. 
2. 
3. `,
    },
    en: {
      title: 'Task Brief Template',
      summary: 'Turn a vague request into a task that an AI assistant can execute and you can review.',
      eyebrow: 'template / brief',
      meta: ['Research', 'Teaching', 'AI collaboration'],
      purpose:
        'Use this before handing work to AI, a teaching assistant, or a collaborator. It clarifies the goal, inputs, boundaries, and review criteria.',
      sections: ['Context', 'Goal', 'Inputs', 'Output format', 'Constraints', 'Acceptance criteria'],
      checklist: [
        'Is there one main goal?',
        'Are the inputs traceable?',
        'Is the output format explicit?',
        'Are the boundaries clear?',
        'Can the result be checked item by item?',
      ],
      template: `# Task Brief

## Context
The problem I want to solve is:

## Goal
After this task, I should have:

## Inputs
Materials the assistant may use:
-

Materials it must not invent or supplement:
-

## Output Format
Please return:
- Markdown / table / list / script / chart

## Constraints
- Length:
- Tone:
- Scope:
- Avoid:

## Acceptance Criteria
I will judge the output by:
1.
2.
3.`,
    },
  },
  {
    slug: 'prompt-template',
    zh: {
      title: 'Prompt 设计模板',
      summary: '用“目标、材料、约束、格式、验收”五段式设计科研与教学 prompt。',
      eyebrow: 'template / prompt',
      meta: ['Prompt', '任务设计', '科研表达'],
      purpose: '适合从一次性提问升级到可复用任务。重点不是措辞漂亮，而是让 AI 知道什么能做、什么不能做。',
      sections: ['角色', '任务', '材料', '约束', '输出格式', '验收方式'],
      checklist: [
        '是否限定材料来源',
        '是否说明目标读者',
        '是否明确不要编造',
        '是否要求列出不确定项',
        '是否给出可检查格式',
      ],
      template: `# Prompt 设计

角色：
你是一位：

任务：
请帮助我：

材料：
你可以使用：

约束：
- 字数：
- 风格：
- 范围：
- 不要编造：

输出格式：
请按照以下结构输出：
1. 
2. 
3. 

验收方式：
输出后请额外列出：
- 哪些内容来自我提供的材料
- 哪些内容需要我进一步确认
- 你不确定的地方`,
    },
    en: {
      title: 'Prompt Design Template',
      summary: 'Use goal, material, constraints, format, and checks to design reliable research and teaching prompts.',
      eyebrow: 'template / prompt',
      meta: ['Prompting', 'Task design', 'Research expression'],
      purpose:
        'Use this when a one-off question needs to become a reusable task. The point is not clever wording; it is controlled execution.',
      sections: ['Role', 'Task', 'Material', 'Constraints', 'Output format', 'Review method'],
      checklist: [
        'Does it limit source material?',
        'Does it define the audience?',
        'Does it forbid invented facts?',
        'Does it surface uncertainty?',
        'Does it use a checkable format?',
      ],
      template: `# Prompt Design

Role:
You are:

Task:
Please help me:

Material:
You may use:

Constraints:
- Length:
- Style:
- Scope:
- Do not invent:

Output Format:
Return the result as:
1.
2.
3.

Review Method:
After the output, list:
- What came from my material
- What I need to confirm
- What you are uncertain about`,
    },
  },
  {
    slug: 'review-checklist',
    zh: {
      title: 'AI 结果验收清单',
      summary: '在采纳 AI 输出前，用一张短清单检查事实、边界、格式和风险。',
      eyebrow: 'checklist / review',
      meta: ['验收', '质量控制', '可靠性'],
      purpose: '适合放在每个 AI 工作流末尾。它提醒你不要因为文本流畅就默认结果可靠。',
      sections: ['事实检查', '证据来源', '边界声明', '格式完整性', '后续动作'],
      checklist: [
        '关键事实是否能回到来源',
        '引用或数据是否可追踪',
        '不确定项是否被标出',
        '格式是否符合交付要求',
        '是否存在过度承诺',
      ],
      template: `# AI 结果验收清单

## 事实
- [ ] 关键事实可以回到原始材料
- [ ] 数字、单位、日期没有被改写错
- [ ] 引用、DOI、链接没有凭空生成

## 边界
- [ ] AI 标出了不确定内容
- [ ] 没有把推测写成结论
- [ ] 没有超出我允许的材料范围

## 格式
- [ ] 输出结构符合要求
- [ ] 表格字段完整
- [ ] 术语和语言风格一致

## 风险
- [ ] 是否需要人工复核实验结论
- [ ] 是否涉及隐私或未公开数据
- [ ] 是否需要补充原始证据`,
    },
    en: {
      title: 'AI Output Review Checklist',
      summary: 'Before accepting AI output, check facts, sources, boundaries, format, and risk.',
      eyebrow: 'checklist / review',
      meta: ['Review', 'Quality control', 'Reliability'],
      purpose: 'Use this at the end of an AI workflow. Fluent text is not the same thing as reliable work.',
      sections: ['Facts', 'Sources', 'Boundaries', 'Format', 'Next actions'],
      checklist: [
        'Can key facts trace back to sources?',
        'Are citations and data inspectable?',
        'Are uncertain items marked?',
        'Does the format match the request?',
        'Does the output overclaim?',
      ],
      template: `# AI Output Review Checklist

## Facts
- [ ] Key facts trace back to source material
- [ ] Numbers, units, and dates are unchanged
- [ ] Citations, DOI, and links were not invented

## Boundaries
- [ ] Uncertain points are marked
- [ ] Speculation is not presented as conclusion
- [ ] The output stays within the allowed material

## Format
- [ ] The structure matches the request
- [ ] Table fields are complete
- [ ] Terminology and tone are consistent

## Risk
- [ ] Research conclusions need human review
- [ ] Private or unpublished data is involved
- [ ] Original evidence needs to be attached`,
    },
  },
  {
    slug: 'course-retrospective',
    zh: {
      title: '课程复盘表',
      summary: '把一次课程从“讲完了”复盘成可迭代的产品：目标、卡点、证据和下一版改动。',
      eyebrow: 'template / course',
      meta: ['课程设计', '复盘', '教学产品'],
      purpose: '适合每次课后 20 分钟内填写。目标是保留真实反馈，不让课程改进只停留在感觉里。',
      sections: ['课程目标', '学生卡点', '有效环节', '无效环节', '证据', '下一版改动'],
      checklist: [
        '是否记录了具体卡点',
        '是否区分感觉和证据',
        '是否留下学生原话或行为',
        '是否写出下一版动作',
        '是否能复用到下一节课',
      ],
      template: `# 课程复盘

课程名称：
日期：
对象：

## 原定目标
这节课本来要让学生做到：

## 实际发生
学生最顺的地方：

学生最卡的地方：

## 证据
我观察到的行为、提问或作业表现：
- 

## 判断
需要保留的环节：

需要删除或压缩的环节：

## 下一版改动
1. 
2. 
3. `,
    },
    en: {
      title: 'Course Retrospective Template',
      summary: 'Turn a finished class into an iterated product: goals, friction, evidence, and next-version changes.',
      eyebrow: 'template / course',
      meta: ['Course design', 'Retrospective', 'Teaching product'],
      purpose:
        'Use this within 20 minutes after a class. The goal is to preserve real feedback instead of relying on vague impressions.',
      sections: ['Course goal', 'Student friction', 'Effective parts', 'Ineffective parts', 'Evidence', 'Next version'],
      checklist: [
        'Are concrete friction points recorded?',
        'Is evidence separated from feeling?',
        'Are student behaviors or quotes captured?',
        'Are next actions specific?',
        'Can the learning transfer to the next session?',
      ],
      template: `# Course Retrospective

Course:
Date:
Audience:

## Intended Goal
Students were supposed to be able to:

## What Happened
What went smoothly:

Where students got stuck:

## Evidence
Observed behavior, questions, or assignment signals:
-

## Judgment
Parts to keep:

Parts to remove or compress:

## Next Version Changes
1.
2.
3.`,
    },
  },
];

export type ResourceIndexItem = {
  title: string;
  summary: string;
  href: string;
  meta: string[];
  external?: boolean;
};

export type ResourceIndexGroup = {
  id: 'course-materials' | 'templates' | 'checklists' | 'workflow-tools' | 'wechat-extensions';
  title: string;
  summary: string;
  items: ResourceIndexItem[];
};

type ResourceIndexLang = 'zh' | 'en';

const coursePackBase = '/silicon-ashes/courses/ai-research-efficiency/';

const templateItem = (lang: ResourceIndexLang, slug: string, hrefBase: string): ResourceIndexItem | undefined => {
  const template = resourceTemplates.find((item) => item.slug === slug);
  if (!template) return undefined;
  const copy = template[lang];
  return {
    title: copy.title,
    summary: copy.summary,
    href: `${hrefBase}${template.slug}/`,
    meta: [...copy.meta],
  };
};

const compact = <T>(items: Array<T | undefined>) => items.filter((item): item is T => Boolean(item));

export const getResourceIndexGroups = (lang: ResourceIndexLang): ResourceIndexGroup[] => {
  const isZh = lang === 'zh';
  const routeBase = isZh ? '/silicon-ashes' : '/en/silicon-ashes';
  const templateBase = `${routeBase}/resources/`;
  const courseHub = `${routeBase}/courses/`;
  const feedHref = `${routeBase}/feed/`;
  const writingHref = `${routeBase}/writing/`;
  const profileHref = isZh ? '/profile/' : '/en/profile/';

  const templateItems = compact([
    templateItem(lang, 'task-brief', templateBase),
    templateItem(lang, 'prompt-template', templateBase),
    templateItem(lang, 'course-retrospective', templateBase),
  ]);
  const checklistItems = compact([templateItem(lang, 'review-checklist', templateBase)]);

  if (isZh) {
    return [
      {
        id: 'course-materials',
        title: '课程资料',
        summary: '课程作为资源子模块保留，入口集中在这里。',
        items: [
          {
            title: 'AI 编程与科研效率基础课',
            summary: '课程包总入口：总览、学习路径、讲义和后续方向。',
            href: courseHub,
            meta: ['课程', '总览'],
          },
          {
            title: '课程首页',
            summary: '进入静态课程包，查看完整模块。',
            href: `${coursePackBase}index.html`,
            meta: ['课程包', '入口'],
          },
          {
            title: '课程安排',
            summary: '课时结构、模块顺序和课堂节奏。',
            href: `${coursePackBase}schedule.html`,
            meta: ['日程', '教学'],
          },
          {
            title: '打印讲义',
            summary: '适合课前发放或课后归档的讲义版本。',
            href: `${coursePackBase}handout.html`,
            meta: ['讲义', '打印'],
          },
        ],
      },
      {
        id: 'templates',
        title: '模板',
        summary: '把模糊任务变成可执行、可复用的工作入口。',
        items: templateItems,
      },
      {
        id: 'checklists',
        title: '清单',
        summary: '用于采纳 AI 输出之前的人工验收。',
        items: checklistItems,
      },
      {
        id: 'workflow-tools',
        title: '工具流',
        summary: '课程和日常实践里会反复用到的工具页面。',
        items: [
          {
            title: '工具链实操',
            summary: 'WorkBuddy、Claude Code、Codex 与 GitHub 的基础使用路径。',
            href: `${coursePackBase}toolchain.html`,
            meta: ['工具', '实操'],
          },
          {
            title: '工作流工坊',
            summary: '把文献、表达、数据或课程任务拆成可检查流程。',
            href: `${coursePackBase}workflow-lab.html`,
            meta: ['流程', '练习'],
          },
          {
            title: '代码审查',
            summary: '用于课堂或个人项目的代码检查入口。',
            href: `${coursePackBase}code-review.html`,
            meta: ['代码', '质量'],
          },
        ],
      },
      {
        id: 'wechat-extensions',
        title: '公众号延伸',
        summary: '最新更新在公众号，网站负责索引和资料沉淀。',
        items: [
          {
            title: '公众号入口',
            summary: '关注「硅基余烬」，获取最新更新。',
            href: feedHref,
            meta: ['公众号', '更新源'],
          },
          {
            title: '博客索引',
            summary: '网站内沉淀的文章索引。',
            href: writingHref,
            meta: ['博客', '索引'],
          },
          {
            title: '个人信息',
            summary: '背景、项目和联系方式。',
            href: profileHref,
            meta: ['背景', '联系'],
          },
        ],
      },
    ];
  }

  return [
    {
      id: 'course-materials',
      title: 'Course materials',
      summary: 'Courses stay as a resource submodule, with all entry points collected here.',
      items: [
        {
          title: 'AI Programming and Research Efficiency Basics',
          summary: 'The course-package gateway: overview, path, handout, and next directions.',
          href: courseHub,
          meta: ['Course', 'Overview'],
        },
        {
          title: 'Course home',
          summary: 'Open the static course package and all modules.',
          href: `${coursePackBase}index.html`,
          meta: ['Course pack', 'Entry'],
        },
        {
          title: 'Schedule',
          summary: 'Class structure, module order, and teaching rhythm.',
          href: `${coursePackBase}schedule.html`,
          meta: ['Schedule', 'Teaching'],
        },
        {
          title: 'Printable handout',
          summary: 'A version for class use and archive.',
          href: `${coursePackBase}handout.html`,
          meta: ['Handout', 'Print'],
        },
      ],
    },
    {
      id: 'templates',
      title: 'Templates',
      summary: 'Turn vague work into executable, reusable task entries.',
      items: templateItems,
    },
    {
      id: 'checklists',
      title: 'Checklists',
      summary: 'Human review before accepting AI output.',
      items: checklistItems,
    },
    {
      id: 'workflow-tools',
      title: 'Workflow tools',
      summary: 'Tool pages reused across the course and daily practice.',
      items: [
        {
          title: 'Toolchain practice',
          summary: 'A starter path for WorkBuddy, Claude Code, Codex, and GitHub.',
          href: `${coursePackBase}toolchain.html`,
          meta: ['Tools', 'Practice'],
        },
        {
          title: 'Workflow lab',
          summary: 'Turn reading, expression, data, or course tasks into checkable flows.',
          href: `${coursePackBase}workflow-lab.html`,
          meta: ['Workflow', 'Lab'],
        },
        {
          title: 'Code review',
          summary: 'A review entry for class exercises and personal projects.',
          href: `${coursePackBase}code-review.html`,
          meta: ['Code', 'Quality'],
        },
      ],
    },
    {
      id: 'wechat-extensions',
      title: 'WeChat extensions',
      summary: 'Updates are published on WeChat; the site keeps indexes and materials.',
      items: [
        {
          title: 'WeChat entry',
          summary: 'Follow silicon-embers for new updates.',
          href: feedHref,
          meta: ['WeChat', 'Updates'],
        },
        {
          title: 'Blog index',
          summary: 'Essays preserved on the website.',
          href: writingHref,
          meta: ['Blog', 'Index'],
        },
        {
          title: 'Personal info',
          summary: 'Background, projects, and contact paths.',
          href: profileHref,
          meta: ['Background', 'Contact'],
        },
      ],
    },
  ];
};
