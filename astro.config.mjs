// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    compressHTML: false,
    experimental: {
        fonts: [
            {
                name: "EB Garamond",
                cssVariable: "--font-garamond",
                provider: fontProviders.fontsource(),
                weights: ["400 800"],
                subsets: ["latin"],
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
                name: "Fraunces",
                cssVariable: "--font-fraunces",
                provider: fontProviders.fontsource(),
                weights: ["100 900"],
                variationSettings: "'WONK' 1",
                fallbacks: ["serif"],
                optimizedFallbacks: false,
            },
            {
                name: "Editorial New",
                cssVariable: "--font-editorial-new",
                provider: "local",
                variants: [
                    {
                        style: "italic",
                        src: ["./src/assets/fonts/PPEditorialNew-UltralightItalic.otf"]
                    },
                    {
                        style: "normal",
                        src: ["./src/assets/fonts/PPEditorialNew-Ultralight.otf"]
                    }
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
                        src: ["./src/assets/fonts/PPNeueMontreal-Book.otf"]
                    },
                    {
                        style: "normal",
                        src: ["./src/assets/fonts/PPNeueMontreal-Medium.otf"]
                    }
                ],                
                fallbacks: ["sans-serif"],
                optimizedFallbacks: false,
            }

        ]
    }
});
