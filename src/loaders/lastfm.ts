import type { Loader } from "astro/loaders";
import { z } from "astro/zod";

interface LastfmLoaderOptions {
  username: string;
  apiKey: string;
  period?: "7day" | "1month" | "12month" | "overall";
  limit?: number;
}

export function lastfmLoader({ username, apiKey, period = "overall", limit = 10 }: LastfmLoaderOptions): Loader {
  return {
    name: "lastfm-loader",
    load: async ({ store, logger, generateDigest }) => {
      if (!apiKey || !username) {
        logger.warn("Last.fm credentials missing. Skipping fetch.");
        return;
      }

      logger.info(`Fetching Last.fm data (${period}) for ${username}...`);

      try {
        // Fetch Top Artists
        const artistsUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`;
        const artistsRes = await fetch(artistsUrl);
        const artistsData = await artistsRes.json();

        if (artistsData.topartists?.artist) {
          logger.info(`Found ${artistsData.topartists.artist.length} artists.`);
          artistsData.topartists.artist.forEach((artist: any) => {
            const data = {
              name: artist.name,
              playcount: parseInt(artist.playcount),
              url: artist.url,
              image: artist.image[3]["#text"] || "",
              type: "artist",
            };
            store.set({
              id: `artist-${artist.mbid || artist.name.replace(/\s+/g, "-").toLowerCase()}`,
              data,
              digest: generateDigest(data),
            });
          });
        } else {
          logger.warn(`Last.fm Artist API Response: ${JSON.stringify(artistsData).substring(0, 200)}`);
        }

        // Fetch Top Albums
        const albumsUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`;
        const albumsRes = await fetch(albumsUrl);
        const albumsData = await albumsRes.json();

        if (albumsData.topalbums?.album) {
          logger.info(`Found ${albumsData.topalbums.album.length} albums.`);
          albumsData.topalbums.album.forEach((album: any) => {
            const data = {
              title: album.name,
              artist: album.artist.name,
              playcount: parseInt(album.playcount),
              url: album.url,
              image: album.image[3]["#text"] || "",
              type: "album",
            };
            store.set({
              id: `album-${album.mbid || (album.artist.name + "-" + album.name).replace(/\s+/g, "-").toLowerCase()}`,
              data,
              digest: generateDigest(data),
            });
          });
        } else {
          logger.warn(`Last.fm Album API Response: ${JSON.stringify(albumsData).substring(0, 200)}`);
        }
        // Fetch Recent Tracks
        const tracksUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&limit=${limit}&format=json`;
        const tracksRes = await fetch(tracksUrl);
        const tracksData = await tracksRes.json();

        if (tracksData.recenttracks?.track) {
          tracksData.recenttracks.track.forEach((track: any, index: number) => {
            const isNowPlaying = track["@attr"]?.nowplaying === "true";
            const data = {
              title: track.name,
              artist: track.artist["#text"],
              album: track.album["#text"],
              image: track.image[3]["#text"] || "",
              url: track.url,
              nowPlaying: isNowPlaying,
              type: "track",
            };
            store.set({
              id: `track-${index}`,
              data,
              digest: generateDigest(data),
            });
          });
        }
      } catch (error) {
        logger.error(`Failed to fetch Last.fm data: ${error}`);
      }
    },
    schema: z.object({
      id: z.string(),
      type: z.enum(["artist", "track", "album"]),
      name: z.string().optional(), // for artists
      title: z.string().optional(), // for tracks and albums
      artist: z.string().optional(), // for tracks and albums
      album: z.string().optional(), // for tracks
      playcount: z.number().optional(),
      image: z.string().optional(),
      url: z.url(),
      nowPlaying: z.boolean().optional(),
    }),
  };
}
