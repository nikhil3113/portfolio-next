# Plan 011: Throttle login attempts and use async bcrypt

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- lib/auth.ts lib/rate-limit.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 005 (`lib/rate-limit.ts`), plan 003 (tests)
- **Category**: security
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

The admin sign-in has no attempt limit. The single admin account can be guessed
online indefinitely, with no backoff, lockout, or alert. The password comparison
also uses `bcrypt.compareSync`, which blocks the Node.js event loop for the
duration of the hash on every attempt. A burst of concurrent login requests
serializes CPU work and can stall unrelated requests on the same instance.

This plan moves credential verification into a testable module, adds per-email
and per-IP attempt limits with a short lockout, switches to `bcrypt.compare`, and
performs a dummy hash comparison when the email is unknown to reduce timing
enumeration. It does not change the NextAuth session shape or the sign-in UI.

## Current state

- `lib/auth.ts:24-52`:

```ts
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;
  try {
    const { email, password } = credentials;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return null;
    return { id: user.id, email: user.email };
  } catch (error) {
    console.error("Error during authorization:", error);
    return null;
  }
}
```

- `lib/auth.ts:55-58` — JWT session strategy, `NEXTAUTH_SECRET`.
- `lib/rate-limit.ts` is created in plan 005 with `checkRateLimit(key, limit,
  windowMs)` and `resetRateLimit()`.
- `prisma/schema.prisma:17-21` — one `User` model with `email @unique` and a
  bcrypt `password` hash.
- The sign-in page (`app/auth/signin/page.tsx:55-65`) shows a generic "Invalid
  credentials" message; it does not need to know whether the account is locked.

## Commands you will need

| Purpose        | Command                                          | Expected on success |
| -------------- | ------------------------------------------------ | ------------------- |
| Tests          | `npx vitest run lib/verify-credentials.test.ts`   | all pass            |
| All tests      | `npm test`                                       | all pass            |
| Typecheck      | `npm run typecheck`                              | exit 0              |
| Lint           | `npm run lint`                                   | exit 0              |
| Generate hash  | `node -e "console.log(require('bcryptjs').hashSync('not-the-password',10))"` | one bcrypt hash |

## Scope

**In scope**:
- `lib/verify-credentials.ts` (create)
- `lib/auth.ts`
- `lib/rate-limit.ts` (extend `resetRateLimit` to accept an optional key)
- `lib/verify-credentials.test.ts` (create)

**Out of scope**:
- Changing the sign-in UI, the NextAuth provider, or the session callbacks.
- Adding MFA, email OTP, or password reset.
- Migrating to NextAuth v5 / Auth.js.
- A distributed rate limiter. The in-memory limiter is the same one used by the
  contact form; replace it later if the deployment needs multiple instances.

## Git workflow

- Branch: `advisor/011-harden-login`
- Commits: `refactor: extract credential verification`, `fix: throttle failed logins and use async bcrypt`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extend the rate limiter with a per-key reset

In `lib/rate-limit.ts` (from plan 005), change:

```ts
export function resetRateLimit() {
  buckets.clear();
}
```

to:

```ts
export function resetRateLimit(key?: string) {
  if (key) {
    buckets.delete(key);
    return;
  }
  buckets.clear();
}
```

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Create the testable verifier

Create `lib/verify-credentials.ts`:

```ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 20;

// Generate this once with:
// node -e "console.log(require('bcryptjs').hashSync('not-the-password',10))"
const DUMMY_HASH = "<paste the generated hash here>";

export type CredentialResult =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; reason: "invalid" | "locked" };

export async function verifyCredentials(
  rawEmail: string,
  password: string,
  ip: string,
): Promise<CredentialResult> {
  const email = rawEmail.trim().toLowerCase();
  const emailKey = `login:email:${email}:${ip}`;
  const ipKey = `login:ip:${ip}`;

  const emailLimit = checkRateLimit(emailKey, MAX_ATTEMPTS, WINDOW_MS);
  const ipLimit = checkRateLimit(ipKey, MAX_ATTEMPTS_PER_IP, WINDOW_MS);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    return { ok: false, reason: "locked" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Keep the response time close to a real comparison.
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { ok: false, reason: "invalid" };
  }

  resetRateLimit(emailKey);
  return { ok: true, user: { id: user.id, email: user.email } };
}
```

Notes:
- The dummy hash must be a real bcrypt hash; otherwise `compare` returns false
  immediately and the timing mitigation does nothing.
