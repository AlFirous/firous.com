import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import Parser from "rss-parser";
import fs from "node:fs/promises";
import path from "node:path";

interface CustomItem {
  filmTitle?: string;
  filmYear?: string;
  rating?: string;
  rewatch?: string;
  tmdbId?: string;
  watchedDate?: string;
}

const rssParser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ["letterboxd:filmTitle", "filmTitle"],
      ["letterboxd:filmYear", "filmYear"],
      ["letterboxd:rewatch", "rewatch"],
      ["letterboxd:memberRating", "rating"],
      ["letterboxd:watchedDate", "watchedDate"],
      ["tmdb:movieId", "tmdbId"],
    ],
  },
});

function extractPoster(html: string): string {
  return html.match(/<img[^>]+src="([^"]+)"/)?.[1] || "";
}

function slugFromLink(link: string): string {
  return link.replace(/\/$/, "").split("/").pop() || link;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = j < vals.length ? vals[j] : "";
    });
    rows.push(row);
  }
  return rows;
}

function splitLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line.trim()) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((v) => v.trim());
}

async function fetchBackdrop(
  tmdbId: string,
  token: string
): Promise<string> {
  if (!token) return "";
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.backdrop_path) {
      return `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
    }
  } catch {
    // silent
  }
  return "";
}

const SEARCH_CACHE_FILE = "tmdb-search-cache.json";

function searchCacheKey(title: string, year: string): string {
  return `${title.toLowerCase().trim()}|${year}`;
}

async function searchTMDB(
  title: string,
  year: string,
  token: string
): Promise<{ tmdbId: string; poster: string; backdrop: string } | null> {
  if (!token) return null;
  try {
    const q = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/multi?query=${q}&include_adult=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.results?.length) return null;

    const inputYear = year ? parseInt(year) : null;
    const ranked = data.results
      .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
      .map((r: any) => {
        let score = 0;
        const displayTitle =
          r.media_type === "tv" ? r.name : r.title;
        const dateField =
          r.media_type === "tv"
            ? r.first_air_date
            : r.release_date;
        const resultYear = dateField
          ? parseInt(dateField.slice(0, 4))
          : null;

        if (displayTitle?.toLowerCase() === title.toLowerCase())
          score += 10;
        if (inputYear && resultYear === inputYear) score += 5;
        if (
          resultYear &&
          inputYear &&
          Math.abs(resultYear - inputYear) <= 1
        )
          score += 2;
        if (r.popularity) score += Math.min(r.popularity / 10, 3);
        if (r.vote_count > 100) score += 1;
        if (r.vote_count > 1000) score += 1;
        // Boost TV shows — Letterboxd diaries include series, and movies
        // unfairly win on vote_count alone
        if (r.media_type === "tv") score += 2;

        return { ...r, score };
      });

    if (!ranked.length) return null;

    ranked.sort((a: any, b: any) => b.score - a.score);
    const best = ranked[0];

    return {
      tmdbId: String(best.id),
      poster: best.poster_path
        ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${best.poster_path}`
        : "",
      backdrop: best.backdrop_path
        ? `https://image.tmdb.org/t/p/original${best.backdrop_path}`
        : "",
    };
  } catch {
    return null;
  }
}

export const movieSchema = z.object({
  title: z.string(),
  filmYear: z.number().optional(),
  watchedDate: z.string().optional(),
  rating: z.number().optional(),
  rewatch: z.boolean().optional(),
  link: z.string().optional(),
  poster: z.string().optional(),
  backdrop: z.string().optional(),
  tmdbId: z.string().optional(),
});

interface LetterboxdLoaderOptions {
  rssUrl: string;
  csvPath?: string;
  tmdbToken?: string;
  mode?: "both" | "csv" | "rss";
}

