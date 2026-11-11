import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { count: vi.fn() },
    blog: { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAdminCounts, getDashboardStats } from "@/lib/admin/stats";

const projectCount = vi.mocked(prisma.project.count);
const blogCount = vi.mocked(prisma.blog.count);
const blogAggregate = vi.mocked(prisma.blog.aggregate);
const blogFindMany = vi.mocked(prisma.blog.findMany);

describe("getAdminCounts", () => {
  beforeEach(() => {
    projectCount.mockReset();
    blogCount.mockReset();
  });

  it("returns both counts", async () => {
    projectCount.mockResolvedValue(4);
    blogCount.mockResolvedValue(7);
    await expect(getAdminCounts()).resolves.toEqual({
      totalProjects: 4,
      totalBlogs: 7,
    });
  });
});

describe("getDashboardStats", () => {
  beforeEach(() => {
    projectCount.mockReset();
    blogCount.mockReset();
    blogAggregate.mockReset();
    blogFindMany.mockReset();
  });

  it("returns content stats and the top posts", async () => {
    projectCount
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3); // hidden
    blogCount
      .mockResolvedValueOnce(8) // total
      .mockResolvedValueOnce(6); // published
    blogAggregate.mockResolvedValue({ _sum: { views: 42 } } as never);
    blogFindMany.mockResolvedValue([
      { id: "b1", h1: "Top", slug: "top", views: 20, isPublished: true },
      {
        id: "b2",
        h1: "Draft post",
        slug: "draft-post",
        views: 10,
        isPublished: false,
      },
    ] as never);

    const stats = await getDashboardStats();

    expect(stats.hiddenProjects).toBe(3);
    expect(stats.draftBlogs).toBe(2);
    expect(stats.totalViews).toBe(42);
    expect(stats.topBlogs).toHaveLength(2);
    expect(stats.topBlogs[0]).toEqual({
      id: "b1",
      h1: "Top",
      slug: "top",
      views: 20,
      isPublished: true,
    });
    expect(stats.topBlogs[1]).toEqual({
      id: "b2",
      h1: "Draft post",
      slug: "draft-post",
      views: 10,
      isPublished: false,
    });
  });

  it("queries hidden projects, published blogs, and the top five posts", async () => {
    projectCount.mockResolvedValue(0);
    blogCount.mockResolvedValue(0);
    blogAggregate.mockResolvedValue({ _sum: { views: 0 } } as never);
    blogFindMany.mockResolvedValue([] as never);

    await getDashboardStats();

    expect(projectCount).toHaveBeenNthCalledWith(2, {
      where: { hidden: true },
    });
    expect(blogCount).toHaveBeenNthCalledWith(2, {
      where: { isPublished: true },
    });
    expect(blogAggregate).toHaveBeenCalledWith({ _sum: { views: true } });
    expect(blogFindMany).toHaveBeenCalledWith({
      orderBy: { views: "desc" },
      take: 5,
      select: {
        id: true,
        h1: true,
        slug: true,
        views: true,
        isPublished: true,
      },
    });
  });

  it("treats a null view sum as zero", async () => {
    projectCount.mockResolvedValue(4);
    blogCount.mockResolvedValue(0);
    blogAggregate.mockResolvedValue({ _sum: { views: null } } as never);
    blogFindMany.mockResolvedValue([] as never);

    const stats = await getDashboardStats();

    expect(stats.totalViews).toBe(0);
  });
});
