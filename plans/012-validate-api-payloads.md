# Plan 012: Validate API payloads with shared Zod schemas

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/api/blog app/api/projects lib/validation.ts app/admin/blog app/admin/project`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 003 (tests), plan 006 (blog routes were edited there)
- **Category**: security / tech-debt
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Every admin mutation route trusts raw JSON. The admin forms use Zod, but those
schemas run only in the browser and can be bypassed with a direct request. The
routes currently accept:

- Non-array `tags` or an empty array (projects).
- Arbitrary `createdAt` strings passed to `new Date(...)`.
- Arbitrary `imageUrl`, `siteLink`, and `githubLink`, including `javascript:`
  URLs that are later rendered as `href` in project cards.
- Arbitrary `slug` strings, duplicate slugs that surface as 500s, and
  `isPublished` values of any type.
- Unbounded strings that can exceed reasonable document sizes.

The result is 500s where 400s belong, malformed data in MongoDB, and a stored
link-injection path. This plan creates one set of server schemas, uses them in
all blog and project mutation routes, shares the field validators with the admin
forms, maps unique-constraint failures to 409, and adds contract tests.

## Current state

- `app/api/blog/route.ts:19-46` — destructures `h1`, `metaDescription`,
  `content`, `imageUrl`, `author`, `isPublished`, `slug` and writes them
  directly.
- `app/api/blog/[slug]/route.ts:49-88` — destructures the same plus `newSlug`,
  does a read-then-write uniqueness check, and writes directly.
- `app/api/projects/route.ts:16-58` — destructures `tags` and `createdAt` and
  writes directly; `createdAt ? new Date(createdAt) : new Date()`.
- `app/api/projects/[id]/route.ts:20-57` — same on update.
- `app/admin/blog/add/page.tsx:12-20` and
  `app/admin/blog/update/[slug]/page.tsx:13-21` — client-only schemas:

```ts
const formSchema = z.object({
  h1: z.string().min(1, "Heading is required"),
  metaDescription: z.string().min(1, "Meta description is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
  author: z.string().min(1, "Author is required"),
  slug: z.string().min(1, "Slug is required"),
  isPublished: z.boolean(),
});
```

- `app/admin/project/add/page.tsx:12-21` and
  `app/admin/project/update/[id]/page.tsx:12-21` — `z.url()` for links, no
  scheme restriction beyond what `z.url()` accepts.
- `components/project/ProjectCard.tsx:37-40,62-77` — renders `siteLink` and
  `githubLink` as `href` in `Link` components.
- Zod 4.0.5 is installed; `z.url()` is available.

## Commands you will need

| Purpose        | Command                                             | Expected on success |
| -------------- | --------------------------------------------------- | ------------------- |
| Tests          | `npx vitest run lib/validation.test.ts`             | all pass            |
| Route tests    | `npx vitest run app/api/blog/route.test.ts app/api/projects/route.test.ts` | all pass |
| All tests      | `npm test`                                          | all pass            |
| Typecheck      | `npm run typecheck`                                 | exit 0              |
| Lint           | `npm run lint`                                      | exit 0              |

## Scope

**In scope**:
- `lib/validation.ts` (create)
- `app/api/blog/route.ts`
- `app/api/blog/[slug]/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/admin/blog/add/page.tsx`
- `app/admin/blog/update/[slug]/page.tsx`
- `app/admin/project/add/page.tsx`
- `app/admin/project/update/[id]/page.tsx`
- `lib/validation.test.ts` (create)
- `app/api/blog/route.test.ts`, `app/api/projects/route.test.ts`,
  `app/api/blog/[slug]/route.test.ts` (extend)

**Out of scope**:
- Changing the database schema or migrating existing rows.
- Adding HTML sanitization (plan 006).
- Changing the `hidden` filter (plan 010).
- Adding a form library or changing the admin form layout.
- Enforcing uniqueness on project titles.

## Git workflow

- Branch: `advisor/012-validate-api-payloads`
- Commits: `feat: add shared validation schemas`, `fix: validate blog and project mutations`, `test: cover validation failures`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Check existing slugs before enforcing a pattern

Run a read-only query against the local database (or inspect a production
export if available):

```bash
npx prisma studio
```

or a small script. List every `Blog.slug`. The intended pattern is lowercase
alphanumeric words separated by single hyphens:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

If any existing slug violates it (uppercase, underscore, spaces, leading/trailing
hyphen), STOP and report the list. Do not silently make existing posts
uneditable. If you cannot access the database, note that the check was skipped
and keep the route validation tolerant: use `.min(1).max(120)` and the regex,
but only return 400 on create; on update, accept the existing slug unchanged and
validate only `newSlug`.

### Step 2: Create the shared schemas

Create `lib/validation.ts`:

```ts
import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug is too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens",
  );

