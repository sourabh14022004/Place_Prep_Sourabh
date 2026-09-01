/**
 * app/robots.ts — Admin Console is an AUTHED INTERNAL APP.
 * Block ALL crawling. This is the single most important robots rule in the
 * product — admin URLs must never appear in search results.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
