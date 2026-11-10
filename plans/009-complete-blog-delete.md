# Plan 009: Complete the blog delete flow

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/api/blog app/admin/blog/page.tsx components/blog`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: plan 008 (admin blog states), plan 003 (tests)
- **Category**: tech-debt / feature
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Blog CRUD is missing its delete operation. The admin list renders an active
destructive “Delete” button, but the click handler is commented out and no
`DELETE` handler exists in either blog route. An admin can click Delete and
nothing happens: no request, no confirmation, no feedback. Every other entity
(projects) has a working delete flow, so this is a visible asymmetry and a dead
control.

This plan adds an authenticated `DELETE /api/blog/[slug]`, a small client action
component with a confirmation dialog, and route-contract tests. It does not add
soft delete; deletion is permanent, so the confirmation is required.

## Current state

- `app/admin/blog/page.tsx:99-110`:

```tsx
<TableCell className="text-right space-x-2 flex justify-center items-center">
  <Button size="sm" variant="outline" asChild>
    <a href={`/admin/blog/update/${blog.slug}`}>Edit</a>
  </Button>
  <Button
    size="sm"
    variant="destructive"
  // onClick={() => handleDelete(blog.id)}
  >
    Delete
  </Button>
</TableCell>
```

- `app/api/blog/route.ts` exports `POST` and `GET` only.
- `app/api/blog/[slug]/route.ts` exports `GET` and `PUT` only.
- `components/project/TableActions.tsx:11-32` — the existing project delete
  pattern:

```tsx
const handleDelete = async () => {
  if (!confirm("Are you sure you want to delete this project?")) return;
  const response = await fetch(`/api/projects/${projectId}`, { method: "delete" });
  if (response.ok) {
    alert("Project deleted successfully");
    router.refresh();
  } else {
    alert("Failed to delete project");
  }
};
```

- `app/api/projects/[id]/route.ts:96-132` — the server-side delete pattern:
  session check, `findUnique` 404 check, `delete`, revalidate `/projects` and
  `/`, return 200.
- The blog detail page is statically generated, so deletion must revalidate the
  post URL as well as the list and sitemap.

## Commands you will need

| Purpose        | Command                                                   | Expected on success |
| -------------- | --------------------------------------------------------- | ------------------- |
| Tests          | `npx vitest run "app/api/blog/[slug]/route.test.ts"`         | all pass            |
| All tests      | `npm test`                                                 | all pass            |
| Typecheck      | `npm run typecheck`                                        | exit 0              |
| Lint           | `npm run lint`                                             | exit 0              |

## Scope

**In scope**:
- `app/api/blog/[slug]/route.ts`
- `components/blog/BlogActions.tsx` (create)
- `app/admin/blog/page.tsx`
- `app/api/blog/[slug]/route.test.ts` (create)

**Out of scope**:
- Soft delete, trash, restore, or an audit log.
- Bulk delete.
- Deleting Cloudinary images when a post is deleted.
- Deleting the `GET`/`PUT` handlers or changing their behavior.
- Changing the project delete flow.

## Git workflow

- Branch: `advisor/009-blog-delete`
- Commits: `feat: add authenticated blog delete`, `feat: wire blog delete action`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the DELETE handler

In `app/api/blog/[slug]/route.ts`, add:

```ts
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const existing = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    await prisma.blog.delete({ where: { slug } });

    revalidatePath(`/blogs/${slug}`);
    revalidatePath("/blogs");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ message: "Blog deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
```

Match the style of the existing handlers: named exports, `NextResponse`, one
`try/catch`, and generic error messages. Do not use the request body.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Create the client action

Create `components/blog/BlogActions.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function BlogActions({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setPending(true);
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/auth/signin");
        return;
      }

      if (!response.ok) {
        throw new Error(`Delete failed (${response.status})`);
      }

      toast.success("Blog deleted");
      router.refresh();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

Use `encodeURIComponent` for the slug so a slug with reserved characters cannot
change the path. Plan 012 will constrain slugs to a safe pattern; this is defense
in depth.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Wire the action into the admin table

In `app/admin/blog/page.tsx`:

1. Import `{ BlogActions } from "@/components/blog/BlogActions"`.
2. Replace the dead `Button` with:

```tsx
<BlogActions slug={blog.slug} title={blog.h1} />
```

3. Keep the Edit link and the table layout unchanged.
4. Remove the commented-out `onClick` line.

**Verify**: `npm run lint` → exit 0.

### Step 4: Add route tests

Create `app/api/blog/[slug]/route.test.ts`. Mock:

```ts
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { blog: { findUnique: vi.fn(), delete: vi.fn() } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
```

Import `{ DELETE }` from `@/app/api/blog/[slug]/route`.

Helper:

```ts
const params = Promise.resolve({ slug: "hello" });
const request = new Request("http://localhost/api/blog/hello", { method: "DELETE" });
```

Cases:
1. No session → 401, `delete` not called.
2. Session, `findUnique` returns `null` → 404, `delete` not called.
3. Session, existing blog → 200, `delete` called with `{ where: { slug: "hello" } }`.
4. Success calls `revalidatePath` with `/blogs/hello`, `/blogs`, `/`, and
   `/sitemap.xml`.
5. `delete` rejects → 500.

**Verify**: `npx vitest run "app/api/blog/[slug]/route.test.ts"` → 5 passing tests.

### Step 5: Manual smoke test

With a local database:
1. Sign in and open `/admin/blog`.
2. Click Delete on a test post; cancel the confirm; confirm the row remains.
3. Click Delete again and confirm; confirm the toast, the row disappears after
   refresh, `/blogs` no longer lists it, and the post URL returns 404.
4. Confirm `/sitemap.xml` no longer lists the slug.

Do not run this against production data.

## Test plan

New file: `app/api/blog/[slug]/route.test.ts` covering the five cases above.
Follow the mocking pattern from `app/api/blog/route.test.ts` (plan 003).

Manual: the four checks in step 5.

## Done criteria

- [ ] `DELETE /api/blog/[slug]` exists and requires a session
- [ ] Missing blog returns 404
- [ ] Successful delete revalidates the post URL, list, home, and sitemap
- [ ] `components/blog/BlogActions.tsx` confirms before deleting and shows
      success/failure toasts
- [ ] The admin table uses `BlogActions`
- [ ] `npx vitest run "app/api/blog/[slug]/route.test.ts"` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- The project has no confirmation pattern and the operator wants a custom dialog
  instead of `confirm()`. Report and ask; do not add a modal library.
- Deleting a blog should also delete its Cloudinary image. That is a product
  decision; do not add it silently.
- The admin table has already been converted to a Server Component by plan 018.
  In that case, keep `BlogActions` as the client boundary and wire it the same
  way.
- A test reveals the slug route is also used for previews (plan 022). Coordinate
  the DELETE behavior with the preview route; never delete a draft through a
  preview URL.

## Maintenance notes

- Deletion is permanent. If the owner wants undo, add a `deletedAt` field and
  filter it everywhere; do not add a trash UI without a migration plan.
- When plan 018 converts the admin list to a Server Component, `BlogActions`
  remains the only client part of the row.
- If Cloudinary cleanup is added later, do it after the database delete succeeds
  and treat a Cloudinary failure as non-fatal (log it).
- The `revalidatePath("/sitemap.xml")` call must stay in sync with plan 007.
