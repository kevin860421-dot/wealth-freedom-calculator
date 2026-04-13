import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogTaxLeakMeter } from "../blog-tax-leak-meter";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "dividend-tax-54c-ratio-why-it-matters" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（8）｜54C 占比：你以為的股利，不一定都算進去｜財富自由計算機",
  description:
    "入帳股利不等於全額計入 54C。ETF 的平準金/資本利得、54C 占比，會影響二代健保門檻與所得稅計算基礎。僅供參考。",
  alternates: { canonical: ARTICLE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: "存股節稅（8）｜54C 占比：你以為的股利，不一定都算進去",
    description: "先搞懂計入基礎，才知道你在算哪個世界的稅後現金流。",
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

function DividendTax54cRatioPublished() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 8</span>
      </div>
      <h1 className={styles.title}>54C 占比：你以為的股利，不一定都算進去</h1>
      <p className={styles.subtitle}>
        你看到的「入帳金額」是一種世界；稅務與二代健保採用的「計入基礎」可能是另一種世界。兩個世界沒對齊，你的試算就會漂移。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <h2>先把 54C 占比翻成白話</h2>
        <p className={styles.grafTight}>
          你可以把<strong>54C 占比</strong>理解成：一筆股利裡，有多少比例會被拿去當作「需要計入」的基礎（用來判斷門檻、計算稅/費）。
        </p>
        <p className={styles.grafTight}>
          對很多人來說，最容易踩雷的是 ETF：因為 ETF 配息可能包含平準金、資本利得等成分，並不等同於「全部都是需要計入的股利所得」。
        </p>

        <BlogTaxLeakMeter />

        <h2>為什麼它會影響二代健保？</h2>
        <p className={styles.grafTight}>
          你以為你跨過了「單筆 20,000」門檻，但如果計入基礎只有一部分，可能其實沒跨過；反過來也可能發生：入帳看起來不大，但計入基礎偏高，反而踩線。
        </p>

        <h2>為什麼它也會影響所得稅與抵減？</h2>
        <p className={styles.grafTight}>
          不同申報方式下，稅額與抵減會用到「應稅的那一段」。如果你用入帳總額去推估，誤差會在你資產拉長後被放大。
        </p>

        <h2>實務上你該怎麼做？</h2>
        <ul>
          <li>先把你常買的標的，找出配息的組成與 54C 相關資訊（以年度公告為準）。</li>
          <li>在試算時，把「計入比例」與門檻用同一套假設對齊。</li>
          <li>不要只看結論；把「每期須扣除」攤開，確認你是在扣哪一種基礎。</li>
        </ul>

        <p className={styles.grafTight}>
          在<strong>財富自由計算機</strong>裡，你可以用同一條時間軸把「54C 占比 → 門檻 → 稅/費 → 再投入」連起來，避免用錯基礎還以為自己算很準。
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
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；配息組成、54C 計入與門檻等以主管機關公告與您的個案為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function DividendTax54cRatioWhyItMatters() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <DividendTax54cRatioPublished />;
}