export function letterboxdLoader(
  options: string | LetterboxdLoaderOptions
): Loader {
  const rssUrl = typeof options === "string" ? options : options.rssUrl;
  const csvPath =
    typeof options === "string" ? "" : options.csvPath || "";
  const tmdbToken =
    typeof options === "string" ? "" : options.tmdbToken || "";
  const mode =
    typeof options === "string" ? "both" : options.mode || "both";

  return {
    name: "letterboxd-loader",
    schema: movieSchema,
    load: async ({ store, logger, parseData, meta, generateDigest }) => {
      const MOVIES_DIR = path.join(process.cwd(), "src/data/movies");
      await fs.mkdir(MOVIES_DIR, { recursive: true });

      const SEARCH_CACHE_VERSION = 3; // bump when search logic changes
      const searchCachePath = path.join(MOVIES_DIR, SEARCH_CACHE_FILE);
      const searchCache = new Map<string, { tmdbId: string; poster: string; backdrop: string }>();
      try {
        const raw = await fs.readFile(searchCachePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.version === SEARCH_CACHE_VERSION && Array.isArray(parsed.entries)) {
          for (const [k, v] of parsed.entries) searchCache.set(k, v);
        }
      } catch { /* no cache or invalid */ }

      const saveSearchCache = async () => {
        await fs.writeFile(
          searchCachePath,
          JSON.stringify({ version: SEARCH_CACHE_VERSION, entries: [...searchCache] }, null, 2) + "\n",
          "utf-8"
        );
      };

      // ── Load existing movie cache ──
      const existingFiles = await fs.readdir(MOVIES_DIR).catch(() => []);
      const movieCache = new Map<string, Record<string, unknown>>();
      for (const f of existingFiles) {
        if (!f.endsWith(".json") || f === SEARCH_CACHE_FILE) continue;
        const id = f.replace(".json", "");
        try {
          const content = await fs.readFile(path.join(MOVIES_DIR, f), "utf-8");
          const data = JSON.parse(content);
          // Skip entries from old cache versions — force re-fetch from TMDB
          if (data._cv !== SEARCH_CACHE_VERSION) continue;
          movieCache.set(id, data);
        } catch { /* skip corrupt */ }
      }

      // ── Cached TMDB lookup ──
      const lookupTMDB = async (title: string, year: string) => {
        const cacheKey = searchCacheKey(title, year);
        const cached = searchCache.get(cacheKey);
        if (cached) return cached;
        const result = await searchTMDB(title, year, tmdbToken);
        if (result) searchCache.set(cacheKey, result);
        return result;
      };

      const saveEntry = async (id: string, data: Record<string, unknown>) => {
        const validated = await parseData({
          id,
          data: { ...data, watchedDate: data.watchedDate || undefined },
        });
        store.set({ id, data: validated, digest: generateDigest(validated) });
        await fs.writeFile(path.join(MOVIES_DIR, `${id}.json`), JSON.stringify(data, null, 2) + "\n", "utf-8");
      };

      const activeIds = new Set<string>();
      const csvBaseSlugs = new Set<string>();

      // ── Step 1: CSV Import ──
      let csvNewCount = 0;
      if (mode !== "rss" && csvPath) {
        const csvFile = path.join(process.cwd(), csvPath);
        try {
          const csvText = await fs.readFile(csvFile, "utf-8");
          const rows = parseCSV(csvText);
          logger.info(`Parsed ${rows.length} entries from CSV.`);

          rows.sort((a, b) => {
            const da = a["Watched Date"] || a.Date || "";
            const db = b["Watched Date"] || b.Date || "";
            return da.localeCompare(db);
          });

          const slugCounter = new Map<string, number>();
          for (const row of rows) {
            const title = row.Name || "";
            if (!title) continue;

            // Use title slug for ID — matches RSS slug format, eliminates duplicates with RSS
            const baseSlug = slugifyTitle(title);
            csvBaseSlugs.add(baseSlug);

            const count = slugCounter.get(baseSlug) ?? 0;
            slugCounter.set(baseSlug, count + 1);
            const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
            activeIds.add(id);

            const rating = row.Rating ? parseFloat(row.Rating) : undefined;
            const watchedDate = row["Watched Date"] || row.Date || undefined;

            const cached = movieCache.get(id);
            if (cached) {
              cached.rating = rating ?? cached.rating;
              cached.watchedDate = watchedDate ?? cached.watchedDate;
              await saveEntry(id, cached);
              continue;
            }

            const year = row.Year || "";
            const tmdbResult = await lookupTMDB(title, year);
            // Only delay before actual API call, not cache hits
            if (!searchCache.has(searchCacheKey(title, year)) && tmdbResult) {
              await new Promise((r) => setTimeout(r, 250));
            }

            await saveEntry(id, {
              _cv: SEARCH_CACHE_VERSION,
              title,
              filmYear: year ? parseInt(year) : undefined,
              watchedDate,
              rating: rating && !isNaN(rating) ? rating : undefined,
              rewatch: count > 0,
              link: row["Letterboxd URI"] || "",
              poster: tmdbResult?.poster || "",
              backdrop: tmdbResult?.backdrop || "",
              tmdbId: tmdbResult?.tmdbId || undefined,
            });
            csvNewCount++;
          }
          logger.info(`CSV: ${csvNewCount} new, ${rows.length - csvNewCount} cached.`);
        } catch (e) {
          logger.warn(`CSV not found at ${csvPath} (${e}). Skipping CSV import.`);
        }
      }

      // ── Step 2: RSS ──
      if (mode !== "csv") try {
        const cachedFingerprint = meta.get("fingerprint");
        const feed = await rssParser.parseURL(rssUrl);
        const fingerprint = feed.items?.map((i) => i.guid || i.link || "").join("|") || "";

        if (cachedFingerprint === fingerprint && csvNewCount === 0) {
          await saveLegacyEntries(movieCache, activeIds, tmdbToken, saveEntry, fetchBackdrop);
          await cleanupOrphans(MOVIES_DIR, activeIds, SEARCH_CACHE_FILE, logger);
          // Remove stale entries no longer in the active set
          for (const key of store.keys()) {
            if (!activeIds.has(key)) {
              store.delete(key);
            }
          }
          await saveSearchCache();
          logger.info(`RSS unchanged. Loaded ${store.keys().length} movies from cache.`);
          return;
        }

        logger.info(`Parsing ${feed.items?.length || 0} items from RSS.`);

        for (const item of feed.items || []) {
          const link = item.link || "";
          const baseSlug = slugFromLink(link);
          if (csvBaseSlugs.has(baseSlug)) continue;

          const id = baseSlug;
          activeIds.add(id);

          if (movieCache.has(id)) {
            const cached = movieCache.get(id)!;
            if (!cached.backdrop && item.tmdbId && tmdbToken) {
              cached.backdrop = await fetchBackdrop(item.tmdbId, tmdbToken);
              await saveEntry(id, cached);
            }
            continue;
          }

          const description = item.content || item.contentSnippet || "";
          const poster = extractPoster(description);
          const rating = item.rating ? parseFloat(item.rating) : undefined;
          const backdrop = item.tmdbId ? await fetchBackdrop(item.tmdbId, tmdbToken) : "";

          await saveEntry(id, {
            _cv: SEARCH_CACHE_VERSION,
            title: item.filmTitle || item.title || baseSlug,
            filmYear: item.filmYear ? parseInt(item.filmYear) : undefined,
            watchedDate: item.watchedDate || item.pubDate || undefined,
            rating,
            rewatch: item.rewatch === "Yes",
            link,
            poster,
            backdrop,
            tmdbId: item.tmdbId || undefined,
          });
        }

        meta.set("fingerprint", fingerprint);
      } catch (e) {
        logger.warn(`RSS fetch failed (${e}). Using cached data.`);
      }

      // ── Step 3: Save legacy cached entries not in CSV/RSS ──
      await saveLegacyEntries(movieCache, activeIds, tmdbToken, saveEntry, fetchBackdrop);

      // ── Step 4: Clean up orphan boxd.it short code files ──
      await cleanupOrphans(MOVIES_DIR, activeIds, SEARCH_CACHE_FILE, logger);

      // Remove stale entries no longer in the active set
      for (const key of store.keys()) {
        if (!activeIds.has(key)) {
          store.delete(key);
        }
      }

      await saveSearchCache();
      logger.info(`Total movies: ${store.keys().length}.`);
    },
  };
}

