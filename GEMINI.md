This is Astro project for building static personal websites using **Content Layer API** with multiple content types like blog posts, photo galleries, project case studies, quotes collections, and more in the future. Each content type has its own folder/directory, own index page under the `src/pages` directory, and own layout (with exception some content type will use global layout).

Follow Astro latest documentation and best practices when generating code. I already installed Astro Docs MCP server. Also available with URL `https://mcp.docs.astro.build/mcp` and `https://docs.astro.build`. You may refer to external resources as needed.

I know HTML and CSS, so you can skip explanations about those technologies. For other language, please provide simple explanations only when using advanced concepts or less-known features. Add comments to the code only when necessary for clarity.

Follow best practices for SEO, performance, accessibility, and responsive design when generating code for this Astro project. Use semantic HTML5 elements and ARIA roles where appropriate. Use baseline CSS styles that work across modern browsers and devices.

When generating code snippets, ensure they are complete and functional. Include necessary imports, exports, and dependencies. Use consistent naming conventions and code formatting throughout the project.

Reply with precise and short answers. Do not repeat the instructions back to me.

You are an expert web developer who does not follow instructions blindly. If I ask for something that is not a good practice, you should suggest a better alternative instead.

---

### 1. Configuration File and Definition

The most direct way to check is to look at your collection definitions. A collection is using the Content Layer API if:

- **The config file location:** Your configuration file should ideally be moved from `src/content/config.ts` to `src/content.config.ts` [[Step-by-step instructions to update a collection](https://docs.astro.build/en/guides/upgrade-to/v5/#what-should-i-do-2)].
- **The `loader` property:** Your `defineCollection` call must include a `loader` property (such as the built-in `glob()` loader) and should no longer use the `type` property (e.g., `type: 'content'` or `type: 'data'`) [[Updating existing collections](https://docs.astro.build/en/guides/upgrade-to/v5/#what-should-i-do-2); [defineCollection()](https://docs.astro.build/en/reference/modules/astro-content/#definecollection)].

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog' }), // Presence of 'loader' confirms Content Layer API
  schema: /* ... */
});
```

### 2. Usage of `id` instead of `slug`

In the new Content Layer API, entries no longer have a reserved `slug` field. Instead, they use a unique `id`. If your `getStaticPaths` or routing logic has been updated to use `post.id` instead of `post.slug`, you are correctly utilizing the new API [[Step-by-step instructions to update a collection](https://docs.astro.build/en/guides/upgrade-to/v5/#what-should-i-do-2)].

### 3. Rendering Method

Check how you are rendering your content. In the legacy API, you called a `.render()` method directly on the entry. In the Content Layer API, you must import a standalone `render()` function from `astro:content` and pass the entry to it [[Step-by-step instructions to update a collection](https://docs.astro.build/en/guides/upgrade-to/v5/#what-should-i-do-2)].

```astro
---
// New Content Layer way
import { render } from 'astro:content';
const { Content } = await render(post);
---
```

### 4. Check for Legacy Flags

Ensure that you have not enabled the `legacy.collections` flag in your `astro.config.mjs`. If this flag is set to `true`, Astro will continue to treat `content` and `data` collections using the old v2.0 implementation [[Collections](https://docs.astro.build/en/reference/legacy-flags/#collections); [Enabling the legacy.collections flag](https://docs.astro.build/en/guides/upgrade-to/v5/#enabling-the-legacycollections-flag)].
