# Plan 003: Add a Vitest harness and route-contract tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- package.json app/api/blog/route.ts app/api/projects/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plan 002 (typecheck/lint/CI baseline)
- **Category**: tests
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The repository has no test runner, no test script, and no test files. The
highest-risk code is the auth-gated mutation surface (`app/api/blog`,
`app/api/projects`, `app/api/blog/[slug]`, `app/api/projects/[id]`) and the
unauthenticated contact/upload/view routes. A dropped session check or a changed
status code can ship without any signal today. `tsc` catches types, not behavior;
lint catches style.

This plan installs Vitest, wires it into the existing `verify` gate, and adds the
first route-contract tests. Route handlers are plain functions, so they can be
imported and called directly with a `Request` object. Mock Prisma, NextAuth, and
`next/cache`; no database or dev server is needed.

## Current state

- `package.json:5-12` — no `test` script.
- No `vitest.config.*`, no `*.test.ts`, no `*.spec.ts` anywhere.
- `app/api/blog/route.ts:7-16` — POST starts with:

```ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { h1, metaDescription, content, imageUrl, author, isPublished, slug } =
      await request.json();
```

- `app/api/projects/route.ts:7-14,73-86` — POST is auth-gated, GET is public and
  returns all projects.
- `app/api/projects/route.ts:45-57` — create data shape.
- `app/api/blog/route.ts:36-46` — create data shape.
- Next.js 16 documentation for Vitest lives at
  `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`. It notes that
  async Server Components are not supported by Vitest and that route handlers
  and synchronous components are fine.
- `package.json` uses CommonJS-free ESM TypeScript with path alias `@/*` mapped
  by `tsconfig.json`.

## Commands you will need

| Purpose        | Command                                      | Expected on success        |
| -------------- | -------------------------------------------- | -------------------------- |
| Install        | `npm install -D vitest vite-tsconfig-paths`  | exit 0                     |
| Tests          | `npm test`                                   | all tests pass             |
| Single file    | `npx vitest run app/api/blog/route.test.ts`  | all tests pass             |
| Watch          | `npm run test:watch`                         | watch mode starts          |
| Typecheck      | `npm run typecheck`                          | exit 0                     |
| Lint           | `npm run lint`                               | exit 0                     |

## Scope

**In scope**:
- `vitest.config.mts` (create)
- `package.json` (scripts and devDependencies)
- `package-lock.json`
- `app/api/blog/route.test.ts` (create)
- `app/api/projects/route.test.ts` (create)
- `lib/site.test.ts` or another small pure unit test (create, optional)
- `.github/workflows/verify.yml` (add `npm test`)

**Out of scope**:
- Testing async Server Components (`app/blogs/[slug]/page.tsx`,
  `app/admin/*/page.tsx`). The Next docs explicitly say Vitest does not support
  them; use manual checks or E2E later.
- Browser/component testing with jsdom or React Testing Library. That can be
  added later; this plan uses the Node environment.
- Integration tests against a real MongoDB.
- Coverage thresholds.

## Git workflow

- Branch: `advisor/003-vitest-harness`
- Commits: `test: add vitest harness`, `test: cover auth gates on blog and project routes`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install Vitest and create the config

Run:

```bash
npm install -D vitest vite-tsconfig-paths
```

Create `vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "plans/**"],
    clearMocks: true,
    restoreMocks: true,
  },
});
```

Add scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
```

Change `verify` to:

```json
"verify": "npm run typecheck && npm run lint && npm test"
```

**Verify**: `npx vitest run --passWithNoTests` → exit 0 with "No test files found".

### Step 2: Write the blog route contract test

Create `app/api/blog/route.test.ts`. Use this shape (adjust imports only if the
current route changes):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    blog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/blog/route";

const sessionMock = vi.mocked(getServerSession);
const createMock = vi.mocked(prisma.blog.create);

const validBody = {
  h1: "Hello",
  metaDescription: "A post",
  content: "<p>Body</p>",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/x.png",
  author: "Nikhil",
  isPublished: true,
  slug: "hello",
};

function post(body: unknown) {
  return new Request("http://localhost/api/blog", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/blog", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    createMock.mockReset();
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);
    const response = await POST(post(validBody));
    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await POST(post({ h1: "Only title" }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a blog and revalidates the public paths", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    createMock.mockResolvedValue({ id: "b1" } as never);
    const response = await POST(post(validBody));
    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledOnce();
  });
});
```