async function saveLegacyEntries(
  movieCache: Map<string, Record<string, unknown>>,
  activeIds: Set<string>,
  tmdbToken: string,
  saveEntry: (id: string, data: Record<string, unknown>) => Promise<void>,
  fetchBackdropFn: (tmdbId: string, token: string) => Promise<string>
): Promise<void> {
  for (const [id, data] of movieCache) {
    if (activeIds.has(id)) continue;
    // Skip old boxd.it short code files — they're orphans
    if (/^[a-zA-Z0-9]{5,7}$/.test(id)) continue;
    activeIds.add(id);
    if (!data.backdrop && data.tmdbId && tmdbToken) {
      data.backdrop = await fetchBackdropFn(data.tmdbId as string, tmdbToken);
    }
    await saveEntry(id, data);
  }
}

async function cleanupOrphans(
  dir: string,
  activeIds: Set<string>,
  excludeFile: string,
  logger: { info: (msg: string) => void }
): Promise<void> {
  const files = await fs.readdir(dir).catch(() => []);
  let removed = 0;
  for (const f of files) {
    if (!f.endsWith(".json") || f === excludeFile) continue;
    const id = f.replace(".json", "");
    if (!activeIds.has(id) && /^[a-zA-Z0-9]{5,7}$/.test(id)) {
      await fs.unlink(path.join(dir, f)).catch(() => {});
      removed++;
    }
  }
  if (removed > 0) {
    logger.info(`Cleaned up ${removed} orphan boxd.it files.`);
  }
}
