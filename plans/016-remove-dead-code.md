# Plan 016: Remove dead UI, the duplicate toast stack, and unused dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- components/landing/About.tsx components/ui/terminal.tsx components/ui/sheet.tsx components/ui/toast.tsx components/ui/toaster.tsx hooks/use-toast.ts components/ui/sonner.tsx components/landing/Contact.tsx app/layout.tsx package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 013 (package.json is already being changed there; land
  013 first to avoid conflicts), plan 014 (the local Geist font becomes unused)
- **Category**: tech-debt
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The repository carries several unreferenced modules and a second, unused toast
system:

- `components/landing/About.tsx` is not imported anywhere. It is the only
  importer of `components/ui/terminal.tsx` (about 270 lines of animation code).
- `components/ui/sheet.tsx` has no importers.
- The shadcn Radix toast stack (`components/ui/toast.tsx`,
  `components/ui/toaster.tsx`, `hooks/use-toast.ts`) is mounted only inside
  `components/landing/Contact.tsx`, while every actual notification uses
  `sonner`. The root layout also mounts a raw `sonner` `<Toaster>`, so the
  homepage renders two toast providers.
- `components/ui/sonner.tsx` is a theme-aware wrapper for `sonner` but is unused;
  the root layout imports the unthemed one.
- `package.json` lists `mailersend`, `framer-motion`, and `@tabler/icons-react`
  with no imports. Several `@types/*` packages target libraries that ship their
  own types or are not used.
- `components/TipTap.tsx` imports `@tiptap/extension-code-block`, which is not
  declared; it only resolves because it is a transitive dependency of the
  unused `@tiptap/extension-code-block-lowlight`. Pruning the unused package
  without declaring the direct import would break the editor.

This plan removes the dead weight, adopts the theme-aware Sonner wrapper, and
makes the Tiptap dependency explicit.

## Current state

- `components/landing/Contact.tsx:8-9,137`:

```tsx
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
...
<Toaster />
```

- `app/layout.tsx:9,120`:

```tsx
import { Toaster } from "sonner";
...
<Toaster richColors />
```

- `components/ui/sonner.tsx:1-31` — a `"use client"` wrapper that reads
  `next-themes` and passes token-based `classNames` to Sonner. It is not
  imported.
- `components/ui/toast.tsx`, `components/ui/toaster.tsx`, `hooks/use-toast.ts` —
  only reachable through the Contact `<Toaster />`.
- `components/landing/About.tsx` — imports `Terminal`, `TypingAnimation`, and
  `AnimatedSpan` from `@/components/ui/terminal`; no file imports `About`.
- `components/ui/sheet.tsx` — no importers.
- `components/TipTap.tsx:15` — `import CodeBlock from "@tiptap/extension-code-block";`
- `package.json`:
  - `"@tabler/icons-react"` — no import.
  - `"mailersend"` — no import; the app uses `@getbrevo/brevo`.
  - `"framer-motion"` — no direct import; the app uses `motion`.
  - `"@tiptap/extension-code-block-lowlight"` — no import; `lowlight` itself is
    used directly in `lib/blog/highlight-code.ts`.
  - `"@types/bcrypt"`, `"@types/bcryptjs"`, `"@types/cheerio"`,
    `"@types/multer"` — targets libraries that ship types or are unused.

## Commands you will need

| Purpose        | Command                                         | Expected on success |
| -------------- | ----------------------------------------------- | ------------------- |
| Install        | `npm install`                                   | exit 0              |
| Typecheck      | `npm run typecheck`                             | exit 0              |
| Lint           | `npm run lint`                                  | exit 0              |
| Tests          | `npm test`                                      | all pass            |
| Import search  | `Select-String -Pattern "ui/toast|ui/toaster|use-toast|landing/About|ui/terminal|ui/sheet"` | no matches |

## Scope

**In scope**:
- `components/landing/Contact.tsx`
- `app/layout.tsx`
- `components/ui/sonner.tsx` (use it; do not delete)
- Delete: `components/ui/toast.tsx`, `components/ui/toaster.tsx`,
  `hooks/use-toast.ts`, `components/landing/About.tsx`,
  `components/ui/terminal.tsx`, `components/ui/sheet.tsx`
- `package.json`, `package-lock.json`
- `app/fonts/GeistMonoVF.woff` (delete only if plan 014 removed the last import)

**Out of scope**:
- Deleting any `components/ui/*` file that is imported (check first).
- Replacing Sonner with another notification library.
- Removing `motion` or `lowlight`; both are used.
- Removing `@getbrevo/brevo`; it is the active email SDK.
- Adding `tsx` or fixing the backfill scripts (plan 019).

## Git workflow

- Branch: `advisor/016-remove-dead-code`
- Commits: `chore: remove unused ui and toast stack`, `chore: prune unused dependencies`, `fix: declare tiptap code-block dependency`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Adopt the theme-aware Sonner wrapper

In `app/layout.tsx`, change:

```tsx
import { Toaster } from "sonner";
```

to:

