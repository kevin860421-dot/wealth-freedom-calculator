import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { TaxBracketCompareChart } from "../tax-bracket-compare-chart";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "dividend-tax-merge-vs-separate-decision" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（6）｜合併 vs 分離：用三個問題做決策｜財富自由計算機",
  description:
    "合併課稅與分離課稅怎麼選？用邊際稅率、股利抵減 8.5% 上限、二代健保 2.11% 三個問題，快速把方向選對。僅供參考。",
  alternates: { canonical: ARTICLE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: "存股節稅（6）｜合併 vs 分離：三個問題做決策",
    description: "不用背法條：先把方向選對，再去算細節。",
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

function DividendTaxMergeVsSeparateDecisionPublished() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 6</span>
      </div>
      <h1 className={styles.title}>合併 vs 分離：用三個問題做決策</h1>
      <p className={styles.subtitle}>
        你不需要背完整稅則；你需要的是把「方向」先選對，別讓稅後現金流在關鍵節點被默默打折。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <p className={styles.grafTight}>
          如果你只想記一句話：<strong>先決策，再精算。</strong>先把方向選對，很多人就能少走一年的冤枉路。
        </p>

        <TaxBracketCompareChart />

        <h2>問題 1：你的邊際稅率大概落在哪？</h2>
        <p className={styles.grafTight}>
          <strong>合併課稅</strong>把股利併進綜合所得，真正影響你的是「最後那一塊」落在哪個級距（邊際稅率）。
        </p>
        <p className={styles.grafTight}>
          邊際越高，合併下的稅負壓力越大；反之，邊際偏低時，合併常更有機會把<strong>股利抵減 8.5%</strong>吃滿一部分（但有上限）。
        </p>

        <h2>問題 2：你一年股利有沒有接近抵減上限？</h2>
        <p className={styles.grafTight}>
          合併的「好處」常被簡化成一句：<strong>可以抵減 8.5%</strong>。但現實是：抵減有上限，你不一定每一塊股利都能抵到最甜。
        </p>
        <p className={styles.grafTight}>
          所以你要先回答：你是「抵減吃不滿」的人，還是「很快就碰到上限」的人？兩者的最佳選擇可能完全相反。
        </p>

        <h2>問題 3：你最容易踩到二代健保門檻的是哪一筆？</h2>
        <p className={styles.grafTight}>
          很多人把二代健保當作「年股利越高越痛」。但更常見的真相是：你踩線的是<strong>那一筆</strong>，不是全年總額。
        </p>
        <p className={styles.grafTight}>
          同樣年股利，分成幾次入帳、每次金額落在哪，會直接影響你有沒有跨過<strong>2 萬門檻</strong>（常見費率 <strong>2.11%</strong>）。
        </p>

        <h2>把三個答案丟進同一套試算</h2>
        <p className={styles.grafTight}>
          做決策最怕的是：你用「一個報酬率」說服自己，卻用「另一個稅後現金流」過生活。
        </p>
        <p className={styles.grafTight}>
          你可以用<strong>財富自由計算機</strong>把「股利、54C、二代健保、手續費、再投入」放在同一條時間軸上，看你到底是被哪個假設拉長達標年期。
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
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；實際申報以法令與您的個案為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function DividendTaxMergeVsSeparateDecision() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <DividendTaxMergeVsSeparateDecisionPublished />;
}

