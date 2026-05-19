import type { Loader } from "astro/loaders";
import { z } from "astro/zod";

interface YoutubeLoaderOptions {
  playlistIds: string[];
  apiKey: string;
}

export function youtubeLoader({ playlistIds, apiKey }: YoutubeLoaderOptions): Loader {
  return {
    name: "youtube-loader",
    load: async ({ store, logger }) => {
      if (!apiKey || apiKey === "") {
        logger.warn("YouTube API key is missing. Skipping playlist fetch.");
        return;
      }

      logger.info("Fetching YouTube Playlist data...");

      for (const playlistId of playlistIds) {
        if (playlistId.startsWith("PLexample")) continue; // Skip placeholders

        try {
          const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
          const playlistRes = await fetch(playlistUrl);

          if (!playlistRes.ok) {
            const error = await playlistRes.json();
            logger.error(`YouTube API Error: ${error.error?.message || playlistRes.statusText}`);
            continue;
          }

          const playlistData = await playlistRes.json();

          if (playlistData.items && playlistData.items.length > 0) {
            const item = playlistData.items[0];
            store.set({
              id: `mixtape-${playlistId}`,
              data: {
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url,
                url: `https://www.youtube.com/playlist?list=${playlistId}`,
                type: "mixtape",
              },
            });
          }
        } catch (error) {
          logger.error(`Failed to fetch YouTube playlist ${playlistId}: ${error}`);
        }
      }
    },
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      thumbnail: z.string().optional(),
      url: z.string().url(),
      type: z.literal("mixtape"),
    }),
  };
}
