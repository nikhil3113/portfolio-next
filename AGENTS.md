<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes Ã¢â‚¬â€ APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Styling rules

- **Use CSS variables, never hard-coded design tokens.** Colors, spacing, radii, fonts, and shadows must reference the theme tokens defined in `app/globals.css` / `tailwind.config.ts` (e.g. `bg-background`, `text-foreground`, `border-border`, `bg-primary`) rather than raw values like `bg-[#1a1a1a]`, `text-[#fff]`, `p-[12px]`, or inline `style={{ color: "#fff" }}`.
- When a needed token does not exist, add it to the theme (`@theme` / `tailwind.config.ts`) instead of hard-coding the literal in a component.
- This keeps the app consistent across light/dark modes and the shadcn theme system.