- Do not log the email or password.
- The email lookup uses the normalized lower-case address. The signup script
  stores the address as entered; if an existing admin was created with uppercase
  characters, the lookup will fail. Check the database or normalize at signup in
  plan 019. If the existing admin email contains uppercase characters, STOP and
  report before changing behavior.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Rewire NextAuth `authorize`

In `lib/auth.ts`:

1. Remove the `prisma` and `bcrypt` imports.
2. Import `verifyCredentials`.
3. Replace the `authorize` body:

```ts
async authorize(credentials, req) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const forwarded = req?.headers?.["x-forwarded-for"];
  const ip =
    typeof forwarded === "string" && forwarded.length > 0
      ? forwarded.split(",")[0].trim()
      : "unknown";

  const result = await verifyCredentials(
    credentials.email,
    credentials.password,
    ip,
  );

  return result.ok ? result.user : null;
}
```

Keep the provider, `pages`, `secret`, `session`, and callbacks unchanged.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Add the verifier tests

Create `lib/verify-credentials.test.ts`. Mock Prisma:

```ts
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
```

Import `{ prisma }`, `{ verifyCredentials }`, and `resetRateLimit`.

Create a real hash in `beforeAll`:

```ts
import bcrypt from "bcryptjs";
const passwordHash = bcrypt.hashSync("correct-password", 4);
```

Four rounds keeps tests fast; the verifier does not care about the cost factor.

Cases:
1. Valid email/password returns `{ ok: true }` with the user id/email.
2. Wrong password returns `{ ok: false, reason: "invalid" }`.
3. Unknown email returns `{ ok: false, reason: "invalid" }` and still performs a
   bcrypt comparison (hard to assert directly; at minimum assert it does not
   throw and returns promptly).
4. Five failed attempts for the same email/IP, then a sixth with the correct
   password returns `{ ok: false, reason: "locked" }`.
5. A successful login resets the email bucket: four failures, then success,
   then four more failures are still allowed.
6. Email is normalized: `"ADMIN@Example.com"` looks up
   `"admin@example.com"`.

Call `resetRateLimit()` in `beforeEach` and use a unique IP per test.

**Verify**: `npx vitest run lib/verify-credentials.test.ts` → 6 passing tests.

### Step 5: Manual lockout check

With a local database and admin user:
1. Sign in with the correct password; confirm success.
2. Sign out and enter a wrong password five times; the sixth attempt must still
   show the generic "Invalid credentials" message (not a different error).
3. Enter the correct password within the lockout window; it must also be
   rejected. Wait for the window or clear the process to reset.
4. Restart the dev server and confirm the correct password works again.

Do not test against the production database.

## Test plan

New file: `lib/verify-credentials.test.ts` covering the six cases above.
Use `resetRateLimit()` between tests.

Manual: the four lockout checks in step 5.

## Done criteria

- [ ] `lib/verify-credentials.ts` exports `verifyCredentials`
- [ ] `bcrypt.compare` is used; `compareSync` no longer appears in `lib/`
- [ ] Five failed attempts per email/IP within 15 minutes lock further attempts
- [ ] Per-IP limit of 20 attempts per 15 minutes applies
- [ ] Successful login resets the email bucket
- [ ] Unknown email still performs a dummy bcrypt comparison
- [ ] `npx vitest run lib/verify-credentials.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- The existing admin email in the database contains uppercase characters and the
  normalized lookup would break sign-in. Report before changing the lookup.
- The deployment already has platform-level rate limiting that makes this
  redundant. Report the mechanism; do not add a second limiter blindly.
- The lockout can lock out the legitimate admin with no recovery path. Add a
  documented recovery (restart clears the in-memory bucket) and note it.
- NextAuth's `authorize` request object does not expose headers in this version.
  Fall back to `ip = "unknown"`; the email bucket still limits attempts.

## Maintenance notes

- The limiter is in-memory: a restart clears lockouts, and each serverless
  instance has its own counters. For a multi-instance deployment, move it to a
  shared store and keep the same `checkRateLimit` interface.
- If the admin email is changeable, normalize it at write time (plan 019) and
  keep the lookup normalized.
- Do not return different error messages for "unknown email", "wrong password",
  and "locked" to the client. The sign-in page already collapses them; keep it
  that way.
- A future MFA or password-reset flow must use the same limiter for its token
  endpoints.
