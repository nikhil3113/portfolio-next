# Plan 021: Turn the admin dashboard into a content dashboard

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/admin/page.tsx lib/admin/stats.ts lib/admin/stats.test.ts prisma/schema.prisma`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plan 018 (admin page is a server component and
  `lib/admin/stats.ts` exists)
- **Category**: direction
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The site already collects useful content data that the dashboard ignores:

- `Blog.views` is incremented by `POST /api/blog/views/[slug]` and displayed on
  the public post, but the admin dashboard only shows a total blog count.
- Blogs have a `isPublished` flag, projects have a `hidden` flag, and both are
  only visible as raw lists.
- The dashboard shows no indication of which posts are actually read.

The result is a dashboard that tells the owner “how many rows exist” but not
“what is working.” This plan extends the server-side stats helper with published/
draft/hidden counts, total views, and the top five posts by views, then renders
them on `/admin`. It reuses the data already in MongoDB; no new tracking, schema
change, or chart library is required.

## Current state

- `app/admin/page.tsx` (after plan 018) is an async server component:

```tsx
const { totalProjects, totalBlogs } = await getAdminCounts();
```

It renders two stat cards and two quick-action cards (Projects, Blogs).

- `lib/admin/stats.ts` (after plan 018):

```ts
export type AdminCounts = { totalProjects: number; totalBlogs: number };

export async function getAdminCounts(): Promise<AdminCounts> {
  const [totalProjects, totalBlogs] = await Promise.all([
    prisma.project.count(),
    prisma.blog.count(),
  ]);
  return { totalProjects, totalBlogs };
}
```

- `prisma/schema.prisma:23-49` — `Project.hidden` and `Blog.isPublished`,
  `Blog.views`.
- `app/blogs/[slug]/page.tsx:158-161` — the public view count display.
- `app/api/blog/views/[slug]/route.ts` — increments `views` without a published
  check (plan 012/validation may tighten it; do not change it here).
- No charting library is installed. Do not add one.

## Commands you will need

| Purpose        | Command                                   | Expected on success |
| -------------- | ----------------------------------------- | ------------------- |
| Tests          | `npx vitest run lib/admin/stats.test.ts`   | all pass            |
| All tests      | `npm test`                                | all pass            |
| Typecheck      | `npm run typecheck`                       | exit 0              |
| Lint           | `npm run lint`                            | exit 0              |

## Scope

**In scope**:
- `lib/admin/stats.ts`
- `lib/admin/stats.test.ts`
- `app/admin/page.tsx`

**Out of scope**:
- Changing the view-counting endpoint or deduplication.
- Adding a charting library, sparkline, or time-series storage.
- Adding a date range filter or historical snapshots.
- Changing the public blog page's view display.
- Contact inbox metrics (plan 020 has its own unread count).

## Git workflow

- Branch: `advisor/021-content-dashboard`
- Commits: `feat: extend admin stats`, `feat: render content dashboard`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extend the stats helper

In `lib/admin/stats.ts`, keep `getAdminCounts` (it may be used elsewhere) and add:

```ts
export type TopBlog = {
  id: string;
  h1: string;
  slug: string;
  views: number;
};

export type DashboardStats = AdminCounts & {
  hiddenProjects: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  topBlogs: TopBlog[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalProjects,
    hiddenProjects,
    totalBlogs,
    publishedBlogs,
    viewsAggregate,
    topBlogs,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { hidden: true } }),
    prisma.blog.count(),
    prisma.blog.count({ where: { isPublished: true } }),
    prisma.blog.aggregate({ _sum: { views: true } }),
    prisma.blog.findMany({
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, h1: true, slug: true, views: true },
    }),
  ]);

  return {
    totalProjects,
    totalBlogs,
    hiddenProjects,
    publishedBlogs,
    draftBlogs: totalBlogs - publishedBlogs,
    totalViews: viewsAggregate._sum.views ?? 0,
    topBlogs,
  };
}
```

Notes:
- `views` is a required `Int` with a default, but `aggregate()._sum` is typed
  `number | null`; use `?? 0`.
- `draftBlogs` derives from the two counts. If a future `publishedAt` schedule
  adds a third state, replace the subtraction with explicit counts.
- The top-posts query includes drafts. That is intentional: the owner may want to
  see a draft with high views from a preview. If the product wants published-only,
  add `where: { isPublished: true }` and document it.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Extend the stats tests

In `lib/admin/stats.test.ts`, add a `getDashboardStats` block. Mock:

```ts
const projectCount = vi.mocked(prisma.project.count);
const blogCount = vi.mocked(prisma.blog.count);
const blogAggregate = vi.mocked(prisma.blog.aggregate);
const blogFindMany = vi.mocked(prisma.blog.findMany);
```

Because `prisma.project.count` and `prisma.blog.count` are called with different
arguments, use `mockImplementation` keyed on the call argument or use
`mockResolvedValueOnce` in call order. Example:

```ts
projectCount
  .mockResolvedValueOnce(10) // total
  .mockResolvedValueOnce(3); // hidden
