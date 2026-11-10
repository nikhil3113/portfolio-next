# Plan 005: Harden the contact endpoint and report email failures

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/api/contact/route.ts lib/brevo.ts components/landing/Contact.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 003 (Vitest harness). Plan 004 is not a dependency.
- **Category**: security / bug
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The public contact form is an unauthenticated email sender. Today it:

- Accepts any `name`, `email`, and `message` with only a truthiness check and
  `email.includes("@")`.
- Sends a branded HTML email to the address supplied by the visitor, with the
  visitor's name and message interpolated into the HTML without escaping. Anyone
  can use the portfolio's Brevo sender to send attacker-controlled HTML to
  arbitrary recipients, which is a phishing and sender-reputation problem.
- Has no rate limit or bot check. A loop can send unlimited mail and write
  unlimited MongoDB documents.
- Logs the recipient address and the full Brevo response.
- **Silently reports success when email delivery fails.** `lib/brevo.ts`
  catches every error and returns `{ status: 500 }`; `app/api/contact/route.ts`
  awaits the function but never checks the return value, then returns 200
  "Message sent successfully". A Brevo outage or missing key means the lead is
  saved but the owner never hears about it.

This plan fixes the false-success bug, escapes user content, sends notifications
only to the site owner (with the visitor as `replyTo`), and adds a rate limit plus
a honeypot. The contact row is still persisted so a mail failure does not lose
the lead.

## Current state

- `app/api/contact/route.ts:5-60` — the whole handler:

```ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, message } = body;

  if (!name || !email || !message) return new Response("Missing fields", { status: 400 });
  if (!email.includes("@")) return new Response("Invalid email", { status: 400 });

  try {
    await prisma.contact.create({ data: { name, email, message } });
    try {
      await sednMail(email, message, name);
      console.log("Email sent successfully");
    } catch (error) {
      console.log("Error sending email", error);
      return NextResponse.json({ error: "Error sending email" }, { status: 500 });
    }
    return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
```

- `lib/brevo.ts:3-81` — `sednMail`:
  - Returns `{ status: 400 }` or `{ status: 500 }` instead of throwing.
  - Sends to the visitor's address and BCCs the owner at `:34-37`.
  - Interpolates `${name}` and `${message.substring(...)}` into HTML at `:38-61`.
  - Logs `"Sending OTP to:", email` at `:20` and the full provider response at
    `:65`.
  - Catches all errors and returns `{ status: 500 }` at `:72-79`.
- `components/landing/Contact.tsx:30-57` — submits JSON `{ name, email, message }`
  and treats any `response.ok` as success.
- `prisma/schema.prisma:10-15` — `Contact { name, email, message }`; there is no
  `createdAt` or read flag (the inbox is a direction plan, 020).

## Commands you will need

| Purpose        | Command                                   | Expected on success |
| -------------- | ----------------------------------------- | ------------------- |
| Install        | `npm install`                             | exit 0              |
| Tests          | `npx vitest run app/api/contact/route.test.ts` | all pass       |
| All tests      | `npm test`                                | all pass            |
| Typecheck      | `npm run typecheck`                       | exit 0              |
| Lint           | `npm run lint`                            | exit 0              |

## Scope

**In scope**:
- `app/api/contact/route.ts`
- `lib/brevo.ts`
- `lib/rate-limit.ts` (create)
- `components/landing/Contact.tsx` (honeypot field and error message only)
- `app/api/contact/route.test.ts` (create)

**Out of scope**:
- Adding a CAPTCHA provider or a Redis/Upstash dependency.
- Building the contact inbox UI (plan 020).
- Changing the `Contact` Prisma model.
- Sending marketing email, newsletters, or attachments.
- Styling the contact form beyond the hidden honeypot field.

## Git workflow

- Branch: `advisor/005-harden-contact`
- Commits: `fix: report contact email failures`, `feat: rate-limit contact submissions`, `test: cover contact endpoint`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Return a result from the mailer and escape HTML

In `lib/brevo.ts`, rename `sednMail` to `sendContactMail` and change its contract
to:

```ts
export type MailResult = { ok: true } | { ok: false; error: string };

export async function sendContactMail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<MailResult>
```

Behavior:

- If `BREVO_API_KEY`, `SMTP_EMAIL`, or `MY_EMAIL` (fallback `SMTP_EMAIL`) is
  missing, return `{ ok: false, error: "Mail is not configured" }`. Do not throw.
- Send the **owner notification** to `MY_EMAIL || SMTP_EMAIL`, with
  `replyTo: { email: input.email, name: input.name }`.
- Send an **auto-reply** to `input.email` as a best-effort second call. If it
  fails, log a generic message and still return `{ ok: true }` because the owner
  was notified.
- If the owner notification fails, return `{ ok: false, error: "..." }`.
- Escape `name` and `message` before interpolating them into HTML. Add a local
  helper:

```ts
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}
```

- Remove `console.log("Sending OTP to:", email)` and the full
  `JSON.stringify(data, null, 2)` log. Log only `messageId` or a generic
  success/failure string. Never log the visitor's email or message body.
- Truncate the quoted message in the owner notification to 500 characters after
  escaping. Do not use `substring` on a non-string; the route validates types.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Add a small in-memory rate limiter

Create `lib/rate-limit.ts`:

```ts
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit() {
  buckets.clear();
}
```

This is per-process memory. It is not a distributed limiter; note that in the
code comment and in the completion note. It still stops a single-instance loop,
which is the immediate threat. Do not add Redis for this plan.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Rewrite the contact handler

In `app/api/contact/route.ts`:

1. Import `z` from `"zod"` and `checkRateLimit` from `"@/lib/rate-limit"` at the
   top of the route file.
2. Parse the body and validate it with Zod:

```ts
const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional().default(""),
});

let body: unknown;
try {
  body = await request.json();
} catch {
  return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
}

const parsed = contactSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    {
      error: "Invalid fields",
      errors: parsed.error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

const { name, email, message, website } = parsed.data;
```

Use `parsed.data` for every subsequent read; do not destructure the raw body.

3. Honeypot: if `website` is non-empty, return `200` with
   `{ message: "Message sent successfully" }` **without** writing to the database
   or sending mail.
4. Rate limit by IP:

```ts
const forwarded = request.headers.get("x-forwarded-for") ?? "";
const ip = forwarded.split(",")[0]?.trim() || "unknown";
const perIp = checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
const global = checkRateLimit("contact:global", 60, 60 * 60 * 1000);
if (!perIp.allowed || !global.allowed) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(perIp.retryAfterSeconds || 60) } },
  );
}
```

5. Persist the contact row.
6. Call `sendContactMail({ name, email, message })`.
7. If `!result.ok`, return `502` with `{ error: "Message saved, but email could not be sent. Please try again later." }`.
   Do not return 200. The row is already saved, so the lead is not lost.
8. On success, return 200 `{ message: "Message sent successfully" }`.
9. Never log the full body or the email address. Log only a generic error.

The handler should not use an inner `try/catch` that swallows the mail result.
The outer `catch` returns 500 for unexpected failures.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Add the honeypot to the form

In `components/landing/Contact.tsx`:

- Add `website: ""` to the `formData` state.
- Add a hidden input after the message field:

```tsx
<input
  type="text"
  name="website"
  value={formData.website}
  onChange={handleChange}
  className="hidden"
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
/>
```

- The submit body already serializes the whole state, so no other change is
  needed.
- The route's 429/502 responses currently show a generic toast because the
  component only checks `response.ok`. Keep the generic message; do not display
  the raw server error.

**Verify**: `npm run lint` → exit 0.

### Step 5: Add the route tests

Create `app/api/contact/route.test.ts`. Mock:

```ts
vi.mock("@/lib/prisma", () => ({ prisma: { contact: { create: vi.fn() } } }));
vi.mock("@/lib/brevo", () => ({ sendContactMail: vi.fn() }));
```

Import `resetRateLimit` from `@/lib/rate-limit` and call it in `beforeEach` so
tests do not leak buckets.

Cases:
1. Missing fields → 400, no DB write.
2. Invalid email (`"not-an-email"`) → 400.
3. Valid submission, mailer returns `{ ok: true }` → 200, DB write once, mailer
   called with trimmed values.
4. Valid submission, mailer returns `{ ok: false }` → 502, DB write still once.
5. Honeypot `website: "http://spam"` → 200, no DB write, mailer not called.
6. Six rapid requests from the same IP → the sixth returns 429.

Set a distinct `x-forwarded-for` per test (e.g. `"203.0.113.1"`) so buckets are
predictable. Do not use a real IP.

**Verify**: `npx vitest run app/api/contact/route.test.ts` → 6 passing tests.

### Step 6: Confirm the UI behavior manually

With the dev server and a valid Brevo configuration:
1. Submit a normal message; confirm the owner receives it and the visitor sees
   success.
2. Temporarily unset `BREVO_API_KEY` in a local `.env` (do not commit it) and
   submit; confirm the UI shows an error, not success, and the row is still
   created.
3. Submit six times quickly; confirm the sixth shows an error.

If no Brevo configuration is available, do the equivalent with the unit tests and
note that the live smoke test was skipped.

## Test plan

New file: `app/api/contact/route.test.ts` covering the six cases above.
Follow the mocking pattern in `app/api/blog/route.test.ts` (plan 003). Use
`resetRateLimit()` between tests.

Manual verification: the three UI cases in step 6.

## Done criteria

- [ ] `lib/brevo.ts` exports `sendContactMail` returning
      `{ ok: true } | { ok: false; error }`
- [ ] Owner notification goes to `MY_EMAIL || SMTP_EMAIL`; visitor is `replyTo`
- [ ] `name` and `message` are HTML-escaped in the email body
- [ ] No visitor email or message body is logged
- [ ] `app/api/contact/route.ts` returns 502 when mail fails
- [ ] `app/api/contact/route.ts` returns 429 after 5 requests per 10 minutes per IP
- [ ] Honeypot submissions return 200 without DB or mail side effects
- [ ] `npx vitest run app/api/contact/route.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Brevo's SDK does not support `replyTo` in the installed version. Check the
  installed `@getbrevo/brevo` types; if unsupported, put the visitor's email in
  the body instead and note it.
- The owner-notification address is not configured in the deployment. Report the
  missing variable; do not fall back to sending to the visitor only.
- The rate limiter needs to be shared across instances for the deployment to be
  safe. Report this; do not add Redis silently.
- A test reveals that the current form sends a different field name. Align the
  schema with the client, or STOP if the client contract is unclear.

## Maintenance notes

- The in-memory limiter resets on deploy and is per process. If the site runs
  multiple instances or serverless functions, replace it with a shared store
  (Upstash Redis, Vercel KV, or the platform WAF) and keep the same
  `checkRateLimit` interface.
- The contact row is written before the email send. If the product later decides
  that a failed email should roll back the row, change the order deliberately and
  document the tradeoff.
- Plan 020 (contact inbox) will read the rows this plan writes. Do not change the
  `Contact` model here.
- The auto-reply is best-effort. If deliverability becomes a problem, make it
  opt-in or remove it; the owner notification is the critical path.
