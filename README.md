# Nikhil Chavan Portfolio

A personal portfolio and blog. Public pages showcase projects and published
articles; an authenticated admin area manages both collections.

## Stack

- [Next.js 16](https://nextjs.org) App Router with React 18 and TypeScript
- [Prisma 6](https://www.prisma.io) with MongoDB
- [NextAuth.js](https://next-auth.js.org) credentials provider (JWT sessions)
- [Cloudinary](https://cloudinary.com) for image uploads and delivery
- [Brevo](https://www.brevo.com) for transactional email
- [PostHog](https://posthog.com) for product analytics
- Tailwind CSS 3 with shadcn/ui components

## Prerequisites

- Node.js `>=20.9` (Node 22 recommended)
- A MongoDB database and connection string
- A Cloudinary cloud and API credentials
- A Brevo API key and a verified sender address for the contact form
- Optional: a PostHog project key for analytics

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in .env.local
npm run signup   # create the first admin user
npm run dev      # http://localhost:3000
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

`npm install` runs `prisma generate` so the Prisma client is ready before the
first request. `npm run signup` prompts for an email and password and writes the
first admin user to the database.

## Environment variables

Create `.env.local` from `.env.example`. Never commit it or paste real values
into the documentation.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | server | MongoDB connection string, including the database name |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL used by metadata and the sitemap; defaults to `https://nikchavan.dev` |
| `NEXTAUTH_SECRET` | server | Secret used to sign session JWTs; required in production |
| `NEXTAUTH_URL` | server | Base URL NextAuth uses for callbacks (`http://localhost:3000` in development) |
| `BREVO_API_KEY` | server | Brevo API key for contact notifications and auto-replies |
| `SMTP_EMAIL` | server | Verified sender address for outgoing email |
| `MY_EMAIL` | server | Recipient of contact notifications; defaults to `SMTP_EMAIL` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | public | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | public | Upload preset used by the image widget |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | public | Cloudinary API key sent with signature requests |
| `CLOUDINARY_API_SECRET` | server | Cloudinary secret used to sign uploads and delete assets |
| `CLOUDINARY_ALLOWED_FOLDER` | server, optional | Restricts deletions to public IDs under this folder; when unset, any valid public ID is accepted |
| `NEXT_PUBLIC_POSTHOG_KEY` | public | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | public | PostHog ingestion host; defaults to `https://eu.i.posthog.com` |

Variables prefixed with `NEXT_PUBLIC_` are embedded in the browser bundle. Treat
them as public. Everything else must stay server-side.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in development |
| `npm run build` | Production build (requires the environment above) |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint with the flat config |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run verify` | Typecheck, lint, and test in one command |
| `npm run postinstall` | Generate the Prisma client (runs automatically after install) |
| `npm run signup` | Interactively create an admin user |
| `npm run backfill:project-hidden` | Set `hidden: false` on legacy projects missing the field |
| `npm run backfill:blog-views` | Set `views: 0` on legacy blogs with null views |

The backfill scripts issue one-off MongoDB updates. Back up the database and run
them only against the intended environment; do not run them repeatedly as part
of normal deploys.

## Admin

Sign in at `/auth/signin`. The dashboard lives at `/admin` and links to the
project and blog tables and create forms.

There is no public signup form. The first admin is created with
`npm run signup`, which asks for an email and password and stores a bcrypt hash.

## Verification

Run the full local gate:

```bash
npm run verify
```

`npm run build` needs `DATABASE_URL` and network access for Google Fonts. The
unit suite does not need a database; route and helper tests mock Prisma where
needed.

## Content and uploads

Projects and blog posts store their images on Cloudinary. The upload widget in
the admin forms requests a signature from
`/api/sign-cloudinary-params`, which requires an authenticated admin session.
The same endpoint deletes an image when an admin removes one. Blog HTML is
sanitized on the server before it is stored.
