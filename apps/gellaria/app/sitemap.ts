import type { MetadataRoute } from "next";
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: `${baseUrl}/explore`, changeFrequency: "weekly", priority: 0.7 },
  ];
}
