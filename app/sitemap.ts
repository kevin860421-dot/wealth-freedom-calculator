import type { MetadataRoute } from "next";
import { blogPostPath, getPublishedBlogPosts } from "./blog/posts/registry";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];
  for (const post of getPublishedBlogPosts(now)) {
    entries.push({
      url: `${base}${blogPostPath(post.slug)}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }
  return entries;
}
