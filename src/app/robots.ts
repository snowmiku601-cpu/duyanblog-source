import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Fail-closed indexing control.
 *
 * Only the REAL production deployment explicitly enables indexing via
 * `ALLOW_INDEXING=true` in the host env. Everywhere else — localhost, preview,
 * the Hostinger demo subdomain, unknown clones — default to a full `Disallow: /`
 * so fictional demo content is never accidentally indexed as production
 * editorial.
 *
 * Do NOT guess staging/production from domain suffixes: the flag is the source
 * of truth, so a mis-parked domain cannot silently start leaking.
 */
const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return {
      rules: [
        { userAgent: "*", disallow: "/" },
        { userAgent: "Googlebot", disallow: "/" },
      ],
      // No sitemap exposure while indexing is disabled.
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/go/", "/search"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}