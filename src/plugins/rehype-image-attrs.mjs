import { visit } from "unist-util-visit";
import probe from "probe-image-size";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CACHE_FILE = "./src/plugins/.image-size-cache.json";

function loadCache() {
  if (existsSync(CACHE_FILE)) {
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  }
  return {};
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export function rehypeImageAttrs() {
  return async (tree) => {
    const cache = loadCache();
    const promises = [];
    let isFirst = true;

    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;

      const src = node.properties.src ?? "";
      const eager = isFirst;
      isFirst = false;

      node.properties.decoding = "async";
      node.properties.loading = eager ? "eager" : "lazy";
      if (eager) node.properties.fetchpriority = "high";

      if (src.startsWith("http") && !node.properties.width) {
        if (cache[src]) {
          // cache hit — free
          node.properties.width = cache[src].width;
          node.properties.height = cache[src].height;
        } else {
          // cache miss — probe and store
          const p = probe(src)
            .then(({ width, height }) => {
              node.properties.width = width;
              node.properties.height = height;
              cache[src] = { width, height };
            })
            .catch(() => {});

          promises.push(p);
        }
      }
    });

    await Promise.all(promises);
    saveCache(cache); // persist new entries
  };
}
