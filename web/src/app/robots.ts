import type { MetadataRoute } from "next";

// Servi sur /robots.txt. L'admin et les uploads n'ont rien à faire dans l'index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/uploads"],
    },
    sitemap: "https://limperiam.com/sitemap.xml",
  };
}