```tsx
import { Toaster } from "@/components/ui/sonner";
```

Keep `<Toaster richColors />`. The wrapper forwards props to Sonner and applies
the theme-aware token classes.

In `components/landing/Contact.tsx`:

- Remove `import { Toaster } from "@/components/ui/toaster";`
- Remove `<Toaster />` from the JSX.
- Keep `import { toast } from "sonner";` and all `toast.*` calls.

**Verify**: `Select-String -Path app/layout.tsx -Pattern "sonner"` shows the
wrapper import; `Select-String -Path components/landing/Contact.tsx -Pattern
"Toaster"` returns no matches.

### Step 2: Confirm the deletable files are unreferenced

Run:

```powershell
Select-String -Path (Get-ChildItem -Recurse -Include *.ts,*.tsx -File |
  Where-Object { $_.FullName -notmatch 'node_modules|\.next' }).FullName `
  -Pattern 'ui/toast|ui/toaster|use-toast|landing/About|ui/terminal|ui/sheet'
```

Expected: no matches after step 1. The files themselves will match their own
imports, so exclude the files you are about to delete from the search or inspect
the output. Do not delete a file that still has an external importer.

### Step 3: Delete the dead files

Delete:

- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `hooks/use-toast.ts`
- `components/landing/About.tsx`
- `components/ui/terminal.tsx`
- `components/ui/sheet.tsx`

Also delete `app/fonts/GeistMonoVF.woff` **only if** plan 014 removed the
`localFont` import and `Select-String -Pattern "GeistMonoVF"` returns no matches.

**Verify**: `npm run typecheck` → exit 0. A missing module error means a file is
still imported; restore it and investigate.

### Step 4: Make the Tiptap code-block dependency explicit

```bash
npm install @tiptap/extension-code-block@^3.0.9
```

This is the package `components/TipTap.tsx` already imports. Then remove the
unused parent package:

```bash
npm uninstall @tiptap/extension-code-block-lowlight
```

**Verify**:
- `npm ls @tiptap/extension-code-block` → resolves directly under the project.
- `npm ls @tiptap/extension-code-block-lowlight` → empty.
- `npm run typecheck` → exit 0.

### Step 5: Remove the unused dependencies

```bash
npm uninstall @tabler/icons-react mailersend framer-motion
npm uninstall @types/bcrypt @types/bcryptjs @types/cheerio @types/multer
```

Before removing each type package, confirm the library still typechecks:
- `bcryptjs@3` ships its own types; `@types/bcryptjs` is for v2.
- `cheerio@1.1` ships its own types; `@types/cheerio` is for 0.22.
- `multer` is not used anywhere.
- `bcrypt` (the native package) is not installed; only `bcryptjs` is.

**Verify**: `npm run typecheck` → exit 0.

### Step 6: Re-run the full gate

Run:

```bash
npm run verify
```

Expected: typecheck, lint, and all tests pass.

Then search for extraneous packages:

```bash
npm ls --depth=0
```

Expected: no `UNMET DEPENDENCY` or `extraneous` entries for the removed packages.

### Step 7: Smoke-test notifications

Run `npm run dev`:
1. Submit the contact form with an invalid email; confirm a Sonner error toast
   appears and is styled with the theme (not the Radix toast).
2. Sign in and create/delete a project or blog; confirm Sonner success/error
   toasts still work.
3. Toggle dark mode; confirm the toast colors follow the theme.

## Test plan

No new tests. The change removes dead code and updates imports. Existing
`npm test` must pass.

Manual: the three notification checks in step 7.

## Done criteria

- [ ] `app/layout.tsx` imports `Toaster` from `@/components/ui/sonner`
- [ ] `components/landing/Contact.tsx` no longer renders a second Toaster
- [ ] The six dead files are deleted
- [ ] `@tiptap/extension-code-block` is a direct dependency
- [ ] `@tiptap/extension-code-block-lowlight` is removed
- [ ] `@tabler/icons-react`, `mailersend`, `framer-motion`, and the four unused
      `@types/*` packages are removed
- [ ] `npm run verify` exits 0
- [ ] Notifications still work in both themes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- A file slated for deletion has an importer outside the list. Keep it and
  report the importer.
- Removing a `@types/*` package causes a type error that is not fixed by the
  library's bundled types. Restore that package and note why.
- `framer-motion` is required by a direct import that the search missed. Check
  `rg "framer-motion"` before removing; `motion` may depend on it transitively,
  which is fine.
- The Sonner wrapper does not forward `richColors` correctly. Keep the raw
  Sonner import and report the wrapper issue; do not leave two providers.

## Maintenance notes

- Sonner is the only toast system. Do not reintroduce a Radix toast stack.
- Keep the wrapper in `components/ui/sonner.tsx` as the single mount point so
  toast styling follows the theme.
- Tiptap extensions must be declared directly in `package.json`, even when they
  are transitive dependencies of another extension. Hoisting is not a contract.
- If a future feature needs the terminal-style About block, reintroduce it as a
  deliberate component with a caller; do not keep unused files “for later.”
