import type { Loader } from "astro/loaders";
import { z } from "astro/zod";

interface RaindropLoaderOptions {
  token: string;
}

interface RDCollection {
  _id: number;
  title: string;
  color?: string;
  cover?: string[];
  count: number;
  public: boolean;
  parent?: { $id: number };
  sort: number;
  view?: string;
}

interface RDRaindrop {
  _id: number;
  title: string;
  link: string;
  domain?: string;
  excerpt?: string;
  note?: string;
  tags?: string[];
  cover?: string;
  created: string;
  type?: string;
  collection?: { $id: number };
}

const API = "https://api.raindrop.io/rest/v1";

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function raindropLoader({ token }: RaindropLoaderOptions): Loader {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return {
    name: "raindrop-loader",
    load: async ({ store, logger }) => {
      if (!token) {
        logger.warn("Raindrop token missing. Skipping fetch.");
        return;
      }

      logger.info("Fetching Raindrop collections...");

      try {
        const [rootRes, childrenRes] = await Promise.all([
          fetch(`${API}/collections`, { headers }),
          fetch(`${API}/collections/childrens`, { headers }),
        ]);

        const rootData = await rootRes.json();
        const childrenData = await childrenRes.json();

        if (!rootData.result) {
          logger.error("Failed to fetch root collections");
          return;
        }

        const allCollections: RDCollection[] = [
          ...(rootData.items || []),
          ...(childrenData.items || []),
        ];

        const publicCollections = allCollections.filter((c) => c.public);
        const collectionMap = new Map<number, RDCollection>();
        allCollections.forEach((c) => collectionMap.set(c._id, c));

        logger.info(`Found ${publicCollections.length} public collections`);

        for (const collection of publicCollections) {
          logger.info(`Fetching raindrops for "${collection.title}"...`);

          const rdRes = await fetch(
            `${API}/raindrops/${collection._id}?perpage=50`,
            { headers },
          );
          const rdData = await rdRes.json();

          const raindrops: RDRaindrop[] = rdData.items || [];
          const parentTitle = collection.parent?.$id
            ? collectionMap.get(collection.parent.$id)?.title || null
            : null;

          store.set({
            id: `collection-${collection._id}`,
            data: {
              collectionId: collection._id,
              title: collection.title,
              slug: slugify(collection.title),
              parentId: collection.parent?.$id || null,
              parentTitle,
              color: collection.color || "",
              cover: collection.cover || [],
              count: collection.count,
              sort: collection.sort,
              view: collection.view || "list",
              raindrops: raindrops.map((r) => ({
                raindropId: r._id,
                collectionId: r.collection?.$id || collection._id,
                title: r.title,
                link: r.link,
                domain: r.domain || "",
                excerpt: r.excerpt || "",
                note: r.note || "",
                tags: r.tags || [],
                cover: r.cover || "",
                created: r.created,
                type: r.type || "link",
              })),
            },
          });
        }

        logger.info(`Stored ${publicCollections.length} public collections`);
      } catch (error) {
        logger.error(`Failed to fetch Raindrop data: ${error}`);
      }
    },
    schema: z.object({
      collectionId: z.number(),
      title: z.string(),
      slug: z.string(),
      parentId: z.number().nullable(),
      parentTitle: z.string().nullable(),
      color: z.string(),
      cover: z.array(z.string()),
      count: z.number(),
      sort: z.number(),
      view: z.string(),
      raindrops: z.array(
        z.object({
          raindropId: z.number(),
          collectionId: z.number(),
          title: z.string(),
          link: z.string(),
          domain: z.string(),
          excerpt: z.string(),
          note: z.string(),
          tags: z.array(z.string()),
          cover: z.string(),
          created: z.string(),
          type: z.string(),
        }),
      ),
    }),
  };
}
