import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export async function GET() {
  const blogs = await prisma.blog
    .findMany({ select: { slug: true, updatedAt: true } })
    .catch(() => []);

  const staticEntries = ["", "/blogs", "/projects"].map((p) => ({
    url: absoluteUrl(p),
  }));

  const blogEntries = blogs.map((b: { slug: string; updatedAt: Date }) => ({
    url: absoluteUrl(`/blogs/${b.slug}`),
    lastModified: b.updatedAt.toISOString(),
  }));

  const allEntries = [...staticEntries, ...blogEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `
  <url>
    <loc>${entry.url}</loc>
  </url>`,
  )
  .join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
