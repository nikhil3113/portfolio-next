# Plan 022: Design and build blog draft preview

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/blogs app/admin/blog/page.tsx lib/action/blogs.ts components/blog`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 007 (published/draft filtering and revalidation), plan
  009 (admin blog actions), plan 018 (admin layout/server pages)
- **Category**: direction
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The blog editor can save a post with `isPublished: false`. The public detail page
filters drafts and returns `notFound()`, so there is no way to review a draft in
the same layout readers will see. The only alternative is to publish it, check
it, and unpublish it, which risks exposing unfinished content and invalidating
caches twice.

This plan adds an authenticated admin preview route. It renders the exact article
component used by the public page, including headings, TOC, code highlighting, and
images, but it is not publicly reachable and does not count a view.

## Design decision: admin preview route, not draft mode

Next.js `draftMode()` is the usual preview mechanism, but using it in the public
blog page opts that route into dynamic rendering and adds a bypass cookie to the
public URL. The blog page is currently statically generated for published posts;
losing SSG for every reader to support an admin-only feature is a bad trade.

Instead, this plan adds `/admin/blog/preview/[slug]`:

- It lives under the existing `/admin/:path*` proxy matcher.
- It also checks `getServerSession` on the server.
- It fetches the blog without the `isPublished` filter.
- It renders the shared article component with view tracking disabled.
- It is `noindex` and never linked from the public site.

The public page and its SSG behavior remain unchanged. If the product later needs
a shareable preview URL, add a signed token and a separate route; do not make the
public page dynamic.

## Current state

- `app/blogs/[slug]/page.tsx` — the public page contains all of the article
  rendering:
  - `generateStaticParams` (published-only after plan 007)
  - `generateMetadata`
  - `estimateReadTime`
  - Cheerio heading/TOC processing
  - `highlightCodeBlocks`
  - JSON-LD
  - the article JSX (`h1`, author/date/read time, views, TOC, image, content,
    `CodeBlockEnhancer`)
  - `BlogViewTracker`
- `lib/action/blogs.ts:56-69` — `getBlogBySlug` filters `isPublished: true`.
- `app/admin/blog/page.tsx` (after plans 009/018) — server-rendered table with
  Edit and Delete actions.
- `proxy.ts:1-5` — protects `/admin/:path*`.
- `components/blog/ViewTracker.tsx` — posts a view increment on mount.
- `app/blogs/[slug]/page.tsx:182-186` — the sanitized HTML sink (plan 006).

## Commands you will need

| Purpose        | Command                                        | Expected on success |
| -------------- | ---------------------------------------------- | ------------------- |
| Tests          | `npx vitest run lib/action/blogs.test.ts`       | all pass            |
| All tests      | `npm test`                                     | all pass            |
| Typecheck      | `npm run typecheck`                            | exit 0              |
| Lint           | `npm run lint`                                 | exit 0              |
| Dev smoke      | `npm run dev`                                  | ready on :3000      |

## Scope

**In scope**:
- `components/blog/BlogArticle.tsx` (create by extracting the article body)
- `app/blogs/[slug]/page.tsx` (use the shared component; behavior unchanged)
- `app/admin/blog/preview/[slug]/page.tsx` (create)
- `app/admin/blog/page.tsx` (add a Preview link)
- `lib/action/blogs.ts` (add `getBlogBySlugForPreview`)
- `lib/action/blogs.test.ts` (create or extend)

**Out of scope**:
- Draft mode or a public preview URL.
- Scheduling, publishing workflows, or approvals.
- Editing content on the preview page.
- View counting for previews.
- Sharing a preview with someone who is not signed in.

## Git workflow

- Branch: `advisor/022-draft-preview`
- Commits: `refactor: extract blog article component`, `feat: add admin draft preview`, `test: cover preview data access`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the preview data accessor

In `lib/action/blogs.ts`, add:

```ts
export async function getBlogBySlugForPreview(slug: string) {
  try {
    return await prisma.blog.findUnique({ where: { slug } });
  } catch (error) {
    console.error("Error fetching blog preview:", error);
    return null;
  }
}
```

Do not add `isPublished` to this query. The caller must enforce authentication.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Extract the article body

Create `components/blog/BlogArticle.tsx` as a server-compatible component. Move
the rendering from `app/blogs/[slug]/page.tsx:90-188` into it, with this shape:

```tsx
import type { Blog } from "@prisma/client";
import Image from "next/image";
import * as cheerio from "cheerio";
import slugify from "slugify";
import { CircleUser, CalendarDays, Clock } from "lucide-react";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CodeBlockEnhancer } from "@/components/blog/CodeBlockEnhancer";
import { BlogViewTracker } from "@/components/blog/ViewTracker";
import { highlightCodeBlocks } from "@/lib/blog/highlight-code";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize";

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogArticle({
  blog,
  showViewTracker = true,
}: {
  blog: Blog;
  showViewTracker?: boolean;
}) {
  const safeContent = sanitizeBlogHtml(blog.content);
  const $ = cheerio.load(safeContent, null, false);
  const headings: { text: string; id: string; level: number }[] = [];

  $("h2, h3").each((i, el) => {
    const text = $(el).text();
    let id = $(el).attr("id");
    if (!id) {
      id = slugify(text, { lower: true, strict: true }) + (i > 0 ? `-${i}` : "");
      $(el).attr("id", id);
    }
    const tagName = (el as any).tagName as string;
    headings.push({ text, id, level: Number(tagName.slice(1)) });
  });

  highlightCodeBlocks($);
  const modifiedHtml = $.html();

  return (
    <article className="space-y-6">
      {/* title, metadata row, TOC, image, content, CodeBlockEnhancer */}
      {showViewTracker && <BlogViewTracker slug={blog.slug} />}
    </article>
  );
}
```

Keep the exact markup and classes from the current page. The views count in the
metadata row can stay (it is a number); the tracker is what must be optional.

Notes:
- `Blog` from `@prisma/client` includes all fields; the public page and preview
  both pass a full blog.
- Keep `sanitizeBlogHtml` and `cheerio.load(..., null, false)` from plan 006.
- Do not include JSON-LD in this component; it belongs to the public page only.
- `CodeBlockEnhancer` is a client component; rendering it inside a server
  component is fine.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Update the public page to use the component

In `app/blogs/[slug]/page.tsx`:

- Remove the moved imports and the inline article markup.
- Import `{ BlogArticle } from "@/components/blog/BlogArticle"`.
- Keep `generateStaticParams`, `generateMetadata`, JSON-LD, and `notFound`.
- Render:

```tsx
<BlogArticle blog={blog} />
```

The public output must be visually identical. The view tracker remains enabled by
default.

**Verify**: `npm run dev`, open a published post, and compare the layout (title,
author row, TOC, image, content, code copy buttons, view tracker network call).

### Step 4: Create the admin preview page

Create `app/admin/blog/preview/[slug]/page.tsx`:

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getBlogBySlugForPreview } from "@/lib/action/blogs";
import { BlogArticle } from "@/components/blog/BlogArticle";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Draft preview",
};

export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { slug } = await params;
  const blog = await getBlogBySlugForPreview(slug);
  if (!blog) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Previewing <span className="font-semibold text-foreground">{blog.h1}</span>
          {blog.isPublished ? " (published)" : " (draft)"}
        </p>
        <Link
          href="/admin/blog"
          className="text-sm font-medium text-accent-text hover:underline"
        >
          Back to blogs
        </Link>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <BlogArticle blog={blog} showViewTracker={false} />
      </div>
    </div>
  );
}
```

