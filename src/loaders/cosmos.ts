import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import fs from "node:fs/promises";
import path from "node:path";

const cosmosImageSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

const cosmosItemSchema = z.object({
  id: z.number(),
  image: cosmosImageSchema.nullable(),
  type: z.string().nullable(),
  url: z.string().nullable(),
  sourceUrl: z.string().nullable(),
});

const cosmosCollectionSchema = z.object({
  name: z.string(),
  slug: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  updatedAt: z.string(),
  items: z.array(cosmosItemSchema),
});

interface CosmosLoaderOptions {
  username: string;
  slugs: string[];
}

export function cosmosLoader(options: CosmosLoaderOptions): Loader {
  const { username, slugs } = options;

  return {
    name: "cosmos-loader",
    schema: cosmosCollectionSchema,
    load: async ({ store, logger, parseData, generateDigest }) => {
      const DATA_DIR = path.join(process.cwd(), "src/data/inspiration");
      const IMAGES_DIR = path.join(process.cwd(), "public/_cache/images/inspirations");
      const COSMOS_API = "https://api.cosmos.so/graphql";

      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.mkdir(IMAGES_DIR, { recursive: true });

      const readCached = async (slug: string) => {
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, `${slug}.json`), "utf-8");
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };

      const hasCachedImages = async (data: Record<string, unknown>): Promise<boolean> => {
        const items = data.items as Array<Record<string, unknown>> | undefined;
        if (!items || items.length === 0) return false;
        for (const item of items) {
          const img = item.image as Record<string, string> | null | undefined;
          if (!img?.url) return false;
          try {
            await fs.access(path.join(IMAGES_DIR, path.basename(img.url)));
          } catch {
            return false;
          }
        }
        return true;
      };

      const downloadImage = async (imageUrl: string, id: number): Promise<string | null> => {
        const localPath = path.join(IMAGES_DIR, String(id));
        try {
          await fs.access(localPath);
          return `/_cache/images/inspirations/${id}`;
        } catch {
          // not cached, download
        }
        try {
          const res = await fetch(imageUrl);
          if (!res.ok) return null;
          const buffer = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(localPath, buffer);
          return `/_cache/images/inspirations/${id}`;
        } catch {
          return null;
        }
      };

      const saveEntry = async (slug: string, data: Record<string, unknown>) => {
        const validated = await parseData({ id: slug, data });
        store.set({ id: slug, data: validated, digest: generateDigest(validated) });
        await fs.writeFile(
          path.join(DATA_DIR, `${slug}.json`),
          JSON.stringify(data, null, 2),
          "utf-8"
        );
      };

      const fetchFailed: string[] = [];

      for (const slug of slugs) {
        const query = `query($username: String!, $slug: String!) { cluster(input:{ownerUsername:$username,slug:$slug}) { name description updatedAt elements { items { id image { url width height } type url sourceUrl } } } }`;

        try {
          const res = await fetch(COSMOS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables: { username, slug } }),
          });
          const json = await res.json();
          const cluster = json.data?.cluster;

          if (!cluster) {
            logger.warn(`[cosmos] Unexpected API response for "${slug}"`);
            fetchFailed.push(slug);
            continue;
          }

          const raw: Record<string, unknown> = {
            name: cluster.name,
            slug,
            url: `https://www.cosmos.so/${username}/${slug}`,
            description: cluster.description || null,
            updatedAt: cluster.updatedAt,
            items: [],
          };

          const items: Array<Record<string, unknown>> = [];
          for (const item of (cluster.elements?.items || [])) {
            if (!item.image?.url) continue;
            if (items.length >= 6) break;
            const localUrl = await downloadImage(item.image.url, item.id);
            items.push({
              id: item.id,
              image: {
                url: localUrl || item.image.url,
                width: item.image.width,
                height: item.image.height,
              },
              type: item.type,
              url: item.url,
              sourceUrl: item.sourceUrl,
            });
          }
          raw.items = items;
          await saveEntry(slug, raw);
        } catch (e) {
          logger.warn(`[cosmos] Failed to fetch "${slug}"`);
          fetchFailed.push(slug);
        }
      }

      // Fall back to cache for failed slugs
      if (fetchFailed.length > 0) {
        logger.info(`[cosmos] ${fetchFailed.length} slug(s) failed, trying cache…`);
        for (const slug of fetchFailed) {
          const cached = await readCached(slug);
          if (cached) {
            const imagesOk = await hasCachedImages(cached);
            if (imagesOk) {
              const validated = await parseData({ id: slug, data: cached });
              store.set({ id: slug, data: validated, digest: generateDigest(validated) });
              logger.info(`[cosmos] Loaded "${slug}" from cache`);
            } else {
              logger.warn(`[cosmos] Cached "${slug}" has missing images, skipping`);
            }
          } else {
            logger.warn(`[cosmos] No cache for "${slug}", skipping`);
          }
        }
      }

      // Remove stale collections no longer in the slugs list
      for (const key of store.keys()) {
        if (!slugs.includes(key)) {
          store.delete(key);
        }
      }

      logger.info(`[cosmos] Loaded ${store.keys().length} collection(s)`);
    },
  };
}