If TypeScript rejects `sessionMock.mockResolvedValue(...)`, cast the session
object through `as never` or type the mock as
`MockedFunction<typeof getServerSession>`; do not change the route to make the
test compile.

**Verify**: `npx vitest run app/api/blog/route.test.ts` → 3 passing tests.

### Step 3: Write the project route contract test

Create `app/api/projects/route.test.ts` with the same mocking pattern:

- `POST` returns 401 without a session.
- `POST` returns 400 when `title` is missing.
- `POST` returns 400 when `tags` is an empty array (the route already has this
  branch at `app/api/projects/route.ts:39-44`).
- `POST` returns 201 with a valid body.
- `GET` returns 200 and the mocked project list.

Use `prisma.project.create` and `prisma.project.findMany` mocks.

**Verify**: `npx vitest run app/api/projects/route.test.ts` → 5 passing tests.

### Step 4: Add one pure unit test

Create `lib/site.test.ts` exercising `absoluteUrl` from `lib/site.ts`:

```ts
import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/lib/site";

describe("absoluteUrl", () => {
  it("joins a path onto the configured site URL", () => {
    expect(absoluteUrl("/blogs/hello")).toMatch(/\/blogs\/hello$/);
  });

  it("keeps the root URL stable", () => {
    expect(absoluteUrl("/")).toMatch(/\/$/);
  });
});
```

This proves the alias resolution works for non-route modules too.

**Verify**: `npx vitest run lib/site.test.ts` → 2 passing tests.

### Step 5: Wire tests into CI and the verify gate

In `.github/workflows/verify.yml`, after `npm run verify` or as part of it, make
sure tests run. Because step 1 changed the `verify` script to include `npm test`,
no separate workflow step is required. If the workflow calls `npm run verify`
already, leave it.

**Verify**: `npm run verify` → typecheck, lint, and all tests pass.

## Test plan

New tests:
- `app/api/blog/route.test.ts` — 401, 400, 201.
- `app/api/projects/route.test.ts` — 401, 400 (missing field), 400 (empty tags),
  201, public GET.
- `lib/site.test.ts` — alias and URL joining.

Pattern to follow: the blog test file is the template for all later route tests
in plans 004-010.

Verification: `npm test` → 10 or more tests pass.

## Done criteria

- [ ] `vitest.config.mts` exists with `environment: "node"` and
      `vite-tsconfig-paths`
- [ ] `package.json` has `test`, `test:watch`, and `verify` includes tests
- [ ] `npm test` exits 0 with at least 10 tests
- [ ] `npm run verify` exits 0
- [ ] CI runs `npm run verify` (which now includes tests)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Vitest cannot resolve `@/...` imports after `vite-tsconfig-paths`.
- Importing a route handler pulls in a native module or opens a real Prisma
  connection during the test. Mock the module; if it still connects, STOP.
- `vi.mock` hoisting causes `ReferenceError` that cannot be fixed by moving the
  imports below the mocks.
- A test reveals a real bug in the route. Record the failure, do not change the
  route's behavior in this plan; the fix belongs in plans 004-012.

## Maintenance notes

- Every new route handler should get a contract test in the same style: 401,
  400, success, and the failure path that matters.
- Route tests must never touch a real database. If a test needs Prisma types,
  use `as never` casts rather than instantiating `PrismaClient`.
- Async Server Components are not covered. When admin pages become server
  components in plan 018, verify them manually or add Playwright later.
- Keep the Node environment for route tests. If component tests are added,
  use a separate Vitest project with `jsdom` rather than changing the default.
