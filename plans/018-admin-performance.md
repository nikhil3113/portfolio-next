# Plan 018: Scope the session provider and server-render the admin lists

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/layout.tsx app/Providers.tsx app/admin/layout.tsx app/admin/page.tsx app/admin/blog/page.tsx app/admin/project/page.tsx components/blog/BlogActions.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plan 008 (admin states), plan 009 (`BlogActions`), plan 003
  (test harness for the stats helper)
- **Category**: perf
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Every public page mounts NextAuth's `SessionProvider` at the root layout. The
provider calls `/api/auth/session` on mount and refetches on window focus by
default. Only the admin pages and the sign-in page read the session. Visitors to
`/`, `/projects`, and `/blogs/[slug]` pay an extra request and download the
NextAuth client runtime for a session those pages never use.

The admin list pages are also client-rendered waterfalls:

- `app/admin/page.tsx` fetches full `/api/projects` and `/api/blog` arrays after
  hydration just to read `.length`.
- `app/admin/blog/page.tsx` fetches `/api/blog` on mount; that endpoint returns
  every field, including the full HTML `content`, just to render a six-column
  table.

This plan moves `SessionProvider` into the admin and auth layouts, converts both
admin list pages to server components, and selects only the fields the tables
need. It keeps the interactive row actions as small client components.

## Current state

- `app/layout.tsx:8,115-122`:

```tsx
import { PostHogProvider, Providers } from "./Providers";
...
<Providers>
  <PostHogProvider>
    <Appbar />
    {children}
    <ScrollToTop />
    <Toaster richColors />
  </PostHogProvider>
</Providers>
```

- `app/Providers.tsx:11-13`:

```tsx
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
```

- `app/admin/page.tsx:1,21-38` — `"use client"`, `useEffect`, two `fetch` calls,
  `loading` state.
- `app/admin/blog/page.tsx:1,25-44` — `"use client"`, `useEffect`, `fetch("/api/blog")`,
  `blogs.map` over full rows.
- `app/admin/project/page.tsx:15-38` — already a server component, uses
  `getServerSession` and Prisma directly.
- `app/api/blog/route.ts:62-78` — authenticated GET returns
  `prisma.blog.findMany()` with every field, including `content`.
- `components/blog/BlogActions.tsx` is created in plan 009 and is the client
  boundary for the delete button.
- `app/auth/signin/page.tsx:34` — uses `useSession()`, so it needs a provider.

## Commands you will need

| Purpose        | Command                 | Expected on success |
| -------------- | ----------------------- | ------------------- |
| Typecheck      | `npm run typecheck`     | exit 0              |
| Lint           | `npm run lint`          | exit 0              |
| Tests          | `npm test`              | all pass            |
| Dev smoke      | `npm run dev`           | ready on :3000      |

## Scope

**In scope**:
- `app/layout.tsx`
- `app/Providers.tsx`
- `app/admin/layout.tsx` (create)
- `app/auth/layout.tsx` (create)
- `app/admin/page.tsx`
- `app/admin/blog/page.tsx`
- `lib/admin/stats.ts` (create)
- `lib/admin/stats.test.ts` (create)

**Out of scope**:
- `app/admin/project/page.tsx`; it is already server-rendered. Plan 021 may extend
  its dashboard sibling.
- `app/admin/project/add/page.tsx` and `update/[id]/page.tsx`; they use
  `useAuthRedirect`, which needs a session. The new admin layout provides it.
- Changing the auth/session shape, JWT callbacks, or `proxy.ts`.
- Adding a loading skeleton or streaming. The pages are fast queries; a
  `loading.tsx` can be added later.
- Changing the admin table design beyond replacing the client fetch.

## Git workflow

- Branch: `advisor/018-admin-performance`
- Commits: `perf: scope session provider to admin and auth`, `perf: server-render admin lists`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move SessionProvider into scoped layouts

In `app/Providers.tsx`, delete the `Providers` export and the `SessionProvider`
import. Keep `PostHogProvider` and the `"use client"` directive.

Create `app/admin/layout.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Create `app/auth/layout.tsx` with the same content. Both layouts are client
components; they wrap server-rendered children without making the pages client.

In `app/layout.tsx`:

- Change the import to `import { PostHogProvider } from "./Providers";`
- Remove the `<Providers>` wrapper, keeping `<PostHogProvider>` as the direct
  child of `ThemeProvider`.

The tree becomes:

```tsx
<ThemeProvider ...>
  <PostHogProvider>
    <Appbar />
    {children}
    <ScrollToTop />
    <Toaster richColors />
  </PostHogProvider>
</ThemeProvider>
```

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Add a testable stats helper

Create `lib/admin/stats.ts`:

```ts
import { prisma } from "@/lib/prisma";

