import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/lib/site";

describe("absoluteUrl", () => {
  it("joins a path onto the configured site URL", () => {
    expect(absoluteUrl("/blogs/hello")).toMatch(/\/blogs\/hello$/);
  });

  it("keeps the root URL stable", () => {
    expect(absoluteUrl("/")).toMatch(/\/$/);
  });
});
