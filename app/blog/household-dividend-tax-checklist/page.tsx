import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogCalculatorSnippetDuo } from "../blog-calculator-snippet-duo";
import { BlogHouseholdDividendPanel } from "../blog-household-dividend-panel";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import { BlogPublishedLink } from "../blog-published-link";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "household-dividend-tax-checklist" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const SCROLL_MILESTONE_SESSION_KEY = "wf-blog-scroll-milestone-household-div-v1";

const ARTICLE_PATH = blogPostPath(SLUG);
const ARTICLE_HEADLINE = "合併申報與股利抵減";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（5）｜合併申報與股利抵減｜財富自由計算機",
  description:
    "合併申報、股利抵減 8.5%、每戶可抵減稅額上限、綜所稅級距：雙薪與股利並存時如何思考？互動情境與檢核表，導向財富自由計算機整戶試算。僅供參考。",
  keywords: [
    "合併申報 股利",
    "股利抵減 8.5%",
    "每戶 抵減 上限",
    "夫妻 綜所稅",
    "雙薪 股利",
    "分離課稅 合併課稅",
    "存股 報稅",
    "財富自由 計算機",
  ],
  alternates: { canonical: ARTICLE_PATH },
  openGraph: {
    title: "存股節稅（5）｜合併申報與股利抵減",
    description: "情境式導讀合併申報、每戶上限與級距；務必以試算與稽徵實務為準。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（5）｜合併申報與股利抵減",
    description: "合併申報下股利怎麼放進整戶圖像？檢核表＋計算機試算。",
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
    "@type": "Article",
    headline: ARTICLE_HEADLINE,
    inLanguage: "zh-TW",
    datePublished: entry.publishAtIso,
    dateModified: entry.publishAtIso,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${origin}${ARTICLE_PATH}` },
    description:
      "合併申報、股利抵減與每戶上限之教育性說明，輔以情境導航。僅供一般資訊。",
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: "財富自由計算機", url: origin },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- 結構化資料
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function ArticleBody() {
  return (
    <article className={styles.wrap}>
      {articleJsonLd()}
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 5</span>
      </div>
      <h1 className={styles.title}>合併申報與股利抵減</h1>
      <p className={styles.subtitle}>
        <strong>雙薪＋配息</strong>、<strong>夫妻合併申報</strong>：股利不是獨立科目，是塞進<strong>整戶</strong>那張圖裡。下面兩張摘錄對齊計算機語彙。
      </p>

      <CalculatorHeroPreview />

      <BlogCalculatorSnippetDuo variant="post5" />

      <div className={styles.article}>
        <p className={styles.grafTight}>
          <BlogPublishedLink slug="2026-dividend-tax-guide">股利課稅選項</BlogPublishedLink>、
          <BlogPublishedLink slug="tax-overpay-blind-spot">稅後實拿</BlogPublishedLink>、
          <BlogPublishedLink slug="passive-income-fire-blueprint">FIRE 架構</BlogPublishedLink>、
          <BlogPublishedLink slug="etf-dividend-54c-structure">ETF 與 54C</BlogPublishedLink>
          都談過了。
        </p>
        <p className={styles.grafTight}>
          第五篇只談一個常被忽略的結構：<strong>合併申報</strong>下，股利跟薪資、其他所得<strong>擠同一套級距與抵減空間</strong>。
        </p>
        <p className={styles.innerVoice}>「我股利不少，為什麼抵減像沒吃到？」</p>

        <h2>「每戶」兩個字：抵減上限跟誰綁在一起</h2>
        <p className={styles.grafTight}>
          走<strong>合併課稅</strong>，<strong>股利抵減 8.5%</strong>會碰到<strong>每戶可抵減稅額上限</strong>（常跟「8 萬」一起被提起——實際以當年度法令與試算為準）。
        </p>
        <p className={styles.grafTight}>
          股利再好看，<strong>整戶</strong>能不能用滿空間，還看其他所得、扣除額怎麼長。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            <strong>別只問「我的股利能不能抵」。</strong>要問：在<strong>我這一戶</strong>的綜合所得淨額裡，<strong>合併跟分離哪條路淨稅負比較低</strong>。
          </p>
        </div>

        <h2>先選情境，再勾檢核</h2>
        <p className={styles.grafTight}>教學導航：挑最接近你家所得結構，順手勾你願意做的盡職步驟。</p>
        <BlogHouseholdDividendPanel />

        <h2>為什麼要整戶試算</h2>
        <p className={styles.grafTight}>
          嘴砲比較「分離 28%」跟「合併＋抵減」很容易失真——<strong>薪資把邊際稅率推上去</strong>，股利的邊際效果就跟著變。
        </p>
        <p className={styles.grafTight}>
          <strong>財富自由計算機</strong>把再投入、手續費、稅務欄位塞同一條時間軸，至少讓<strong>現金流跟稅後假設</strong>先自洽。
        </p>

        <h2>跟國稅局試算的界線</h2>
        <p className={styles.grafTight}>
          本站是<strong>長期規劃與教育</strong>，不能取代報稅軟體或稽徵認定。
        </p>
        <p className={styles.grafTight}>
          報稅季請以官方試算、扣繳憑單、申報書為準；結構複雜就找稅務專業。
        </p>

        <p className={styles.toolLine}>
          開計算機：把兩人薪資假設、股利、再投入塞同一模型，對照上面情境。
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

        <h2>今晚就做這三件事</h2>
        <ul>
          <li>寫下這一戶：<strong>薪資、股利、其他所得</strong>大概各多少（粗估即可）。</li>
          <li>問一句：<strong>合併跟分離</strong>哪條路淨稅負較低（先猜再丟試算）。</li>
          <li>打開計算機，看<strong>邊際稅率一動</strong>，股利故事怎麼改寫。</li>
        </ul>

        <h2>靈魂拷問</h2>
        <p className={styles.punchLine}>
          <strong>你算的是「個人的股利」，還是「整戶的稅」？</strong>
        </p>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文章不構成稅務、法律或投資建議。
          </p>
          <p>
            股利抵減、每戶上限、合併申報與分開計稅要件等，均以<strong>中華民國現行稅法與稽徵實務</strong>為準。
          </p>
        </div>
      </div>

      <BlogScrollMilestoneModal sessionKey={SCROLL_MILESTONE_SESSION_KEY} />
      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function BlogPostHouseholdDividendTax() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <ArticleBody />;
}
