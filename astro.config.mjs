// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import flexokiTheme from "./flexoki.json";

import metaTags from "astro-meta-tags";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  compressHTML: false,

  experimental: {
    fonts: [
      {
        name: "EB Garamond",
        cssVariable: "--font-garamond",
        provider: "local",
        variants: [
          {
            style: "normal",
            weight: "400 800",
            src: ["./src/assets/fonts/EBGaramond-VariableFont_wght.woff2"],
          },
          {
            style: "italic",
            weight: "400 800",
            src: ["./src/assets/fonts/EBGaramond-VariableFont_wght-italic.woff2"],
          },
        ],
        fallbacks: ["serif"],
        optimizedFallbacks: false,
      },
      {
        name: "Inter",
        cssVariable: "--font-inter",
        provider: fontProviders.fontsource(),
        weights: ["100 900"],
        fallbacks: ["sans-serif"],
        optimizedFallbacks: false,
      },
      {
        name: "IBM Plex Sans",
        cssVariable: "--font-plex-sans",
        provider: "local",
        variants: [
          {
            style: "normal",
            weight: "100 700",
            src: ["./src/assets/fonts/IBM Plex Sans Var-Roman.woff2"],
          },
        ],
        fallbacks: ["sans-serif"],
        optimizedFallbacks: false,
      },
      {
        name: "Lilex",
        cssVariable: "--font-lilex",
        provider: "local",
        variants: [
          {
            style: "normal",
            weight: "100 700",
            src: ["./src/assets/fonts/Lilex[wght].woff2"],
          },
        ],
        fallbacks: ["monospace"],
        optimizedFallbacks: false,
      },
      {
        name: "Editorial New",
        cssVariable: "--font-editorial-new",
        provider: "local",
        variants: [
          {
            style: "italic",
            src: ["./src/assets/fonts/PPEditorialNew-UltralightItalic.otf"],
          },
          {
            style: "normal",
            src: ["./src/assets/fonts/PPEditorialNew-Ultralight.otf"],
          },
        ],
        fallbacks: ["serif"],
        optimizedFallbacks: false,
      },
      {
        name: "Neue Montreal",
        cssVariable: "--font-neue-montreal",
        provider: "local",
        variants: [
          {
            style: "normal",
            src: ["./src/assets/fonts/PPNeueMontreal-Book.otf"],
          },
          {
            style: "normal",
            src: ["./src/assets/fonts/PPNeueMontreal-Medium.otf"],
          },
        ],
        fallbacks: ["sans-serif"],
        optimizedFallbacks: false,
      },
      {
        name: "Libertinus Sans",
        cssVariable: "--font-libertinus-sans",
        provider: "local",
        variants: [
          {
            style: "normal",
            weight: "400",
            src: ["./src/assets/fonts/LibertinusSans-400.woff2"],
          },
        ],
        fallbacks: ["sans-serif"],
        optimizedFallbacks: false,
      },
    ],
  },

  markdown: {
    shikiConfig: {
      theme: {
        name: "Flexoki",
        type: "dark",
        settings: flexokiTheme.tokenColors,
      },
    },
  },

  integrations: [metaTags(), mdx()],
});
