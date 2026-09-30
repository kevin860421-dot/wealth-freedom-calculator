import type { Metadata } from "next";
import Link from "next/link";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { AFTER_TAX_RANK_2026_08_ETF } from "../posts/after-tax-rank-2026-08";
import {
  blogPostPath,
  getBlogPostBySlug,
  isBlogPostPublished,
  type BlogPostRegistryEntry,
} from "../posts/registry";
import { deriveAfterTaxRank, formatRankMoney } from "@/lib/blog/after-tax-rank";
import {
  AFTER_TAX_RANK_ISSUES,
  AFTER_TAX_RANK_LATEST_SLUG,
  rankingMonthIndex,
  type AfterTaxRankIssue,
} from "@/lib/blog/after-tax-rank-series";
import styles from "./latest.module.css";

export const dynamic = "force-dynamic";

const SLUG = AFTER_TAX_RANK_LATEST_SLUG;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);
const H1 = "月領1萬要多少本金";

type LatestIssue = {
  issue: AfterTaxRankIssue;
  entry: BlogPostRegistryEntry;
};

function latestPublishedIssue(now: Date): LatestIssue | null {
  const sorted = [...AFTER_TAX_RANK_ISSUES].sort(
    (a, b) => rankingMonthIndex(b.year, b.month) - rankingMonthIndex(a.year, a.month),
  );
  for (const issue of sorted) {
    const issueEntry = getBlogPostBySlug(issue.slug);
    if (!issueEntry || !isBlogPostPublished(issueEntry.publishAtIso, now)) continue;
    return { issue, entry: issueEntry };
  }
  return null;
}

function leadForIssue(issue: AfterTaxRankIssue) {
  if (issue.year !== 2026 || issue.month !== 8) return null;
  const top = deriveAfterTaxRank(AFTER_TAX_RANK_2026_08_ETF, "ttm")[0];
  if (!top) return null;
  return top;
}

function descriptionFor(latest: LatestIssue | null): string {
  if (!latest) return "稅後實領月報的固定入口。有最新一期時，這一頁會連過去。";
  const { issue } = latest;
  const lead = leadForIssue(issue);
  const period = `${issue.year}年${issue.month}月`;
  if (!lead) {
    return `最新一期是${period}，資料截止 ${issue.asOf}。完整排行在該期頁面。`;
  }
  return `最新一期是${period}，資料截止 ${issue.asOf}。第一名 ${lead.ticker}，月領 1 萬約需本金 ${formatRankMoney(lead.capital)} 元。完整排行在該期頁面。`;
}

export function generateMetadata(): Metadata {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return {
      title: "文章準備中｜財富自由計算機",
      description: "本篇將於指定時間公開，敬請期待。",
      robots: { index: false, follow: false },
    };
  }
  const latest = latestPublishedIssue(new Date());
  const description = descriptionFor(latest);
  return {
    title: `${H1}｜稅後實領月報最新一期｜財富自由計算機`,
    description,
    alternates: { canonical: ARTICLE_PATH },
    openGraph: {
      title: H1,
      description,
      type: "website",
      url: ARTICLE_PATH,
      locale: "zh_TW",
      siteName: "財富自由計算機",
    },
    twitter: {
      card: "summary_large_image",
      title: H1,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function articleJsonLd(latest: LatestIssue) {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const issuePath = blogPostPath(latest.issue.slug);
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: H1,
    inLanguage: "zh-TW",
    description: descriptionFor(latest),
    dateModified: latest.entry.publishAtIso,
    url: `${origin}${ARTICLE_PATH}`,
    significantLink: `${origin}${issuePath}`,
    isPartOf: {
      "@type": "WebSite",
      name: "財富自由計算機",
      url: origin,
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export default function AfterTaxRankLatestPage() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  const latest = latestPublishedIssue(new Date());
  if (!latest) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  const { issue } = latest;
  const lead = leadForIssue(issue);
  const issuePath = blogPostPath(issue.slug);
  const period = `${issue.year}年${issue.month}月`;

  return (
    <article className={styles.page}>
      <div className={styles.wrap}>
        {articleJsonLd(latest)}
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <p className={styles.kicker}>稅後實領月報 · 固定入口</p>
        <h1 className={styles.title}>{H1}</h1>
        <p className={styles.body}>
          這一頁的網址不帶月份，打開就是最新一期。
          {lead
            ? `最新一期是${period}，資料截止 ${issue.asOf}。第一名是 ${lead.ticker}（${lead.name}），月領 1 萬約需本金 ${formatRankMoney(lead.capital)} 元、${lead.lots.toFixed(1)} 張。`
            : `最新一期是${period}，資料截止 ${issue.asOf}。`}
        </p>
        <p className={styles.body}>
          <Link href={issuePath} className={styles.issueLink}>
            看{period}完整排行
          </Link>
        </p>
        <p className={styles.note}>
          {period}的網址會留著。下一期換成新網址，這一頁改連到新的那期。
        </p>
        <ArticlePublishStamp publishAtIso={latest.entry.publishAtIso} />
      </div>
    </article>
  );
}
