import { prisma } from "@/lib/prisma";

export type AdminCounts = {
  totalProjects: number;
  totalBlogs: number;
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const [totalProjects, totalBlogs] = await Promise.all([
    prisma.project.count(),
    prisma.blog.count(),
  ]);

  return { totalProjects, totalBlogs };
}
