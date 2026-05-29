import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { lastfmLoader } from "./loaders/lastfm";
import { youtubeLoader } from "./loaders/youtube";
import { letterboxdLoader } from "./loaders/letterboxd";
import { raindropLoader } from "./loaders/raindrop";
// import { obsidianVaultLoader } from "./loaders/obsidian-vault";

const music = defineCollection({
  loader: lastfmLoader({
    username: import.meta.env.LASTFM_USERNAME || "",
    apiKey: import.meta.env.LASTFM_API_KEY || "",
    limit: 20,
  }),
});

const mixtapes = defineCollection({
  loader: youtubeLoader({
    playlistIds: ["PLexample1", "PLexample2"], // Add your playlist IDs here
    apiKey: import.meta.env.YOUTUBE_API_KEY || "",
  }),
});

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

const frames = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/frames" }),
  schema: z.object({
    title: z.string(),
    taken: z.coerce.date().optional(),
    created: z.coerce.date().optional(),
    modified: z.coerce.date().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    cssclasses: z.array(z.string()).optional(),
  }),
});

const monstresia = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/monstresia" }),
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

const movies = defineCollection({
  loader: letterboxdLoader({
    rssUrl: "https://letterboxd.com/alfirous/rss/",
    csvPath: "src/data/diary.csv",
    tmdbToken: import.meta.env.TMDB_ACCESS_TOKEN || "",
    mode: "csv",
  }),
});

const moviesRss = defineCollection({
  loader: letterboxdLoader({
    rssUrl: "https://letterboxd.com/alfirous/rss/",
    tmdbToken: import.meta.env.TMDB_ACCESS_TOKEN || "",
    mode: "rss",
  }),
});

const labs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/labs" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    layout: z.string().optional(),
    taken: z.coerce.date().optional(),
    created: z.union([z.string(), z.date()]).optional(),
    modified: z.union([z.string(), z.date()]).optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    cssclasses: z.array(z.string()).optional(),
  }),
});

const bookmarks = defineCollection({
  loader: raindropLoader({
    token: import.meta.env.RAINDROP_TOKEN || "",
  }),
});

export const collections = {
  quotes,
  garden,
  frames,
  monstresia,
  labs,
  music,
  mixtapes,
  movies,
  moviesRss,
  bookmarks,
};
