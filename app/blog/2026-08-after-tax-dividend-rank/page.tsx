import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogAfterTaxRankTable } from "../blog-after-tax-rank-table";
import { BlogAfterTaxRankChrome } from "./rank-chrome";
import { AFTER_TAX_RANK_2026_08 } from "../posts/after-tax-rank-2026-08";
import {
  blogPostPath,
  getBlogPostBySlug,
  isBlogPostPublished,
  type BlogPostRegistryEntry,
} from "../posts/registry";
import styles from "./report.module.css";

export const dynamic = "force-dynamic";

const SLUG = "2026-08-after-tax-dividend-rank" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);
const H1 = "2026最新｜8月高股息配息排行！月領1萬要存幾張、成本多少？";
const DESCRIPTION =
  "截止2026/08/31。用證交所收盤價與e添富已除息金額，試算扣28%示意稅與二代健保後，平均月領一萬要多少本金。非投資建議。";

const publishedArticleMetadata: Metadata = {
  title: `${H1}｜財富自由計算機`,
  description: DESCRIPTION,
  alternates: { canonical: ARTICLE_PATH },
  openGraph: {
    title: H1,
    description: DESCRIPTION,
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
    modifiedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: H1,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export function generateMetadata(): Metadata {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return {
      title: "文章準備中｜財富自由計算機",
      description: "本篇將於指定時間公開，敬請期待。",
      robots: { index: false, follow: false },
    };
  }
  return publishedArticleMetadata;
}

function articleJsonLd() {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: H1,
        inLanguage: "zh-TW",
        datePublished: entry.publishAtIso,
        dateModified: entry.publishAtIso,
        author: {
          "@type": "Organization",
          name: AFTER_TAX_RANK_2026_08.author,
          url: origin,
        },
        publisher: {
          "@type": "Organization",
          name: "財富自由計算機",
          url: origin,
        },
        description: DESCRIPTION,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${origin}${ARTICLE_PATH}` },
        isAccessibleForFree: true,
      },
      {
        "@type": "Dataset",
        name: "2026年8月台股高股息ETF稅後實領排行",
        description: "以2026-08-31收盤價與截止日前已除息金額試算月領一萬本金。",
        temporalCoverage: "2026-08-31",
        creator: AFTER_TAX_RANK_2026_08.author,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function Published() {
  const meta = AFTER_TAX_RANK_2026_08;
  return (
    <article className={styles.page}>
      <div className={styles.wrap}>
        {articleJsonLd()}
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <p className={styles.kicker}>稅後實領月報 · 第 1 期 · 不插入小計算機文排程</p>
        <BlogAfterTaxRankChrome
          headline={H1}
          defaultYear={2026}
          defaultMonth={8}
          author={meta.author}
          asOf={meta.asOf}
        >
        <div className={styles.article}>
          <BlogAfterTaxRankTable />

          <h2>這張表在解釋什麼？</h2>
          <p>
            月配單期看起來小、季配單期看起來大。主榜取截止日前已除息各期金額的中位數（有完整近一年樣本者優先；未滿
            12 個月的列在表內註記，避免假第一）。
          </p>
          <p>
            二代健保看「持有達月領一萬張數」時，{meta.lastPayoutInflowLabel}
            有沒有超過 2 萬。沒過就是 0。
          </p>

          <h2>月領一萬要多少本金？</h2>
          <p>
            公式鎖死：先依頻率把「股息」換算成每張年現金配息（稅前），再用 120,000 除出達月領 1
            萬毛額目標的張數；本金＝張數×1,000×收盤價。排行依本金由低到高（越少越前）。主榜以近 12
            個月每期配息中位數為常態股息；缺逐期資料時回退上一期或均分期數。健保欄仍用
            {meta.lastPayoutInflowLabel}試算。
          </p>
          <Link
            id={WF_BLOG_CALCULATOR_CTA_ID}
            href="/"
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
          >
            用財富自由計算機改成你的稅與張數（另開分頁）→
          </Link>

          <h2>為什麼不用單期年化來排第一？</h2>
          <p>
            把一季配息乘 4，肥單會變成假之王。主榜用各期配息中位數，不讓單次極端值拉歪排行。
          </p>
          <h2>配息月份是除息日嗎？</h2>
          <p>
            不是。投信寫的配息月份常是評價月。這張表的最後買進日、除息日以 e添富清單為準。
          </p>
          <h2>二代健保什麼時候會扣？</h2>
          <p>
            單筆股利所得給付超過 2 萬，補充保費示意 2.11%。達標張數下單筆沒過門檻，本表顯示 0。
          </p>

          <div className={styles.disclaimer}>
            <p>
              免責聲明：報表為情境試算，非投資建議、非報稅結論。實際配息、稅、二代健保以投信公告、國稅局與健保署為準。含息總報酬可能與配息率方向不同。
            </p>
          </div>
        </div>
        </BlogAfterTaxRankChrome>
        <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
      </div>
    </article>
  );
}

export default function AfterTaxDividendRank202608Page() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Published />;
}
