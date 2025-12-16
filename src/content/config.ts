import { defineCollection, z } from 'astro:content';

const quotes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    created: z.coerce.date(),
    modified: z.coerce.date().optional(),
    type: z.string().optional(),
    tags: z.array(z.string()).optional(),
    cssclasses: z.array(z.string()).optional(),
  }),
});

export const collections = {
  quotes,
};
