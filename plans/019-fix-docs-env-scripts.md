# Plan 019: Make setup docs, env example, and scripts match the app

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- README.md .env.example package.json scripts public/llm.txt AGENTS.md DESIGN.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 013 (dependency list is stable), plan 014 (font names in
  DESIGN.md), plan 016 (dead files are gone)
- **Category**: docs / dx
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

A new contributor or agent following the repository gets the wrong setup:

- `README.md` is the untouched create-next-app boilerplate. It never mentions
  MongoDB, `DATABASE_URL`, `NEXTAUTH_SECRET`, the admin signup script, Brevo,
  Cloudinary, or PostHog.
- `.env.example` names `NEXT_PUBLIC_UPLOAD_PRESET`, but the code reads
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. The documented variable does nothing.
- PostHog variables used in `app/Providers.tsx` are missing from the example.
- `package.json` runs `npx tsx scripts/signup.ts`, but `tsx` is not a dependency.
  A fresh clone depends on npx fetching an unpinned runner.
- `scripts/backfill-views.ts` now updates `Project.hidden` while logging “blog
  views”. The original null-views backfill no longer exists, and the name is
  misleading.
- `public/llm.txt` says Prisma uses PostgreSQL; the schema uses MongoDB. It also
  contains an “Instructions for LLM” block, which is an unnecessary
  instruction-bearing surface for automated agents.
- `AGENTS.md` has a mojibake line and tells agents to use `@theme`, a Tailwind 4
  directive, while the project is on Tailwind 3.4.
- `DESIGN.md` lists `primary: '#ffffff'` while the components section and the
  code use electric lime as the primary.

This plan makes the documentation truthful, fixes the env names, adds the
missing runner, and separates the two backfill scripts.

## Current state

- `README.md:1-36` — create-next-app boilerplate. Line 21 says the app uses
  `next/font` to load Geist; the app used a local Geist Mono before plan 014 and
  now loads Hanken Grotesk, Inter, and JetBrains Mono.
- `.env.example:1-17`:

```env
DATABASE_URL=""
NEXT_PUBLIC_SITE_URL=https://nikchavan.dev
NEXTAUTH_SECRET=""
NEXTAUTH_URL=http://localhost:3000
BREVO_API_KEY=""
SMTP_EMAIL=""
MY_EMAIL=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
NEXT_PUBLIC_UPLOAD_PRESET=""
NEXT_PUBLIC_CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

- `components/ImageUpload.tsx:66` — reads
  `process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- `app/Providers.tsx:17,19` — reads `NEXT_PUBLIC_POSTHOG_KEY` and
  `NEXT_PUBLIC_POSTHOG_HOST`.
- `package.json:10-11` — `postinstall` and `signup` scripts; `tsx` is absent from
  `devDependencies`.
- `scripts/backfill-views.ts:3-28` — logs “blog views” but runs
  `update: "Project"` and `$set: { hidden: false }`.
- `public/llm.txt:1-33` — tech stack says “Prisma (PostgreSQL)”; lines 27-30 are
  an “Instructions for LLM” block.
- `AGENTS.md:5` — mojibake in the managed Next.js block; `AGENTS.md:12` says
  tokens live in `@theme` / `tailwind.config.ts`, but Tailwind 3 uses
  `tailwind.config.ts` and CSS variables, not `@theme`.
- `DESIGN.md:19` — `primary: '#ffffff'`; `DESIGN.md:160` says primary buttons
  use Electric Lime; `app/globals.css:357` sets `--primary` to lime.
- `prisma/schema.prisma:6` — `provider = "mongodb"`.

## Commands you will need

| Purpose        | Command                              | Expected on success |
| -------------- | ------------------------------------ | ------------------- |
| Install        | `npm install`                        | exit 0              |
| Typecheck      | `npm run typecheck`                  | exit 0              |
| Lint           | `npm run lint`                       | exit 0              |
| Tests          | `npm test`                           | all pass            |
| Verify         | `npm run verify`                     | exit 0              |

## Scope

**In scope**:
- `README.md`
- `.env.example`
- `package.json`, `package-lock.json` (add `tsx`)
- `scripts/backfill-views.ts` (rename)
- `scripts/backfill-blog-views.ts` (create)
- `public/llm.txt`
- `AGENTS.md` (styling section only; see the managed-block note)
- `DESIGN.md` (primary color and typography alignment)

**Out of scope**:
- Changing runtime code or environment variable names in code. The code's names
  are the source of truth; the example must match them.
