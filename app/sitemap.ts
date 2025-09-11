import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const siteUrl = "https://nikchavan.com";
  const blogs = await prisma.blog
    .findMany({ select: { id: true, updatedAt: true } })
    .catch(() => []);
  const projects = await prisma.project
    .findMany({ select: { id: true, updatedAt: true } })
    .catch(() => []);

  const staticEntries = ["", "/blogs", "/projects"].map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: new Date(),
  }));

  const blogEntries = blogs.map((b) => ({
    url: `${siteUrl}/blogs/${b.id}`,
    lastModified: b.updatedAt,
  }));

  const projectEntries = projects.map((p) => ({
    url: `${siteUrl}/projects/${p.id}`,
    lastModified: p.updatedAt,
  }));

  return [...staticEntries, ...blogEntries, ...projectEntries];
}
