# Plan 014: Wire the documented typography tokens

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/layout.tsx app/globals.css tailwind.config.ts components/Form.tsx package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 002 (lint/typecheck gate)
- **Category**: tech-debt / design system
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The design system in `DESIGN.md` specifies Hanken Grotesk for headings, Inter
for body copy, and JetBrains Mono for code and labels. The code does none of
that:

- `tailwind.config.ts` maps `font-sans` to `var(--font-heading)` and `font-mono`
  to `var(--font-code)`, but neither CSS variable is defined.
- `app/layout.tsx` loads only a local Geist Mono variable font as
  `--font-geist-mono`.
- `app/globals.css` forces `body, html` to Geist Mono, so every paragraph on the
  site is monospaced.
- `components/Form.tsx` uses `font-poppins`, which is not configured.
- `app/blogs/[slug]/page.tsx` uses `prose prose-neutral dark:prose-invert`, but
  `@tailwindcss/typography` is not installed, so those classes do nothing. The
  site relies on a hand-rolled subset of `.prose` rules.

The result is a design system that exists only in documentation. This plan wires
the three families, fixes the token mapping, removes the forced mono body, and
installs the typography plugin so the existing `prose` classes actually work.
The existing custom `.prose` overrides stay; the plugin fills the gaps
(paragraphs, tables, images, code).

## Current state

- `DESIGN.md:56-99` — typography spec:
  - display/headline: Hanken Grotesk
  - body: Inter
  - code-snippet/label-caps: JetBrains Mono
- `tailwind.config.ts:73-76`:

```ts
fontFamily: {
  sans: ["var(--font-heading)"],
  mono: ["var(--font-code)"],
},
```

- `app/layout.tsx:56-60`:

```ts
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
```

- `app/layout.tsx:108` — `<body className={`${geistMono.variable} antialiased`}>`.
- `app/globals.css:4-7`:

```css
body,
html {
  font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
}
```

- `app/globals.css:75-85,104-111` — `.prose pre` and inline code use
  `var(--font-geist-mono)`.
- `components/Form.tsx:54` — `<FormLabel className="text-[15px] font-poppins font-medium">`.
- `package.json` — no `@tailwindcss/typography`.
- The app uses `next/font/local` currently; there is no network font dependency.

## Commands you will need

| Purpose        | Command                                      | Expected on success |
| -------------- | -------------------------------------------- | ------------------- |
| Install        | `npm install @tailwindcss/typography`        | exit 0              |
| Typecheck      | `npm run typecheck`                          | exit 0              |
| Lint           | `npm run lint`                               | exit 0              |
| Tests          | `npm test`                                   | all pass            |
| Dev smoke      | `npm run dev`                                | ready on :3000      |

## Scope

**In scope**:
- `package.json`, `package-lock.json`
- `app/layout.tsx`
- `app/globals.css`
- `tailwind.config.ts`
- `components/Form.tsx` (one class)
- `app/blogs/[slug]/page.tsx` (only if a `prose` class needs adjustment)

**Out of scope**:
- Redesigning the visual hierarchy, spacing, or colors.
- Replacing the hand-rolled `.prose` rules with the typography plugin wholesale.
  Keep the existing rules; the plugin is additive.
- Removing the local font file `app/fonts/GeistMonoVF.woff` (plan 016 can clean
  it up if it becomes unused).
- Changing the code-block syntax highlighting colors (plan 015 handles raw
  colors elsewhere).
- Adding a font-switcher or user preference.

## Git workflow

- Branch: `advisor/014-wire-typography`
- Commits: `feat: load design-system fonts`, `fix: map typography tokens`, `chore: enable tailwind typography`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install the typography plugin

```bash
npm install @tailwindcss/typography
```

Add it to `tailwind.config.ts` plugins:

```ts
plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
```

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 2: Load the documented fonts

In `app/layout.tsx`, replace the `localFont` import and `geistMono` constant with
`next/font/google`:

```ts
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

const headingFont = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["600", "700", "800"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
  weight: ["400", "600"],
});
```

Remove the `localFont` import. On `<html>`, add the three variable classes:

```tsx
<html
  lang="en"
  data-scroll-behavior="smooth"
  suppressHydrationWarning
  className={`${headingFont.variable} ${bodyFont.variable} ${codeFont.variable}`}
>
```

Keep the existing `<body>` classes, but remove `${geistMono.variable}`.

**Verify**: `npm run typecheck` → exit 0.

