import type { Metadata } from "next";
import Link from "next/link";
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
