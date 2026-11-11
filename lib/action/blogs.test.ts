import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { blog: { findUnique: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getBlogBySlugForPreview } from "@/lib/action/blogs";

const findUniqueMock = vi.mocked(prisma.blog.findUnique);

describe("getBlogBySlugForPreview", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("fetches a draft without the published filter", async () => {
    findUniqueMock.mockResolvedValue({
      id: "b1",
      slug: "draft",
      isPublished: false,
    } as never);

    await expect(getBlogBySlugForPreview("draft")).resolves.toMatchObject({
      id: "b1",
      slug: "draft",
      isPublished: false,
    });
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { slug: "draft" } });
  });

  it("returns null and logs a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    findUniqueMock.mockRejectedValue(new Error("database down"));

    await expect(getBlogBySlugForPreview("draft")).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "Error fetching blog preview:",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
