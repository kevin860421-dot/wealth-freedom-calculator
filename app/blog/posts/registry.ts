/**
 * 部落格文章登錄（單一真相來源）
 *
 * ## 新增一篇文章時
 * 1. 在此陣列新增一筆 `BlogPostRegistryEntry`（建議新文放在陣列**上方**，列表會依此順序顯示）。
 * 2. 建立對應路由資料夾：`app/blog/<slug>/page.tsx`。
 * 3. 在該 `page.tsx` 內：
 *    - `const SLUG = "<slug>" as const`
 *    - `const entry = getBlogPostBySlug(SLUG)!`（或自行處理 undefined）
 *    - 未到 `publishAtIso`：render `<BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />`
 *    - `generateMetadata`：未公開時 `robots: { index: false, follow: false }`
 *    - 已公開：完整 SEO metadata；`ArticlePublishStamp` 用 `entry.publishAtIso`
 *
 * 未到 `publishAtIso` 時（全站自動）：
 * - `/blog` 列表不顯示該篇
 * - 首頁勾了 `featureHomeHero` / `featureHomeFooter` 的捷徑不顯示
 * - sitemap 不含該 URL
 * - 直接開 `/blog/<slug>` 只看到「準備中」頁
 */

export type BlogPostRegistryEntry = {
  /** URL 最後一段，例如 2026-dividend-tax-guide */
  slug: string;
  /** ISO 8601（建議含 +08:00）。未到時間＝不公開。 */
  publishAtIso: string;
  /** /blog 列表標題 */
  listTitle: string;
  listDescription: string;
  /** 達公開時間後，是否顯示在首頁 Hero 區連結 */
  featureHomeHero?: boolean;
  homeHeroLabel?: string;
  /** 達公開時間後，是否顯示在首頁頁尾「·」旁連結 */
  featureHomeFooter?: boolean;
  homeFooterLabel?: string;
};

export const BLOG_POST_REGISTRY: BlogPostRegistryEntry[] = [
  {
    slug: "2026-dividend-tax-guide",
    publishAtIso: "2026-03-24T08:30:00+08:00",
    listTitle: "存股節稅（1）｜2026 股利抵減 8.5% 與實拿",
    listDescription: "股利課稅、合併課稅與分離課稅、二代健保與實拿試算觀念。",
    featureHomeHero: true,
    homeHeroLabel: "部落格：2026 存股節稅與股利實拿 →",
    featureHomeFooter: true,
    homeFooterLabel: "2026 存股節稅指南",
  },
  // 下一篇範例（複製後改 slug、時間、文案即可）：
  // {
  //   slug: "your-next-post",
  //   publishAtIso: "2026-04-01T09:00:00+08:00",
  //   listTitle: "標題",
  //   listDescription: "列表簡述。",
  //   featureHomeHero: false,
  //   featureHomeFooter: false,
  // },
];

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`;
}

export function isBlogPostPublished(publishAtIso: string, now: Date = new Date()): boolean {
  const t = new Date(publishAtIso);
  if (Number.isNaN(t.getTime())) return true;
  return now >= t;
}

export function formatPublishLabel(publishAtIso: string): string {
  const d = new Date(publishAtIso);
  if (Number.isNaN(d.getTime())) return publishAtIso;
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getBlogPostBySlug(slug: string): BlogPostRegistryEntry | undefined {
  return BLOG_POST_REGISTRY.find((p) => p.slug === slug);
}

/** 已達公開時間的文章（順序同 registry，新文建議放在陣列前段） */
export function getPublishedBlogPosts(now: Date = new Date()): BlogPostRegistryEntry[] {
  return BLOG_POST_REGISTRY.filter((p) => isBlogPostPublished(p.publishAtIso, now));
}

export function getHomeHeroBlogPosts(now: Date = new Date()): BlogPostRegistryEntry[] {
  return BLOG_POST_REGISTRY.filter(
    (p) => p.featureHomeHero && isBlogPostPublished(p.publishAtIso, now),
  );
}

export function getHomeFooterBlogPosts(now: Date = new Date()): BlogPostRegistryEntry[] {
  return BLOG_POST_REGISTRY.filter(
    (p) => p.featureHomeFooter && isBlogPostPublished(p.publishAtIso, now),
  );
}
