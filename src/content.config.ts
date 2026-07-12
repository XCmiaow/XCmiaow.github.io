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

export const collections = { blog };