export const httpUrlSchema = z
  .url("Enter a valid URL")
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Only http and https URLs are allowed",
  });

export const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .max(500)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "Image URL must be http(s) or site-relative",
  );

const dateInputSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const blogCreateSchema = z.object({
  h1: z.string().trim().min(1).max(200),
  metaDescription: z.string().trim().min(1).max(300),
  content: z.string().min(1).max(200_000),
  imageUrl: imageUrlSchema.or(z.literal("")),
  author: z.string().trim().min(1).max(100),
  isPublished: z.boolean(),
  slug: slugSchema,
});

export const blogUpdateSchema = blogCreateSchema.extend({
  newSlug: slugSchema.optional(),
});

export const projectCreateSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(5000),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  siteLink: httpUrlSchema,
  githubLink: httpUrlSchema,
  imageUrl: imageUrlSchema,
  createdAt: dateInputSchema,
  hidden: z.boolean().optional().default(false),
});

export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
```

Notes:
- `z.url()` in Zod 4 accepts `javascript:`; the `refine` is what restricts the
  scheme. Do not remove it.
- `dateInputSchema` accepts the `YYYY-MM-DD` value produced by the admin
  `<input type="date">`. Parse it with `new Date(value)` only after validation.
- Blog `imageUrl` may be empty because the public page has a “No image”
  fallback. Projects still require an image.
- Do not use `.strict()` unless you also update the forms; unknown keys should be
  stripped, which is Zod's default.

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 3: Validate blog mutations

In `app/api/blog/route.ts` (POST), replace the destructuring and manual
required-field check with:

```ts
const parsed = blogCreateSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json(
    {
      message: "Invalid blog payload",
      errors: parsed.error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

const { h1, metaDescription, content, imageUrl, author, isPublished, slug } =
  parsed.data;
```

Then apply the sanitization from plan 006 and create the row.

Wrap the `prisma.blog.create` call in a unique-constraint check:

```ts
try {
  await prisma.blog.create({ data: { /* ... */ } });
} catch (error) {
  if ((error as { code?: string }).code === "P2002") {
    return NextResponse.json(
      { message: "Slug already in use" },
      { status: 409 },
    );
  }
  throw error;
}
```

The outer `try/catch` still returns 500 for everything else.

In `app/api/blog/[slug]/route.ts` (PUT), do the same with
`blogUpdateSchema`. Use `const nextSlug = parsed.data.newSlug ?? slug;` and
write `slug: nextSlug`. Keep the existing friendly pre-check, but also catch
`P2002` from the update and return 409. Revalidate both slugs after the update
(plan 007).

**Verify**: `npx vitest run app/api/blog/route.test.ts` → existing tests pass.

### Step 4: Validate project mutations

In `app/api/projects/route.ts` (POST), use `projectCreateSchema.safeParse`.
Remove the manual `!tags` and empty-array checks; the schema covers them.

In `app/api/projects/[id]/route.ts` (PUT), use the same schema. Parse
`createdAt` with:

```ts
createdAt: parsed.data.createdAt
  ? new Date(`${parsed.data.createdAt}T00:00:00.000Z`)
  : undefined,
```

On create, default to `new Date()` when absent. Use UTC midnight so the date does
not shift by timezone.

Return 400 with `errors: parsed.error.flatten().fieldErrors` on failure.

**Verify**: `npx vitest run app/api/projects/route.test.ts` → existing tests pass.

### Step 5: Share validators with the admin forms

In the four admin pages, import the shared validators:

```ts
import { httpUrlSchema, slugSchema } from "@/lib/validation";
```

- Replace the blog `slug` field with `slugSchema`.
- Replace project `siteLink` and `githubLink` with `httpUrlSchema`.
- Replace `z.url("Invalid URL format")` with `httpUrlSchema`.
- Keep the client-only fields (`image`, `tags` as a comma-separated string).
- Do not import the full server schemas into client components; they include
  fields the forms shape differently.

**Verify**: `npm run typecheck` and `npm run lint` → exit 0.

### Step 6: Add schema tests

Create `lib/validation.test.ts`:

- `slugSchema` accepts `my-post-1`; rejects `My Post`, `my_post`, `-post`.
- `httpUrlSchema` accepts `https://example.com`; rejects `javascript:alert(1)`
  and `ftp://example.com`.
- `imageUrlSchema` accepts `/blogs/x.png` and a Cloudinary HTTPS URL; rejects
  `javascript:...`.
- `blogCreateSchema` rejects a missing `h1`, a non-boolean `isPublished`, and
  content over 200,000 characters (use a short string plus a length assertion
  instead of allocating 200k if you prefer).
- `blogCreateSchema` accepts an empty `imageUrl`.
- `projectCreateSchema` rejects an empty `tags` array, more than 20 tags, and a
  non-string tag.
- `projectCreateSchema` accepts `createdAt: "2025-01-31"` and `hidden: true`.

**Verify**: `npx vitest run lib/validation.test.ts` → all pass.

### Step 7: Add route-level failure tests

Extend the existing route tests:

- `POST /api/blog` with a non-boolean `isPublished` → 400.
- `POST /api/blog` with `slug: "Bad Slug"` → 400.
- `POST /api/blog` when Prisma rejects with `{ code: "P2002" }` → 409.
- `PUT /api/blog/[slug]` with a `javascript:` `imageUrl` → 400.
- `POST /api/projects` with `tags: []` → 400 (still 400, now from Zod).
- `POST /api/projects` with `siteLink: "javascript:alert(1)"` → 400.

**Verify**: `npm test` → all pass.

### Step 8: Manual admin check

With a local database:
1. Create a blog with a normal title and slug; succeeds.
2. Try a slug with capitals; the form shows the shared error.
3. Create a project with a valid HTTPS site and GitHub URL; succeeds.
4. Open the edit form for an existing project; the fields load unchanged.
5. Edit a project without changing the date; saving still works.

## Test plan

New file `lib/validation.test.ts` plus the route cases in step 7. Follow the
mocking patterns from plan 003.

Manual: the five admin checks in step 8.

## Done criteria

- [ ] `lib/validation.ts` exports `slugSchema`, `httpUrlSchema`,
      `imageUrlSchema`, `blogCreateSchema`, `blogUpdateSchema`,
      `projectCreateSchema`
- [ ] All four mutation routes use `safeParse` and return 400 with field errors
- [ ] Duplicate blog slugs return 409, not 500
- [ ] `javascript:` URLs and empty project tags are rejected server-side
- [ ] Admin forms reuse `slugSchema` and `httpUrlSchema`
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Existing blog slugs violate the slug pattern. Report them; do not force a
  migration in this plan.
- Existing project links use a scheme other than http/https (for example a
  relative `/project` link). Report the list; either widen `httpUrlSchema` for
  that field or migrate the data deliberately.
- The admin forms send a payload shape that does not match the schemas (for
  example `imageUrl` under a different key). Align the route or the form, but do
  not add `any` casts to bypass validation.
- Zod 4.0.5 does not support `z.url()` as written. Use
  `z.string().url()` and note the deviation.

## Maintenance notes

- Any new blog/project field must be added to `lib/validation.ts` and the
  corresponding admin form in the same change.
- The server schemas are the source of truth. Client schemas may be stricter
  (for UX) but must never be looser.
- URL scheme allowlists must be applied anywhere a stored URL becomes an `href`
  or a redirect target.
- Plan 013 bumps Zod to 4.6.6. Re-run this plan's tests after the bump; the
  schema API is unchanged but the version is new enough to matter.
