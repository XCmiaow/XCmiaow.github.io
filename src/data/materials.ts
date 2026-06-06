export type MaterialAudience = 'academic' | 'career' | 'review' | 'portfolio';

export interface MaterialItem {
  id: string;
  audience: MaterialAudience;
  href: {
    zh: string;
    en: string;
  };
  zh: {
    title: string;
    desc: string;
    action: string;
    usage: string;
    status: string;
  };
  en: {
    title: string;
    desc: string;
    action: string;
    usage: string;
    status: string;
  };
}

export const materials: MaterialItem[] = [
  {
    id: 'general-resume',
    audience: 'review',
    href: { zh: '/resume-onepage', en: '/en/resume-onepage' },
    zh: {
      title: '通用一页简历',
      desc: '用于快速介绍教育背景、核心荣誉、项目经历和技能结构。',
      action: '打开并打印',
      usage: '通用自我介绍、老师初筛、同学合作、线上链接补充。',
      status: '公开脱敏版',
    },
    en: {
      title: 'General One-Page Resume',
      desc: 'A compact overview of education, honors, projects, and skills.',
      action: 'Open & print',
      usage: 'General introduction, quick review, collaboration, and profile links.',
      status: 'Public sanitized version',
    },
  },
  {
    id: 'academic-resume',
    audience: 'academic',
    href: { zh: '/resume-academic', en: '/en/resume-academic' },
    zh: {
      title: '保研评优版简历',
      desc: '突出 GPA、排名、奖学金、竞赛奖项、学生工作与志愿服务。',
      action: '打开并打印',
      usage: '保研预备、奖学金评审、三好学生、综合素质评定。',
      status: '公开脱敏版',
    },
    en: {
      title: 'Academic Review Resume',
      desc: 'Focused on GPA, ranking, scholarship, competitions, leadership, and service.',
      action: 'Open & print',
      usage: 'Academic review, scholarship screening, and comprehensive evaluation.',
      status: 'Public sanitized version',
    },
  },
  {
    id: 'career-resume',
    audience: 'career',
    href: { zh: '/resume-career', en: '/en/resume-career' },
    zh: {
      title: '求职实习版简历',
      desc: '突出数学建模、Python、Astro 网站、AI 工具链和项目落地能力。',
      action: '打开并打印',
      usage: '实习投递、项目合作、技术能力展示、GitHub 主页链接。',
      status: '公开脱敏版',
    },
    en: {
      title: 'Internship Resume',
      desc: 'Focused on modeling, Python, Astro, AI toolchains, and implementation.',
      action: 'Open & print',
      usage: 'Internship applications, project collaboration, and GitHub profile links.',
      status: 'Public sanitized version',
    },
  },
  {
    id: 'evidence-gallery',
    audience: 'review',
    href: { zh: '/evidence', en: '/en/evidence' },
    zh: {
      title: '证明材料墙',
      desc: '集中展示奖项证书与荣誉证明，支持点击查看大图。',
      action: '查看证书',
      usage: '审核奖项真实性、补充评审材料、核对证书图片。',
      status: '公开证据版',
    },
    en: {
      title: 'Certificate Gallery',
      desc: 'A centralized gallery for certificates and award evidence.',
      action: 'View evidence',
      usage: 'Award verification, review support, and certificate checking.',
      status: 'Public evidence version',
    },
  },
  {
    id: 'modeling-case',
    audience: 'portfolio',
    href: { zh: '/modeling', en: '/en/modeling' },
    zh: {
      title: '数学建模项目说明',
      desc: '说明建模训练如何转化为问题抽象、数据分析、论文表达和团队协作能力。',
      action: '查看项目',
      usage: '项目面试、竞赛经历解释、科研能力补充说明。',
      status: '项目说明页',
    },
    en: {
      title: 'Modeling Project Case',
      desc: 'Explains how modeling practice maps to abstraction, analysis, writing, and teamwork.',
      action: 'View project',
      usage: 'Project interviews, competition explanation, and research-potential review.',
      status: 'Project detail page',
    },
  },
  {
    id: 'chem-ai-lab',
    audience: 'portfolio',
    href: { zh: '/chem-ai-lab', en: '/en/chem-ai-lab' },
    zh: {
      title: 'ChemAI Lab 方向页',
      desc: '展示 AI 辅助化学研究、计算化学和机器学习工具链的长期学习方向。',
      action: '查看方向',
      usage: '科研兴趣说明、AI 化学方向展示、长期项目规划。',
      status: '方向说明页',
    },
    en: {
      title: 'ChemAI Lab Direction',
      desc: 'Shows the long-term learning direction in AI-assisted chemistry and computational tools.',
      action: 'View direction',
      usage: 'Research-interest explanation, AI chemistry profile, and long-term planning.',
      status: 'Direction page',
    },
  },
];
