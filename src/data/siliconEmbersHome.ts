import { coursePaths } from './courseCatalog';

const courseBase = `${coursePaths.zh}/`;

export type SiliconEmbersLang = 'zh' | 'en';

export const siliconEmbersHomeCopy = {
  zh: {
    htmlLabel: '硅基余烬品牌主站',
    brand: '硅基余烬',
    wordmark: 'silicon-embers',
    homeHref: '/',
    skipLabel: '跳到正文',
    navLabel: '主站导航',
    switchHref: '/en/',
    switchLabel: 'EN',
    nav: [
      { label: '博客', href: '/silicon-ashes/writing/' },
      { label: '资源', href: '/silicon-ashes/resources/' },
      { label: '关于', href: '/silicon-ashes/about/' },
    ],
    hero: {
      eyebrow: '',
      title: '硅基余烬',
      lead: '技术越明亮，人类越需要凝视自己的阴影。',
      sublead: '在硅基智能升起的年代，记录碳基人类尚未熄灭的余温。',
      actionsLabel: '主要入口',
      actions: [
        { label: '读博客', href: '/silicon-ashes/writing/', variant: 'primary' },
        { label: '看资源', href: '/silicon-ashes/resources/', variant: 'default' },
      ],
    },
    thesis: {
      kicker: 'thesis',
      title: '在技术里保留判断。',
      body: '这里整理博客、课程和资源，关注 AI 如何进入科研、教育与表达。',
      principles: [
        { title: '判断', body: '先看清问题，再选择工具。' },
        { title: '流程', body: '把方法落到可复用的步骤。' },
        { title: '实践', body: '让内容服务具体工作。' },
      ],
    },
    operatingSystem: {
      kicker: 'system',
      title: '从问题到方法',
      body: '把观察写成文章，把方法整理成课程和模板。',
      railLabel: 'workflow',
      phases: [
        {
          code: 'observe',
          title: '观察日常',
          body: '从教学、科研和表达现场开始。',
          output: '文章',
        },
        {
          code: 'compose',
          title: '写出判断',
          body: '把经验整理成可讨论的文本。',
          output: '框架',
        },
        {
          code: 'transfer',
          title: '整理方法',
          body: '把 AI 方法拆成课、模板和清单。',
          output: '课程',
        },
        {
          code: 'return',
          title: '回到实践',
          body: '用反馈修正语言和工具。',
          output: '实践',
        },
      ],
    },
    writing: {
      kicker: 'blog',
      title: '博客',
      more: '全部文章 →',
      href: '/silicon-ashes/writing/',
      empty: '文章正在整理。',
      fallbackReadingTime: 'note',
    },
    signalDesk: {
      kicker: 'next',
      title: '下一步',
      body: '选择文章或资源。',
      statsLabel: 'signal',
      postCountLabel: '篇文章',
      stats: [
        { value: '8h', label: '课程起步' },
        { value: '3+', label: '资源入口' },
      ],
      lanes: [
        {
          code: 'read',
          title: '读文章',
          body: '从问题开始。',
          href: '/silicon-ashes/writing/',
          cta: '进入博客',
        },
        {
          code: 'learn',
          title: '学流程',
          body: '把方法落到个人工作。',
          href: '/silicon-ashes/resources/#course-materials',
          cta: '课程资料',
        },
        {
          code: 'use',
          title: '用模板',
          body: '让协作更清楚。',
          href: '/silicon-ashes/resources/',
          cta: '进入资源',
        },
      ],
    },
    course: {
      kicker: 'course',
      title: 'AI 编程与科研效率基础课',
      body: '面向非计算机背景。目标是一套可执行的科研 AI 工作流。',
      links: [
        { label: '课程资料', href: '/silicon-ashes/resources/#course-materials' },
        { label: '课程首页', href: courseBase },
        { label: '课程安排', href: `${courseBase}schedule/` },
        { label: '连续讲义', href: `${courseBase}handout/` },
      ],
    },
    resources: {
      kicker: 'resources',
      title: '资源',
      body: '课程资料、模板和清单。够用优先。',
      links: [
        { label: '课程资料', href: '/silicon-ashes/resources/#course-materials' },
        { label: '任务说明模板', href: '/silicon-ashes/resources/task-brief/' },
        { label: 'Prompt 模板', href: '/silicon-ashes/resources/prompt-template/' },
        { label: '验收清单', href: '/silicon-ashes/resources/review-checklist/' },
      ],
    },
    footer: {
      note: 'silicon-embers / 硅基余烬',
      contact: '联系',
      aboutHref: '/silicon-ashes/about/',
    },
  },
  en: {
    htmlLabel: 'silicon-embers brand site',
    brand: 'silicon-embers',
    wordmark: 'silicon-embers',
    homeHref: '/en/',
    skipLabel: 'Skip to content',
    navLabel: 'Main navigation',
    switchHref: '/',
    switchLabel: '中文',
    nav: [
      { label: 'Blog', href: '/en/silicon-ashes/writing/' },
      { label: 'Resources', href: '/en/silicon-ashes/resources/' },
      { label: 'About', href: '/en/silicon-ashes/about/' },
    ],
    hero: {
      eyebrow: '',
      title: 'silicon-embers',
      lead: 'Notes on AI, research, and blog essays.',
      sublead: 'Essays, courses, resources, and tools.',
      actionsLabel: 'Primary links',
      actions: [
        { label: 'Read blog', href: '/en/silicon-ashes/writing/', variant: 'primary' },
        { label: 'Resources', href: '/en/silicon-ashes/resources/', variant: 'default' },
      ],
    },
    thesis: {
      kicker: 'thesis',
      title: 'Keep judgment inside technology.',
      body: 'Essays, courses, and resources on how AI enters research, education, and expression.',
      principles: [
        { title: 'Judgment', body: 'Understand the problem before choosing tools.' },
        { title: 'Workflow', body: 'Turn methods into reusable steps.' },
        { title: 'Practice', body: 'Make content serve real work.' },
      ],
    },
    operatingSystem: {
      kicker: 'system',
      title: 'From problem to method',
      body: 'Turn observations into essays, and methods into courses and templates.',
      railLabel: 'workflow',
      phases: [
        {
          code: 'observe',
          title: 'Observe daily work',
          body: 'Start from teaching, research, and expression.',
          output: 'essays',
        },
        {
          code: 'compose',
          title: 'Write the judgment',
          body: 'Turn experience into discussable text.',
          output: 'frames',
        },
        {
          code: 'transfer',
          title: 'Package the method',
          body: 'Break AI methods into lessons, templates, and checklists.',
          output: 'courses',
        },
        {
          code: 'return',
          title: 'Return to practice',
          body: 'Revise language and tools with feedback.',
          output: 'practice',
        },
      ],
    },
    writing: {
      kicker: 'blog',
      title: 'Blog',
      more: 'All articles →',
      href: '/en/silicon-ashes/writing/',
      empty: 'Articles are being organized.',
      fallbackReadingTime: 'note',
    },
    signalDesk: {
      kicker: 'next',
      title: 'Choose the next action',
      body: 'Pick an essay or a resource.',
      statsLabel: 'signal',
      postCountLabel: 'essays',
      stats: [
        { value: '8h', label: 'course start' },
        { value: '3+', label: 'resource entries' },
      ],
      lanes: [
        {
          code: 'read',
          title: 'Read an essay',
          body: 'Start from the question.',
          href: '/en/silicon-ashes/writing/',
          cta: 'Open blog',
        },
        {
          code: 'learn',
          title: 'Learn a workflow',
          body: 'Bring methods into personal work.',
          href: '/en/silicon-ashes/resources/#course-materials',
          cta: 'Course materials',
        },
        {
          code: 'use',
          title: 'Use a template',
          body: 'Make the next collaboration clearer.',
          href: '/en/silicon-ashes/resources/',
          cta: 'Open resources',
        },
      ],
    },
    course: {
      kicker: 'course',
      title: 'AI Programming and Research Efficiency Basics',
      body: 'For non-CS backgrounds. The goal is an executable research AI workflow.',
      links: [
        { label: 'Course materials', href: '/en/silicon-ashes/resources/#course-materials' },
        { label: 'English course overview', href: `${coursePaths.en}/` },
        { label: 'Schedule · Chinese', href: `${courseBase}schedule/` },
        { label: 'Handout · Chinese', href: `${courseBase}handout/` },
      ],
    },
    resources: {
      kicker: 'resources',
      title: 'Resources',
      body: 'Course materials, templates, and checklists. Useful first.',
      links: [
        { label: 'Course materials', href: '/en/silicon-ashes/resources/#course-materials' },
        { label: 'Task brief', href: '/en/silicon-ashes/resources/task-brief/' },
        { label: 'Prompt template', href: '/en/silicon-ashes/resources/prompt-template/' },
        { label: 'Review checklist', href: '/en/silicon-ashes/resources/review-checklist/' },
      ],
    },
    footer: {
      note: 'silicon-embers',
      contact: 'Contact',
      aboutHref: '/en/silicon-ashes/about/',
    },
  },
} as const;

