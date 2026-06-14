import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";
import { blogPostPath, getPublishedBlogPosts } from "./blog/posts/registry";
import { getPublishedQuick1ExclusivePosts } from "./mini-blog/posts/quick1-exclusive";

/** 動態 sitemap（App Router：app/sitemap.ts）。僅收錄乾淨路由，不含 query 組合（如 /quick-4?code=）。 */
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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteOrigin();
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

  const miniBlogUrls: MetadataRoute.Sitemap = getPublishedQuick1ExclusivePosts(now).map((post) => {
    const publishedAt = new Date(post.publishAtIso);
    return {
      url: `${baseUrl}/mini-blog/${post.slug}`,
      lastModified: Number.isNaN(publishedAt.getTime()) ? now : publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    };
  });

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
    {
      url: `${baseUrl}/mini-blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...calculatorUrls,
    ...blogUrls,
    ...miniBlogUrls,
  ];
}