- Adding a `.env.local` or committing any real secret.
- Rewriting `DESIGN.md` as a full design specification.
- Editing the Next.js managed block in `AGENTS.md` if `next dev` would rewrite
  it. Fix the non-managed styling guidance and note the mojibake.
- Adding a license, contributor guide, or issue templates.

## Git workflow

- Branch: `advisor/019-fix-docs-env-scripts`
- Commits: `docs: replace boilerplate readme`, `docs: align env example and design notes`, `chore: add tsx and split backfill scripts`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite the README

Replace `README.md` with a project-specific document. Include:

1. **What the project is** — a personal portfolio with public project/blog pages
   and an admin CRUD area.
2. **Stack** — Next.js 16 App Router, React 18, TypeScript, Prisma + MongoDB,
   NextAuth credentials, Cloudinary, Brevo, PostHog, Tailwind 3.
3. **Prerequisites** — Node `>=20.9` (Node 22 recommended), a MongoDB connection
   string, Cloudinary credentials, a Brevo API key.
4. **Setup**:

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run signup   # create the first admin user
npm run dev      # http://localhost:3000
```

5. **Environment table** with every variable from `.env.example` and a one-line
   description. Mark public (browser-exposed) variables clearly. Never include
   real values.
6. **Scripts table**:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in development |
| `npm run build` | Production build (needs the env) |
| `npm start` | Start the production server |
| `npm run lint` | ESLint flat config |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run verify` | typecheck + lint + tests |
| `npm run signup` | Create an admin user interactively |
| `npm run backfill:project-hidden` | Set `hidden: false` on legacy projects |
| `npm run backfill:blog-views` | Set `views: 0` on legacy blogs with null views |

7. **Admin** — sign in at `/auth/signin`; the dashboard is `/admin`. Explain
   that the first user is created by `npm run signup`, not by a public signup
   form.
8. **Verification** — `npm run verify`; note that `next build` needs
   `DATABASE_URL` and network access for Google Fonts.
9. **Content** — blog and project images use Cloudinary; the upload widget signs
   through `/api/sign-cloudinary-params`, which requires an admin session.

Do not copy secrets or a real database URL into the README.

**Verify**: `Select-String -Path README.md -Pattern "create-next-app|Geist|pnpm"`
returns no matches (unless pnpm is mentioned deliberately in an alternative
install note; prefer npm only).

### Step 2: Fix `.env.example`

Replace the file with the names the code reads:

