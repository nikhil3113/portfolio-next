import { getPublishedBlogsForSitemap } from "@/lib/action/blogs";
import { absoluteUrl } from "@/lib/site";

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const blogs = await getPublishedBlogsForSitemap();

  const staticEntries = ["", "/blogs", "/projects"].map((p) => ({
    url: absoluteUrl(p),
  }));

  const blogEntries = blogs.map((b) => ({
    url: absoluteUrl(`/blogs/${b.slug}`),
    lastModified: b.updatedAt.toISOString(),
  }));

  const allEntries = [...staticEntries, ...blogEntries];

  const entries = allEntries
    .map((entry) => {
      const lastmod =
        "lastModified" in entry && entry.lastModified
          ? `<lastmod>${entry.lastModified}</lastmod>`
          : "";
      return `  <url><loc>${escapeXml(entry.url)}</loc>${lastmod}</url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
