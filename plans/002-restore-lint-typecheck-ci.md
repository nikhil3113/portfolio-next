# Plan 002: Restore lint, add typecheck, and gate work in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- package.json .eslintrc.json tsconfig.json .github`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 001 (Next and `eslint-config-next` are upgraded to the
  same 16.4.6 line there; doing this first would make the flat config target
  the older plugin)
- **Category**: dx
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The repository's only lint command is broken. `package.json` still runs
`next lint`, but Next.js 16 removed that subcommand; running it prints
`Invalid project directory provided, no such directory: ...\lint` and exits 1.
`next build` also no longer lints. ESLint 9 is installed, but the repo has only
a legacy `.eslintrc.json` and no flat config, so `npx eslint .` cannot start
either.

There is also no `typecheck` script and no CI. `npx tsc --noEmit` currently
passes, which makes a baseline cheap. This plan restores a single command that
actually checks the code, and a CI workflow that runs it on every push and pull
request. Every later plan depends on this gate.

## Current state

- `package.json:5-12` — scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "postinstall": "npx prisma generate",
  "signup": "npx tsx scripts/signup.ts"
}
```

- `.eslintrc.json:1-3` — legacy config:

```json
{ "extends": ["next/core-web-vitals", "next/typescript"] }
```

- `node_modules/eslint-config-next` version `16.0.7` before plan 001, `16.4.6`
  after it. It exports flat-config arrays at
  `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- `npx tsc --noEmit --incremental false` currently exits 0.
- `npm run lint` currently exits 1 with the invalid-directory error.
- No `.github/` directory exists.
- `tsconfig.json` is strict and already includes `**/*.ts` and `**/*.tsx`.

## Commands you will need

| Purpose        | Command                               | Expected on success              |
| -------------- | ------------------------------------- | -------------------------------- |
| Install        | `npm install`                         | exit 0                           |
| Lint           | `npm run lint`                        | exit 0, no errors                |
| Typecheck      | `npm run typecheck`                   | exit 0, no errors                |
| Both gates     | `npm run verify`                      | exit 0                           |
| Tests          | `npm test`                            | **unavailable** until plan 003   |

## Scope

**In scope**:
- `eslint.config.mjs` (create)
- `.eslintrc.json` (delete)
- `package.json`
- `.github/workflows/verify.yml` (create)
- `.nvmrc` (create)
- Source files that ESLint flags, **only** for mechanical fixes that do not
  change behavior (unused imports, unescaped entities, `no-img-element`
  annotations, missing hook dependencies that are safe to add).

**Out of scope**:
- Adding Prettier or a formatter.
- Adding new lint rules beyond the Next.js and TypeScript presets.
- Refactoring components to satisfy `@next/next/no-img-element`. Prefer an
  explicit, scoped disable comment where `next/image` is not appropriate
  (e.g. remote favicons) and record it.
- Adding tests or Vitest. Plan 003 does that.

## Git workflow

- Branch: `advisor/002-restore-lint`
- Commits: `chore: restore eslint flat config`, `chore: add typecheck and ci`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the flat ESLint config

Create `eslint.config.mjs` using the Next.js 16 documented shape:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
```

Delete `.eslintrc.json` so there is exactly one config source.

**Verify**: `npx eslint --print-config app/page.tsx > $null; echo $LASTEXITCODE`
(PowerShell) or `npx eslint --print-config app/page.tsx > /dev/null; echo $?`
(bash) → exit 0.

If `eslint/config` cannot be resolved, the installed ESLint is older than
expected. In that case use a plain array (`const eslintConfig = [...nextVitals,
...nextTs, { ignores: [...] }]`) and note the deviation.

### Step 2: Update the scripts and pin Node

Edit `package.json` scripts to:

```json
"lint": "eslint .",
"typecheck": "tsc --noEmit",
"verify": "npm run typecheck && npm run lint",
```

Add:

```json
"engines": { "node": ">=20.9" }
```

Create `.nvmrc` with `22` on a single line.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Run lint and triage the backlog

Run `npm run lint`. It will likely report existing issues. Handle them in this
order:

1. Configuration noise: add a documented `globalIgnores` entry or a scoped rule
   override only if the rule cannot apply to this project. Record the reason in
   a comment.
2. Mechanical source fixes: remove unused imports/variables, escape apostrophes
   with `&apos;`, add safe missing hook dependencies, and add a file-level
   `/* eslint-disable @next/next/no-img-element */` only where `next/image`
   cannot be used (remote favicons in `components/landing/Experience.tsx` and
   the Simple Icons strip in `components/landing/Skills.tsx` are candidates;
   plan 017 replaces those images).
3. If a rule would require behavior changes, STOP and report instead of
   disabling it globally.

**Verify**: `npm run lint` → exit 0.

Do not raise rule severities or relax the presets to reach exit 0.

### Step 4: Add the CI workflow

Create `.github/workflows/verify.yml`:

```yaml
name: verify

on:
  push:
    branches: ["**"]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run verify
```

`npm ci` already runs the `postinstall` Prisma generate; the explicit step makes
the requirement visible and keeps the workflow working if scripts change.

**Verify**: inspect the YAML for valid indentation and confirm
`npm run verify` is the last step.

### Step 5: Prove the gate catches a real failure

Make a temporary, local change that should fail typecheck (for example add
`const x: string = 1;` to a scratch file outside git), run
`npm run typecheck`, confirm it exits non-zero, then remove the change. Do the
same for lint with an unused variable. This proves the scripts are wired to the
real tools.

**Verify**: `git status` shows no leftover scratch file.

## Test plan

No test suite is added here. The gates are:
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `npm run verify` → exit 0

Plan 003 adds `npm test` to the same `verify` script.

## Done criteria

- [ ] `eslint.config.mjs` exists and uses `eslint-config-next/core-web-vitals`
      plus `eslint-config-next/typescript`
- [ ] `.eslintrc.json` is deleted
- [ ] `npm run lint` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] `npm run verify` exits 0
- [ ] `.github/workflows/verify.yml` exists and runs `npm run verify`
- [ ] `package.json` has `lint`, `typecheck`, `verify`, and `engines.node`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- ESLint cannot resolve `eslint-config-next/core-web-vitals` after plan 001.
- `npm run lint` reports more than 30 errors or any error that requires a
  behavior change to fix.
- A needed fix would touch a file outside the scope list.
- CI cannot install dependencies because of a private registry or missing
  lockfile entry.

## Maintenance notes

- New code must pass `npm run verify` before review. The CI workflow is the
  source of truth.
- When plan 003 lands, change `verify` to
  `npm run typecheck && npm run lint && npm test` and add `npm test` to the
  workflow.
- Keep `eslint.config.mjs` as the only ESLint config. Do not reintroduce
  `.eslintrc.*`.
- If a future Next upgrade changes the flat-config export shape, read
  `node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md`
  before editing.
