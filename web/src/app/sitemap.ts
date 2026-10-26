import type { MetadataRoute } from "next";
import { fetchProjects } from "@/lib/server-fetch";

const BASE = "https://limperiam.com";

// Servi sur /sitemap.xml : l'accueil + une entrée par projet publié.
// fetchProjects() renvoie [] si l'API est injoignable, le sitemap reste valide.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await fetchProjects();
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${BASE}/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
