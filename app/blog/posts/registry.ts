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
 * 未到 `publishAtIso` 時（全站自動）—**基本邏輯：不對外露出**
 * - `/blog` 列表不顯示該篇
 * - 首頁 Hero 第一篇連結不出現；`featureHomeFooter` 捷徑不出現
 * - **文內系列互相引用**請用 `BlogPublishedLink`，未到時間不渲染成連結（避免導向「準備中」）
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
  /** 達公開時間後，可搭配 `getHomeHeroBlogPosts()` 多篇主打；首頁目前改為只連「第一篇」，此旗標可維持 false */
  featureHomeHero?: boolean;
  /** 首頁 Hero 連結文案（僅第一篇使用時可填，未填則用 listTitle） */
  homeHeroLabel?: string;
  /** 達公開時間後，是否顯示在首頁頁尾「·」旁連結 */
  featureHomeFooter?: boolean;
  homeFooterLabel?: string;
};

export const BLOG_POST_REGISTRY: BlogPostRegistryEntry[] = [
  // ─────────────────────────────────────────────────────────
  // 實戰對決（19）～（30）：消費／投資／崩盤／退休路徑
  // ─────────────────────────────────────────────────────────
  {
    slug: "delay-gratification-retirement-speed",
    publishAtIso: "2026-05-02T21:00:00+08:00",
    listTitle: "實戰對決（30）｜延遲享樂不是苦行，是加速退休自由",
    listDescription: "你少買的不是快樂，而是把現金流換成未來更大的選擇權。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（30）",
  },
  {
    slug: "emergency-fund-vs-invest-order",
    publishAtIso: "2026-05-02T20:00:00+08:00",
    listTitle: "實戰對決（29）｜先存緊急預備金，還是先全力投資？",
    listDescription: "沒有安全墊的投資，通常在第一個意外來時就中斷。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（29）",
  },
  {
    slug: "split-payment-illusion-cost",
    publishAtIso: "2026-05-02T19:00:00+08:00",
    listTitle: "實戰對決（28）｜分期讓你比較敢買，還是比較敢忽略成本？",
    listDescription: "每月看起來不痛，但總成本與機會成本常比你想像更高。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（28）",
  },
  {
    slug: "retire-by-40-starting-25",
    publishAtIso: "2026-05-02T18:00:00+08:00",
    listTitle: "實戰對決（27）｜25 歲開始，40 歲退休真的可行嗎？",
    listDescription: "可行與否取決於投入率、現金流紀律與你能否熬過崩盤。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（27）",
  },
  {
    slug: "downpayment-vs-all-in-index",
    publishAtIso: "2026-05-02T17:00:00+08:00",
    listTitle: "實戰對決（26）｜頭期款先留著，還是全數投入大盤？",
    listDescription: "當資金有明確時程，流動性常比報酬率更重要。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（26）",
  },
  {
    slug: "monthly-10000-after-10-years",
    publishAtIso: "2026-05-02T16:00:00+08:00",
    listTitle: "實戰對決（25）｜每個月存一萬，十年後到底差多少？",
    listDescription: "答案不只看年化，還要把稅費、扣除與手續費算進去。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（25）",
  },
  {
    slug: "buy-now-pay-later-vs-etf",
    publishAtIso: "2026-05-02T15:00:00+08:00",
    listTitle: "實戰對決（24）｜買東西用分期很聰明？先看你少掉多少 ETF 部位",
    listDescription: "分期不一定錯，但它會先綁住你的資金機動性。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（24）",
  },
  {
    slug: "small-spending-800-compound",
    publishAtIso: "2026-05-02T14:00:00+08:00",
    listTitle: "實戰對決（23）｜小資族的 800 元剁手術：從手搖到複利",
    listDescription: "每天 800 看似不痛，拉到長期就是退休速度的差距。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（23）",
  },
  {
    slug: "rent-vs-buy-asset-truth",
    publishAtIso: "2026-05-02T13:00:00+08:00",
    listTitle: "實戰對決（22）｜不買房真的會比較有錢？數據告訴你真相",
    listDescription: "租屋與買房不是立場戰，核心是現金流壓力與流動性。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（22）",
  },
  {
    slug: "market-crash-20000-bankrupt",
    publishAtIso: "2026-05-02T12:00:00+08:00",
    listTitle: "實戰對決（21）｜如果大盤跌回兩萬點，我會破產嗎？",
    listDescription: "先看每期扣除後還剩多少，再談你扛不扛得住崩盤。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（21）",
  },
  {
    slug: "mercedes-monthly-10000-cost",
    publishAtIso: "2026-05-02T11:00:00+08:00",
    listTitle: "實戰對決（20）｜學弟的賓士夢：月付一萬的背後是千萬代價",
    listDescription: "每月一萬看起來不重，拉到二十年會變成巨大的機會成本。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（20）",
  },
  {
    slug: "duel-iphone15-buy-or-invest",
    publishAtIso: "2026-05-02T10:00:00+08:00",
    listTitle: "實戰對決（19）｜【對決】換 iPhone 15 是痛還是致命？",
    listDescription: "用分期與定投對照，四年後差距不是感覺，是資產數字。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（19）",
  },

  // ─────────────────────────────────────────────────────────
  // 痛點短評（6）～（12）：短篇、焦慮點拆解（買不起房／勞保／中年失業）
  // ─────────────────────────────────────────────────────────
  {
    slug: "painpoint-12-stop-playing-pretend",
    publishAtIso: "2026-04-30T09:00:00+08:00",
    listTitle: "痛點短評（17）｜別再假裝「沒事」",
    listDescription: "焦慮不是問題；不敢算清楚才是。把風險攤開，你才有選擇權。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（17）",
  },
  {
    slug: "painpoint-18-parent-care-cost",
    publishAtIso: "2026-05-02T09:00:00+08:00",
    listTitle: "痛點短評（18）｜長照費用最殘酷的是「不確定」",
    listDescription: "不是每月多少錢最可怕，是你不知道要燒多久。把成本與期間寫成區間，才有選擇權。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（18）",
  },
  {
    slug: "painpoint-11-middle-age-job-loss",
    publishAtIso: "2026-04-28T09:30:00+08:00",
    listTitle: "痛點短評（16）｜中年失業最殘酷的不是收入歸零",
    listDescription: "是現金流斷掉時，你才發現自己沒有『可延展』的備案。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（16）",
  },
  {
    slug: "painpoint-10-labor-insurance-collapse",
    publishAtIso: "2026-04-25T09:00:00+08:00",
    listTitle: "痛點短評（15）｜勞保破產焦慮：你該做的不是轉發貼文",
    listDescription: "先把『缺口』量出來：你要補的是錢、時間，還是風險承受度？",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（15）",
  },
  {
    slug: "painpoint-9-cant-afford-house",
    publishAtIso: "2026-04-23T09:30:00+08:00",
    listTitle: "痛點短評（14）｜買不起房不是你不努力",
    listDescription: "但你更不能用『我先不算』來逃避：時間一過，成本只會更硬。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（14）",
  },
  {
    slug: "painpoint-8-inflation-is-silent-tax",
    publishAtIso: "2026-04-21T09:00:00+08:00",
    listTitle: "痛點短評（13）｜通膨是最安靜的稅",
    listDescription: "你以為你存得很穩，其實購買力在慢慢掉。焦慮感通常來自這裡。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（13）",
  },
  {
    slug: "painpoint-7-no-buffer-is-real-risk",
    publishAtIso: "2026-04-18T09:00:00+08:00",
    listTitle: "痛點短評（12）｜真正的風險不是下跌",
    listDescription: "是你沒有緩衝：一個意外，就讓你被迫在最差的時點做決策。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（12）",
  },
  {
    slug: "painpoint-6-anxiety-about-retirement",
    publishAtIso: "2026-04-16T09:30:00+08:00",
    listTitle: "痛點短評（11）｜退休焦慮其實是一種「未知成本」",
    listDescription: "你不是怕努力沒回報，你是怕『扣完還剩多少』永遠沒人講清楚。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（11）",
  },
  {
    slug: "dividend-tax-return-filing-check",
    /**（6）密集但不每天：週一 4/20 */
    publishAtIso: "2026-04-20T09:00:00+08:00",
    listTitle: "存股節稅（10）｜報稅前最後一張清單",
    listDescription: "把今年的股利、54C、抵減與二代健保，用一張表對齊到「稅後實拿」。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "報稅清單（10）",
  },
  {
    slug: "dividend-tax-credit-cap-and-timing",
    /**（9）週五 */
    publishAtIso: "2026-04-17T09:30:00+08:00",
    listTitle: "存股節稅（9）｜8.5% 抵減上限怎麼影響你",
    listDescription: "不是每一塊股利都能抵滿 8 萬；先懂上限與級距，才知道該不該糾結。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "抵減上限（9）",
  },
  {
    slug: "dividend-tax-54c-ratio-why-it-matters",
    /**（8）週三 */
    publishAtIso: "2026-04-15T09:00:00+08:00",
    listTitle: "存股節稅（8）｜54C 占比：你以為的股利，不一定都算進去",
    listDescription: "ETF 平準金、資本利得與 54C 占比，會改寫你的二代健保門檻與稅後再投入。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "54C 占比（8）",
  },
  {
    slug: "dividend-tax-nhi2-threshold-strategy",
    /**（7）週六（避開連兩天） */
    publishAtIso: "2026-04-12T09:30:00+08:00",
    listTitle: "存股節稅（7）｜二代健保 2 萬門檻：你該在意的是「哪一筆」",
    listDescription: "同樣年股利，按次數入帳會差很多：先找出你最容易踩線的那筆。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "二代健保（7）",
  },
  {
    slug: "dividend-tax-merge-vs-separate-decision",
    /**（6）週四 */
    publishAtIso: "2026-04-09T09:00:00+08:00",
    listTitle: "存股節稅（6）｜合併 vs 分離：用三個問題做決策",
    listDescription: "不用背法條：先用邊際稅率、抵減上限、二代健保把方向選對。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "合併/分離（6）",
  },
  {
    slug: "household-dividend-tax-checklist",
    /** 清明連假 4/3–4/6 後首個上班日（週二）；與（4）隔 5 日（中間為連假） */
    publishAtIso: "2026-04-07T09:30:00+08:00",
    listTitle: "存股節稅（5）｜合併申報與股利抵減",
    listDescription: "雙薪＋股利：整戶級距、每戶抵減上限，別只算個人科目。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "家庭申報／股利（5）",
  },
  {
    slug: "etf-dividend-54c-structure",
    /** 連假前最後上班日（週四）；與（3）隔 2 日 */
    publishAtIso: "2026-04-02T09:00:00+08:00",
    listTitle: "存股節稅（4）｜ETF 配息與 54C",
    listDescription: "入帳總額≠全進 54C：平準金、占比，對齊補充保費與試算表。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "ETF 配息／54C（4）",
  },
  {
    slug: "passive-income-fire-blueprint",
    /** 與（2）隔 5 日；連假前最後一篇週間檔 */
    publishAtIso: "2026-03-31T09:30:00+08:00",
    listTitle: "存股節稅（3）｜FIRE 與稅後現金流",
    listDescription: "目標用稅後、回顧別只看稅前：三槓桿沙盒＋五項自檢。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "FIRE／稅後（3）",
  },
  {
    slug: "tax-overpay-blind-spot",
    /** 延後檔期（原 3/26）；仍早於（3）3/31 */
    publishAtIso: "2026-03-30T09:00:00+08:00",
    listTitle: "存股節稅（2）｜稅後真相",
    listDescription: "複利的是稅前還稅後？課稅、抵減、二代健保，實拿先算清。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "稅後真相（2）",
  },
  {
    slug: "2026-dividend-tax-guide",
    publishAtIso: "2026-03-24T08:30:00+08:00",
    listTitle: "存股節稅（1）｜抵減 8.5% 與實拿",
    listDescription: "合併／分離、二代健保、抵減上限：實拿別只靠殖利率。",
    homeHeroLabel: "部落格：存股節稅（1）→",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "存股節稅（1）",
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
