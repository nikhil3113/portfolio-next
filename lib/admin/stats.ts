import { prisma } from "@/lib/prisma";

export type AdminCounts = {
  totalProjects: number;
  totalBlogs: number;
};

export type TopBlog = {
  id: string;
  h1: string;
  slug: string;
  views: number;
};

export type DashboardStats = AdminCounts & {
  hiddenProjects: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  topBlogs: TopBlog[];
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const [totalProjects, totalBlogs] = await Promise.all([
    prisma.project.count(),
    prisma.blog.count(),
  ]);

  return { totalProjects, totalBlogs };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalProjects,
    hiddenProjects,
    totalBlogs,
    publishedBlogs,
    viewsAggregate,
    topBlogs,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { hidden: true } }),
    prisma.blog.count(),
    prisma.blog.count({ where: { isPublished: true } }),
    prisma.blog.aggregate({ _sum: { views: true } }),
    prisma.blog.findMany({
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, h1: true, slug: true, views: true },
    }),
  ]);

  return {
    totalProjects,
    totalBlogs,
    hiddenProjects,
    publishedBlogs,
    draftBlogs: totalBlogs - publishedBlogs,
    totalViews: viewsAggregate._sum.views ?? 0,
    topBlogs,
  };
}
