# Plan 013: Align Prisma, next-cloudinary, and Zod versions

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- package.json package-lock.json components/ImageUpload.tsx app/api/sign-cloudinary-params`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 012 (schemas use Zod; land 012 first so the bump has
  test coverage), plan 004 (Cloudinary auth is in place before changing the SDK)
- **Category**: migration
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Three dependency problems have concrete cost:

1. **Prisma CLI and client are different versions.** `prisma` is 6.8.2 while
   `@prisma/client` is 6.6.0. `postinstall` runs `npx prisma generate` with the
   6.8.2 CLI, which generates a client that is then loaded through the 6.6.0
   runtime. Prisma does not support that combination; failures surface at
   runtime, not at build time.
2. **`next-cloudinary@6.16.0` does not support Next 16 and carries a high
   advisory.** Its peer range ends at `^15`, and `npm audit` reports a high
   severity issue through `@cloudinary-util/url-loader` (a Zod memory-exhaustion
   advisory) with the fix being `next-cloudinary@7.0.0`. The widget is the only
   image upload path in the admin.
3. **Zod 4.0.5 is below the fixed line for a high advisory** (Zod can exhaust
   memory while validating oversized constrained collections, fixed in 4.6.6).
   The API validation added in plan 012 uses Zod directly.

This plan aligns the pairs, moves the Prisma CLI to dev dependencies, and
verifies the admin image flow after the Cloudinary major bump. It does not
upgrade Prisma to 7 (a separate generator/engine migration) or change the
database provider.

## Current state

- `package.json:17` — `"@prisma/client": "^6.6.0"`; lockfile resolves 6.6.0.
- `package.json:60` — `"prisma": "^6.8.2"`; lockfile resolves 6.8.2, and
  `package.json:10` runs `npx prisma generate` on postinstall.
- `package.json:57` — `"next-cloudinary": "^6.16.0"`; installed 6.16.0.
  `node_modules/next-cloudinary/package.json` peer:
  `next: "^12 || ^13 || ^14 || >=15.0.0-rc || ^15"` — no Next 16.
- `package.json:68` — `"zod": "^4.0.5"`; installed 4.0.5.
- `npm audit --json`:
  - `@cloudinary-util/url-loader` high, fix is `next-cloudinary@7.0.0`.
  - `next-cloudinary` high, fix is `next-cloudinary@7.0.0`.
  - `zod` high, affected `<4.6.6`.
- `components/ImageUpload.tsx:65-85` — `CldUploadWidget` with
  `signatureEndpoint`, `uploadPreset`, `onSuccess`, and options.
- `app/api/sign-cloudinary-params/route.ts` — signing endpoint (plan 004 adds
  auth). Do not change its contract during this plan.

## Commands you will need

| Purpose        | Command                                              | Expected on success |
| -------------- | ---------------------------------------------------- | ------------------- |
| Install client | `npm install @prisma/client@6.8.2`                   | exit 0              |
| Install CLI    | `npm install -D prisma@6.8.2`                        | exit 0              |
| Generate       | `npx prisma generate`                                | exit 0              |
| Cloudinary     | `npm install next-cloudinary@7.0.0`                  | exit 0              |
| Zod            | `npm install zod@^4.6.6`                             | exit 0              |
| Audit          | `npm audit --json`                                   | no high for zod/cloudinary |
| Typecheck      | `npm run typecheck`                                  | exit 0              |
| Tests          | `npm test`                                           | all pass            |

## Scope

**In scope**:
- `package.json`
- `package-lock.json`
- `components/ImageUpload.tsx` (only if the v7 widget API requires a prop change)
- `app/api/sign-cloudinary-params/route.ts` (only if the v7 SDK changes the
  signing helper; keep the session check from plan 004)

**Out of scope**:
- Prisma 7. It changes the generated client and is a larger migration.
- Replacing `@getbrevo/brevo` or removing `mailersend` (plan 016 handles unused
  dependencies).
- Upgrading React or Next again.
- Fixing every transitive high advisory in the tree. Record what remains.

## Git workflow

- Branch: `advisor/013-align-dependencies`
- Commits: `chore: align prisma cli and client`, `chore: upgrade next-cloudinary to v7`, `chore: bump zod`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Align Prisma

```bash
npm install @prisma/client@6.8.2
npm install -D prisma@6.8.2
npx prisma generate
```

This moves `prisma` from `dependencies` to `devDependencies`. Production hosts
that run `postinstall` still need the CLI at build time; if the host installs
only production dependencies, keep `prisma` in `dependencies` and note it. The
current `postinstall` already assumes the CLI is available during install.

**Verify**:
- `npm ls prisma @prisma/client` → both report `6.8.2`.
- `npx prisma validate` → exit 0 (it reads `DATABASE_URL`; if the env var is
  missing, use `DATABASE_URL="mongodb://localhost:27017/portfolio" npx prisma validate`).
- `npm run typecheck` → exit 0.

### Step 2: Upgrade next-cloudinary

```bash
npm install next-cloudinary@7.0.0
```

Before changing code, read the v7 README or changelog in
`node_modules/next-cloudinary/README.md` and the installed types for
`CldUploadWidget`. Confirm:

- The component still accepts `signatureEndpoint`.
- The `uploadPreset` prop name is unchanged.
- `onSuccess` still receives `result.info` with `secure_url`.
- `CldImage` still accepts `src`, `width`, `height`, `fill`, `sizes`, and
  `className`.

Run `npm run typecheck`. If the API changed, update only the affected props in
`components/ImageUpload.tsx`, `components/blog/BlogCard.tsx`,
`components/project/ProjectCard.tsx`, and
`components/project/SampleProjectCard.tsx` (the files that import
`next-cloudinary`). Keep behavior identical.

**Verify**: `npm run typecheck` → exit 0; `npm ls next-cloudinary` → `7.0.0`.

### Step 3: Bump Zod

```bash
npm install zod@^4.6.6
```

**Verify**:
- `npm ls zod` → a version `>=4.6.6`.
- `npm test` → all pass, especially `lib/validation.test.ts` from plan 012.

If a Zod 4 minor changes a schema error shape used by the admin UI, adjust the
route response mapping, not the UI contract.

### Step 4: Re-audit

Run `npm audit --json` and record:

- `next-cloudinary` and `@cloudinary-util/url-loader` should no longer be high.
- `zod` should no longer be high.
- Remaining high findings (likely `sharp`, `prosemirror-view`, `brace-expansion`,
  `follow-redirects`, `markdown-it`, `undici`, `source-map-js`) should be noted
  with their paths.

If `npm audit fix` can resolve a remaining high without a major version change,
you may run it. Do not run `npm audit fix --force`.

**Verify**: `npm audit --json` → no high finding for `zod`, `next-cloudinary`, or
`@cloudinary-util/url-loader`.

### Step 5: Smoke-test the admin image flow

With a local Cloudinary configuration:
1. Sign in and open `/admin/blog/add`.
2. Upload an image; preview appears.
3. Remove the image; the asset is deleted.
4. Create a project with an uploaded image; the card renders it.
5. Open an existing blog/project with a Cloudinary image; the image renders.

If no Cloudinary configuration is available, state that the live check was
skipped and rely on typecheck plus the Cloudinary route tests from plan 004.

### Step 6: Build once if the environment allows

`npm run build` requires `DATABASE_URL` and network access for any font
downloads (plan 014). If both are available, run it and confirm exit 0. If not,
record that the build was skipped.

## Test plan

No new test files. Existing tests must all pass:
- `npm test`
- `npm run typecheck`
- `npm run lint`

The Cloudinary route tests from plan 004 and validation tests from plan 012 are
the regression net for the SDK and Zod bumps.

## Done criteria

- [ ] `npm ls prisma @prisma/client` reports the same version
- [ ] `prisma` is in `devDependencies` (or a documented reason it stays in
      `dependencies`)
- [ ] `npm ls next-cloudinary` reports `7.0.0`
- [ ] `npm ls zod` reports `>=4.6.6`
- [ ] `npm audit` has no high finding for `zod`, `next-cloudinary`, or
      `@cloudinary-util/url-loader`
- [ ] `npm run verify` exits 0
- [ ] The admin image upload and removal flow still works (or is documented as
      skipped)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- next-cloudinary v7 changes the widget API in a way that requires rewriting the
  upload flow. Report the breaking change; do not improvise a new provider.
- The Prisma 6.8.2 client cannot be generated for the MongoDB schema. Report the
  exact error.
- `npm test` fails after the Zod bump because a schema behavior changed. Fix the
  schema only if the new behavior is stricter and intended; otherwise pin the
  previous version and report.
- A production host installs only production dependencies and needs the Prisma
  CLI at runtime. Keep `prisma` in `dependencies` and document the reason.

## Maintenance notes

- Keep `prisma` and `@prisma/client` pinned to the same version in future
  changes. Add a CI check if the project grows.
- `next-cloudinary@7` requires Next 16 and React 18.2+/19. If the project ever
  downgrades Next, this package must be downgraded too.
- Prisma 7 is a separate migration; do not combine it with routine dependency
  updates.
- Re-run `npm audit` after every dependency change and record the remaining
  transitive highs rather than silently accepting them.
