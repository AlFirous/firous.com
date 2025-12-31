// src/utils/tags.ts
export function tagsToClasses(tags: string[] = []) {
  return tags
    .map(t =>
      t
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    )
    .join(" ");
}
