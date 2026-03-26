import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogFireReadinessChecklist } from "../blog-fire-readiness-checklist";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogPublishedLink } from "../blog-published-link";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import { BlogThreeLeverSandbox } from "../blog-three-lever-sandbox";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "passive-income-fire-blueprint" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const SCROLL_MILESTONE_SESSION_KEY = "wf-blog-scroll-milestone-passive-income-pro-v1";

const SLUG_TAX_1 = "2026-dividend-tax-guide" as const;
const SLUG_TAX_2 = "tax-overpay-blind-spot" as const;

const ARTICLE_PATH = blogPostPath(SLUG);
const ARTICLE_HEADLINE = "FIRE 與稅後現金流";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（3）｜FIRE 與稅後現金流｜財富自由計算機",
  description:
    "被動收入 規劃、FIRE 試算、財富自由 現金流：稅後口徑對齊股利再投入與財務獨立。銜接股利課稅、二代健保與合併分離課稅，導向財富自由計算機交叉驗證。僅供參考。",
  keywords: [
    "被動收入 規劃",
    "FIRE 試算",
    "財富自由 現金流",
    "財務獨立",
    "股利 再投入",
    "稅後 殖利率",
    "財富自由 計算機",
    "ETF 現金流",
    "存股 規劃",
  ],
  alternates: {
    canonical: ARTICLE_PATH,
  },
  openGraph: {
    title: "存股節稅（3）｜FIRE 與稅後現金流",
    description:
      "稅後現金流當錨點：三槓桿沙盒＋五項自檢，假設與財富自由計算機對齊再談自由。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（3）｜FIRE 與稅後現金流",
    description:
      "稅後現金流當錨點：三槓桿沙盒＋五項自檢，假設與財富自由計算機對齊再談自由。",
  },
  robots: {
    index: true,
    follow: true,
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
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${origin}${ARTICLE_PATH}`,
    },
    description:
      "FIRE 與稅後現金流：再投入與風險檢核，銜接股利課稅觀念。僅供一般資訊。",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: "財富自由計算機",
      url: origin,
    },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- 結構化資料
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function PassiveIncomeArticleBody() {
  return (
    <article className={styles.wrap}>
      {articleJsonLd()}
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 3</span>
      </div>
      <h1 className={styles.title}>FIRE 與稅後現金流</h1>
      <p className={styles.subtitle}>
        配息你懂了就差一步：把<strong>財富自由</strong>、<strong>被動收入</strong>從口號變成<strong>同一套稅後假設</strong>。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <p className={styles.grafTight}>
          談<strong>財務獨立</strong>、<strong>FIRE 試算</strong>，最危險的不是樂觀，是<strong>口徑打架</strong>。
        </p>
        <p className={styles.grafTight}>
          目標用稅後、回顧卻看稅前配息、模型又忽略再投入——像在鬧區擺攤，帳本記的是毛額，口袋卻對不上。
        </p>
        <p className={styles.innerVoice}>「我明明有配息，怎麼自由還遠？」</p>
        <p className={styles.grafTight}>
          老實說：先對齊語言，再談報酬。
        </p>

        <h2>稅後現金流當唯一錨點</h2>
        <p className={styles.grafTight}>
          <strong>被動收入 規劃</strong>若不以能花掉的現金為核心，常見後果是——年度數字看起來達標，心裡帳卻對不起來。
        </p>
        <p className={styles.grafTight}>
          <BlogPublishedLink slug={SLUG_TAX_1}>存股節稅（1）</BlogPublishedLink>
          、
          <BlogPublishedLink slug={SLUG_TAX_2}>存股節稅（2）</BlogPublishedLink>
          已拆過<strong>合併／分離課稅</strong>、<strong>股利抵減 8.5%</strong>、<strong>二代健保 股利</strong>。
        </p>
        <p className={styles.grafTight}>
          第三篇要把這些收成<strong>模型輸入</strong>，才能跟<strong>財富自由 計算機</strong>講話。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            <strong>說穿了：</strong>「要多少資產才自由」這句，先定<strong>稅後月現金流目標</strong>，再回頭檢驗配息、課稅選項、再投入——有沒有撐得住。
          </p>
        </div>

        <h2>三個槓桿：跟計算機對齊的沙盒</h2>
        <p className={styles.grafTight}>
          下面把<strong>目標月流</strong>、<strong>稅後回報假設</strong>、<strong>再投入比例</strong>塞同一畫面。
        </p>
        <p className={styles.grafTight}>
          數字是教學用數量級；個案請以站內試算表的稅務、手續費欄位為準。
        </p>
        <BlogThreeLeverSandbox />

        <h2>五項自檢：假設能不能拿去對帳</h2>
        <p className={styles.grafTight}>
          要給自己或家人看年度檢討，至少通過下面這組——不是法律簽核，是<strong>別讓模型一開始就歪</strong>。
        </p>
        <BlogFireReadinessChecklist />

        <h2>長文跟計算機：誰幹嘛</h2>
        <p className={styles.grafTight}>
          關心<strong>財富自由 現金流</strong>、<strong>股利 再投入</strong>，缺的不是雞湯，是<strong>能調參數的試算框架</strong>。
        </p>
        <ul>
          <li>
            <strong>觀念層</strong>：先問對問題（稅後口徑、課稅選項、再投入），模型一開始別偏航。
          </li>
          <li>
            <strong>試算層</strong>：同名變數丟進同一工具，才能做敏感度、年度對帳。
          </li>
        </ul>

        <h2>下一步：同一套假設，交叉驗證</h2>
        <p className={styles.toolLine}>
          開<strong>財富自由計算機</strong>：沙盒裡的<strong>月目標</strong>、<strong>再投入</strong>，加上前兩篇的<strong>課稅與健保假設</strong>，看曲線對參數有多敏感。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            先確定<strong>輸入一致</strong>再談結論；別先堅持結論，再挑對自己有利的假設。
          </p>
        </div>
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
          <li>寫下你的<strong>稅後月現金流目標</strong>（一個數字就好）。</li>
          <li>對照（1）（2）：課稅、健保假設有沒有寫進同一張紙。</li>
          <li>打開計算機，把沙盒與表格的欄位<strong>填同一組</strong>，看哪個參數一動就翻車。</li>
        </ul>

        <h2>靈魂拷問</h2>
        <p className={styles.punchLine}>
          <strong>FIRE 不是信仰，是稅後口徑下的試算紀律。</strong>
        </p>
        <p className={styles.grafTight}>名詞對齊、輸入對齊，你跟顧問（若需要）才省得吵。</p>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文章僅為一般性財經教育與資訊整理，不構成投資、稅務、法律或財務規劃建議。
          </p>
          <p>
            稅負、補充保費、配息與市場報酬均可能變動；<strong>請以中華民國現行法令、稽徵實務與您個案事實為準。</strong>
          </p>
          <p>涉及申報選項、資產配置或退休規劃，建議諮詢合格專業人士。</p>
        </div>
      </div>

      <BlogScrollMilestoneModal sessionKey={SCROLL_MILESTONE_SESSION_KEY} />
      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function BlogPostPassiveIncomeFireBlueprint() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <PassiveIncomeArticleBody />;
}
