import { describe, expect, it } from "vitest";
import { sanitizeBlogHtml, stripTags } from "@/lib/blog/sanitize";

describe("sanitizeBlogHtml", () => {
  it("removes script tags but keeps safe markup", () => {
    const result = sanitizeBlogHtml("<script>alert(1)</script><p>ok</p>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>ok</p>");
  });

  it("removes images and event handlers", () => {
    const result = sanitizeBlogHtml('<img src=x onerror="alert(1)">');
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onerror");
  });

  it("removes javascript: links", () => {
    const result = sanitizeBlogHtml('<a href="javascript:alert(1)">x</a>');
    expect(result).not.toContain("javascript:");
  });

  it("keeps http links and adds noopener noreferrer", () => {
    const result = sanitizeBlogHtml(
      '<a href="https://example.com">x</a>'
    );
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("keeps language classes on code blocks", () => {
    const result = sanitizeBlogHtml(
      '<pre><code class="language-typescript">const x = 1</code></pre>'
    );
    expect(result).toContain('class="language-typescript"');
  });
});

describe("stripTags", () => {
  it("removes markup and keeps the text", () => {
    expect(stripTags("<b>Hello</b>")).toBe("Hello");
  });
});
