import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/seo";

describe("serializeJsonLd", () => {
  it("does not emit a closing script tag", () => {
    const output = serializeJsonLd({
      name: "</script><script>alert(1)</script>",
    });
    expect(output).not.toContain("</script>");
  });

  it("remains valid JSON after unescaping the < characters", () => {
    const value = { name: "</script>", count: 2 };
    const output = serializeJsonLd(value);
    const restored = output.replace(/\\u003c/g, "<");
    expect(JSON.parse(restored)).toEqual(value);
  });
});