export type SiliconEmbersHomeCopy = (typeof siliconEmbersHomeCopy)[SiliconEmbersLang];
export interface SiliconEmbersNavCopy {
  htmlLabel: string;
  brand: string;
  homeHref: string;
  navLabel: string;
  switchHref: string;
  switchLabel: string;
  nav: readonly { label: string; href: string }[];
}
export type SiliconEmbersHeroCopy = SiliconEmbersHomeCopy['hero'];
export type SiliconEmbersThesisCopy = SiliconEmbersHomeCopy['thesis'];
export type SiliconEmbersOperatingSystemCopy = SiliconEmbersHomeCopy['operatingSystem'];
export type SiliconEmbersWritingCopy = SiliconEmbersHomeCopy['writing'];
export type SiliconEmbersSignalDeskCopy = SiliconEmbersHomeCopy['signalDesk'];
export type SiliconEmbersLinkSectionCopy = SiliconEmbersHomeCopy['course'] | SiliconEmbersHomeCopy['resources'];

export const siliconEmbersArticleAlternates: Readonly<Record<string, string>> = {
  'ai-research-efficiency-101': 'en-ai-research-workflow-101',
  'en-ai-research-workflow-101': 'ai-research-efficiency-101',
  'chemistry-ai-toolbox': 'en-chemistry-ai-toolbox',
  'en-chemistry-ai-toolbox': 'chemistry-ai-toolbox',
  'prompt-engineering-for-research': 'en-prompting-as-task-design',
  'en-prompting-as-task-design': 'prompt-engineering-for-research',
};
