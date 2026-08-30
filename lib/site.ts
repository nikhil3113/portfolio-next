const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nikchavan.dev";

export const siteUrl = configuredSiteUrl.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}
