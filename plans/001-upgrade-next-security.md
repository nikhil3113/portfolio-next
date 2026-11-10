# Plan 001: Upgrade Next.js past the critical advisories and harden image handling

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- package.json package-lock.json next.config.mjs app/opengraph-image.tsx app/icon.tsx app/apple-icon.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security / migration
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The installed Next.js version is inside a critical advisory range published by
npm. The advisories name two surfaces this app actually uses: `next/og`
`ImageResponse` (the Open Graph, icon, and Apple icon routes) and the image
optimizer configured with `dangerouslyAllowSVG`. A fix is already published as
`next@16.4.6`, the current `latest` tag. Leaving this version in place exposes
publicly reachable endpoints to remote-code-execution and SSRF classes of bugs,
not just audit noise.

This plan also makes SVG image responses safer even after the framework
upgrade. The app allows SVG through the image optimizer and allows Cloudinary as
a remote source. SVG can contain script, so the optimizer should serve it with a
restrictive image CSP and an attachment disposition.

## Current state

- `package.json:55` — `"next": "^16.1.1"`; the lockfile currently resolves
  `16.3.3`.
- `package.json:79` — `"eslint-config-next": "^16.0.7"`; lockfile resolves
  `16.0.7`.
- `npm audit --json` on this tree reports:
  - `next` **critical**, affected range `16.0.0 - 16.4.0`, fix available.
  - Advisories include "Remote Code Execution in next/og ImageResponse" and an
    image-optimizer advisory involving SVG.
- `app/opengraph-image.tsx:1` — imports `ImageResponse` from `next/og`.
- `app/icon.tsx:1` and `app/apple-icon.tsx` — also generate images with
  `ImageResponse`.
- `next.config.mjs:1-22` — current image config:

```js
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.simpleicons.org", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
  },
};
```

- There is no test harness yet. Plan 003 adds one. Until then, verification is
  `tsc`, `npm audit`, and a dev-server smoke test.
- Node requirement: Next 16 needs Node `>=20.9`.

## Commands you will need

| Purpose        | Command                                            | Expected on success                         |
| -------------- | -------------------------------------------------- | ------------------------------------------- |
| Install        | `npm install`                                      | exit 0                                      |
| Upgrade Next   | `npm install next@16.4.6` and `npm install -D eslint-config-next@16.4.6` | exit 0                |
| Audit          | `npm audit --json`                                 | no `critical` finding for `next`            |
| Typecheck      | `npx tsc --noEmit --incremental false`              | exit 0, no errors                           |
| Dev smoke      | `npm run dev`                                      | ready on `http://localhost:3000`            |
| Lint           | `npm run lint`                                      | **unavailable** until plan 002              |
| Tests          | `npm test`                                          | **unavailable** until plan 003              |

## Scope

**In scope**:
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `app/opengraph-image.tsx` (only if the upgrade requires a type change)
- `app/icon.tsx`, `app/apple-icon.tsx` (only if the upgrade requires a type change)

**Out of scope**:
- Any upgrade of React. Next 16.4.6 still declares React `^18.2.0 || ^19`, so
  React 18.3.1 is supported; do not change React as part of this plan.
- Any refactor of the metadata routes' visual design.
- Adding a nonce-based strict CSP. That is a separate, larger change.
- Removing `cdn.simpleicons.org` from `remotePatterns`; the skills strip still
  uses that host (though via `<img>`, not `next/image`).

## Git workflow

- Branch: `advisor/001-upgrade-next`
- Commit per logical unit. Match the repo's conventional style, e.g.
  `chore: upgrade next to 16.4.6` and `fix: harden svg image responses`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Upgrade Next and its ESLint config

Run:

```bash
npm install next@16.4.6
npm install -D eslint-config-next@16.4.6
```

**Verify**: `npm ls next eslint-config-next` → both report `16.4.6`.

### Step 2: Confirm the critical advisory is gone

Run `npm audit --json` and inspect the `next` entry.

**Verify**:
- There is no `"severity": "critical"` entry for `next`.
- `npm audit` may still report high findings for transitive packages such as
  `sharp` or `prosemirror-view`. Record them in your completion note; do not
  attempt to force-fix transitive packages in this plan.

If `next` is still reported as critical after installing `16.4.6`, STOP.

### Step 3: Harden SVG delivery

Edit `next.config.mjs`. Keep `dangerouslyAllowSVG: true` only if the project
actually needs SVG through the optimizer (Cloudinary may serve SVG screenshots).
Regardless, add the two documented options inside `images`:

```js
dangerouslyAllowSVG: true,
contentDispositionType: "attachment",
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
```

`contentDispositionType: "attachment"` is the default but is stated explicitly
because it matters when SVG is enabled. `contentSecurityPolicy` prevents scripts
embedded in an SVG from executing if the optimizer serves it.

If you can confirm the project stores no SVG images in Cloudinary or
`public/`, prefer the safer configuration instead:

```js
dangerouslyAllowSVG: false,
contentDispositionType: "attachment",
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
```

To confirm, search the repository and the Cloudinary usage in
`components/ImageUpload.tsx`; do not guess. If you are unsure, keep
`dangerouslyAllowSVG: true` with the CSP and note the decision.

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 4: Smoke-test the image and metadata routes

Start the dev server (`npm run dev`). With the server running, request:

- `http://localhost:3000/`
- `http://localhost:3000/opengraph-image`
- `http://localhost:3000/icon`
- `http://localhost:3000/apple-icon`
- `http://localhost:3000/blogs/<a published slug>` if the local database is
  available.

**Verify**:
- `/`, `/opengraph-image`, `/icon`, and `/apple-icon` return HTTP 200.
- The image routes return an image content type (`image/png`).
- The browser console has no new errors and the site still renders.
- Stop the dev server when done.

If the local database is not configured, skip the blog URL and say so in the
completion note. Do not invent data or run `prisma db push`.

## Test plan

No new automated tests in this plan because the test harness is added in plan
003. The existing `npx tsc --noEmit` check and the manual route smoke test are
the gates.

After plan 003 lands, add a smoke test for `app/opengraph-image.tsx` only if the
test harness can render it without a network; otherwise leave metadata routes to
manual verification.

## Done criteria

- [ ] `npm ls next` reports `16.4.6`
- [ ] `npm audit --json` has no critical finding for `next`
- [ ] `npx tsc --noEmit --incremental false` exits 0
- [ ] `next.config.mjs` contains `contentDispositionType` and
      `contentSecurityPolicy` for images
- [ ] `/`, `/opengraph-image`, `/icon`, `/apple-icon` return 200 in dev
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- `npm install next@16.4.6` cannot resolve, or `npm ls next` does not report
  `16.4.6`.
- `npm audit` still reports `next` as critical after the upgrade.
- The dev server fails to start after the upgrade.
- A metadata route returns 500 or a non-image response after the upgrade.
- The upgrade requires a React change to compile. Report the exact error; do not
  upgrade React silently.

## Maintenance notes

- Future Next upgrades should be treated as security work; run `npm audit` after
  every minor bump. The App Router API surface changed in Next 16, so read
  `node_modules/next/dist/docs/` before taking a larger upgrade.
- If the project later adds user-uploaded SVG avatars or blog images, keep the
  image CSP and attachment disposition; do not enable `dangerouslyAllowSVG`
  without them.
- The remaining high advisories are transitive. Re-check them after the
  dependency-alignment plan (013) and after `next-cloudinary` 7 lands.
