import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    lang: z.enum(['zh', 'en']),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    series: z.string().optional(),
    cover: z.string().optional(),
    readingTime: z.number().optional(),
    audience: z.enum(['teacher', 'researcher', 'general']).optional(),
  }),
});

const course = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/course' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    module: z.enum(['foundations-1', 'foundations-2', 'task-design', 'tool-systems', 'agents', 'workflow-lab']),
    order: z.number().int().positive(),
    durationMinutes: z.number().int().positive(),
    kind: z.enum(['lesson', 'lab']),
    objectives: z.array(z.string()).min(2),
    prerequisites: z.array(z.string()),
    deliverables: z.array(z.string()).min(1),
    sources: z.array(
      z.object({
        title: z.string(),
        url: z.url(),
        reviewedAt: z.coerce.date(),
      }),
    ),
    productMinutes: z.number().int().nonnegative(),
    workBuddyMinutes: z.number().int().nonnegative().default(0),
    draftBody: z.boolean().default(false),
  }),
});

export const collections = { blog, course };
