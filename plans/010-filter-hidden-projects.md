# Plan 010: Exclude hidden projects from public API responses

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/api/projects/route.ts app/admin/page.tsx lib/action/projects.ts prisma/schema.prisma`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 003 (tests)
- **Category**: bug
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The `hidden` visibility toggle was just added to projects. Public pages filter it
correctly through `getProjects()` in `lib/action/projects.ts`, but the public
`GET /api/projects` handler has no filter and no session check. Anyone can call
that endpoint and retrieve hidden projects, including their titles,
descriptions, links, and images. “Hidden” should mean hidden from the public,
not hidden only from the rendered pages.

The admin dashboard also calls `GET /api/projects` and should keep seeing all
projects, including hidden ones, so the fix must be session-aware rather than
unconditionally filtering.

## Current state

- `prisma/schema.prisma:31` — `hidden Boolean @default(false)`.
- `lib/action/projects.ts:5-14` — public server action:

```ts
export async function getProjects() {
  const projects = await prisma.project.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
  });
  ...
}
```

- `app/api/projects/route.ts:73-86` — public GET:

```ts
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
```

- `app/api/projects/route.ts:7-14` — POST already requires a session.
- `app/admin/page.tsx:21-38` — the dashboard fetches `/api/projects` and
  `/api/blog` client-side to count rows, with the session cookie sent
  same-origin.
- `app/api/projects/[id]/route.ts:71-96` — single-project GET already requires a
  session and can return a hidden project.

## Commands you will need

| Purpose        | Command                                      | Expected on success |
| -------------- | -------------------------------------------- | ------------------- |
| Tests          | `npx vitest run app/api/projects/route.test.ts` | all pass         |
| All tests      | `npm test`                                   | all pass            |
| Typecheck      | `npm run typecheck`                          | exit 0              |
| Lint           | `npm run lint`                               | exit 0              |

## Scope

**In scope**:
- `app/api/projects/route.ts`
- `app/api/projects/route.test.ts` (extend)

**Out of scope**:
- Changing the `hidden` field or the admin forms.
- Changing `app/admin/page.tsx`. It already sends the session cookie; verify it
  still counts all projects after the change.
- Adding pagination or field selection to the public GET.
- Hiding projects from `app/api/projects/[id]`; that route is already
  authenticated and is used by the admin edit form.

## Git workflow

- Branch: `advisor/010-filter-hidden-projects`
- Commits: `fix: hide hidden projects from the public api`, `test: cover hidden project filtering`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the GET session-aware

In `app/api/projects/route.ts`, change `GET` to:

```ts
export async function GET() {
  const session = await getServerSession(authOptions);
  const where = session?.user ? {} : { hidden: false };

  try {
    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
```

`authOptions` and `getServerSession` are already imported at the top of the file
for `POST`. Do not add a second import.

Behavior:
- Anonymous: `where: { hidden: false }`.
- Authenticated admin: `where: {}`, so the dashboard count includes hidden
  projects.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Extend the route tests

Open `app/api/projects/route.test.ts` (created in plan 003). Add cases for `GET`:

1. Unauthenticated GET → `findMany` called with
   `{ where: { hidden: false }, orderBy: { createdAt: "desc" } }`, response 200.
2. Authenticated GET → `findMany` called with
   `{ where: {}, orderBy: { createdAt: "desc" } }`, response 200.
3. `findMany` rejects → 500.

Use the same `getServerSession` mock as the POST tests. Reset it in `beforeEach`.

**Verify**: `npx vitest run app/api/projects/route.test.ts` → all tests pass,
including the three new GET cases.

### Step 3: Verify the admin dashboard still counts hidden projects

Start the dev server, sign in, and open `/admin`.

- Create a project with “Hide this project from the public site” checked.
- The dashboard's “Total Projects” count must include it.
- Open `/projects` (public) and confirm the hidden project does not appear.
- Call `/api/projects` without a session (private window or `curl`) and confirm
  the hidden project is absent from the JSON.
- Call it with the session cookie (browser devtools) and confirm the hidden
  project is present.

If no local database is available, rely on the unit tests and state that the
manual check was skipped.

## Test plan

Extend `app/api/projects/route.test.ts` with the three GET cases above. The file
already mocks `@/lib/prisma` and `next-auth` from plan 003.

## Done criteria

- [ ] `GET /api/projects` filters `hidden: false` without a session
- [ ] `GET /api/projects` returns all projects with a session
- [ ] The public `/projects` page still excludes hidden projects
- [ ] The admin dashboard still counts hidden projects
- [ ] `npx vitest run app/api/projects/route.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- The admin dashboard stops showing hidden projects because its fetch does not
  send cookies. Do not add a query parameter or a second endpoint without
  reporting the constraint.
- A public page other than `app/projects/page.tsx` calls `/api/projects`
  directly. Search first; if a public caller needs hidden data, that is a bug.
- The project model changes again (for example a `published` field) before this
  plan lands. Reconcile the filter with the live schema.

## Maintenance notes

- If project visibility grows beyond a boolean (scheduled, members-only), replace
  the single `where` with an explicit visibility policy shared by
  `lib/action/projects.ts` and the API route.
- The public GET returns full project rows. If the public surface grows, select
  only the fields the cards need; the admin caller can use a separate endpoint
  or query parameter.
- Keep `app/api/projects/[id]` authenticated; it is the admin edit read path.
