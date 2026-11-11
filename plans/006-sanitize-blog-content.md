# Plan 006: Sanitize blog HTML and harden JSON-LD and response headers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- app/blogs app/api/blog/route.ts app/api/blog/[slug]/route.ts app/layout.tsx next.config.mjs package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 003 (Vitest harness). Plan 001 already touched
  `next.config.mjs`; rebase this plan after 001.
- **Category**: security
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Blog content is admin-authored rich text stored in MongoDB and rendered on the
public site with `dangerouslySetInnerHTML`. The Tiptap editor is only a
client-side constraint; the API accepts any HTML string, and older or imported
content may contain script, event handlers, or `javascript:` links. Because the
content is server-rendered, a stored payload executes for every reader on a
direct page load.

Two related issues are in the same rendering path:

1. **JSON-LD injection.** `app/blogs/[slug]/page.tsx` inserts
   `JSON.stringify(blogPostingLd)` into a `<script type="application/ld+json">`
   tag without escaping `<`. A `</script>` sequence in the title or meta
   description breaks out of the block. `app/layout.tsx` has the same pattern for
   the Person and WebSite schemas.
2. **Cheerio wraps the article in a full document.** The page calls
   `cheerio.load(blog.content)` and then `$.html()`. `$.html()` serializes the
   whole document, including `<html><head></head><body>`, which is then injected
   inside a `<div id="blog-content">`. That is invalid markup. Load the content
   as a fragment (`cheerio.load(content, null, false)`) and serialize with
   `$.html()`.

This plan sanitizes on write and on read (defense in depth for existing rows),
escapes JSON-LD, fixes the fragment serialization, and adds basic
response-hardening headers. The CSP is deliberately conservative because the app
loads Next.js inline scripts and PostHog/Google Analytics; the sanitizer is the
primary XSS control, not the CSP.

## Current state

- `app/api/blog/route.ts:19-46` — destructures `content`, `h1`, `metaDescription`,
  `author`, `slug`, `isPublished` and writes them directly to `prisma.blog.create`.
- `app/api/blog/[slug]/route.ts:49-88` — same for `prisma.blog.update`, including
  `newSlug`.
- `app/blogs/[slug]/page.tsx:90-104`:

```ts
const $ = cheerio.load(blog.content);
const headings = [];
$("h2, h3").each((i, el) => { /* slugify heading text, set id */ });
highlightCodeBlocks($);
const modifiedHtml = $.html();
```

- `app/blogs/[slug]/page.tsx:128-131` — JSON-LD:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
/>
```

- `app/blogs/[slug]/page.tsx:182-186` — content sink:

```tsx
<div
  id="blog-content"
  className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
  dangerouslySetInnerHTML={{ __html: modifiedHtml }}
/>
```

- `app/layout.tsx:98-107` — two JSON-LD scripts with the same raw
  `JSON.stringify`.
- `next.config.mjs` has no `headers()` function.
- `sanitize-html` is not installed. `cheerio` 1.x is installed.
- The editor (`components/TipTap.tsx`) emits paragraphs, headings h1-h3, bold,
  italic, underline, bullet/ordered lists, blockquote, links, and code blocks.
  It does not emit images, tables, iframes, or embedded scripts.

## Commands you will need

| Purpose        | Command                                                                 | Expected on success |
| -------------- | ----------------------------------------------------------------------- | ------------------- |
| Install        | `npm install sanitize-html` and `npm install -D @types/sanitize-html`    | exit 0              |
| Tests          | `npx vitest run lib/blog/sanitize.test.ts lib/seo.test.ts`               | all pass            |
| All tests      | `npm test`                                                              | all pass            |
| Typecheck      | `npm run typecheck`                                                     | exit 0              |
| Lint           | `npm run lint`                                                          | exit 0              |
| Dev smoke      | `npm run dev`                                                           | ready on :3000      |

## Scope

**In scope**:
- `package.json`, `package-lock.json` (add `sanitize-html` and its types)
- `lib/blog/sanitize.ts` (create)
- `lib/seo.ts` (create)
- `app/api/blog/route.ts`
- `app/api/blog/[slug]/route.ts`
- `app/blogs/[slug]/page.tsx`
- `app/layout.tsx`
- `next.config.mjs`
- `lib/blog/sanitize.test.ts`, `lib/seo.test.ts` (create)

**Out of scope**:
- Changing the Tiptap editor or the content model.
- A nonce-based strict CSP. This plan adds a conservative header; a strict CSP
  needs dynamic rendering and a proxy nonce, which is a separate change.
- Sanitizing project descriptions or titles. They render as React text, not
  HTML.
- Migrating existing Mongo documents. Sanitizing on read protects them without a
  migration.
- Adding a WYSIWYG preview feature (plan 022 covers draft preview).

## Git workflow

- Branch: `advisor/006-sanitize-blog-content`
- Commits: `feat: add blog html sanitizer`, `fix: sanitize blog writes and reads`,
  `fix: escape json-ld`, `chore: add response hardening headers`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install the sanitizer

```bash
npm install sanitize-html
npm install -D @types/sanitize-html
```

**Verify**: `npm ls sanitize-html` → a version in the 2.x line.

### Step 2: Create the sanitizer module

Create `lib/blog/sanitize.ts`:

```ts
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3",
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "blockquote",
  "a",
  "pre", "code", "span",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  code: ["class"],
  pre: ["class", "data-language"],
  h1: ["id"],
  h2: ["id"],
  h3: ["id"],
  span: ["class"],
};

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { a: ["http", "https", "mailto"] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
        },
      }),
    },
  });
}

