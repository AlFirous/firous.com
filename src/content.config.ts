import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const quotes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/quotes" }),
  schema: z.object({
    title: z.string(),
    created: z.coerce.date(),
    modified: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const garden = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/garden" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.preprocess((val) => {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
        const match = val[0].match(/\[\[(.*?)\]\]/);
        return match ? match[1] : val[0];
      }
      return val;
    }, z.string().optional()),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    created: z.union([z.string(), z.date()]).optional(),
    modified: z.union([z.string(), z.date()]).optional(),
  }),
});

export const collections = {
  quotes,
  garden,
};
