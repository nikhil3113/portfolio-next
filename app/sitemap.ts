import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const siteUrl = "https://nikchavan.com";
  const blogs = await prisma.blog
    .findMany({ select: { slug: true, updatedAt: true } })
    .catch(() => []);

  const staticEntries = ["", "/blogs", "/projects"].map((p) => ({
    url: `${siteUrl}${p}`,
  }));

  const blogEntries = blogs.map((b) => ({
    url: `${siteUrl}/blogs/${b.slug}`,
    lastModified: b.updatedAt,
  }));

  return [...staticEntries, ...blogEntries];
}
