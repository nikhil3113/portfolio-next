# Plan 015: Replace hard-coded palette utilities with theme tokens

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app components/landing components/project components/blog components/Form.tsx components/ImageUpload.tsx components/TipTap.tsx app/globals.css tailwind.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plan 014 (fonts/tokens are wired first; otherwise color
  changes land on an inconsistent typography base)
- **Category**: tech-debt / design system
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

`AGENTS.md:11` requires every color, spacing, radius, font, and shadow to use
theme tokens from `app/globals.css` / `tailwind.config.ts`, never raw values.
The public pages mostly follow that rule; the admin, auth, editor, and upload
surfaces do not. A grep for Tailwind palette utilities finds about 199
occurrences across the app, concentrated in:

- `components/project/ProjectForm.tsx` (29)
- `app/admin/project/page.tsx` (46 across its page group)
- `app/admin/page.tsx` (23)
- `app/auth/signin/page.tsx` (12)
- `components/TipTap.tsx` (10)
- `components/Form.tsx` (4)
- `components/ImageUpload.tsx` (3)
- `components/project/TableActions.tsx` (2)
- `components/ui/toast.tsx` (2)
- `components/landing/RadiantButton.tsx` (1)

The result is a visual split: public pages use the lime “Deep Slate & Neon”
system, while admin and sign-in pages look like a separate blue/purple/gray app.
Blog links and blockquotes in `app/globals.css:46-72` also use raw hex and fight
the brand in dark mode. This plan replaces the utilities with existing tokens and
adds a `success` token for the toast styling that currently has no semantic
equivalent.

## Current state

- `app/globals.css:45-73` — raw hex in prose rules:

```css
.prose blockquote {
  border-left: 4px solid #a0aec0;
  color: #6b7280;
  background: #f9fafb;
}
.dark .prose blockquote {
  background: #18181b !important;
  color: #cbd5e1 !important;
  border-left: 4px solid #6366f1 !important;
}
.prose a { color: #2563eb; }
.prose a:hover { color: #1d4ed8; }
```

- `components/Form.tsx:71` — focus ring `#4379EE`:

```tsx
className="dark:border-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4379EE] focus-visible:border-[#4379EE]"
```

- `components/project/ProjectForm.tsx:39-56` — gradient header, progress bar,
  `text-gray-900`, `dark:text-white`, `bg-gray-200`.
- `app/admin/project/page.tsx:52-153` — gray text/borders, blue/purple gradient
  “Add” link and avatar.
- `app/admin/page.tsx:41-114` — gray cards and blue/purple icons.
- `app/auth/signin/page.tsx:79-144` — gradient icon and submit button, gray text,
  red alert.
- `components/TipTap.tsx:62,74,93-95,124-251` — `text-blue-500`, gray borders,
  gray toolbar, `bg-white` select.
- `components/ImageUpload.tsx:64,123,136` — gray dashed border and gradient
  circle.
