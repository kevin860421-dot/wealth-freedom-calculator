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
const ARTICLE_HEADLINE = "被動收入規劃的專業架構：稅後現金流與 FIRE 試算";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（3）｜被動收入與 FIRE 試算：稅後現金流專業筆記｜財富自由計算機",
  description:
    "被動收入 規劃、FIRE 試算、財富自由 現金流：以稅後口徑對齊股利再投入與財務獨立路徑。銜接股利課稅、二代健保與合併分離課稅，導向財富自由計算機交叉驗證。僅供參考。",
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
    title: "存股節稅（3）｜被動收入與 FIRE：專業試算架構",
    description:
      "用稅後現金流語言描述 FIRE：三槓桿沙盒＋五項專業自檢，並與財富自由計算機對齊假設。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（3）｜被動收入與 FIRE：專業試算架構",
    description:
      "用稅後現金流語言描述 FIRE：三槓桿沙盒＋五項專業自檢，並與財富自由計算機對齊假設。",
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
      "被動收入與 FIRE 試算的專業架構：稅後現金流、再投入與風險檢核，銜接股利課稅觀念。僅供一般資訊。",
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
      <h1 className={styles.title}>被動收入如何「落地」：FIRE 試算的專業架構（稅後現金流）</h1>
      <p className={styles.subtitle}>
        本篇目標讀者：已理解配息，準備把<strong>財富自由</strong>與<strong>被動收入</strong>從口號改成可驗證假設者。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <p>
          若你關心的是長期<strong>財務獨立</strong>或<strong>FIRE 試算</strong>，最危險的不是樂觀，而是<strong>口徑不一致</strong>：目標用稅後、回顧卻看稅前配息、模型又忽略再投入與手續費。專業做法是先對齊語言，再談報酬。
        </p>

        <h2>1｜為何需要「稅後現金流」作為唯一錨點</h2>
        <p>
          <strong>被動收入 規劃</strong>若不以可花用現金為核心，常見後果是：年度現金流看起來達標，但可支配餘額與心理帳對不起來。我們在
          <BlogPublishedLink slug={SLUG_TAX_1}>存股節稅（1）</BlogPublishedLink>
          與
          <BlogPublishedLink slug={SLUG_TAX_2}>存股節稅（2）</BlogPublishedLink>
          已分別整理<strong>合併課稅 分離課稅</strong>、<strong>股利抵減 8.5%</strong>與<strong>二代健保 股利</strong>對實拿的影響；第三篇要把這些收斂成<strong>模型輸入</strong>，才能與
          <strong>財富自由 計算機</strong>這類工具對話。
        </p>
        <div className={styles.callout}>
          <p>
            <strong>專業共識（簡化版）：</strong>任何「我需要多少資產才自由」的倒推，都應先定義<strong>稅後月現金流目標</strong>，再回頭檢驗配息、課稅選項與再投入假設是否支援該目標。
          </p>
        </div>

        <h2>2｜與計算機對齊的三個槓桿（教學沙盒）</h2>
        <p>
          下列互動將<strong>目標月流</strong>、<strong>稅後現金流回報假設</strong>與<strong>再投入比例</strong>放在同一畫面。數字僅協助建立直覺與數量級；個案請以站內試算表的稅務與手續費欄位為準。
        </p>
        <BlogThreeLeverSandbox />

        <h2>3｜五項專業自檢：你的假設是否「可拿去開會」</h2>
        <p>
          若你要把試算結果用於年度檢討或家庭財務溝通，建議至少通過下列結構檢核。這不是法律或稅務簽核，而是<strong>降低模型偏誤</strong>的最低限度。
        </p>
        <BlogFireReadinessChecklist />

        <h2>4｜長文與試算分工：為何要把觀念與計算機放在一起</h2>
        <p>
          關心「<strong>財富自由 現金流</strong>」「<strong>股利 再投入</strong>」的讀者，真正需要的往往不是口號，而是<strong>可調參數的試算框架</strong>。長文負責釐清口徑與制度邊界，計算機負責把假設壓在同一張表上——兩者分工，才接近常見的專業工作流程。
        </p>
        <ul>
          <li>
            <strong>觀念層</strong>：先問對問題（稅後口徑、課稅選項、再投入），避免模型一開始就偏航。
          </li>
          <li>
            <strong>試算層</strong>：把同名變數輸入同一工具，才能做敏感性分析與年度對帳。
          </li>
        </ul>

        <h2>5｜建議的下一步（同一套假設，交叉驗證）</h2>
        <p className={styles.toolLine}>
          請開啟<strong>財富自由計算機</strong>：將你在沙盒中假設的<strong>月目標</strong>、<strong>再投入比例</strong>，與前兩篇提到的<strong>課稅與健保假設</strong>一併輸入，觀察曲線對參數的敏感度。
        </p>
        <div className={styles.callout}>
          <p>
            專業流程上，這一步稱為<strong>敏感性分析</strong>的初階版本：先確定輸入一致，再討論結論；而不是先堅持結論，再挑有利的假設。
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

        <h2>6｜一句話收斂</h2>
        <p style={{ fontSize: "1.05rem", color: "var(--morandi-text, #f0ebe5)", fontWeight: 600 }}>
          FIRE 不是信仰，是同一套稅後口徑下的試算紀律。
        </p>
        <p>當名詞對齊、輸入對齊，你與顧問（若需要）的對話成本會顯著下降。</p>

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
