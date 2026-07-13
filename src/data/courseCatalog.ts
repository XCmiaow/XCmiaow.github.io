export const courseModules = [
  {
    id: 'foundations-1',
    slug: '01-ai-history',
    title: 'AI 发展史与能力地图',
    shortTitle: 'AI 能力地图',
  },
  {
    id: 'foundations-2',
    slug: '02-llm-mental-model',
    title: '大语言模型的工作方式',
    shortTitle: 'LLM 心智模型',
  },
  {
    id: 'task-design',
    slug: '03-task-design',
    title: '任务、提示、上下文与验收',
    shortTitle: '任务设计',
  },
  {
    id: 'tool-systems',
    slug: '04-tool-systems',
    title: '网络、API、文件、成本与安全',
    shortTitle: '工具系统',
  },
  {
    id: 'agents',
    slug: '05-controlled-agents',
    title: '可控智能体与人机协作',
    shortTitle: '可控智能体',
  },
  {
    id: 'workflow-lab',
    slug: '06-research-workflow-studio',
    title: '科研工作流设计工坊',
    shortTitle: '工作流工坊',
  },
] as const;

export type CourseModuleId = (typeof courseModules)[number]['id'];
export type CourseSlug = (typeof courseModules)[number]['slug'];

export const courseFacts = {
  language: 'zh',
  totalMinutes: 720,
  productMinutes: 290,
  workBuddyMinutes: 45,
  audience: '广泛科研人员；案例与练习以化学、化工教师为主',
  delivery: '线下授课优先，同时兼容自学',
} as const;

export const coursePaths = {
  zh: '/silicon-ashes/courses/ai-research-efficiency',
  en: '/en/silicon-ashes/courses/ai-research-efficiency',
} as const;
