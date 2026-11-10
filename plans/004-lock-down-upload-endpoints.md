# Plan 004: Lock down Cloudinary signing and delete the unused upload route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/api/sign-cloudinary-params/route.ts app/api/blog/upload components/ImageUpload.tsx proxy.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 003 (Vitest harness for the regression tests). The code
  fix itself does not depend on 003, but land 003 first so the fix ships with
  tests.
- **Category**: security
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Two upload-related endpoints are open to the internet with no authentication:

1. `POST /api/sign-cloudinary-params` signs arbitrary Cloudinary parameters with
   the server's API secret. Anyone can use the signature to upload to the
   owner's Cloudinary account, consume quota, create arbitrary public IDs, and
   host content under the owner's brand.
2. `DELETE /api/sign-cloudinary-params` accepts any `publicId` and destroys that
   asset. Anyone can delete published blog and project images by guessing or
   scraping public IDs.
3. `POST/DELETE /api/blog/upload` is an unused local-filesystem upload route. It
   writes attacker-named files into `public/` and deletes arbitrary files via
   path traversal in `fileName`. It has no caller in the app.

The only image flow the app actually uses is the Cloudinary widget in
`components/ImageUpload.tsx`. This plan authenticates that flow and removes the
unused local upload route entirely.

## Current state

- `app/api/sign-cloudinary-params/route.ts:1-35`:

```ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return new Response("Cloudinary API credentials are not set", { status: 500 });
  }
  try {
    const body = await request.json();
    const { paramsToSign } = body;
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    );
    return Response.json({ signature });
  } catch (error) { /* 500 */ }
}
```

- The DELETE handler at `:37-55` calls
  `cloudinary.uploader.destroy(publicId)` with no session check.
- `app/api/blog/upload/route.ts:5-45` — POST reads `formData()`, takes
  `file.name`, keeps only `path.extname(file.name)`, writes into
  `public/blogs`, and returns `/blogs/<filename>`.
- `app/api/blog/upload/route.ts:47-69` — DELETE joins request `fileName` onto
  `public/blogs` and calls `unlink` without checking the resolved path.
- `components/ImageUpload.tsx:46-62` — admin removal calls
  `axios.delete("/api/sign-cloudinary-params", { data: { publicId } })`.
- `components/ImageUpload.tsx:65-67` — widget uses
  `signatureEndpoint="/api/sign-cloudinary-params"`.
- `components/blog/Form.tsx:95-100` and `components/project/ProjectForm.tsx:143-148`
  use `ImageUpload`; no component calls `/api/blog/upload`.
- `proxy.ts:1-5` matches only `/admin/:path*`; it does not protect API routes.
- The app has a single admin user (`prisma/schema.prisma:17-21`), so a session
  check is the correct authorization boundary.

## Commands you will need

| Purpose        | Command                                                    | Expected on success |
| -------------- | ---------------------------------------------------------- | ------------------- |
| Install        | `npm install`                                              | exit 0              |
| Tests          | `npx vitest run app/api/sign-cloudinary-params/route.test.ts` | all pass         |
| All tests      | `npm test`                                                 | all pass            |
| Typecheck      | `npm run typecheck`                                        | exit 0              |
| Lint           | `npm run lint`                                             | exit 0              |
| Caller check   | `rg "api/blog/upload"` (or PowerShell `Select-String`)     | no matches          |

## Scope

**In scope**:
- `app/api/sign-cloudinary-params/route.ts`
- `app/api/blog/upload/route.ts` (delete the file and its now-empty directory)
- `app/api/sign-cloudinary-params/route.test.ts` (create)
- `components/ImageUpload.tsx` only if the endpoint response shape changes
  (it does not in this plan)

**Out of scope**:
- Replacing Cloudinary with another provider.
- Changing the upload preset, widget UI, or Cloudinary folder structure.
- Adding a full RBAC system. There is one admin user; a valid session is enough.
- Deleting existing Cloudinary assets.

## Git workflow

- Branch: `advisor/004-lock-down-uploads`
- Commits: `fix: require auth for cloudinary signing`, `chore: remove unused blog upload route`, `test: cover cloudinary route auth`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Authenticate both Cloudinary handlers

At the top of `app/api/sign-cloudinary-params/route.ts`, import the existing auth
helpers:

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
```

In both `POST` and `DELETE`, before reading the body or touching Cloudinary:

```ts
const session = await getServerSession(authOptions);
if (!session?.user) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

Use `Response.json` to match the file's existing style.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Validate the payloads

Still in the same file, accept only the parameters the widget needs.

For `POST`:

- Parse the JSON body in a `try` block.
- Require `paramsToSign` to be a non-null plain object (`typeof === "object"`,
  not an array).
- Reject any key outside this allowlist:
  `timestamp`, `upload_preset`, `folder`, `public_id`, `source`, `tags`,
  `context`, `transformation`, `eager`, `overwrite`, `invalidate`.
