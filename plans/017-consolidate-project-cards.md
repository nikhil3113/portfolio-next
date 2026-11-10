# Plan 017: Consolidate project cards and right-size images

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" happens, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 6222ddd..HEAD -- components/project components/landing/Skills.tsx components/landing/Experience.tsx app/page.tsx app/projects/page.tsx types/projects.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 002 (lint gate), plan 015 (card colors are tokenized
  there; rebase after 015)
- **Category**: tech-debt / perf
- **Planned at**: commit `6222ddd`, 2026-11-10

## Why this matters

Two components export `ProjectCard` with the same six props but different
markup. The homepage imports the “Sample” 3D version under the alias
`ProjectCard`; the projects page imports the flat version. A change to image
sizing, tags, or CTA links must be made twice, and the alias hides which card a
page uses.

The same components also request images several times larger than they render:

- `SampleProjectCard` asks Cloudinary for 1000×1000 while the image renders at
  `h-40` (160px) on mobile and `h-60` (240px) on larger screens.
- `ProjectCard` asks for 500×500 for a card in an `aspect-[16/10]` container.
- `components/landing/Skills.tsx` renders 19 raw `<img>` tags pointing at
  `cdn.simpleicons.org` with no loading hint. They are below the fold and
  compete with the hero for bandwidth.
- `Experience.tsx` loads Google favicons as raw `<img>` without lazy loading.

This plan gives both cards a shared prop type, explicit names, and sizes that
match their rendered dimensions, then moves the skills icons to `next/image` so
they are lazy-loaded and optimized. It does not redesign the cards; the homepage
keeps its 3D treatment and the projects page keeps the flat grid.

## Current state

- `types/projects.ts:1-9`:

```ts
export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  siteLink: string;
  githubLink: string;
}
```

- `components/project/ProjectCard.tsx:7-14` — local `ProjectCardProps` without
  `id`; flat card with `CldImage width={500} height={500}` at `:32-33`.
- `components/project/SampleProjectCard.tsx:10-17` — the same local props; 3D
  card with `CldImage height={1000} width={1000}` at `:44-50`.
- `app/page.tsx:4` — `import { ProjectCard } from "@/components/project/SampleProjectCard";`
  and uses it at `:133-143`.
- `app/projects/page.tsx:1` — `import { ProjectCard } from "@/components/project/ProjectCard";`
  and spreads the project at `:63-65`.
- `components/landing/Skills.tsx:51-57,71-77`:

```tsx
<img
  src={`https://cdn.simpleicons.org/${skill.slug}?viewbox=auto`}
  alt={skill.name}
  className="h-10 w-10"
  height={40}
  width={40}
