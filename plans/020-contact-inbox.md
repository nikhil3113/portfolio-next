# Plan 020: Design and build the contact inbox

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- prisma/schema.prisma app/api/contact app/admin/page.tsx app/admin/layout.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 005 (contact writes are reliable), plan 018 (admin
  layout and server-rendering patterns)
- **Category**: direction
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The `Contact` model is write-only. `prisma.contact.create` in the contact route
is the only reference to it in the entire codebase: no page, route, or server
action reads the rows. Every inquiry is stored in MongoDB, but the owner can only
see it if the Brevo email succeeds. Plan 005 fixes the false-success bug, but the
data is still invisible in the admin.

This plan adds a small admin inbox: a list of submissions, an unread indicator, a
mark-read toggle, and delete. It is deliberately narrow — no threading, no reply
composer, no CRM. The goal is that a lead is never lost because an email failed
or was filtered.

## Design decisions (make these before coding)

1. **Read state is optional in the schema.** Existing documents predate any
   `isRead` field. Add nullable `isRead` and `createdAt` fields instead of
   required ones so old rows do not break reads. Treat `isRead: null` as unread.
2. **Sort by `id` descending.** MongoDB ObjectIds are time-ordered. Use `id` as
   the primary sort so rows without `createdAt` still appear in insertion order.
3. **No reply composer.** Show the email as a `mailto:` link. Replying from the
   owner's mail client is simpler and avoids another email path.
4. **Deletion is permanent.** Use a confirmation, matching the project/blog
   delete pattern. Retention policy is an open question (see the end).
5. **No pagination in v1.** If the inbox exceeds ~200 rows, add pagination in a
   follow-up; do not render an unbounded list forever.

## Current state

- `prisma/schema.prisma:10-15`:

```prisma
model Contact {
  id      String @id @default(auto()) @map("_id") @db.ObjectId
  name    String
  email   String
  message String
}
```

- `app/api/contact/route.ts:18-24` — creates a row with `{ name, email, message }`.
- `app/admin/page.tsx` — dashboard with Projects and Blogs quick actions; no
  Contacts card.
- `components/project/TableActions.tsx:11-32` — the delete + `router.refresh()`
  pattern to mirror.
- `app/admin/layout.tsx` — created in plan 018 and provides `SessionProvider` to
  admin pages.
- No `app/api/contact/[id]` route exists.

## Commands you will need

| Purpose        | Command                                        | Expected on success |
| -------------- | ---------------------------------------------- | ------------------- |
| Prisma format  | `npx prisma format`                            | exit 0              |
| Prisma generate| `npx prisma generate`                          | exit 0              |
| Tests          | `npx vitest run "app/api/contact/[id]/route.test.ts"` | all pass        |
| All tests      | `npm test`                                     | all pass            |
| Typecheck      | `npm run typecheck`                            | exit 0              |
| Lint           | `npm run lint`                                 | exit 0              |

## Scope

**In scope**:
- `prisma/schema.prisma`
- `app/api/contact/route.ts` (set `isRead: false` and `createdAt` on create)
- `app/api/contact/[id]/route.ts` (create: PATCH and DELETE)
- `app/admin/contact/page.tsx` (create)
- `components/contact/ContactActions.tsx` (create)
- `app/admin/page.tsx` (add a Contacts quick action)
- `app/api/contact/[id]/route.test.ts` (create)

**Out of scope**:
- Reply composer, attachments, or outbound email from the inbox.
- Threading, tags, assignment, or CRM integration.
- Changing the public contact form (plan 005 does the honeypot).
- Pagination, search, or filtering in v1.
- A real-time notification system.

## Git workflow

- Branch: `advisor/020-contact-inbox`
- Commits: `feat: add contact read state`, `feat: add admin contact inbox`, `test: cover contact inbox actions`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extend the Contact model

Add nullable fields:

```prisma
model Contact {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  email     String
  message   String
  isRead    Boolean?  @default(false)
  createdAt DateTime? @default(now())
}
```

Nullable fields are intentional: existing documents do not have them, and a
required field with a default can still read as missing on legacy MongoDB
documents. The UI treats `null` as unread/unknown.

Run:

```bash
npx prisma format
npx prisma generate
```

**Verify**: `npx prisma validate` → exit 0 (use a dummy `DATABASE_URL` if the
environment variable is absent).

### Step 2: Set the new fields on create

In `app/api/contact/route.ts`, change the create call to:

```ts
await prisma.contact.create({
  data: {
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    isRead: false,
    createdAt: new Date(),
  },
});
```

Field names may differ if plan 005 used `safe` variables; keep the same values
that are written today.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Add the authenticated PATCH and DELETE routes

Create `app/api/contact/[id]/route.ts`:

```ts
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.isRead !== "boolean") {
    return NextResponse.json({ message: "isRead must be a boolean" }, { status: 400 });
  }

  try {
    const existing = await prisma.contact.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: { isRead: body.isRead },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.contact.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
```

There is no public cache to revalidate; the inbox is dynamic.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Build the admin inbox page

Create `app/admin/contact/page.tsx` as a server component:

```tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactActions } from "@/components/contact/ContactActions";

export const dynamic = "force-dynamic";

export default async function ContactInbox() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const contacts = await prisma.contact.findMany({
    orderBy: { id: "desc" },
    take: 200,
  });

  if (contacts.length === 0) {
    return ( /* empty state using theme tokens */ );
  }

  return ( /* table: name, email, message preview, received, read state, actions */ );
}
```

Requirements:
- Use the existing table primitives from `components/ui/table`.
- Email is a `mailto:` link.
- Message preview is truncated with `line-clamp-3`; the full message appears in
  a `title` attribute or a collapsible row.
- Badge: “Unread” for `isRead !== true`, “Read” otherwise.
- Date: `contact.createdAt?.toLocaleDateString() ?? "—"`.
- Use theme tokens, not raw palette classes (plan 015’s rule).

**Verify**: `npm run typecheck` → exit 0.

### Step 5: Add the client actions

Create `components/contact/ContactActions.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ContactActions({
  id,
  isRead,
}: {
  id: string;
  isRead: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggleRead() {
    setPending(true);
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isRead: !isRead }),
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      router.refresh();
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this contact message? This cannot be undone.")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/contact/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      toast.success("Contact deleted");
      router.refresh();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="outline" onClick={toggleRead} disabled={pending}>
        {isRead ? "Mark unread" : "Mark read"}
      </Button>
      <Button size="sm" variant="destructive" onClick={remove} disabled={pending}>
        Delete
      </Button>
    </div>
  );
}
```

**Verify**: `npm run lint` → exit 0.

### Step 6: Link the inbox from the dashboard

In `app/admin/page.tsx`, add a Contacts card or a third quick-action block:

- Title “Messages”
- Count of unread contacts would be ideal; add
  `prisma.contact.count({ where: { isRead: { not: true } } })` to
  `lib/admin/stats.ts` or query it directly in the page.
- Link to `/admin/contact`.

Keep the existing Projects and Blogs cards.

**Verify**: `npm run typecheck` and `npm run lint` → exit 0.

### Step 7: Add the route tests

Create `app/api/contact/[id]/route.test.ts`. Mock `next-auth`, `@/lib/auth`, and
`@/lib/prisma` (contact `findUnique`, `update`, `delete`).

Cases:
1. PATCH without a session → 401.
2. PATCH with a non-boolean `isRead` → 400.
3. PATCH for a missing contact → 404.
4. PATCH for an existing contact → 200 and `update` called with the boolean.
5. DELETE without a session → 401.
6. DELETE for a missing contact → 404.
7. DELETE for an existing contact → 200 and `delete` called.

**Verify**: `npx vitest run "app/api/contact/[id]/route.test.ts"` → 7 passing tests.

### Step 8: Manual smoke test

With a local database:
1. Submit a contact message through the public form.
2. Sign in and open `/admin/contact`; the message appears as unread.
3. Mark it read; refresh; it stays read.
4. Mark it unread; refresh; it stays unread.
5. Delete it; confirm it disappears.
6. Confirm the dashboard link and unread count.

## Test plan

New file: `app/api/contact/[id]/route.test.ts` with the seven cases. Follow the
route-test pattern from plan 003.

Manual: the six checks in step 8.

## Done criteria

- [ ] `Contact` has nullable `isRead` and `createdAt`
- [ ] New submissions set `isRead: false` and `createdAt`
- [ ] PATCH and DELETE require a session and handle 400/404
- [ ] `/admin/contact` lists submissions, supports mark read/unread and delete
- [ ] The dashboard links to the inbox
- [ ] `npx vitest run "app/api/contact/[id]/route.test.ts"` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Existing contact documents cannot be read after adding the fields. Make the
  fields nullable as specified; if Prisma still errors, report the exact error.
- The admin layout from plan 018 is not in place. Do not add a second
  `SessionProvider`; land 018 first.
- The inbox needs pagination because the data set is already large. Report the
  row count; add `take: 200` now and plan pagination separately.
- The product wants a reply composer. That is a separate email path and a
  different plan; do not add it here.

## Maintenance notes

- Retention: decide how long to keep messages. A future cron or manual delete
  policy is needed; this plan only adds a cap of 200 rows in the view.
- If the inbox grows, add cursor pagination on `id` and a search filter.
- Marking read is a single boolean. If multiple admins are added, replace it with
  per-user read state.
- The public contact route writes `createdAt`; any bulk import must set it too.
