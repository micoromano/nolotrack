import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/termini"],
        disallow: ["/dashboard", "/login", "/api", "/auth"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
