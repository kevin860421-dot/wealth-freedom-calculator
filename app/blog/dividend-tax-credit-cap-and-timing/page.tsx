import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { DividendTaxInteractive } from "../dividend-tax-interactive";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "dividend-tax-credit-cap-and-timing" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（9）｜8.5% 抵減上限怎麼影響你｜財富自由計算機",
  description:
    "股利抵減 8.5% 不是無限。當你接近上限時，多出來的股利會落在不同稅後手感。先懂上限與級距，才知道該不該糾結。僅供參考。",
  alternates: { canonical: ARTICLE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: "存股節稅（9）｜8.5% 抵減上限怎麼影響你",
    description: "抵減不是無限：你要知道自己在哪個區間。",
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

function DividendTaxCreditCapAndTimingPublished() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 9</span>
      </div>
      <h1 className={styles.title}>8.5% 抵減上限怎麼影響你</h1>
      <p className={styles.subtitle}>
        很多人聽過「股利可以抵減 8.5%」，然後把它當成固定折扣。但真正左右你稅後現金流的，是：你有沒有碰到上限。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <h2>你要先回答的不是「能不能抵」，而是「抵得到多少」</h2>
        <p className={styles.grafTight}>
          抵減通常有上限。當你在「還沒碰到上限」的區間時，每多一筆可抵減的股利，體感會比較好；但當你「早早就碰到上限」時，後面新增的股利，稅後手感會突然變硬。
        </p>

        <h2>上限會讓你出現兩種錯覺</h2>
        <ul>
          <li>
            <strong>錯覺 1：</strong>我一直都能吃到 8.5%。（其實你可能已經碰到上限了）
          </li>
          <li>
            <strong>錯覺 2：</strong>抵減吃不滿，所以合併一定最優。（其實還要看邊際稅率與其他所得）
          </li>
        </ul>

        <h2>一個務實做法：用「兩段」去想你的股利</h2>
        <p className={styles.grafTight}>
          把你的股利拆成兩段：<strong>上限內</strong>與<strong>上限外</strong>。上限內那段，合併可能更香；上限外那段，可能就要回到邊際稅率、分離稅率與其他條件去比。
        </p>

        <h2>把上限放回 FIRE 年期，就知道該不該糾結</h2>
        <p className={styles.grafTight}>
          抵減上限不是「報稅時多拿一點」而已；它會影響你每期可以再投入的幅度，而這件事會反映在達標年期上。
        </p>
        <p className={styles.grafTight}>
          你可以在<strong>財富自由計算機</strong>裡，用同一組輸入切換「合併/分離、抵減、54C、二代健保」，看哪個差異真正會把你推到「多等幾年」。
        </p>

        <DividendTaxInteractive />
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
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；抵減上限、適用條件與申報結果以當年度法規與您的個案為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function DividendTaxCreditCapAndTiming() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <DividendTaxCreditCapAndTimingPublished />;
}

