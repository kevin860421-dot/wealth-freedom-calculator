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
 *
 * ## 本機預覽（未到時間也想看全文）
 * 在 **開發模式**（`npm run dev`）且專案根目錄 `.env.local` 設：
 * `NEXT_PUBLIC_BLOG_PREVIEW_ALL=true`
 * 會暫時**忽略**排程，列表／首頁／內文皆當「已公開」顯示。
 * **正式站**（`NODE_ENV=production`）不會套用此變數，無需擔心誤公開。
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
    slug: "household-dividend-tax-checklist",
    /** 清明連假 4/3–4/6 後首個上班日（週二）；與（4）隔 5 日（中間為連假） */
    publishAtIso: "2026-04-07T09:30:00+08:00",
    listTitle: "存股節稅（5）｜夫妻合併申報、股利抵減上限與整戶試算",
    listDescription:
      "合併申報、股利抵減 8.5%、每戶上限與級距：雙薪與股利並存時的決策視角，附互動情境與檢核。",
    featureHomeHero: true,
    homeHeroLabel: "部落格：家庭申報與股利抵減（5）→",
    featureHomeFooter: true,
    homeFooterLabel: "家庭申報／股利（5）",
  },
  {
    slug: "etf-dividend-54c-structure",
    /** 連假前最後上班日（週四）；與（3）隔 2 日 */
    publishAtIso: "2026-04-02T09:00:00+08:00",
    listTitle: "存股節稅（4）｜ETF 配息與 54C",
    listDescription:
      "現金股利與 54C 應稅股利、收益平準金示意；對齊二代健保計入與財富自由計算機占比欄位。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "ETF 配息／54C（4）",
  },
  {
    slug: "passive-income-fire-blueprint",
    /** 與（2）隔 5 日；連假前最後一篇週間檔 */
    publishAtIso: "2026-03-31T09:30:00+08:00",
    listTitle: "存股節稅（3）｜被動收入與 FIRE：稅後現金流專業架構",
    listDescription:
      "FIRE 試算、被動收入規劃、財富自由現金流：三槓桿沙盒與專業自檢，銜接股利稅與財富自由計算機。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "被動收入／FIRE（3）",
  },
  {
    slug: "tax-overpay-blind-spot",
    /** 與（1）隔 2 日，週四上午 */
    publishAtIso: "2026-03-26T09:00:00+08:00",
    listTitle: "存股節稅（2）｜八成存股族忽略的稅後真相",
    listDescription: "你複利的是稅前還是稅後？股利課稅、分離與合併、抵減與二代健保，把實拿算回來。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "存股課稅盲點（2）",
  },
  {
    slug: "2026-dividend-tax-guide",
    publishAtIso: "2026-03-24T08:30:00+08:00",
    listTitle: "存股節稅（1）｜2026 股利抵減 8.5% 與實拿",
    listDescription: "股利課稅、合併課稅與分離課稅、二代健保與實拿試算觀念。",
    featureHomeHero: false,
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

/** 僅開發模式：略過 publishAtIso，方便本機預覽全文（見 .env.example） */
function isSchedulePreviewBypassed(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const v = process.env.NEXT_PUBLIC_BLOG_PREVIEW_ALL;
  return v === "1" || v === "true";
}

export function isBlogPostPublished(publishAtIso: string, now: Date = new Date()): boolean {
  if (isSchedulePreviewBypassed()) return true;
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