- `components/project/TableActions.tsx:38-44` — blue/purple and red gradients.
- `components/landing/RadiantButton.tsx:7` — `bg-slate-800`.
- `components/ui/toast.tsx:36,82` — green/red classes and rgba shadows.
- Available tokens in `tailwind.config.ts:12-71`: `background`, `foreground`,
  `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `accent-text`,
  `destructive`, `border`, `input`, `ring`, `surface`, `outline`,
  `electric-lime`.
- There is no `success` token. The toast success variant needs one.

## Commands you will need

| Purpose        | Command                 | Expected on success |
| -------------- | ----------------------- | ------------------- |
| Typecheck      | `npm run typecheck`     | exit 0              |
| Lint           | `npm run lint`          | exit 0              |
| Tests          | `npm test`              | all pass            |
| Dev smoke      | `npm run dev`           | ready on :3000      |

## Scope

**In scope**:
- `app/globals.css`
- `tailwind.config.ts`
- `components/Form.tsx`
- `components/ImageUpload.tsx`
- `components/TipTap.tsx`
- `components/project/ProjectForm.tsx`
- `components/project/TableActions.tsx`
- `components/landing/RadiantButton.tsx`
- `components/ui/toast.tsx`
- `app/admin/page.tsx`
- `app/admin/blog/page.tsx`
- `app/admin/project/page.tsx`
- `app/admin/project/add/page.tsx`
- `app/admin/project/update/[id]/page.tsx`
- `app/auth/signin/page.tsx`
- `app/blogs/page.tsx` (the remaining gray classes)

**Out of scope**:
- `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`,
  `app/manifest.ts`. These generate images/metadata with inline colors and cannot
  use Tailwind tokens.
- `components/ui/*` other than `toast.tsx`. The rest already use tokens.
- Redesigning layouts, spacing, or component structure. This is a token
  substitution.
- Adding dark-mode-specific overrides beyond the existing `dark:` classes.
- Changing `DESIGN.md` (plan 019 handles doc drift).

## Token mapping

Use this table consistently. Do not invent a new palette.

| Raw class / value | Replace with |
| --- | --- |
| `text-gray-900`, `text-gray-800`, `text-black` | `text-foreground` |
| `text-gray-700`, `text-gray-600`, `text-gray-500`, `text-gray-400` | `text-muted-foreground` |
| `text-white` on a primary/dark gradient | `text-primary-foreground` |
| `text-white` on a red/destructive gradient | `text-destructive-foreground` |
| `bg-white`, `bg-slate-50`, `bg-slate-100` | `bg-background` or `bg-card` |
| `bg-white/80`, `dark:bg-slate-800/80` | `bg-card` (drop the alpha) |
| `bg-gray-50`, `bg-gray-100`, `bg-gray-200` | `bg-muted` |
| `bg-slate-800` | `bg-card` or `bg-surface-container` |
| `border-gray-100/200/300/700`, `dark:border-gray-600/700` | `border-border` |
| `hover:bg-gray-50/50`, `hover:bg-gray-800/30` | `hover:bg-muted` |
| `from-blue-500 to-purple-600`, similar gradients | `bg-primary` |
| `hover:from-blue-600 hover:to-purple-700` | `hover:opacity-90` |
| `bg-red-500`, `bg-red-600` | `bg-destructive` |
| `text-red-*`, `bg-red-50`, `dark:bg-red-900/20` | `text-destructive`, `bg-card`, `border-destructive` |
| `text-blue-600`, `text-purple-600`, `text-green-600`, `text-rose-600`, `text-orange-600` (icons) | `text-accent-text` |
| `text-blue-500` (editor link) | `text-accent-text` |
| `ring-[#4379EE]`, `border-[#4379EE]` | `ring-ring`, `border-ring` |
| `bg-[image:...]` in RadiantButton | keep the gradient shape, use `hsl(var(--primary) / …)` as it already does |
| `#a0aec0`, `#6b7280`, `#f9fafb`, `#18181b`, `#cbd5e1`, `#6366f1`, `#2563eb`, `#1d4ed8` | `hsl(var(--border))`, `hsl(var(--muted-foreground))`, `hsl(var(--muted))`, `hsl(var(--accent-text))` |

For destructive hover states, prefer `hover:opacity-90` over `hover:bg-destructive/90`
because the Tailwind color config uses `hsl(var(--…))` without
`<alpha-value>`, so slash opacity does not work reliably.

## Git workflow

- Branch: `advisor/015-tokenize-palette`
- Commit in surfaces, not one giant commit:
  `style: tokenize admin surfaces`, `style: tokenize auth and editor`,
  `style: tokenize prose and toasts`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the success token

In `app/globals.css`, under `:root`, add:

```css
--success: 142 71% 45%;
--success-foreground: 0 0% 100%;
```

Under `.dark`, add:

```css
--success: 142 60% 55%;
--success-foreground: 144 70% 10%;
```

In `tailwind.config.ts`, add:

```ts
success: {
  DEFAULT: "hsl(var(--success))",
  foreground: "hsl(var(--success-foreground))",
},
```

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 2: Fix prose colors

In `app/globals.css`, replace the raw hex block:

```css
.prose blockquote {
  border-left: 4px solid hsl(var(--border));
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
}
.dark .prose blockquote {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  border-left: 4px solid hsl(var(--primary));
}
.prose a {
  color: hsl(var(--accent-text));
}
.prose a:hover {
  color: hsl(var(--primary));
}
```

Remove the `!important` flags unless a specificity conflict requires them; test
in both themes first.

**Verify**: `Select-String -Path app/globals.css -Pattern "#[0-9a-fA-F]{3,6}"`
returns no matches.

### Step 3: Tokenize the forms and editor

Work file by file, using the mapping table:

- `components/Form.tsx` — focus ring and border, password-toggle icon colors.
- `components/ImageUpload.tsx` — dashed border, gradient circle, helper text.
- `components/TipTap.tsx` — link class, editor border, toolbar background,
  separators, select background/text, button states.
- `components/project/ProjectForm.tsx` — page gradient, header icon, progress
  bar, section borders, headings, helper text, tags icon, submit button.
- `components/project/TableActions.tsx` — Update/Live and Delete buttons.

**Verify**: `npm run typecheck` and `npm run lint` → exit 0.

### Step 4: Tokenize the admin and auth pages

- `app/admin/page.tsx` — page gradient, card backgrounds/borders, headings, icon
  colors.
- `app/admin/blog/page.tsx` — spinner, image placeholder, text, borders.
- `app/admin/project/page.tsx` — headings, table container, rows, links, email
  link, footer.
- `app/admin/project/add/page.tsx` and `update/[id]/page.tsx` — only if they
  contain raw classes not covered by `ProjectForm`.
- `app/auth/signin/page.tsx` — gradient icon/button, card, text, alert, submit
  button.
- `app/blogs/page.tsx` — the remaining `text-gray-900`, `text-gray-600`,
  `text-gray-300`, `text-gray-500`.

**Verify**:
```powershell
$files = Get-ChildItem -Recurse -Include *.tsx -File |
  Where-Object { $_.FullName -notmatch 'node_modules|\.next' }
$matches = $files | Select-String -Pattern '(text|bg|border|from|to|via|ring|fill|stroke)-(gray|slate|blue|purple|red|green|rose|orange|amber|emerald|indigo|violet|pink|yellow|zinc|neutral|stone)-[0-9]{2,3}'
$matches | Select-Object Path, LineNumber, Line
```
Expected: only the excluded generated-image files, or no matches.

### Step 5: Fix the toast variants

In `components/ui/toast.tsx`:

- Success variant: `border-success/40` (if alpha works; otherwise
  `border-success`), `bg-success`, `text-success-foreground`.
- Destructive variant: `border-destructive`, `bg-destructive`,
  `text-destructive-foreground`.
- Remove the rgba shadow strings; use the default toast shadow.
- The close button's hover/focus colors should use
  `text-muted-foreground`/`ring-ring`.

If slash opacity does not render because the theme colors lack
`<alpha-value>`, use solid tokens without slash.

**Verify**: `npm run lint` → exit 0.

### Step 6: Visual regression pass

Run `npm run dev` and open, in both light and dark mode:

- `/`
- `/projects`
- `/blogs`
- `/blogs/<published slug>`
- `/admin`
- `/admin/blog`
- `/admin/project`
- `/admin/project/add`
- `/admin/blog/add`
- `/auth/signin`

Check:
- No element becomes invisible (for example white text on a white card).
- The lime primary remains the only accent; admin pages no longer have
  blue/purple gradients.
- Destructive buttons are red in both themes.
- The blog blockquote and links are readable in both themes.
- The editor toolbar is legible and the link color is visible.
- Toasts (success and error) are readable.

Fix only token substitutions; do not redesign a page during this pass.

## Test plan

No new automated tests; this is a styling change. Existing `npm test`,
`npm run typecheck`, and `npm run lint` must pass.

Manual: the light/dark visual pass in step 6. Take before/after screenshots if
the tooling is available.

## Done criteria

- [ ] `--success` and `--success-foreground` exist in both themes and in Tailwind
- [ ] `app/globals.css` has no raw hex colors
- [ ] No hard-coded palette utilities remain in `app/` or `components/`, except
      the generated image routes listed out of scope
- [ ] Admin, auth, editor, upload, and toast surfaces use theme tokens
- [ ] Light and dark mode are both readable on the pages in step 6
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- A token substitution makes text unreadable in one theme and no existing token
  fixes it. Report the specific pair; do not add a one-off color.
- The design requires a gradient that cannot be expressed with the primary token.
  Keep the gradient but source its stops from `hsl(var(--primary))` and report.
- A raw class is in a file outside the in-scope list. Add the file to the scope
  only after confirming it is part of the same surface.
- The toast success variant needs a color that `--success` cannot represent.
  Report the contrast requirement.

## Maintenance notes

- New UI must use tokens. The grep in step 4 is a useful CI check; consider
  adding it as a script if the rule keeps regressing.
- The `--success` token is new; do not reuse it for “published” status if a
  neutral or primary treatment is more appropriate.
- The theme colors currently use `hsl(var(--token))` without `<alpha-value>`, so
  slash opacity utilities are unreliable. If the design needs translucent
  surfaces, update the Tailwind color definitions to
  `hsl(var(--token) / <alpha-value>)` in a separate change.
- `DESIGN.md` still describes the palette in prose; plan 019 aligns it with the
  implemented tokens.
