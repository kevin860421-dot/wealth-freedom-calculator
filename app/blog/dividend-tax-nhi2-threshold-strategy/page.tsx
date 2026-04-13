import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogNhi2Compare } from "../blog-nhi2-compare";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "dividend-tax-nhi2-threshold-strategy" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（7）｜二代健保 2 萬門檻：你該在意的是哪一筆｜財富自由計算機",
  description:
    "二代健保補充保費常見門檻是「單筆 > 2 萬」。同樣年股利，按次數入帳會差很多：先找出你最容易踩線的那筆，再談策略。僅供參考。",
  alternates: { canonical: ARTICLE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: "存股節稅（7）｜二代健保 2 萬門檻：你該在意的是哪一筆",
    description: "不是年股利總額最可怕，是那一筆剛好超過 2 萬。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
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

function DividendTaxNhi2ThresholdStrategyPublished() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 7</span>
      </div>
      <h1 className={styles.title}>二代健保 2 萬門檻：你該在意的是「哪一筆」</h1>
      <p className={styles.subtitle}>
        很多人把二代健保當作「年股利越高越痛」。但更常見的真相是：你踩線的是那一筆，不是全年總額。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <h2>先把規則說成一句話</h2>
        <p className={styles.grafTight}>
          常見情境是：<strong>單筆股利給付超過 2 萬</strong>，會按一定費率計收補充保費（常見數字是 <strong>2.11%</strong>；實務以當年度規定與扣繳單位為準）。
        </p>

        <h2>同樣年股利，為什麼有人完全沒感覺？</h2>
        <p className={styles.grafTight}>
          因為「年股利」會被拆成多次入帳。你要看的不是一年加總，而是每次入帳落在哪個區間。
        </p>
        <ul>
          <li>一年 60,000：如果分成 3 次各 20,000，可能跟「1 次 60,000」完全不同。</li>
          <li>一年 120,000：分成 12 次各 10,000，跟 2 次各 60,000，體感也不一樣。</li>
        </ul>

        <BlogNhi2Compare />

        <h2>你真正需要做的是：找出「最容易踩線」的那筆</h2>
        <p className={styles.grafTight}>
          這一步很土，但最有效：把你今年（或去年）每次配息的金額列出來，標記「有沒有超過 20,000」。
        </p>
        <p className={styles.grafTight}>
          如果你有 ETF 與個股混著領，還要再加上<strong>54C 占比</strong>的差異，因為有些計入基礎不是你以為的「入帳總額」。
        </p>

        <h2>把門檻放回你的 FIRE 時間軸</h2>
        <p className={styles.grafTight}>
          二代健保不是「一次被扣一點點」而已；它影響的是你每期可再投入的現金流，長期會反映在達標年期上。
        </p>
        <p className={styles.grafTight}>
          用<strong>財富自由計算機</strong>把「每期須扣除」攤開，才知道你是在第幾年開始被門檻咬到、以及咬的是哪一筆。
        </p>
        <Link
          id={WF_BLOG_CALCULATOR_CTA_ID}
          href="/"
          className={styles.cta}
          target="_blank"
          rel="noopener noreferrer"
        >
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；補充保費門檻、費率與計入基礎以當年度法規與您的個案為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function DividendTaxNhi2ThresholdStrategy() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <DividendTaxNhi2ThresholdStrategyPublished />;
}

