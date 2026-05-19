import type { MetadataRoute } from "next";
import { blogPostPath, getPublishedBlogPosts } from "./blog/posts/registry";

/** 動態 sitemap（App Router：app/sitemap.ts）。僅收錄乾淨路由，不含大量 query 組合。 */
export const dynamic = "force-dynamic";

const QUICK_CALCULATOR_ROUTES = [
  "quick-1",
  "quick-2",
  "quick-3",
  "quick-4",
  "quick-5",
  "quick-6",
  "quick-7",
  "quick-8",
  "quick-9",
  "quick-10",
  "quick-11",
  "quick-12",
] as const;

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteOrigin();
  const now = new Date();

  const calculatorUrls: MetadataRoute.Sitemap = QUICK_CALCULATOR_ROUTES.map((id) => ({
    url: `${baseUrl}/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogUrls: MetadataRoute.Sitemap = getPublishedBlogPosts(now).map((post) => ({
    url: `${baseUrl}${blogPostPath(post.slug)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...calculatorUrls,
    ...blogUrls,
  ];
}