The server session check is the primary gate; `proxy.ts` is the first line of
defense.

**Verify**: `npm run typecheck` and `npm run lint` → exit 0.

### Step 5: Add the Preview link to the admin list

In `app/admin/blog/page.tsx`, add a link next to Edit/Delete:

```tsx
<Button size="sm" variant="outline" asChild>
  <Link
    href={`/admin/blog/preview/${blog.slug}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    Preview
  </Link>
</Button>
```

Use `next/link`. The link opens in a new tab so the admin list stays in place.

**Verify**: `npm run lint` → exit 0.

### Step 6: Add data-access tests

Create or extend `lib/action/blogs.test.ts`. Mock `@/lib/prisma`.

Cases:
1. `getBlogBySlugForPreview("draft")` calls `findUnique({ where: { slug: "draft" } })`
   with no `isPublished` filter and returns the row.
2. When Prisma rejects, it returns `null` and logs a generic error.

If `getBlogBySlug` is wrapped in React `cache` from plan 007, do not test it here;
React `cache` outside a render is a pass-through.

**Verify**: `npx vitest run lib/action/blogs.test.ts` → 2+ passing tests.

### Step 7: Security and behavior checks

With a local database:
1. Create a draft post.
2. Open `/admin/blog`, click Preview; the post renders with the draft banner.
3. Confirm the view count did **not** increment (query the database or refresh the
   public post; the preview does not call the tracker).
4. Sign out (or open a private window) and request the preview URL directly; it
   must redirect to `/auth/signin`, not render the draft.
5. Request the public `/blogs/<draft-slug>`; it must return 404.
6. Publish the draft, open the preview again; the banner says “published”.
7. Confirm the public page still renders and the view tracker still increments.

## Test plan

New/extended `lib/action/blogs.test.ts` with the two data-access cases. Existing
route tests must pass.

Manual: the seven checks in step 7.

## Done criteria

- [ ] `getBlogBySlugForPreview` queries without `isPublished`
- [ ] `BlogArticle` renders the article body and optional view tracker
- [ ] The public page uses `BlogArticle` and its output is unchanged
- [ ] `/admin/blog/preview/[slug]` requires a session, is `noindex`, and shows a
      draft banner
- [ ] Preview does not increment views
- [ ] A private request to the preview URL redirects to sign-in
- [ ] The public draft URL still 404s
- [ ] The admin list has a Preview link
- [ ] `npx vitest run lib/action/blogs.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Extracting `BlogArticle` changes the public page's output. Compare the rendered
  HTML and fix the extraction before adding the preview route.
- The preview route is reachable without a session. That is a data leak; stop and
  fix the auth check before continuing.
- The public page's `generateStaticParams` starts including drafts after the
  refactor. Plan 007 must remain intact.
- A shareable preview URL is required. That needs signed tokens and a separate
  design; do not expose the admin route.

## Maintenance notes

- Keep preview rendering on the admin route. Do not add `draftMode()` to the
  public blog page; it would make the page dynamic for all readers.
- If the article body changes, update `BlogArticle` once; both public and preview
  pages inherit it.
- The preview is authenticated but not auditable. If multiple admins are added,
  log preview access.
- If a future feature needs a preview link for an external reviewer, add a
  short-lived signed token route and rate-limit it; never make the admin route
  public.
