import { MetadataRoute } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getAllSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/api/v1/shops/public/slugs`, { next: { revalidate: 3600 } });
    const json = await res.json();
    return (json.data || json || []).map((s: any) => s.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();
  const shopUrls = slugs.map((slug) => ({
    url: `https://weeelink.com/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    { url: "https://weeelink.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://weeelink.com/auth/login", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: "https://weeelink.com/auth/register", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...shopUrls,
  ];
}
