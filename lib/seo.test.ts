import { describe, expect, it } from "vitest";
import {
  AUTHOR_NAME,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  buildBlogTitle,
  clampDescription,
  normalizeAuthor,
  truncateAtWord,
} from "@/lib/seo";

describe("normalizeAuthor", () => {
  it("expands the short form stored in older rows", () => {
    expect(normalizeAuthor("Nikhil")).toBe(AUTHOR_NAME);
    expect(normalizeAuthor("nikhil chavan")).toBe(AUTHOR_NAME);
    expect(normalizeAuthor("  Nikhil   Chavan  ")).toBe(AUTHOR_NAME);
  });

  it("keeps a different name untouched", () => {
    expect(normalizeAuthor("Ada Lovelace")).toBe("Ada Lovelace");
  });

  it("falls back to the canonical name when empty", () => {
    expect(normalizeAuthor(null)).toBe(AUTHOR_NAME);
    expect(normalizeAuthor("   ")).toBe(AUTHOR_NAME);
  });
});

describe("truncateAtWord", () => {
  it("returns short text unchanged", () => {
    expect(truncateAtWord("Short", 10)).toBe("Short");
  });

  it("never exceeds the budget", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    expect(truncateAtWord(text, 20).length).toBeLessThanOrEqual(20);
  });

  it("cuts on a word boundary", () => {
    expect(truncateAtWord("alpha beta gamma delta", 14)).toBe("alpha beta");
    expect(truncateAtWord("alpha beta gamma delta", 16)).toBe(
      "alpha beta gamma",
    );
  });

  it("drops punctuation left by the cut", () => {
    expect(truncateAtWord("alpha beta, gamma", 11)).toBe("alpha beta");
  });
});

describe("clampDescription", () => {
  it("fits the display budget", () => {
    const long = "Next.js ".repeat(40);
    expect(clampDescription(long).length).toBeLessThanOrEqual(
      MAX_DESCRIPTION_LENGTH,
    );
  });

  it("removes the legacy site-name suffix", () => {
    expect(
      clampDescription("A short description | Full Stack Developer Portfolio"),
    ).toBe("A short description");
  });

  it("does not end on a dangling connector", () => {
    const text =
      "Ever wondered how AI chatbots like ChatGPT and Claude actually remember your conversation? Learn how AI chat memory works, what a context window is, and";
    const result = clampDescription(text);
    expect(result.endsWith(" and")).toBe(false);
    expect(result.endsWith(" is")).toBe(false);
  });

  it("handles empty input", () => {
    expect(clampDescription(null)).toBe("");
    expect(clampDescription("")).toBe("");
  });
});

describe("buildBlogTitle", () => {
  it("appends the brand when it fits", () => {
    expect(buildBlogTitle("SSR vs CSR")).toBe("SSR vs CSR | Nikhil Chavan");
  });

  it("prefers an explicit metaTitle", () => {
    expect(buildBlogTitle("A very long headline ".repeat(5), "Short title")).toBe(
      "Short title",
    );
  });

  it("stays within the title budget for a long headline", () => {
    const headline =
      "How AI Coding Tools Like Claude Code Actually Work \u2014 And How I Built My Own in Go";
    const title = buildBlogTitle(headline);
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(title).not.toContain(`${AUTHOR_NAME} | ${AUTHOR_NAME}`);
  });

  it("never repeats the brand", () => {
    const title = buildBlogTitle("LocalStorage vs. Cookies");
    expect(title.match(new RegExp(AUTHOR_NAME, "g"))).toHaveLength(1);
  });
});