export function stripTags(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
```

Notes:
- Do not allow `img`, `iframe`, `script`, `style`, `object`, or `embed`.
- Do not allow `on*` attributes; `sanitize-html` drops them by default when they
  are not in the allowlist.
- `allowedSchemes` also blocks `javascript:` and `data:` links.
- Keep `class` on `code` so the existing `language-*` highlighting still works.
- Keep `id` on headings because the TOC builds anchors from them.

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 3: Sanitize on write

In `app/api/blog/route.ts` (POST), after the required-field check and before
`prisma.blog.create`, replace the raw values:

```ts
const safeH1 = stripTags(h1);
const safeMetaDescription = stripTags(metaDescription);
const safeAuthor = stripTags(author);
const safeContent = sanitizeBlogHtml(content);
```

Write `safeH1`, `safeMetaDescription`, `safeAuthor`, `safeContent` instead of the
raw values. Leave `slug` and `isPublished` as plan 012 will validate them.

In `app/api/blog/[slug]/route.ts` (PUT), do the same for `h1`,
`metaDescription`, `author`, and `content` before `prisma.blog.update`.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Sanitize and fragment-parse on read

In `app/blogs/[slug]/page.tsx`:

1. Import `sanitizeBlogHtml` from `@/lib/blog/sanitize`.
2. Replace:

```ts
const $ = cheerio.load(blog.content);
```

with:

```ts
const safeContent = sanitizeBlogHtml(blog.content);
const $ = cheerio.load(safeContent, null, false);
```

The third argument `false` loads a fragment instead of a full document, so
`$.html()` no longer emits `<html><head><body>` wrappers.

3. Keep the heading ID loop, `highlightCodeBlocks($)`, and
   `const modifiedHtml = $.html();` as they are.
4. `generateMetadata` builds `baseDesc` from `blog.metaDescription` and strips
   tags with a regex. Use `stripTags(blog.metaDescription)` there, or leave the
   regex; it is not a security sink because React escapes `description`. Do not
   introduce `dangerouslySetInnerHTML` there.

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 5: Escape JSON-LD

Create `lib/seo.ts`:

```ts
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
```

Use it in `app/blogs/[slug]/page.tsx`:

```tsx
dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingLd) }}
```

Use it for both scripts in `app/layout.tsx` (`webSiteLd` and `jsonLd`).

**Verify**: `npx tsc --noEmit --incremental false` → exit 0.

### Step 6: Add response-hardening headers

In `next.config.mjs`, add a `headers()` function. Keep the existing `images`
config from plan 001.

```js
async headers() {
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://*.posthog.com https://*.cloudinary.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.cloudinary.com https://cdn.simpleicons.org https://www.google.com https://www.google-analytics.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.posthog.com https://www.google-analytics.com https://*.cloudinary.com",
    "frame-src 'self' https://*.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
},
```

This CSP allows the inline scripts Next.js injects, so it is not a substitute for
sanitization. It still blocks unknown external scripts, objects, and framing.
If PostHog or Google Analytics uses an additional host, the browser console will
show a CSP violation; add only the specific host and record it.

**Verify**: `npm run dev`, open `/`, `/blogs/<published slug>`, `/admin`, and the
browser console. There should be no CSP violations and no broken analytics
requests. If the contact form or image upload breaks, inspect the console before
changing the CSP.

### Step 7: Add the unit tests

Create `lib/blog/sanitize.test.ts`:

- `<script>alert(1)</script><p>ok</p>` → no `<script>`, keeps `<p>ok</p>`.
- `<img src=x onerror=alert(1)>` → no `<img>` and no `onerror`.
- `<a href="javascript:alert(1)">x</a>` → no `javascript:` href.
- `<a href="https://example.com">x</a>` → keeps the link and adds
  `rel="noopener noreferrer"`.
- `<pre><code class="language-typescript">const x = 1</code></pre>` → keeps the
  class.
- `stripTags("<b>Hello</b>")` → `Hello`.

Create `lib/seo.test.ts`:

- `serializeJsonLd({ name: "</script><script>alert(1)</script>" })` does not
  contain `</script>`.
- The output is valid JSON after replacing `\u003c` back to `<` (optional).

**Verify**: `npx vitest run lib/blog/sanitize.test.ts lib/seo.test.ts` → all
pass.

### Step 8: Manual content check

With the dev server and a published blog:

1. Open the blog page. Confirm the article renders with paragraphs, headings,
   lists, links, code blocks, and the TOC.
2. View source / inspect `#blog-content`. It must not contain `<html>`,
   `<head>`, or `<body>` wrappers.