If the build environment cannot reach Google Fonts, Next will fail to download
the font at build time. In that case STOP and report; do not silently fall back
to system fonts. The local Geist file can be kept as a documented fallback in a
follow-up.

### Step 3: Map the Tailwind tokens

Update `tailwind.config.ts`:

```ts
fontFamily: {
  sans: ["var(--font-body)"],
  heading: ["var(--font-heading)"],
  mono: ["var(--font-code)"],
},
```

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 4: Fix the base CSS

In `app/globals.css`:

1. Delete the `body, html { font-family: var(--font-geist-mono) ... }` block.
2. In the existing `@layer base` block at the bottom, set:

```css
body {
  @apply bg-background text-foreground font-sans;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

3. Replace every `var(--font-geist-mono)` in `.prose pre` and
   `.prose :not(pre) > code` with `var(--font-code)`.
4. Keep `html { scroll-behavior: smooth; }`.

**Verify**: `Select-String -Path app/globals.css -Pattern "font-geist-mono"`
returns no matches.

### Step 5: Fix the undefined utility

In `components/Form.tsx:54`, replace `font-poppins` with `font-heading`:

```tsx
<FormLabel className="text-[15px] font-heading font-medium">
```

**Verify**: `Select-String -Path components/Form.tsx -Pattern "font-poppins"`
returns no matches.

### Step 6: Check the prose classes

`app/blogs/[slug]/page.tsx:184` and `components/TipTap.tsx:74` use
`prose prose-neutral dark:prose-invert`. With the plugin installed, these now
generate real typography. The existing custom `.prose` rules in `globals.css`
remain and override the plugin where they overlap.

Check:
- The blog article's paragraphs have normal body spacing.
- Headings use Hanken Grotesk.
- Inline code and code blocks use JetBrains Mono.
- The TipTap editor content looks consistent with the blog.

Do not remove the custom `.prose` rules in this plan. If a plugin rule produces a
visual regression, add a scoped override in `globals.css` and note it.

### Step 7: Smoke-test every surface

Run `npm run dev` and inspect:
- `/` — body Inter, hero heading Hanken, mono labels JetBrains.
- `/projects` — cards use the body font; tags use mono.
- `/blogs` — list typography.
- `/blogs/<published slug>` — article body, headings, code blocks.
- `/admin` and `/admin/blog/add` — form labels and editor.
- `/auth/signin` — labels and inputs.
- Toggle light/dark mode on each page; check contrast and no layout shift.

Use the browser devtools computed styles to confirm:
- `body` font-family resolves to Inter.
- `h1`/`h2` resolve to Hanken Grotesk.
- `pre code` resolves to JetBrains Mono.

## Test plan

No new automated tests. The change is visual and CSS-driven. Existing
`npm test` must pass.

Manual: the computed-style and light/dark checks in step 7. Record any page that
looks worse in the completion note.

## Done criteria

- [ ] `@tailwindcss/typography` is installed and in `tailwind.config.ts`
- [ ] `app/layout.tsx` loads Hanken Grotesk, Inter, and JetBrains Mono with the
      three CSS variables
- [ ] `tailwind.config.ts` maps `sans`, `heading`, and `mono`
- [ ] `app/globals.css` no longer forces mono on `body/html` and has no
      `--font-geist-mono` references
- [ ] `font-poppins` no longer appears
- [ ] Body renders Inter, headings render Hanken Grotesk, code renders JetBrains
      Mono (verified in devtools)
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Google Fonts cannot be downloaded in the build environment. Report the network
  constraint; do not silently swap families.
- The typography plugin changes the article layout so much that content becomes
  unreadable. Keep the plugin installed but disable it for the article and report
  the regression.
- A font family lacks the required weights (for example Hanken Grotesk 800).
  Adjust the `weight` array to available values and note it.
- The local Geist font file is referenced anywhere else. Search before removing
  any import; this plan leaves the file in place.

## Maintenance notes

- Any new heading component should inherit the base `h1`-`h6` rule. Do not add
  `font-heading` manually unless the element is not a heading tag.
- Keep `font-sans` as the body default and `font-mono` for labels, metadata, and
  code, matching `DESIGN.md`.
- If the project moves to Tailwind 4, the `@theme` syntax in `AGENTS.md` becomes
  relevant; until then, tokens live in `tailwind.config.ts` and `globals.css`.
- The local Geist file is now unused. If a future audit confirms no import,
  remove it with plan 016's dead-file cleanup.
