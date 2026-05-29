# Project Overview

- Latest stable AstroJS with vanilla and baseline HTML, CSS, and JavaScript.
- Static-first website with hybrid rendering if necessary.
- Multiple collections and content types with it's own design and schema, while sharing "invisible" global design system and patterns.
- Accessible and performant.
- Media is in remote storage.

# Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- If something is not a good practice, you should suggest a better alternative, but must cite the reasons.
- You are up to date and research first before make decision.
- If tool or dependency isn't available on this machine, ask the user to run the command.

# Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Don't install dependencies if not necessary.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

# Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

# Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

# Style Guide

- Not defined here. For now, follow the same conventions and patterns that you detect in the surrounding code.
- Keep formatting consistent.

# Running Tests

- Run test in Chrome DevTools MCP if necessary.

# Astro Quick Reference

- Fetch **LLM-optimized** docs at https://docs.astro.build/llms.txt.
- Fetch **Full docs** at https://docs.astro.build/ (primary source, use when llms.txt lacks info).

## Vite Dep Optimizer (`optimizeDeps`)

When a bug works in `astro build` but fails in `astro dev` with errors like `require is not defined`, the root cause is almost always Vite's dep optimizer failing to pre-bundle a CJS dependency. `astro build` uses Rollup and handles CJS→ESM reliably; `astro dev` relies on esbuild's optimizer scan, which is intentionally shallow and will miss deps that are only reachable through non-JS files (like `.astro` components in `node_modules`). The key files are `packages/astro/src/vite-plugin-environment/index.ts` (sets `optimizeDeps.entries`) and `packages/astro/src/core/create-vite.ts` (wires up `vitefu`/`crawlFrameworkPkgs`). For a full deep-dive including a debugging playbook and potential fixes, see [`reference/optimize-deps.md`](./reference/optimize-deps.md).

# Cleanup

- If unused, remove screenshot created during debugging and testing.
- If unused, remove snapshot created during debugging and testing.