3. Confirm the JSON-LD script parses (paste it into a JSON parser) and does not
   contain a literal `</script>`.

If no published blog exists, create a local draft with a heading, a list, a link,
and a code block, publish it, and test.

## Test plan

New files:
- `lib/blog/sanitize.test.ts` — six cases above.
- `lib/seo.test.ts` — JSON-LD escaping.

Pattern: follow `app/api/blog/route.test.ts` for Vitest style, but these are pure
functions and need no mocks.

Manual: the article rendering and JSON-LD checks in step 8.

## Done criteria

- [ ] `sanitize-html` and `@types/sanitize-html` are installed
- [ ] `lib/blog/sanitize.ts` exports `sanitizeBlogHtml` and `stripTags`
- [ ] Blog POST and PUT sanitize `h1`, `metaDescription`, `author`, and `content`
- [ ] Blog page sanitizes on read and uses `cheerio.load(..., null, false)`
- [ ] `lib/seo.ts` escapes `<` in JSON-LD; both page and layout use it
- [ ] `next.config.mjs` has the security headers and CSP
- [ ] `npx vitest run lib/blog/sanitize.test.ts lib/seo.test.ts` passes
- [ ] `npm run verify` exits 0
- [ ] No `<html>`/`<body>` wrapper in the rendered `#blog-content`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- The sanitizer strips markup that existing posts depend on (for example
  tables or images). Record the tag list and ask before widening the allowlist.
- The CSP breaks the site or analytics in a way that cannot be fixed by adding
  one specific host. Revert the CSP header to the four non-CSP headers and report.
- `cheerio.load(content, null, false)` is rejected by the installed types. Use
  `cheerio.load(content, {}, false)`; if that still fails, use
  `$("body").html()` and note the deviation.
- The blog page is statically generated and a sanitizer change requires a full
  rebuild to take effect. That is expected; run the build if the environment
  allows, otherwise note it.

## Maintenance notes

- Any new rich-text feature must be added to the sanitizer allowlist in the same
  change. A feature that the editor can produce but the sanitizer strips will
  silently lose content.
- The CSP uses `'unsafe-inline'` because Next.js injects inline scripts. If the
  project later adopts a nonce-based CSP (Next's proxy guide), remove
  `'unsafe-inline'` and update the proxy. Do not tighten it without testing
  PostHog and Google Analytics.
- Sanitizing on read is deliberate defense in depth for legacy documents. If a
  future migration sanitizes all stored content, the read-side call can be
  removed, but keep the write-side call.
- JSON-LD escaping belongs in `serializeJsonLd`; do not hand-roll
  `JSON.stringify` in new pages.
