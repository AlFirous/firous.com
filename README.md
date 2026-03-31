Build in public or work with the garage door up.

## Tech Stack

- Astro
- HTML
- CSS
- JS
- Markdown
- MDX

More detail at [Colophon](https://firous.com/colophon).

## TODO

- PhotoSwipe with Rehype plugin for customizing markdown image `![alt](src)` render from <img> to PhotoSwipe component
- Remove dead code:
  | `src/components/FooterCenter.astro` | Never imported, also references missing `Navs.astro` |
  | `src/components/HeaderCenter.astro` | Never imported |
  | `src/components/GardenLogo.astro` | Never imported |
  | `src/components/RemoteImage.astro` | You already identified - unused |
  | `src/pages/frames.astro` | Unused `Image` import |
  | `src/pages/frames/[framesSlug].astro` | Unused `Image` import |
  | `src/pages/garden/[slug].astro` | Unused `Image` import |
  | `src/pages/monstresia/[monstresia].astro` | Unused `Image` import |
  | `src/pages/quotes.astro` | Unused `Grid` import
