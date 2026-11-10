# Plan 007: Fix draft filtering, sitemap output, and blog revalidation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/blogs app/sitemap.xml/route.ts lib/action/blogs.ts app/api/blog/route.ts app/api/blog/[slug]/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 003 (tests), plan 006 (the blog page is edited there;
  rebase this plan after 006)
- **Category**: bug
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The public blog list only shows published posts, but three adjacent paths do not
respect `isPublished`:

1. `generateStaticParams` prerenders every blog, including drafts. The detail
   page then filters drafts and returns `notFound()`, so build output is wasted
   and a draft slug is known to the build.
2. `sitemap.xml` lists every slug, including drafts, and computes `lastModified`
   but never emits it. Draft URLs are advertised to search engines.
3. Publishing or renaming a post revalidates the wrong path. Creating a post
   revalidates `/blogs` and `/` but not the new post URL. Renaming revalidates
   the old slug but not `newSlug`. A cached 404 or stale page can survive.

The detail page also fetches the same blog twice per request: once in
`generateMetadata` and once in the page component. React `cache()` removes the
duplicate query within a request.

## Current state

- `app/blogs/[slug]/page.tsx:15-18`:

```ts
export async function generateStaticParams() {
  const blogs = await prisma.blog.findMany({ select: { slug: true } });
  return blogs.map((blog) => ({ slug: blog.slug }));
}
```

- `lib/action/blogs.ts:56-69` — `getBlogBySlug`:

```ts
export async function getBlogBySlug(slug: string) {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug, isPublished: true },
    });
    return blog;
  } catch (error) {
    console.log("Error fetching blog by ID:", error);
    return null;
  }
}
```

- `app/sitemap.xml/route.ts:5-16`:

```ts
const blogs = await prisma.blog
  .findMany({ select: { slug: true, updatedAt: true } })
  .catch(() => []);

const blogEntries = blogs.map((b) => ({
  url: absoluteUrl(`/blogs/${b.slug}`),
  lastModified: b.updatedAt.toISOString(),
}));
```

- `app/sitemap.xml/route.ts:22-29` — output only contains `<loc>${entry.url}</loc>`;
  `lastModified` is dropped.
- `app/api/blog/route.ts:47-52` — after create:

```ts
revalidatePath("/blogs");
revalidatePath("/");
```

- `app/api/blog/[slug]/route.ts:89-92` — after update:

```ts
revalidatePath(`/blogs/${slug}`);
revalidatePath("/blogs");
revalidatePath("/");
```

`newSlug` is not revalidated, and `/sitemap.xml` is never revalidated.

## Commands you will need

| Purpose        | Command                                                   | Expected on success |
| -------------- | --------------------------------------------------------- | ------------------- |
| Tests          | `npx vitest run app/sitemap.xml/route.test.ts`             | all pass            |
| All tests      | `npm test`                                                 | all pass            |
| Typecheck      | `npm run typecheck`                                        | exit 0              |
| Lint           | `npm run lint`                                             | exit 0              |

## Scope

**In scope**:
- `app/blogs/[slug]/page.tsx`
- `app/sitemap.xml/route.ts`
- `lib/action/blogs.ts`
- `app/api/blog/route.ts`
- `app/api/blog/[slug]/route.ts`
- `app/sitemap.xml/route.test.ts` (create)

**Out of scope**:
- Adding a `publishedAt` field or scheduling posts.
- Changing the blog detail layout or sanitization (plan 006).
- Adding pagination to the blog list.
- Changing the sitemap URL structure or adding project URLs.

## Git workflow

- Branch: `advisor/007-fix-blog-publishing`
- Commits: `fix: filter drafts from static params and sitemap`, `fix: revalidate blog slugs on create and rename`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add published-only data helpers

In `lib/action/blogs.ts`, add two functions next to the existing ones:

```ts
export async function getPublishedBlogSlugs() {
  try {
    return await prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
  } catch (error) {
    console.error("Error fetching published blog slugs:", error);
    return [];
  }
}

export async function getPublishedBlogsForSitemap() {
  try {
    return await prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching sitemap blogs:", error);
    return [];
  }
}
```

Wrap `getBlogBySlug` in React `cache`:

```ts
import { cache } from "react";

export const getBlogBySlug = cache(async (slug: string) => {
  // existing body
});
```

Keep the existing `try/catch` and return type.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Filter static params

In `app/blogs/[slug]/page.tsx`, replace the `generateStaticParams` body with:

```ts
export async function generateStaticParams() {
  const blogs = await getPublishedBlogSlugs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}
```

Import `getPublishedBlogSlugs` from `@/lib/action/blogs`. The page should no
longer call `prisma.blog.findMany` directly.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Fix the sitemap

In `app/sitemap.xml/route.ts`:

