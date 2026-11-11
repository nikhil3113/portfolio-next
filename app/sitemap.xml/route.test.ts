import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://nikchavan.dev";
});

vi.mock("@/lib/prisma", () => ({
  prisma: { blog: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/sitemap.xml/route";

const findManyMock = vi.mocked(prisma.blog.findMany);

const publishedAt = new Date("2026-11-01T10:00:00.000Z");

describe("GET /sitemap.xml", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("queries only published blogs", async () => {
    findManyMock.mockResolvedValue([
      { slug: "hello", updatedAt: publishedAt },
    ] as never);

    await GET();

    expect(findManyMock).toHaveBeenCalledWith({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("lists the published post URL", async () => {
    findManyMock.mockResolvedValue([
      { slug: "hello", updatedAt: publishedAt },
    ] as never);

    const response = await GET();
    const xml = await response.text();

    expect(xml).toContain(
      "<loc>https://nikchavan.dev/blogs/hello</loc>",
    );
  });

  it("emits lastmod for blog entries", async () => {
    findManyMock.mockResolvedValue([
      { slug: "hello", updatedAt: publishedAt },
    ] as never);

    const response = await GET();
    const xml = await response.text();

    expect(xml).toContain(
      "<lastmod>2026-11-01T10:00:00.000Z</lastmod>",
    );
  });

  it("keeps the static sitemap when the database fails", async () => {
    findManyMock.mockRejectedValue(new Error("database down"));

    const response = await GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(xml).toContain("<loc>https://nikchavan.dev/</loc>");
    expect(xml).toContain("<loc>https://nikchavan.dev/blogs</loc>");
    expect(xml).toContain("<loc>https://nikchavan.dev/projects</loc>");
    expect(xml).not.toContain("<lastmod>");
  });

  it("escapes ampersands in URLs", async () => {
    findManyMock.mockResolvedValue([
      { slug: "a&b", updatedAt: publishedAt },
    ] as never);

    const response = await GET();
    const xml = await response.text();

    expect(xml).toContain("a&amp;b");
    expect(xml).not.toContain("a&b");
  });
});
