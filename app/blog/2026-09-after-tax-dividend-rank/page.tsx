import type { Metadata } from "next";
import Link from "next/link";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogAfterTaxRankTable } from "../blog-after-tax-rank-table";
import { BlogAfterTaxRankChrome } from "../2026-08-after-tax-dividend-rank/rank-chrome";
import { AfterTaxRankDevOutlet } from "../after-tax-rank-dev-outlet";
import {
  AFTER_TAX_RANK_2026_08_ETF,
  AFTER_TAX_RANK_2026_08_ETF_AUDITED,
  AFTER_TAX_RANK_2026_08_STOCK,
} from "../posts/after-tax-rank-2026-08";
import { AFTER_TAX_RANK_2026_09_ETF } from "../posts/after-tax-rank-2026-09";
import {
  blogPostPath,
  getBlogPostBySlug,
  isBlogPostPublished,
  type BlogPostRegistryEntry,
} from "../posts/registry";
import {
  afterTaxLastBasisTabLabel,
  afterTaxLastPayoutInflowLabel,
  afterTaxRankPeriodMonth,
  afterTaxTtmBasisTabLabel,
  AFTER_TAX_RANK_LATEST_SLUG,
} from "@/lib/blog/after-tax-rank-series";
import styles from "../2026-08-after-tax-dividend-rank/report.module.css";

export const dynamic = "force-dynamic";

const SLUG = "2026-09-after-tax-dividend-rank" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);
const H1 = "2026最新｜9月高股息配息排行！月領1萬要存幾張、成本多少？";
const DESCRIPTION =
  "截止2026/09/30。用證交所收盤價，配息沿用8月已核對序列並補上9月除息，試算二代健保後平均月領一萬要多少本金。非投資建議。";

const RANK_MONTH = afterTaxRankPeriodMonth("2026-09");
const AUDITED_TICKERS = new Set(AFTER_TAX_RANK_2026_08_ETF_AUDITED.map((row) => row.ticker));

const SEPTEMBER_ISSUE = {
  meta: {
    periodId: "2026-09",
    periodTitle: "2026年9月",
    rankingMonth: RANK_MONTH,
    lastBasisTabLabel: afterTaxLastBasisTabLabel(RANK_MONTH),
    ttmBasisTabLabel: afterTaxTtmBasisTabLabel(),
    lastPayoutInflowLabel: afterTaxLastPayoutInflowLabel(RANK_MONTH),
    asOf: "2026-09-30",
    author: "財富自由計算機編輯部",
    canonicalPath: ARTICLE_PATH,
    priceSource: "臺灣證券交易所 每日收盤行情，收盤 2026-09-30",
    dividendSource: "8月已核對配息，並補上證交所 ETF 收益分配中除息日為 2026-09-01 至 2026-09-30 者",
    ttmSource: "近一年中位數沿用8月已核對樣本；9月新除息有分期樣本者已併入",
  },
  etf: AFTER_TAX_RANK_2026_09_ETF,
  etfAudited: AFTER_TAX_RANK_2026_09_ETF.filter((row) => AUDITED_TICKERS.has(row.ticker)),
  stock: [],
  sectionReleaseIso: {
    "total-rank": "2026-10-01T09:30:00+08:00",
    "etf-focus-pk": "2026-10-08T09:30:00+08:00",
    "stock-rent": "2026-10-15T09:30:00+08:00",
    "ex-div-preview": "2026-10-22T09:30:00+08:00",
  },
  comparisonNote: "上期排行是2026年8月的名次。",
  prior: {
    etf: AFTER_TAX_RANK_2026_08_ETF,
    etfAudited: AFTER_TAX_RANK_2026_08_ETF_AUDITED,
    stock: AFTER_TAX_RANK_2026_08_STOCK,
  },
  asideNote: "00919 這一期上一期是 9/16 除息 1.10 元，最後買進日 9/15，發放日 10/15。",
  augustExDivCopy: false as const,
};

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

export default function AfterTaxDividendRank202609Page() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return (
    <article className={styles.page}>
      <div className={styles.wrap}>
        <p className={styles.backRow}>
          <Link href="/blog" className={styles.back}>
            ← 部落格列表
          </Link>
          <Link href={blogPostPath(AFTER_TAX_RANK_LATEST_SLUG)} className={styles.back}>
            固定入口：月領1萬要多少本金
          </Link>
        </p>
        <p className={styles.kicker}>稅後實領月報 · 第 2 期 · 不插入小計算機文排程</p>
        <BlogAfterTaxRankChrome
          headline={H1}
          defaultYear={2026}
          defaultMonth={9}
          author={SEPTEMBER_ISSUE.meta.author}
          asOf={SEPTEMBER_ISSUE.meta.asOf}
        >
          <div className={styles.article}>
            <BlogAfterTaxRankTable issue={SEPTEMBER_ISSUE} />
            <div className={styles.disclaimer}>
              <p>
                免責聲明：報表為情境試算，非投資建議、非報稅結論。實際配息、稅、二代健保以投信公告、國稅局與健保署為準。含息總報酬可能與配息率方向不同。
              </p>
            </div>
            <AfterTaxRankDevOutlet />
          </div>
        </BlogAfterTaxRankChrome>
      </div>
    </article>
  );
}