export type AdminCounts = {
  totalProjects: number;
  totalBlogs: number;
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const [totalProjects, totalBlogs] = await Promise.all([
    prisma.project.count(),
    prisma.blog.count(),
  ]);

  return { totalProjects, totalBlogs };
}
```

This counts all projects (including hidden) and all blogs (including drafts), which
matches the current dashboard's “Total” labels. Plan 021 extends this module.

Create `lib/admin/stats.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { count: vi.fn() },
    blog: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAdminCounts } from "@/lib/admin/stats";

describe("getAdminCounts", () => {
  beforeEach(() => {
    vi.mocked(prisma.project.count).mockReset();
    vi.mocked(prisma.blog.count).mockReset();
  });

  it("returns both counts", async () => {
    vi.mocked(prisma.project.count).mockResolvedValue(4);
    vi.mocked(prisma.blog.count).mockResolvedValue(7);
    await expect(getAdminCounts()).resolves.toEqual({
      totalProjects: 4,
      totalBlogs: 7,
    });
  });
});
```

**Verify**: `npx vitest run lib/admin/stats.test.ts` → passes.

### Step 3: Convert the dashboard to a server component

Rewrite `app/admin/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderKanban, Plus, Eye } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminCounts } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { totalProjects, totalBlogs } = await getAdminCounts();

  return ( /* the existing markup, with the loading ternaries replaced by the numbers */ );
}
```

Remove `"use client"`, `useEffect`, `useState`, and the `loading` ternaries. Keep
the existing cards and quick actions; use `{totalProjects}` and `{totalBlogs}`
directly.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Convert the blog list to a server component

Rewrite `app/admin/blog/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogActions } from "@/components/blog/BlogActions";
// table and Button imports

export const dynamic = "force-dynamic";

export default async function AllBlogsTable() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  let blogs;
  try {
    blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        h1: true,
        metaDescription: true,
        slug: true,
        imageUrl: true,
        author: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return ( /* error card with a retry link */ );
  }

  return ( /* the existing table, using BlogActions and blogs.map */ );
}
```

Important:
- Do **not** select `content`. The table does not use it.
- `createdAt` is a `Date` in server components; `new Date(blog.createdAt)` still
  works, but you can call `.toLocaleDateString()` directly.
- The image preview uses `next/image` with `width`/`height` or `fill`; keep the
  existing sizing.
- The Delete button is now `<BlogActions slug={blog.slug} title={blog.h1} />`.
- The plan 008 client fetch/error/401 logic is replaced by the server session
  check and error card. Do not leave dead `useEffect` code.

**Verify**: `npm run typecheck` and `npm run lint` → exit 0.

### Step 5: Confirm the public pages no longer fetch the session

Run `npm run dev` and open `/`, `/projects`, `/blogs`, `/blogs/<slug>` in the
browser network panel. Filter for `api/auth/session`. It should not appear on
those pages. Open `/admin` and `/auth/signin`; the request should appear there.

Also confirm:
- `/admin` renders counts without a spinner.
- `/admin/blog` renders the table immediately (server-rendered HTML).
- Deleting a blog still works and refreshes the list.
- `/auth/signin` still redirects to `/admin` after a successful login.
- `/admin/blog/add` and `/admin/project/add` still redirect to `/` when
  unauthenticated (`useAuthRedirect` gets the provider from the admin layout).

**Verify**: the network/behavior checks above.

## Test plan

New file: `lib/admin/stats.test.ts` with the count test. Existing route tests
must still pass.

Manual: the public/admin network and behavior checks in step 5.

## Done criteria

- [ ] Root layout no longer wraps the app in `SessionProvider`
- [ ] `app/admin/layout.tsx` and `app/auth/layout.tsx` provide the session
- [ ] `app/admin/page.tsx` is an async server component using `getAdminCounts`
- [ ] `app/admin/blog/page.tsx` is an async server component that selects no
      `content` field
- [ ] Both admin pages check the session and redirect to `/auth/signin`
- [ ] Public pages make no `/api/auth/session` request
- [ ] `npx vitest run lib/admin/stats.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- A client component outside `app/admin` or `app/auth` calls `useSession` or
  `signIn` and now has no provider. Search before moving the provider.
- The admin layout's client boundary causes a server component import error.
  Move the provider into a small client wrapper component instead.
- The blog table needs `content` for a preview column that plan 009/022 adds. If
  so, select it explicitly for that feature; do not select the whole row.
- `redirect()` is swallowed by a `try/catch`. Keep it outside the Prisma
  `try/catch`.

## Maintenance notes

- `app/admin/layout.tsx` is the only session provider for admin pages. New admin
  routes inherit it.
- If a public page later needs session-aware UI, add a small provider around that
  subtree; do not move `SessionProvider` back to the root.
- `getAdminCounts` counts hidden projects and draft blogs. If the dashboard labels
  change to “published” or “visible”, add separate counts instead of reusing
  these numbers.
- Plan 021 extends `lib/admin/stats.ts` with views and top posts. Keep the helper
  the single data source for the dashboard.