blogCount
  .mockResolvedValueOnce(8)  // total
  .mockResolvedValueOnce(6); // published
blogAggregate.mockResolvedValue({ _sum: { views: 42 } } as never);
blogFindMany.mockResolvedValue([
  { id: "b1", h1: "Top", slug: "top", views: 20 },
] as never);
```

Assert:
- `hiddenProjects` = 3
- `draftBlogs` = 2
- `totalViews` = 42
- `topBlogs` length 1
- When `_sum.views` is `null`, `totalViews` is 0.

**Verify**: `npx vitest run lib/admin/stats.test.ts` → all pass.

### Step 3: Render the dashboard

In `app/admin/page.tsx`, call `getDashboardStats()` instead of
`getAdminCounts()`.

Add a “Content” section below the existing stat cards:

1. **Four stat cards** (reuse the existing `Card` markup):
   - Total views (`totalViews`)
   - Published posts (`publishedBlogs`)
   - Drafts (`draftBlogs`)
   - Hidden projects (`hiddenProjects`)
2. **Top posts** — a small list or table:

```tsx
{stats.topBlogs.map((blog) => (
  <div key={blog.id} className="flex items-center justify-between gap-4 py-2">
    <Link
      href={`/blogs/${blog.slug}`}
      className="truncate text-sm text-foreground hover:text-accent-text"
    >
      {blog.h1}
    </Link>
    <span className="shrink-0 font-mono text-xs text-muted-foreground">
      {blog.views} views
    </span>
  </div>
))}
```

3. **A simple bar** for the top post relative to the max, if it reads well:

```tsx
const maxViews = Math.max(1, ...stats.topBlogs.map((b) => b.views));
<div className="h-1 w-full rounded-full bg-muted">
  <div
    className="h-1 rounded-full bg-primary"
    style={{ width: `${Math.round((blog.views / maxViews) * 100)}%` }}
  />
</div>
```

The inline width is dynamic data, not a design token; that is acceptable. Do not
add a chart library.

4. Empty state: if `topBlogs.length === 0`, render “No posts yet” with a link to
   `/admin/blog/add`.

Use theme tokens for all colors (plan 015's rule). Keep the existing Projects and
Blogs quick actions.

**Verify**: `npm run lint` and `npm run typecheck` → exit 0.

### Step 4: Manual check

With a local database:
1. Open `/admin`.
2. The counts match the Projects and Blogs lists (including hidden/draft rows).
3. Total views equals the sum shown on the blog cards/posts.
4. The top five are ordered by views.
5. The bar widths look proportional and do not overflow.
6. The “No posts yet” state appears when there are no blogs.
7. Toggle dark mode; the new cards and bars are readable.

## Test plan

Extend `lib/admin/stats.test.ts` with the `getDashboardStats` cases in step 2.

Manual: the seven dashboard checks in step 4.

## Done criteria

- [ ] `getDashboardStats` returns total/hidden projects, total/published/draft
      blogs, total views, and top five posts
- [ ] `null` view sums become 0
- [ ] `/admin` renders the four new stat cards and the top-posts list
- [ ] Empty top-posts state links to `/admin/blog/add`
- [ ] All colors use theme tokens
- [ ] `npx vitest run lib/admin/stats.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- The Prisma aggregate return type differs from `_sum.views` and cannot be typed
  without `any`. Report the type; do not add an untyped cast.
- The dashboard becomes slow (>1s) because one of the counts is unbounded. Report
  the query plan; do not add caching in this plan.
- The product wants time-series views. That requires an event table or analytics
  provider; do not derive it from a single counter.
- Plan 018 has not landed, so `/admin` is still a client component. Land 018
  first.

## Maintenance notes

- `Blog.views` is a single counter, not a time series. Any “views over time”
  feature needs a new event model or PostHog queries.
- If contact metrics are added, keep them in `lib/admin/stats.ts` so the page has
  one data source.
- The top-posts query includes drafts by design. If that changes, update the
  dashboard copy to “Published posts” and add a filter.
- The inline bar width is data-driven; do not replace it with a fixed Tailwind
  width class.
