import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogCalculatorSnippetDuo } from "../blog-calculator-snippet-duo";
import { BlogHouseholdDividendPanel } from "../blog-household-dividend-panel";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
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
const ARTICLE_HEADLINE = "家庭合併申報與股利：每戶抵減上限與級距的決策視角";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（5）｜夫妻合併申報、股利抵減上限與試算｜財富自由計算機",
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
    title: "存股節稅（5）｜家庭申報與股利抵減",
    description: "情境式導讀合併申報、每戶上限與級距；務必以試算與稽徵實務為準。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（5）｜家庭申報與股利抵減",
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
      "夫妻合併申報、股利抵減與每戶上限之教育性說明，輔以情境導航。僅供一般資訊。",
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
      <h1 className={styles.title}>家庭合併申報與股利：每戶抵減上限、級距，該怎麼一起想？</h1>
      <p className={styles.subtitle}>
        給<strong>雙薪＋配息</strong>與<strong>夫妻合併申報</strong>的讀者：把股利放回「整戶」圖像。以下兩張為計算機語彙下的<strong>所得拼圖</strong>與<strong>合併／分離粗估</strong>示意，與第一篇 hero 預覽版型不同。
      </p>

      <BlogCalculatorSnippetDuo variant="post5" />

      <div className={styles.article}>
        <p>
          前序文章已從
          <Link href={blogPostPath("2026-dividend-tax-guide")}>股利課稅選項</Link>、
          <Link href={blogPostPath("tax-overpay-blind-spot")}>稅後實拿</Link>、
          <Link href={blogPostPath("passive-income-fire-blueprint")}>FIRE 架構</Link>，以及
          <Link href={blogPostPath("etf-dividend-54c-structure")}>ETF 配息與 54C</Link>
          逐步堆疊。第五篇處理最常見、也最容易被忽略的結構：<strong>合併申報</strong>下，股利如何與薪資、其他所得共享同一套級距與抵減空間。
        </p>

        <h2>1｜「每戶」是關鍵字：抵減上限與申報單位</h2>
        <p>
          在合併課稅路線下，<strong>股利抵減 8.5%</strong>涉及可抵減稅額的計算，且制度上存在<strong>每戶可抵減稅額上限</strong>（常聽見與「8
          萬元」上限相連的討論，實際適用以當年度法令與申報試算為準）。這代表：即使股利金額可觀，<strong>整戶</strong>能否「用滿」抵減空間，仍取決於其他所得與扣除額結構。
        </p>
        <div className={styles.callout}>
          <p>
            <strong>專業提醒：</strong>不要只問「我的股利能不能抵」；要問「在<strong>我這一戶</strong>的綜合所得淨額與稅額計算裡，合併或分離哪條路淨稅負較低」。
          </p>
        </div>

        <h2>2｜互動：先選情境，再對照檢核項</h2>
        <p>以下為教學導航，請依最接近的家庭所得結構選取；並勾選你準備採取的盡職步驟。</p>
        <BlogHouseholdDividendPanel />

        <h2>3｜為什麼需要「整戶試算」工具</h2>
        <p>
          口頭比較「分離課稅 28%」與「合併＋抵減」往往失真，因為<strong>薪資已推高的邊際稅率</strong>會改變股利的邊際效果。<strong>財富自由計算機</strong>的價值在於：把再投入、手續費與稅務欄位放在同一長度時間軸上，讓你至少先對<strong>現金流與稅後假設</strong>達成內部一致。
        </p>

        <h2>4｜與國稅局試算的關係</h2>
        <p>
          本站工具聚焦於<strong>長期財務規劃與教育</strong>，不能替代綜合所得稅申報軟體或稽徵機關認定。當你接近報稅季，仍請以官方試算、扣繳憑單與申報書為準；若所得結構複雜（海外所得、執行業務、分開計稅要件等），請諮詢稅務專業人士。
        </p>

        <p className={styles.toolLine}>
          接下來請開啟計算機：把你與配偶的薪資假設、股利與再投入比例放進同一模型，對照本篇情境提示。
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
