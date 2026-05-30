# Firous.com

Personal static site built with **Astro 6** (SSG, `output: "static"`). Vanilla HTML/CSS/JS — no React, no framework components in templates.

## Commands

```sh
pnpm dev          # astro dev (long-running dev server)
pnpm build        # astro build
pnpm astro check  # type-check all files (uses @astrojs/check)
```

No test framework. Type-checking via `pnpm astro check` is the only verification step. Run it after every change.

`pnpm` is the package manager. Never use `npm` or `yarn`.

## Architecture

Monorepo? No — single package (`astro.config.mjs` is the root). Layout is flat:

- `src/content.config.ts` — all content collections defined here (10 collections: quotes, garden, frames, monstresia, labs, music, mixtapes, movies, moviesRss, bookmarks, inspiration, obsidian)
- `src/loaders/` — custom remote loaders (lastfm, youtube, letterboxd, raindrop, cosmos, _obsidian-vault). These fetch from external APIs at build time
- `src/data/` — local markdown/CSV content for glob-loaded collections
- `src/pages/` — flat page routes + param slug directories (`frames/[framesSlug].astro`, etc.)
- `src/layouts/` — per-content-type layouts (FramesLayout, GardenLayout, LabsLayout, MonstresiaLayout)
- `src/components/` — shared UI components
- `src/styles/` — per-page CSS files, all imported as side-effect imports in `.astro` frontmatter
- `src/styles/variables.css` — global design tokens (must use this)
- Images hosted on **Cloudflare R2 CDN** (`cdn.firous.com`)
- 9 fonts configured in `astro.config.mjs` via Fonts API, loaded via `<Font cssVariable="..." preload />`

## Critical quirks

### Remote loaders + dev server loops

Remote loaders call `store.set()` → writes to `.astro/data-store.json` → dev server watcher detects change → triggers reload → loaders run again → infinite loop.

**Fix:** Every `store.set()` must include `digest: generateDigest(data)`. `store.set()` returns `false` when digest matches existing entry, which skips the disk write and breaks the loop.

**Never use `store.clear()`** in a remote loader — it forces a full rewrite every reload, guaranteeing the loop. Instead, track active IDs and delete stale entries at the end.

### TypeScript + `.astro` files

`.astro` files are **excluded from tsconfig** (`"**/*.astro"` in `exclude`). The TypeScript compiler can't parse Astro's template syntax. Only the frontmatter (`---` block) is TypeScript; the template section is not type-checked by `tsc`. Astro's own language server handles `.astro` checks.

**Implicit `any` errors** in `.astro` frontmatter: `getCollection()` return types aren't available to the TS language server. Add explicit type annotations to callback parameters in `.map()`, `.filter()`, `.sort()` etc., or use `as any` on the `getCollection()` call and type the variable explicitly.

### Prettier

`printWidth: 1000` — extremely wide. Don't reformat file line breaks to match default 80. Keep existing formatting.

### Inline scripts in `.astro`

Scripts in `.astro` `<script>` tags use TypeScript syntax (`: type` annotations, `as` casts) because Astro processes them. Use `e as MouseEvent`, `querySelectorAll<HTMLElement>`, etc. The TS server checks these.

For third-party scripts with `src` or `data-` attributes, add `is:inline` directive explicitly to suppress the astro(4000) hint.

### Environment variables

Loaded from `.env` (committed — personal project, local dev only). Required vars:
- `LASTFM_API_KEY`, `LASTFM_USERNAME`
- `TMDB_ACCESS_TOKEN`
- `RAINDROP_TOKEN`
- `YOUTUBE_API_KEY` (optional, playlist IDs are placeholders)
- `OBSIDIAN_VAULT_PATH` (optional, gates the obsidian collection)

### Content collection conventions

- 5 glob-loaded collections: quotes, garden, frames, monstresia, labs (markdown/MDX in `src/data/`)
- 7 remote-loaded collections: music (Last.fm), mixtapes (YouTube), movies/moviesRss (Letterboxd), bookmarks (Raindrop), inspiration (Cosmos), obsidian (local vault — gated behind env var)
- Each remote loader is its own file in `src/loaders/` with `Loader` object pattern
- `_obsidian-vault.ts` is prefixed with underscore — draft loader, not yet wired to env

## Dead code (from README — don't touch unless asked)

- `src/components/FooterCenter.astro` — never imported (imports Nav.astro as `Navs`, already fixed)
- `src/components/HeaderCenter.astro` — never imported
- `src/components/GardenLogo.astro` — never imported
- `src/components/RemoteImage.astro` — never imported
- Several pages have unused `Image` imports from `astro:assets` (frames, garden/[slug], monstresia/[monstresia], quotes)

## Git conventions

Conventional commits per `.github/commit-instructions.md`:
```
<type>[optional scope]: <description>
```
Types: `fix`, `feat`, `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`.

### Zod 4 API changes

`astro/zod` re-exports `zod/v4`. In Zod 4, `z.string().url()` is deprecated — use `z.url()` instead. Same for other string validators (`z.string().base64url()` → `z.base64url()`, etc.).

## Verification status

`pnpm astro check` yields **0 errors, 0 warnings, 3 hints** (all in third-party `.js` files — `src/scripts/imamu.js` and `src/scripts/spectrogram.js`).

## Astro docs reference

- LLM-optimized: https://docs.astro.build/llms.txt
- Full docs: https://docs.astro.build/
