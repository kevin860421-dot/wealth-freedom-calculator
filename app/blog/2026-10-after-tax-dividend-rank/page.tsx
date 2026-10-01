import type { Metadata } from "next";
import Link from "next/link";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogAfterTaxRankChrome } from "../2026-08-after-tax-dividend-rank/rank-chrome";
import {
  blogPostPath,
  getBlogPostBySlug,
  isBlogPostPublished,
  type BlogPostRegistryEntry,
} from "../posts/registry";
import { AFTER_TAX_RANK_LATEST_SLUG } from "@/lib/blog/after-tax-rank-series";
import styles from "../2026-08-after-tax-dividend-rank/report.module.css";

export const dynamic = "force-dynamic";

const SLUG = "2026-10-after-tax-dividend-rank" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);
const H1 = "2026年10月高股息配息排行｜月領1萬要多少本金";
const DESCRIPTION =
  "10月榜沿用同一套欄位：排行、代碼、股利、股息、月領本金、應稅、二代健保、手續費、實領、上期排行、升降。截止日與收盤尚未結算，先不填數字。";

/** 10月快照還沒有。沒有這份資料就不公開，避免把8月數字當成10月。 */
const OCTOBER_SNAPSHOT_READY = false;

function isOctoberPublic(now = new Date()): boolean {
  return OCTOBER_SNAPSHOT_READY && isBlogPostPublished(entry.publishAtIso, now);
}

export function generateMetadata(): Metadata {
  if (!isOctoberPublic()) {
    return {
      title: "文章準備中｜財富自由計算機",
      description: "本篇將於指定時間公開，敬請期待。",
      robots: { index: false, follow: false },
    };
  }
  return {
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
}

function OctoberArticle() {
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
        <p className={styles.kicker}>稅後實領月報 · 2026年10月 · 尚未填入本期數字</p>
        <BlogAfterTaxRankChrome
          headline={H1}
          defaultYear={2026}
          defaultMonth={10}
          author="財富自由計算機編輯部"
          asOf="尚未截止"
        >
          <div className={styles.article}>
            <p>
              欄位與8月同一套：排行、代碼、股利、股息、月領本金、應稅、二代健保、手續費、實領、上期排行、升降，以及下方計算機。10月收盤與已除息清單還沒結進來，所以這裡先不填數字。
            </p>
          </div>
        </BlogAfterTaxRankChrome>
      </div>
    </article>
  );
}

export default function AfterTaxDividendRank202610Page() {
  if (!isOctoberPublic()) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <OctoberArticle />;
}
