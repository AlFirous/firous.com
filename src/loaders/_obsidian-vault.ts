import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export function obsidianVaultLoader(options: { vaultPath: string; pattern?: string }): Loader {
  const { vaultPath, pattern = "**/*.md" } = options;

  return {
    name: "obsidian-vault-loader",

    load: async ({ store, parseData, logger }) => {
      store.clear();

      const files = globSync(vaultPath, pattern);
      logger.info(`Found ${files.length} files in vault`);

      for (const filePath of files) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(raw);
        const id = getIdFromPath(filePath, vaultPath);

        try {
          const parsed = await parseData({
            id,
            data: {
              ...data,
              body: content,
            },
          });

          store.set({
            id,
            data: parsed,
          });
        } catch (err) {
          logger.warn(`Skipping ${id}: ${err}`);
        }
      }
    },

    schema: z.object({
      title: z.string(),
      status: z
        .union([z.enum(["public", "private"]), z.string(), z.array(z.string()), z.null()])
        .optional()
        .transform((val) => {
          if (val === null || val === undefined) return "private";
          if (Array.isArray(val)) {
            return val.some((v) => v && v.toLowerCase?.() === "public") ? "public" : "private";
          }
          if (typeof val === "string" && val.toLowerCase() === "public") return "public";
          return "private";
        }),
      tags: z.union([z.array(z.string()), z.string()]).optional(),
      created: z.union([z.string(), z.date()]).optional(),
      modified: z.union([z.string(), z.date()]).optional(),
      body: z.string().optional(),
    }),
  };
}

function globSync(base: string, pattern: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && matchGlob(entry.name, pattern)) {
          results.push(fullPath);
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }

  walk(base);
  return results;
}

function matchGlob(fileName: string, pattern: string): boolean {
  const normalized = pattern.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const fileParts = fileName.split(".");
  const lastExt = "." + fileParts[fileParts.length - 1];
  const nameWithoutExt = fileParts.slice(0, -1).join(".");

  let i = 0;
  let j = 0;

  while (i < parts.length && j < parts.length) {
    const p = parts[i];

    if (p === "**") {
      if (i === parts.length - 1) return true;
      const next = parts[i + 1];
      if (next === "**") {
        i += 2;
        continue;
      }
      const nextExt = next.startsWith(".") ? next : null;
      const nextName = nextExt ? next.replace(".", "") : next;

      if (nextExt) {
        if (lastExt === nextExt) {
          i += 2;
          if (i >= parts.length) return true;
        } else {
          j++;
        }
      } else {
        if (nameWithoutExt === nextName || nextName === "*") {
          i += 2;
        } else {
          j++;
        }
      }
    } else if (p === "*") {
      const next = parts[i + 1];
      if (next && next.startsWith(".")) {
        if (lastExt === next) {
          i += 2;
          return i >= parts.length;
        }
        return false;
      }
      i++;
    } else if (p.startsWith(".")) {
      return lastExt === p && i === parts.length - 1;
    } else {
      return fileName === p && i === parts.length - 1;
    }
  }

  if (i >= parts.length) return true;
  if (parts[i] === "**") return true;
  return false;
}

function getIdFromPath(filePath: string, base: string): string {
  const relative = path.relative(base, filePath);
  return relative
    .replace(/\.(md|mdx)$/, "")
    .replace(/\\/g, "/")
    .replace(/\//g, "-");
}
