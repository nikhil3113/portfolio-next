import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { count: vi.fn() },
    blog: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAdminCounts } from "@/lib/admin/stats";

describe("getAdminCounts", () => {
  beforeEach(() => {
    vi.mocked(prisma.project.count).mockReset();
    vi.mocked(prisma.blog.count).mockReset();
  });

  it("returns both counts", async () => {
    vi.mocked(prisma.project.count).mockResolvedValue(4);
    vi.mocked(prisma.blog.count).mockResolvedValue(7);
    await expect(getAdminCounts()).resolves.toEqual({
      totalProjects: 4,
      totalBlogs: 7,
    });
  });
});
