# Plan 008: Render empty, error, and unauthorized states

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/blogs/page.tsx app/admin/blog/page.tsx app/admin/project/page.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 002 (lint gate). Plan 009 rewrites the admin blog table
  and depends on this plan; land 008 first.
- **Category**: bug
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Three user-visible states are currently wrong:

1. **Public blog list, zero posts.** `app/blogs/page.tsx` builds an empty-state
   `<div>` but never returns it. The expression is discarded and the page renders
   the “Blogs” header plus an empty grid. A database error also returns `[]` from
   `getBlogs`, so an outage looks identical to “no posts”.
2. **Admin blog list, expired session or API failure.** The client fetches
   `/api/blog` and stores `await res.json()` without checking `res.ok`. A 401
   returns `{ error: "Unauthorized" }`, which is then passed to `blogs.map` and
   throws, blanking the page.
3. **Admin project list, unauthenticated.** `getProjects` throws inside a
   `try/catch` and returns `[]`, so an unauthenticated request renders
   “No Project Found” instead of redirecting to sign-in. The `proxy.ts` matcher
   normally prevents this, but the page should not disguise an auth failure as an
   empty database.

This plan makes each state explicit: empty, error, and unauthenticated.

## Current state

- `app/blogs/page.tsx:46-68`:

```tsx
export default async function Blogs() {
  const blogs = await getBlogs();

  if (!blogs || blogs.length === 0) {
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">No blogs found.</p>
    </div>;
  }

  return ( /* header + <BlogCard blogs={blogs} /> */ );
}
```

- `lib/action/blogs.ts:3-27` — `getBlogs` catches errors and returns `[]`; it does
  not distinguish an outage.
- `app/admin/blog/page.tsx:25-44`:

```tsx
const [blogs, setBlogs] = useState<Blog[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/blog")
    .then((res) => res.json())
    .then((data) => {
      setBlogs(data);
      setLoading(false);
    });
}, []);
```

- `app/admin/project/page.tsx:17-46`:

```tsx
async function getProjects() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized access");
    return await prisma.project.findMany({ orderBy: { createdAt: "asc" } });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}
```

- The admin blog list has a Delete button with no handler
  (`app/admin/blog/page.tsx:103-109`). Plan 009 completes deletion; this plan only
  fixes states.
- `app/not-found.tsx` exists and is styled; use it as the visual reference for
  empty/error cards if a shared component is created.

## Commands you will need

| Purpose        | Command                 | Expected on success |
| -------------- | ----------------------- | ------------------- |
| Typecheck      | `npm run typecheck`     | exit 0              |
| Lint           | `npm run lint`          | exit 0              |
| Tests          | `npm test`              | all pass            |
| Dev smoke      | `npm run dev`           | ready on :3000      |

## Scope

**In scope**:
- `app/blogs/page.tsx`
- `app/admin/blog/page.tsx`
- `app/admin/project/page.tsx`
- `components/admin/StateCard.tsx` (create only if you reuse it in at least two
  of the three pages; otherwise keep the markup inline)

**Out of scope**:
- Adding blog deletion (plan 009).
- Converting admin pages to server components (plan 018).
- Changing the `getBlogs` return type or adding a Result type. If you want a
  richer error signal, keep it local to this plan and document it.
- Adding a global `error.tsx` boundary. This plan handles the three known states;
  a route-level error boundary can be a follow-up.

## Git workflow

- Branch: `advisor/008-empty-error-states`
- Commits: `fix: return the blog empty state`, `fix: handle admin api failures`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Return the public blog empty state

In `app/blogs/page.tsx`, change the conditional to return:

```tsx
if (!blogs || blogs.length === 0) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="mb-3 text-2xl font-bold text-foreground">Blogs</h1>
      <p className="text-muted-foreground">
        No published articles yet. Check back soon.
      </p>
    </div>
  );
}
```

Use theme tokens (`text-foreground`, `text-muted-foreground`) rather than the
current `text-gray-500`. This also removes one hard-coded palette class from the
file, which plan 015 continues.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Make the admin blog fetch check the response

In `app/admin/blog/page.tsx`, replace the effect body with an async function:

```tsx
useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      const res = await fetch("/api/blog");
      if (res.status === 401) {
        router.replace("/auth/signin");
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load blogs (${res.status})`);
      }
      const data: unknown = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected blog list response");
      }
      if (!cancelled) {
        setBlogs(data);
        setError(null);
      }
    } catch (err) {
      if (!cancelled) {
        setError("Could not load blogs. Please refresh and try again.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  load();
  return () => {
    cancelled = true;
  };
}, [router]);
```

Add `const [error, setError] = useState<string | null>(null);` and
`const router = useRouter();` (import `useRouter` from `next/navigation`).

Render an error state before the table:

```tsx
if (error) {
  return (
    <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Blogs</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
```

The 401 redirect uses `router.replace`, so the sign-in page is not added to the
history stack.

**Verify**: `npm run lint` and `npm run typecheck` → exit 0.

### Step 3: Stop disguising auth failures on the project list

In `app/admin/project/page.tsx`:

1. Import `redirect` from `next/navigation`.
2. Move the session check out of the `try/catch`:

```tsx
const session = await getServerSession(authOptions);
if (!session?.user) {
  redirect("/auth/signin");
}
```

3. Keep the Prisma query in a `try/catch`, but return a discriminated result so
   the page can distinguish an error from an empty list:

```tsx
type ProjectsResult =
  | { ok: true; projects: Project[] }
  | { ok: false; message: string };
```

On success return `{ ok: true, projects }`; on failure log the error and return
`{ ok: false, message: "Could not load projects." }`. Do not throw from the
helper.

4. In the page component:
   - If `!result.ok`, render an error card with a retry link.
   - If `result.projects.length === 0`, render “No projects yet” plus a link to
     `/admin/project/add`.
   - Otherwise render the table as before.

`redirect()` throws a special Next.js error. Do not wrap it in `try/catch`; if you
do, the redirect will be swallowed.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Exercise the states manually

1. **Public empty state**: temporarily set every blog to `isPublished: false` in
   a local database, open `/blogs`, confirm the message. Restore the data
   afterward.
2. **Admin 401**: sign in, then clear the session cookie (or open the admin blog
   page in a private window with a direct API call). Confirm the page redirects
   to `/auth/signin` instead of throwing.
3. **Admin API error**: stop the database or rename `DATABASE_URL` to an invalid
   value in a local `.env`, open `/admin/blog`, confirm the error card. Restore
   the env afterward.
4. **Project unauthorized**: open `/admin/project` without a session in a private
   window; `proxy.ts` should redirect. If it does not, the page's new
   `redirect()` is the fallback.

If a state cannot be reproduced locally, say so in the completion note.

## Test plan

No new automated tests. The three states are async Server Components or
browser-only client behavior, which the Vitest setup (plan 003) does not cover.

Existing `npm test` must still pass. Manual checks in step 4 are the verification.

## Done criteria

- [ ] `/blogs` returns the empty-state markup when there are no published posts
- [ ] Admin blog list checks `res.ok`, redirects on 401, and shows an error card
      on other failures
- [ ] Admin project list redirects unauthenticated users and distinguishes an
      error from an empty list
- [ ] All new text uses theme tokens, not raw palette classes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- `redirect("/auth/signin")` causes a build error because the page is statically
  rendered. Add `export const dynamic = "force-dynamic"` and note it.
- The admin blog page has already been converted to a Server Component by a newer
  commit. Reconcile with the live code before applying the client changes.
- Clearing the session reveals that `proxy.ts` does not protect `/admin` itself
  (only subpaths). Report the matcher behavior; do not change `proxy.ts` in this
  plan.
- A state requires a database mutation that you are not authorized to perform.
  Use a local database only; never modify production data.

## Maintenance notes

- Plan 009 rewrites the admin blog table. Keep the `error` state and the 401
  redirect when you replace the fetch with server rendering.
- Plan 018 converts the admin pages to server components; the client-side
  `res.ok` logic then disappears. The server page should still check the session
  and render explicit error/empty states.
- If a shared `StateCard` is introduced, keep it small and token-based. Do not
  create a generic design-system component for three call sites.
