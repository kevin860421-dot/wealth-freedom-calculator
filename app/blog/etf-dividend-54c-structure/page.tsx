import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogCalculatorSnippetDuo } from "../blog-calculator-snippet-duo";
import { BlogEtf54cComposition } from "../blog-etf-54c-composition";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "etf-dividend-54c-structure" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const SCROLL_MILESTONE_SESSION_KEY = "wf-blog-scroll-milestone-etf-54c-v1";

const ARTICLE_PATH = blogPostPath(SLUG);
const ARTICLE_HEADLINE = "ETF 配息與 54C：入帳與課稅計入";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（4）｜ETF 配息與 54C｜財富自由計算機",
  description:
    "ETF 配息、54C 應稅股利、收益平準金、現金股利占比：為何同金額配息，二代健保與所得稅基礎不同？銜接存股節稅專欄，並以財富自由計算機 54C 欄位試算。僅供參考。",
  keywords: [
    "ETF 配息 稅",
    "54C 股利",
    "收益平準金",
    "現金股利 課稅",
    "二代健保 股利",
    "存股 ETF 稅",
    "股利 組成",
    "財富自由 計算機",
  ],
  alternates: { canonical: ARTICLE_PATH },
  openGraph: {
    title: "存股節稅（4）｜ETF 配息與 54C",
    description:
      "教學用沙盒拆解現金股利與 54C 占比，對齊補充保費門檻邏輯；實務以基金公司揭露與稽徵認定為準。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（4）｜ETF 配息與 54C",
    description: "54C 與平準金示意、二代健保計入基礎，對齊站內試算假設。",
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
      "ETF 配息與 54C 應稅股利、平準金示意；二代健保計入與計算機 54C 欄位。僅供一般資訊。",
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
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 4</span>
      </div>
      <h1 className={styles.title}>ETF 配息與 54C</h1>
      <p className={styles.subtitle}>
        配息入帳總額 ≠ 全部計入 54C。<strong>平準金、現金股利占比</strong>會改變二代健保與所得稅的計入底座——下面兩張摘錄對齊首頁試算表欄位邏輯。
      </p>

      <BlogCalculatorSnippetDuo variant="post4" />

      <div className={styles.article}>
        <p>
          若你已讀過
          <Link href={blogPostPath("2026-dividend-tax-guide")}>存股節稅（1）</Link>與
          <Link href={blogPostPath("tax-overpay-blind-spot")}>存股節稅（2）</Link>，應已熟悉<strong>合併課稅 分離課稅</strong>與<strong>二代健保 股利</strong>補充保費的門檻敘述。第四篇要把焦點放在
          <strong>ETF 與高股息商品常見的「配息組成」</strong>：為何站內試算要請你填<strong>54C 股利占現金股利占比</strong>。
        </p>

        <h2>1｜名詞先對齊：現金股利 ≠ 全部都要進 54C</h2>
        <p>
          實務上，投資人收到的「現金股利」或配息，可能包含不同會計／稅務性質的科目。常見討論包括<strong>盈餘分配之股利</strong>與<strong>收益平準金</strong>等（實際分類依基金／ETF 契約與公告為準）。其中，與綜合所得稅<strong>股利所得（常見對應 54C）</strong>相關、並進而影響<strong>補充保費計入想像</strong>者，通常只是整包現金流的一部分。
        </p>
        <div className={styles.callout}>
          <p>
            <strong>專業重點：</strong>若誤把「入帳總額」直接當成 54C 基礎，容易<strong>高估</strong>二代健保補充保費或稅負想像；若反向<strong>低估</strong> 54C 占比，則可能以為自己離門檻很遠，實則不然。
          </p>
        </div>

        <h2>2｜互動：用沙盒看「占比」如何改變計入</h2>
        <p>
          下列沙盒與<strong>財富自由計算機</strong>採同一邏輯：以<strong>54C 應稅股利計入金額</strong>判斷是否達補充保費門檻，並對該計入金額試算 2.11%（法規若有調整以最新為準）。
        </p>
        <BlogEtf54cComposition />

        <h2>3｜與試算工具如何銜接</h2>
        <p>
          在首頁表格中，你會看到<strong>54C 股利佔比</strong>欄位：它不是在刁難使用者，而是提醒——<strong>高股息 ETF 與個股、不同年度配息結構</strong>可能差很大。若你完全不知道占比，可先採基金公司年報區間或保守假設，再在計算機裡做敏感性測試。
        </p>

        <h2>4｜系列銜接與下一步</h2>
        <p>
          <Link href={blogPostPath("passive-income-fire-blueprint")}>存股節稅（3）</Link>
          談的是 FIRE 與稅後現金流架構；本篇補上「配息從哪裡來」的細節，讓你的<strong>稅後口徑</strong>更站得住腳。第五篇將進一步處理
          <strong>家庭合併申報</strong>與<strong>每戶抵減上限</strong>的決策視角。
        </p>

        <p className={styles.toolLine}>
          建議直接開啟計算機：用你關心的標的與占比，對照本文沙盒，跑一次完整表格。
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
            <strong>免責聲明：</strong>本文章為一般性教育用途，不構成投資、稅務或法律建議。
          </p>
          <p>
            ETF 配息科目、54C 認列、平準金性質及補充保費要件，均可能隨法令、函釋與個案事實而異；<strong>請以發放單位公告、稽徵機關與專業人士意見為準。</strong>
          </p>
        </div>
      </div>

      <BlogScrollMilestoneModal sessionKey={SCROLL_MILESTONE_SESSION_KEY} />
      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function BlogPostEtf54cStructure() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <ArticleBody />;
}
