export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Display limits used across metadata so titles and descriptions stay in the SERP. */
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 155;

/** Canonical author name. Blog rows may store a short form ("Nikhil"). */
export const AUTHOR_NAME = "Nikhil Chavan";

export function normalizeAuthor(value: string | null | undefined): string {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) return AUTHOR_NAME;
  if (/^nikhil(\s+chavan)?$/i.test(clean)) return AUTHOR_NAME;
  return clean;
}

/** Cut on a word boundary and trim trailing punctuation left by the cut. */
export function truncateAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice.slice(0, max);

  return cut.replace(/[\s,;:.!?\-–—]+$/, "");
}

const DANGLING_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "why",
  "with",
]);

/**
 * Drop the legacy site-name suffix stored in some rows, fit the remainder into
 * the display budget, and avoid ending on a dangling connector
 * ("… context window is, and").
 */
export function clampDescription(
  text: string | null | undefined,
  max = MAX_DESCRIPTION_LENGTH,
): string {
  if (!text) return "";

  const clean = text
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*Full Stack Developer Portfolio\s*$/i, "")
    .trim();

  const words = truncateAtWord(clean, max).split(" ");
  while (words.length > 4) {
    const last = words[words.length - 1]
      .toLowerCase()
      .replace(/[\s,;:.!?\-–—]+$/, "");
    if (!DANGLING_WORDS.has(last)) break;
    words.pop();
  }

  return words.join(" ").replace(/[\s,;:.!?\-–—]+$/, "");
}

/**
 * Drop a trailing subtitle ("— And How I Built…") when the headline is too long
 * for a SERP title. Only separators past the 20th character are used so short
 * headlines like "SSR vs CSR: What's the Difference?" keep their subtitle.
 */
function shortenHeadline(headline: string, max: number): string {
  for (const separator of [" — ", " – ", " | ", ": ", " - "]) {
    const index = headline.indexOf(separator);
    if (index >= 20) {
      const head = headline.slice(0, index).trim();
      if (head.length <= max) return head;
    }
  }

  return truncateAtWord(headline, max);
}

/**
 * Build a title that fits the 60-character budget. The brand is appended only
 * when it fits; otherwise the headline stands alone rather than being cut
 * mid-brand (which is what produced "… | Nikhil Chavan | Nikhil Chavan").
 */
export function buildBlogTitle(
  headline: string,
  metaTitle?: string | null,
): string {
  if (metaTitle?.trim()) return truncateAtWord(metaTitle, MAX_TITLE_LENGTH);

  const full = `${headline} | ${AUTHOR_NAME}`;
  if (full.length <= MAX_TITLE_LENGTH) return full;

  const shortened = shortenHeadline(headline, MAX_TITLE_LENGTH);
  const branded = `${shortened} | ${AUTHOR_NAME}`;
  return branded.length <= MAX_TITLE_LENGTH ? branded : shortened;
}
