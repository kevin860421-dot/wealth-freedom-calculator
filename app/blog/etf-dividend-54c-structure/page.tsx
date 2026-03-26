import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogCalculatorSnippetDuo } from "../blog-calculator-snippet-duo";
import { BlogEtf54cComposition } from "../blog-etf-54c-composition";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import { BlogPublishedLink } from "../blog-published-link";
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
        入帳總額 ≠ 全部進 54C。<strong>平準金、現金股利占比</strong>一改，二代健保與所得稅的「底座」就跟著變。
      </p>

      <CalculatorHeroPreview />

      <BlogCalculatorSnippetDuo variant="post4" />

      <div className={styles.article}>
        <p className={styles.grafTight}>
          <BlogPublishedLink slug="2026-dividend-tax-guide">存股節稅（1）</BlogPublishedLink>
          、
          <BlogPublishedLink slug="tax-overpay-blind-spot">存股節稅（2）</BlogPublishedLink>
          已講過<strong>合併／分離課稅</strong>、<strong>二代健保 股利</strong>門檻。
        </p>
        <p className={styles.grafTight}>
          第四篇只盯一件事：<strong>ETF／高股息那包配息，成分到底是什麼</strong>——所以站內試算才要你填<strong>54C 占現金股利占比</strong>。
        </p>
        <p className={styles.innerVoice}>「同一筆錢入帳，為什麼跟鄰居算的不一樣？」</p>

        <h2>現金股利 ≠ 整包都進 54C</h2>
        <p className={styles.grafTight}>
          你看到的「現金股利」或配息，底下可能混了不同科目——<strong>盈餘分配股利</strong>、<strong>收益平準金</strong>等（以基金／ETF 公告為準）。
        </p>
        <p className={styles.grafTight}>
          跟綜所稅<strong>股利所得（常見對應 54C）</strong>、進而牽動<strong>補充保費怎麼計入</strong>的，通常只是整包現金流的一截。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            <strong>說白了：</strong>把「入帳總額」當 54C 基底，容易<strong>高估</strong>補充保費或稅負想像；反過來<strong>低估</strong> 54C，又會以為離門檻還很遠——兩種都痛。
          </p>
        </div>

        <h2>沙盒：占比一動，計入就跟著動</h2>
        <p className={styles.grafTight}>
          下面跟<strong>財富自由計算機</strong>同一套邏輯：用<strong>54C 應稅股利計入</strong>看有沒有跨補充保費門檻，再對該金額試算 2.11%（法規以最新為準）。
        </p>
        <BlogEtf54cComposition />

        <h2>跟試算表怎麼接</h2>
        <p className={styles.grafTight}>
          首頁表格有<strong>54C 股利佔比</strong>——不是刁難你填表，是提醒：<strong>高股息 ETF 跟個股、不同年度</strong>，結構可以差很遠。
        </p>
        <p className={styles.grafTight}>
          完全沒概念？先用年報區間或保守假設，進計算機做敏感度，比瞎猜強。
        </p>

        <h2>系列往哪接</h2>
        <p className={styles.grafTight}>
          <BlogPublishedLink slug="passive-income-fire-blueprint">存股節稅（3）</BlogPublishedLink>
          談 FIRE、稅後現金流骨架；這篇補「錢從哪個科目來」，你的<strong>稅後口徑</strong>才站得住。
        </p>
        <p className={styles.grafTight}>
          第五篇再談<strong>家庭合併申報</strong>、<strong>每戶抵減上限</strong>——整戶圖像。
        </p>

        <p className={styles.toolLine}>
          開計算機：用你關心的標的與占比，對照沙盒，跑一輪完整表。
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

        <h2>今晚就做這兩件事</h2>
        <ul>
          <li>查你持有標的最近一次配息公告：<strong>54C／平準金</strong>大概長什麼樣。</li>
          <li>把占比填進計算機，動一下滑桿，看<strong>門檻與實拿</strong>差多少。</li>
        </ul>

        <h2>靈魂拷問</h2>
        <p className={styles.punchLine}>
          <strong>你算的稅，是配息簡訊上的故事，還是 54C 底座上的故事？</strong>
        </p>

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
