import type { MetadataRoute } from "next";
import { industries } from "@/components/marketing/marketing-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/features", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/industries", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/demo", priority: 0.8, changeFrequency: "monthly" as const },
    {
      path: "/request-demo",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
  ];
  return [
    ...routes.map((route) => ({
      url: baseUrl + route.path,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...industries.map(({ slug }) => ({
      url: baseUrl + "/industries/" + slug,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