- Reject more than 20 keys.
- Return `400` with `{ error: "Invalid signing parameters" }` on failure.

For `DELETE`:

- Require `publicId` to be a string of length 1-500.
- Reject values containing `..`, a leading `/`, a backslash, or whitespace.
- Optionally, if `process.env.CLOUDINARY_ALLOWED_FOLDER` is set, require
  `publicId.startsWith(`${folder}/`)`. Do not require it by default; existing
  assets may not be in a folder.
- Return `400` with `{ error: "Invalid public ID" }` on failure.

Do not log the API secret or the full signed payload. Log only a generic error
message.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Delete the unused local upload route

Confirm it has no callers:

```powershell
Select-String -Path (Get-ChildItem -Recurse -Include *.ts,*.tsx -File |
  Where-Object { $_.FullName -notmatch 'node_modules|\.next' }).FullName `
  -Pattern 'api/blog/upload'
```

Expected: no output. Then delete `app/api/blog/upload/route.ts` and remove the
empty `app/api/blog/upload/` directory. `app/api/blog/route.ts` and
`app/api/blog/[slug]/route.ts` must remain.

**Verify**: `Test-Path app/api/blog/upload/route.ts` → `False`;
`Test-Path app/api/blog/route.ts` → `True`.

### Step 4: Add the regression tests

Create `app/api/sign-cloudinary-params/route.test.ts`.

Mock these modules before importing the route:

```ts
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: { api_sign_request: vi.fn(() => "test-signature") },
    uploader: { destroy: vi.fn() },
  },
}));
```

Then import:

```ts
import { getServerSession } from "next-auth";
import { POST, DELETE } from "@/app/api/sign-cloudinary-params/route";
```

Cases:
1. `POST` without a session → 401, `api_sign_request` not called.
2. `POST` with a session and `{ paramsToSign: { timestamp: 1, upload_preset: "x" } }`
   → 200 and `{ signature: "test-signature" }`.
3. `POST` with a session and `{ paramsToSign: { evil: "x" } }` → 400.
4. `DELETE` without a session → 401, `destroy` not called.
5. `DELETE` with a session and `{ publicId: "../../secret" }` → 400.
6. `DELETE` with a session and `{ publicId: "portfolio/image" }` → 200 and
   `destroy` called with that ID.

Set `process.env.CLOUDINARY_API_SECRET` and
`process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY` in the test file (before importing
the route if the module reads them at import time) or mock the route's config
check. Never use a real value; use `"test-key"` and `"test-secret"`.

**Verify**: `npx vitest run app/api/sign-cloudinary-params/route.test.ts` → 6
passing tests.

### Step 5: Confirm the admin flow still works

The response shapes did not change, so `components/ImageUpload.tsx` should not
need a change. Read it once to confirm:
- Upload signing still gets `{ signature }`.
- Delete still sends `{ data: { publicId } }`.

If you changed any response key, update the component to match.

**Verify**: `npm run lint` and `npm run typecheck` → exit 0.

## Test plan

New file: `app/api/sign-cloudinary-params/route.test.ts` covering the six cases
above. Follow the mocking pattern from `app/api/blog/route.test.ts` (plan 003).

Manual smoke (only if a local Cloudinary account is configured):
1. Sign in to `/auth/signin`.
2. Open `/admin/blog/add`.
3. Upload an image through the widget; confirm the preview appears.
4. Click Cancel; confirm the asset is removed from Cloudinary.
5. In a private window, call `POST /api/sign-cloudinary-params` with a JSON body;
   confirm 401.

## Done criteria

- [ ] Both `POST` and `DELETE` in `app/api/sign-cloudinary-params/route.ts`
      call `getServerSession` and return 401 without a session
- [ ] Invalid signing parameters return 400
- [ ] Invalid `publicId` values return 400
- [ ] `app/api/blog/upload/route.ts` is deleted
- [ ] `Select-String -Pattern "api/blog/upload"` returns no matches
- [ ] `npx vitest run app/api/sign-cloudinary-params/route.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- A caller of `/api/blog/upload` is found outside `node_modules`/`.next`.
- The Cloudinary widget needs a parameter that is not in the allowlist. Add the
  specific key to the allowlist and note it; do not remove the allowlist.
- The Cloudinary SDK throws at import time because credentials are missing in
  the test environment. Mock the SDK; do not add real credentials.
- Removing the upload route changes behavior used by a deployed client. Search
  the repository first; if unsure, report instead of deleting.

## Maintenance notes

- Any future upload provider or endpoint must follow the same rule: authenticate
  before signing or deleting, validate the payload, and never build a filesystem
  path from request data.
- If the site gains multiple admin users, replace the session check with an
  explicit role check and scope deletion by owner/folder.
- Keep the Cloudinary API secret server-only. Never expose it through a
  `NEXT_PUBLIC_` variable.
- The `Content-Security-Policy` for optimized images is configured in
  `next.config.mjs` (plan 001). Do not remove it while SVG uploads are possible.