/>
```

- `components/landing/Experience.tsx:49-55` — raw Google favicon `<img>` with an
  `onError` fallback.
- `next.config.mjs:6-11` already allows `cdn.simpleicons.org` in
  `remotePatterns`, so `next/image` can use it without a config change.

## Commands you will need

| Purpose        | Command                 | Expected on success |
| -------------- | ----------------------- | ------------------- |
| Typecheck      | `npm run typecheck`     | exit 0              |
| Lint           | `npm run lint`          | exit 0              |
| Tests          | `npm test`              | all pass            |
| Dev smoke      | `npm run dev`           | ready on :3000      |

## Scope

**In scope**:
- `types/projects.ts`
- `components/project/ProjectCard.tsx`
- `components/project/SampleProjectCard.tsx` (rename to
  `FeaturedProjectCard.tsx`)
- `app/page.tsx`
- `app/projects/page.tsx`
- `components/landing/Skills.tsx`
- `components/landing/Experience.tsx`

**Out of scope**:
- Redesigning the card layouts or the 3D tilt effect.
- Changing the project data model or the admin form.
- Adding a carousel, lightbox, or image gallery.
- Changing `next.config.mjs` remote patterns; the icons host is already allowed.
- Optimizing the Google favicon service; it is a tiny image with a fallback.

## Git workflow

- Branch: `advisor/017-project-cards-images`
- Commits: `refactor: share project card props`, `refactor: rename featured project card`, `perf: right-size project and skill images`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add shared card props

In `types/projects.ts`, add:

```ts
export type ProjectCardData = Omit<Project, "id">;
```

Keep the `Project` interface unchanged; the admin and server actions use it.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Use the shared type in both cards

In `components/project/ProjectCard.tsx`:

- Remove the local `ProjectCardProps` interface.
- Import `ProjectCardData` from `@/types/projects`.
- Type the component as `ProjectCardData`.
- Keep the exported name `ProjectCard`.

In `components/project/SampleProjectCard.tsx`:

- Remove the local `ProjectCardProps`.
- Import `ProjectCardData`.
- Rename the file to `components/project/FeaturedProjectCard.tsx` and the export
  to `FeaturedProjectCard`.
- Keep the 3D markup and the `CardContainer`/`CardBody` structure.

Update the homepage import:

```tsx
import { FeaturedProjectCard } from "@/components/project/FeaturedProjectCard";
```

and the usage at `app/page.tsx:133`:

```tsx
<FeaturedProjectCard key={items.id ?? idx} {...items} />
```

If `Project` from `getProjects` includes `id`, prefer `key={items.id}`. The
current `map((items: Project, idx: number)` can drop `idx` if `id` is always
present. Do not change the visual output.

**Verify**: `npm run typecheck` → exit 0; `Select-String -Pattern
"SampleProjectCard"` returns no matches.

### Step 3: Right-size the card images

In `ProjectCard.tsx`, change the `CldImage` to:

```tsx
<CldImage
  src={image}
  alt={title}
  className="h-full w-full transform object-cover transition duration-200 group-hover:scale-95 group-hover:rounded-2xl"
  width={600}
  height={375}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

`600×375` matches the `aspect-[16/10]` container and the largest rendered width
(about 350–400px at common breakpoints) with a 2x allowance.

In `FeaturedProjectCard.tsx`, change the `CldImage` to:

```tsx
<CldImage
  src={image}
  alt={title}
  width={800}
  height={400}
  className="h-40 w-full rounded-xl object-cover sm:h-60 group-hover/card:shadow-xl"
  sizes="(max-width: 640px) 100vw, 480px"
/>
```

`800×400` with `sizes` lets Cloudinary/Next pick a smaller transform for the
rendered 480px card.

**Verify**: `npm run dev`, open `/` and `/projects`, inspect the image `src`
URLs in the network panel. They should request a width close to the rendered
size, not 1000px/500px. Confirm the images still fill their containers and are
not distorted.

### Step 4: Move the skills icons to next/image

In `components/landing/Skills.tsx`:

1. Add `import Image from "next/image";`
2. Replace both `<img>` blocks with:

```tsx
<Image
  src={`https://cdn.simpleicons.org/${skill.slug}?viewbox=auto`}
  alt={skill.name}
  width={40}
  height={40}
  sizes="40px"
  className="h-10 w-10"
/>
```

`next/image` lazy-loads below-the-fold images by default. Do not add `priority`.

3. The `img` elements inside the marquee are duplicated in two rows; that is
   intentional for the scroll effect. Do not deduplicate the data.

**Verify**: `npm run lint` → exit 0. If ESLint still flags `no-img-element`
elsewhere, leave the scoped disable from plan 002.

### Step 5: Lazy-load the experience favicons

In `components/landing/Experience.tsx`, add:

```tsx
loading="lazy"
decoding="async"
referrerPolicy="no-referrer"
width={24}
height={24}
```

to the raw `<img>`. Keep the `onError` fallback; do not switch to `next/image`
because the Google favicon host is not in `remotePatterns` and the fallback
behavior is already correct.

**Verify**: `npm run typecheck` and `npm run lint` → exit 0.

### Step 6: Visual and performance check

Run the dev server and check:
- `/` — the two featured cards render the 3D effect, images fill the card, tags
  and buttons are unchanged.
- `/projects` — the grid cards render at the same aspect ratio; hover scale
  still works.
- `/` skills strip — icons render at 40px and load lazily (network panel: images
  below the fold are requested after scroll).
- Resize to mobile (375px) and desktop (1440px); no layout shift or stretched
  images.
- Compare the network payload for `/` before and after; the project images should
  be smaller and the 19 icon requests should not block the initial render.

If Lighthouse is available, record the LCP and total image transfer before and
after. Do not chase a score in this plan.

## Test plan

No new automated tests; the changes are presentational and `CldImage` is a
third-party component. Existing `npm test` must pass.

Manual: the six checks in step 6.

## Done criteria

- [ ] `ProjectCardData` is shared by both cards
- [ ] The homepage imports `FeaturedProjectCard` explicitly; no
      `SampleProjectCard` references remain
- [ ] Both cards request image dimensions close to their rendered size and pass
      `sizes`
- [ ] Skills icons use `next/image` with width/height and lazy loading
- [ ] Experience favicons use `loading="lazy"` and keep the fallback
- [ ] `npm run verify` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- The two cards' props diverge while you are merging them (for example one
  starts using `hidden` or `createdAt`). Reconcile the shared type with the live
  data before proceeding.
- Cloudinary returns a noticeably worse image at the new dimensions on a
  high-DPI display. Increase the width once and note the tradeoff.
- `next/image` cannot load `cdn.simpleicons.org` because of a CSP or remote
  pattern. The host is already in `remotePatterns`; if the image optimizer still
  rejects it, report the response.
- The 3D card layout depends on the `1000×1000` intrinsic ratio. If the image
  distorts, keep the ratio with `object-cover` and adjust only the requested
  width/height, not the CSS.

## Maintenance notes

- If the project grid gains a third column at a new breakpoint, update the
  `sizes` attribute in `ProjectCard`.
- `FeaturedProjectCard` is the homepage variation; do not use it in the grid
  without checking the fixed `sm:w-[30rem]` width.
- The skills list is static. If it grows past ~30 icons, consider a sprite or
  inline SVG set instead of 30 remote requests.
- Revisit image sizes if the design changes the card aspect ratio or container
  width.
