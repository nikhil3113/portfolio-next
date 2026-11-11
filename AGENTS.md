<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Styling rules

- **Use CSS variables, never hard-coded design tokens.** Colors, spacing, radii, fonts, and shadows must reference the theme tokens defined in `app/globals.css` / `tailwind.config.ts` (e.g. `bg-background`, `text-foreground`, `border-border`, `bg-primary`) rather than raw values like `bg-[#1a1a1a]`, `text-[#fff]`, `p-[12px]`, or inline `style={{ color: "#fff" }}`.
- When a needed token does not exist, add it to `tailwind.config.ts` and the corresponding CSS variable in `app/globals.css` instead of hard-coding the literal in a component.
- This keeps the app consistent across light/dark modes and the shadcn theme system.