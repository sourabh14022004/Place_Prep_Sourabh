/**
 * app/robots.ts — Faculty Portal is an AUTHED INTERNAL APP.
 * Block all crawling; nothing here belongs in a search index.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