1. Use `getPublishedBlogsForSitemap()` instead of the direct Prisma query.
2. Emit `<lastmod>` for entries that have one.
3. XML-escape the URL. Slugs are normally safe, but `absoluteUrl` can include
   `&` if the site URL has a query string; escape `&`, `<`, and `>`.

Implementation shape:

```ts
const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const entries = allEntries
  .map((entry) => {
    const lastmod = "lastModified" in entry && entry.lastModified
      ? `<lastmod>${entry.lastModified}</lastmod>`
      : "";
    return `  <url><loc>${escapeXml(entry.url)}</loc>${lastmod}</url>`;
  })
  .join("\n");
```

Keep the `Content-Type: application/xml` response header. Do not change the
route to a metadata file; the repo intentionally uses a route handler.

**Verify**: `npx vitest run app/sitemap.xml/route.test.ts` after step 5.

### Step 4: Revalidate every affected path

In `app/api/blog/route.ts` (POST, after `prisma.blog.create`):

```ts
revalidatePath("/blogs");
revalidatePath(`/blogs/${slug}`);
revalidatePath("/");
revalidatePath("/sitemap.xml");
```

In `app/api/blog/[slug]/route.ts` (PUT, after `prisma.blog.update`):

```ts
revalidatePath(`/blogs/${slug}`);
if (newSlug && newSlug !== slug) {
  revalidatePath(`/blogs/${newSlug}`);
}
revalidatePath("/blogs");
revalidatePath("/");
revalidatePath("/sitemap.xml");
```

If `newSlug` is missing in the request (the current client always sends it),
treat the post as unchanged and do not call `prisma.blog.update` with
`slug: undefined`. Plan 012 adds schema validation; for this plan, guard with
`newSlug || slug`.

**Verify**: `npm run typecheck` → exit 0.

### Step 5: Add the sitemap tests

Create `app/sitemap.xml/route.test.ts`. Mock Prisma before importing the route:

```ts
vi.mock("@/lib/prisma", () => ({
  prisma: { blog: { findMany: vi.fn() } },
}));
```

Import `{ GET }` from `@/app/sitemap.xml/route` and `{ prisma }` from
`@/lib/prisma`.

Cases:
1. `findMany` returns one published blog and one draft (the mock returns only
   what `findMany` resolves; assert the route passed `where: { isPublished: true }`
   to Prisma).
2. The XML contains `<loc>https://nikchavan.dev/blogs/hello</loc>`.
3. The XML contains `<lastmod>` with the ISO date.
4. When `findMany` rejects, the route still returns a valid XML document with the
   static entries and status 200.
5. A slug containing `&` is escaped as `&amp;` (if the helper is exported; if
   not, test through a mocked blog with slug `a&b`).

Because `siteUrl` reads `NEXT_PUBLIC_SITE_URL` at import time, set it in the test
with `vi.stubEnv` before importing the route, or assert with a regex on
`/blogs/hello`.

**Verify**: `npx vitest run app/sitemap.xml/route.test.ts` → 5 passing tests.

### Step 6: Manual check

With a local database containing at least one draft and one published post:
1. `npm run dev`, open `/sitemap.xml`; the draft slug must not appear.
2. Open a published post; the page renders.
3. Publish a draft in the admin; open its URL without a rebuild; it should
   return 200, not a cached 404.
4. Rename a published slug; the old URL should 404 and the new URL should work.

If no local database is available, note that the manual check was skipped.

## Test plan

New file: `app/sitemap.xml/route.test.ts` covering the five cases above.

Manual: the four sitemap/publish/rename checks in step 6.

## Done criteria

- [ ] `generateStaticParams` only queries published blogs
- [ ] `sitemap.xml` only lists published blogs and includes `<lastmod>`
- [ ] XML output escapes `&`, `<`, `>`
- [ ] Create revalidates the new post URL and the sitemap
- [ ] Rename revalidates both the old and new slug and the sitemap
- [ ] `getBlogBySlug` is wrapped in React `cache`
- [ ] `npx vitest run app/sitemap.xml/route.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- `revalidatePath("/sitemap.xml")` does not invalidate the route in the local
  runtime. Note the behavior; do not add a cache-busting query parameter.
- A draft URL is still reachable publicly after the change. That is a security
  finding; stop and report.
- `cache()` changes the return type in a way that breaks `generateMetadata`.
- The sitemap route already has a different published filter from a newer
  commit. Reconcile with the live code first.

## Maintenance notes

- When a `publishedAt` or scheduled-publishing field is added, update
  `getPublishedBlogSlugs`, `getPublishedBlogsForSitemap`, and
  `getBlogBySlug` together.
- If the blog list gains pagination, the sitemap should still list all published
  posts; do not paginate the sitemap query without also adding sitemap indexes.
- The sitemap is a route handler, not `app/sitemap.ts`, so Next's metadata
  conventions do not apply. Keep the XML escaping local to this route or move it
  to `lib/seo.ts` if another feed is added (plan 021/022 may add one).
