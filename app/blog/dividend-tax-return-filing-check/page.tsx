import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogOverpayQuiz } from "../blog-overpay-quiz";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "dividend-tax-return-filing-check" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（10）｜報稅前最後一張清單｜財富自由計算機",
  description:
    "報稅前把股利、54C、抵減與二代健保，用一張清單對齊到稅後實拿。用同一套假設回到時間軸，避免只看總資產。僅供參考。",
  alternates: { canonical: ARTICLE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: "存股節稅（10）｜報稅前最後一張清單",
    description: "把數字對齊到稅後實拿，才算真的完成。",
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

function DividendTaxReturnFilingCheckPublished() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 10</span>
      </div>
      <h1 className={styles.title}>報稅前最後一張清單</h1>
      <p className={styles.subtitle}>
        你不需要把稅務變成學術論文；你需要把「影響稅後現金流的那幾件事」確實勾完，然後把它放回你的 FIRE 時間軸。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <p className={styles.grafTight}>
          這篇的目標很簡單：讓你報完稅之後，不會再用「配息簡訊的數字」去想像再投入，而是回到<strong>稅後實拿</strong>。
        </p>

        <h2>清單 1：把「每次入帳」列出來</h2>
        <ul>
          <li>不要只看全年加總；請先列出每次股利入帳金額與時間。</li>
          <li>
            把「單筆是否 {"\u003e"} 20,000」先標記出來（通常用於二代健保門檻判斷）。
          </li>
        </ul>

        <BlogOverpayQuiz />

        <h2>清單 2：把 54C 占比與「計入基礎」對齊</h2>
        <p className={styles.grafTight}>
          ETF 配息可能包含不同組成；你要確認你在算的是「入帳總額」還是「計入基礎」。兩者不同，門檻與稅後實拿就會不同。
        </p>

        <h2>清單 3：抵減上限與申報方式先用「區間」想</h2>
        <p className={styles.grafTight}>
          合併/分離不是一句口訣決勝負；請先用邊際稅率、抵減上限、二代健保門檻，把選項縮小到 1～2 個，再做細算。
        </p>

        <h2>清單 4：把結果放回「每期須扣除」</h2>
        <p className={styles.grafTight}>
          最容易出錯的地方是：你用稅前股利去想像再投入，但現實是稅後現金流。把「每期須扣除」攤開，你才知道自己到底少了多少可再投入的彈藥。
        </p>

        <p className={styles.grafTight}>
          你可以在<strong>財富自由計算機</strong>裡，把「稅、二代健保、手續費」放到同一條時間軸，直接看到達標年期差幾年。
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
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；實際申報、門檻、占比與扣繳結果以當年度法規與您的個案為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function DividendTaxReturnFilingCheck() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <DividendTaxReturnFilingCheckPublished />;
}

