import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/features",
        "/industries",
        "/pricing",
        "/demo",
        "/request-demo",
      ],
      disallow: ["/app/", "/api/", "/login", "/register", "/invitation/"],
    },
    sitemap: baseUrl + "/sitemap.xml",
    host: baseUrl,
  };
}