```env
# Database (MongoDB)
DATABASE_URL=""

# Site
NEXT_PUBLIC_SITE_URL=https://nikchavan.dev

# NextAuth
NEXTAUTH_SECRET=""
NEXTAUTH_URL=http://localhost:3000

# Brevo transactional email
BREVO_API_KEY=""
SMTP_EMAIL=""
MY_EMAIL=""

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""
NEXT_PUBLIC_CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# PostHog analytics (public keys)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Note the difference between `NEXT_PUBLIC_*` (sent to the browser) and server-only
variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `BREVO_API_KEY`,
`CLOUDINARY_API_SECRET`).

**Verify**:
- `Select-String -Path .env.example -Pattern "NEXT_PUBLIC_UPLOAD_PRESET"`
  returns no matches.
- Every `process.env.X` reference in `app/`, `lib/`, and `components/` has a
  matching key in `.env.example`. Run the search and compare manually.

### Step 3: Add `tsx` and split the backfill scripts

```bash
npm install -D tsx
```

In `package.json`, change `signup` to `tsx scripts/signup.ts` and add:

```json
"backfill:project-hidden": "tsx scripts/backfill-project-hidden.ts",
"backfill:blog-views": "tsx scripts/backfill-blog-views.ts"
```

Rename `scripts/backfill-views.ts` to `scripts/backfill-project-hidden.ts`.
Fix the logs:

```ts
console.log("Starting backfill of project.hidden...");
...
console.log("Successfully backfilled project.hidden");
```

Create `scripts/backfill-blog-views.ts` with the original views backfill:

```ts
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting backfill of null blog views...");

  try {
    const result = await prisma.$runCommandRaw({
      update: "Blog",
      updates: [
        {
          q: { views: null },
          u: { $set: { views: 0 } },
          multi: true,
        },
      ],
    });

    console.log("Successfully backfilled blog views");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error backfilling blog views:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

Do not run either script against production. Typecheck is the only local
verification unless a disposable MongoDB is available.

**Verify**: `npm run typecheck` → exit 0; `npm ls tsx` → a version is installed.

### Step 4: Correct `public/llm.txt`

Change the tech stack line from “Prisma (PostgreSQL)” to “Prisma (MongoDB)”.
Remove the “Instructions for LLM” block. Replace it with a neutral factual line
if useful:

```text
Notes:
- This file is a factual summary for search engines and AI assistants.
- The source of truth is the repository code and README.
```

Do not add instructions telling agents what to do. This file is served publicly.

**Verify**: `Select-String -Path public/llm.txt -Pattern "PostgreSQL|Instructions for LLM"`
returns no matches.

### Step 5: Fix `AGENTS.md` guidance

In the styling section (below the managed Next.js block), replace the `@theme`
reference with the actual setup:

```md
- When a needed token does not exist, add it to `tailwind.config.ts` and the
  corresponding CSS variable in `app/globals.css` instead of hard-coding the
  literal in a component.
```

The line above it already says `@theme`; update both occurrences in that
sentence. Do not edit the managed `<!-- BEGIN:nextjs-agent-rules -->` block if
`next dev` rewrites it; if the mojibake is only in that block, note it in the
completion note and leave it. If you do edit it, run `git diff` and confirm the
block is still structurally intact.

**Verify**: `Select-String -Path AGENTS.md -Pattern "@theme"` returns no matches
outside a deliberate Tailwind 4 note.

### Step 6: Align `DESIGN.md` with the implemented tokens

- Change the YAML `primary` from `'#ffffff'` to `'#BDFF00'` (the Electric Lime
  value already listed as `primary-container`/`electric-lime`). Set `on-primary`
  to the dark slate used for text on lime (`#0F172A` or the code's
  `--primary-foreground`).
- Keep `primary-container` as is if the design distinguishes it; the code maps
  `--primary` to lime.
- Update the typography section if plan 014 changed a family or weight. The code
  loads Hanken Grotesk, Inter, and JetBrains Mono; if those match, no change.
- Add a one-line note at the top of the Colors section: “The CSS variables in
  `app/globals.css` are the source of truth; the YAML frontmatter is a
  design-tool export.”

**Verify**: `Select-String -Path DESIGN.md -Pattern "primary: '#ffffff'"`
returns no matches.

### Step 7: Check cross-document consistency

Search for the old names and claims:

```powershell
Select-String -Path README.md,.env.example,AGENTS.md,DESIGN.md,public/llm.txt `
  -Pattern "PostgreSQL|NEXT_PUBLIC_UPLOAD_PRESET|Geist|@theme|create-next-app"
```

Expected: no stale claims. A deliberate mention of Geist as a fallback is fine if
clearly labeled.

**Verify**: `npm run verify` → exit 0.

## Test plan

No new automated tests. The changes are documentation, env names, and scripts.
`npm run typecheck` covers the new/renamed TypeScript scripts. Existing tests must
pass.

Manual: the cross-document search in step 7.

## Done criteria

- [ ] README is project-specific and documents setup, env, scripts, admin, and
      verification
- [ ] `.env.example` uses `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` and includes
      PostHog variables
- [ ] `tsx` is a dev dependency; `signup` uses it directly
- [ ] The project-hidden and blog-views backfills are separate scripts with
      accurate logs
- [ ] `public/llm.txt` says MongoDB and has no instruction block
- [ ] `AGENTS.md` no longer recommends `@theme` for this Tailwind 3 project
- [ ] `DESIGN.md` primary color matches lime and notes the code as source of truth
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- A real `.env` file is tracked by git. Do not open it or copy values; report the
  `git ls-files` path and recommend rotation.
- The code reads an environment variable that has no documented default and is
  required for build. Add it to the README table; do not guess a value.
- The managed `AGENTS.md` block is regenerated by `next dev` and overwrites your
  edit. Leave the managed block alone and fix only the styling section.
- The blog-views backfill would run against a database where `views` is a
  non-numeric type. Report the schema mismatch; do not force the update.

## Maintenance notes

- The README's env table and `.env.example` must stay in sync with
  `process.env.*` references. A future audit can add a script that compares them.
- `tsx` is now a local runner; do not use `npx tsx` in scripts.
- Keep the two backfill scripts separate. A script named “views” must not touch
  project visibility.
- `DESIGN.md` is a design-tool export with a code-truth note; do not let it drift
  into a second source of tokens.
- `public/llm.txt` is public content, not an instruction channel. Keep it factual.
