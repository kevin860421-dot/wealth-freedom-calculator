import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import { DividendTaxInteractive } from "../dividend-tax-interactive";
import { TaxBracketCompareChart } from "../tax-bracket-compare-chart";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

/** 與資料夾名、registry.slug 一致 */
const SLUG = "2026-dividend-tax-guide" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
/** 供本頁與 generateMetadata 使用（避免巢狀函式內 TS 推斷為 undefined） */
const entry: BlogPostRegistryEntry = _registryEntry;

const SCROLL_MILESTONE_SESSION_KEY = "wf-blog-scroll-milestone-2026-dividend-v1";

const ARTICLE_PATH = blogPostPath(SLUG);
const ARTICLE_HEADLINE = "2026 存股節稅：股利抵減 8.5% 與實拿";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（1）｜股利抵減 8.5%、合併分離課稅｜財富自由計算機",
  description:
    "存股、ETF 稅、股利課稅怎麼算？合併課稅與分離課稅、二代健保 2.11%、股利抵減 8.5% 觀念整理，並用財富自由計算機試算目標與實拿。僅供參考。",
  keywords: [
    "股利抵減 8.5%",
    "股利課稅",
    "合併課稅 分離課稅",
    "二代健保 股利",
    "存股 稅",
    "ETF 稅",
    "財富自由 計算機",
  ],
  alternates: {
    canonical: ARTICLE_PATH,
  },
  openGraph: {
    title: "存股節稅（1）｜股利抵減 8.5% 與實拿",
    description:
      "別只看殖利率——稅與健保會決定你實際留下多少。用合理試算理解合併與分離課稅。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（1）｜股利抵減 8.5% 與實拿",
    description:
      "別只看殖利率——稅與健保會決定你實際留下多少。用合理試算理解合併與分離課稅。",
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
      "存股、ETF 稅、股利課稅與二代健保觀念整理，合併課稅與分離課稅試算參考。僅供一般資訊，非專業建議。",
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

function BlogPost2026DividendTaxGuidePublished() {
  return (
    <article className={styles.wrap}>
      {articleJsonLd()}
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        {/* 專欄編號：往後新文請改 2、3… 方便口頭／文件對齊 */}
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 1</span>
      </div>
      <h1 className={styles.title}>2026 存股節稅：股利抵減 8.5% 與實拿</h1>
      <p className={styles.subtitle}>
        合併／分離、二代健保先講清楚，再談被動收入——不然<strong>財富自由</strong>像在霧裡開車，儀表板很亮，路其實看不清。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <p className={styles.grafTight}>
          每年領股利，有算過<strong>真正進口袋</strong>多少嗎？
        </p>
        <p className={styles.innerVoice}>「有配就好啦，殖利率看起來不錯啊。」</p>
        <p className={styles.grafTight}>
          存股、買<strong>ETF</strong>，很多人只看票面。<strong>股利課稅</strong>、<strong>合併／分離</strong>怎麼選，再加<strong>二代健保 股利</strong>，決定你是「看得到」還是「拿得到」。
        </p>
        <p className={styles.punchLine}>
          <strong>稅，才是很多存股族忽略的那條線。</strong>
        </p>
        <p className={styles.grafTight}>
          搞懂<strong>股利抵減 8.5%</strong>什麼時候有用，被動收入才比較留得住。
        </p>

        <h2>邊際 5% 跟 12%：同一筆股利，實拿差一截</h2>
        <p className={styles.grafTight}>
          <strong>合併課稅</strong>下，邊際在 <strong>5%</strong>，抵減 8.5% 常能幫你多留一點；邊際到 <strong>12%</strong>，同筆股利被扣的所得稅又是另一個故事。
        </p>
        <p className={styles.grafTight}>下面折線跟本站計算機同一套假設——先看趨勢，再啃細節。</p>
        <TaxBracketCompareChart />

        <h2>先別滑：心裡先選一個</h2>
        <p className={styles.grafTight}>
          假設現金股利入帳 <strong>30,000</strong>（單筆、已入戶），扣完該扣的，實拿比較像哪一個？
        </p>
        <div className={styles.quiz} role="group" aria-label="互動題組">
          <p>
            <strong>A.</strong> 大概 28,000～30,000（差不多全拿）
          </p>
          <p>
            <strong>B.</strong> 大概 20,000～23,000（知道會被啃一口）
          </p>
          <p>
            <strong>C.</strong> 大概 15,000 以下（覺得會扣很凶）
          </p>
        </div>
        <p className={styles.grafTight}>先憑直覺。下面用可對帳的粗算法拆給你看。</p>
        <p className={styles.punchLine}>
          <strong>選對課稅方式，比糾結 0.1% 殖利率重要。</strong>
        </p>

        <h2>兩個常見金額：30,000 與 100,000</h2>
        <p className={styles.grafTight}>
          以下全是<strong>教學試算</strong>，看制度怎麼咬現金流。每人級距、上限、申報細節不同，以實際報稅與法規為準。
        </p>

        <h3>（1）單筆 30,000：二代健保先上場</h3>
        <p className={styles.grafTight}>
          單筆給付<strong>超過 2 萬</strong>，通常繞不開<strong>二代健保</strong>補充保費（常聽到 <strong>2.11%</strong>，依給付全額算）。這筆不是免費入袋。
        </p>
        <ul>
          <li>
            補充保費（試算）：30,000 × 2.11% = <strong>633</strong>（實務依單位與年度規定）
          </li>
        </ul>
        <p className={styles.grafTight}>
          接著才是<strong>股利課稅</strong>主戲：<strong>合併</strong>（併入綜所，有機會用<strong>股利抵減 8.5%</strong>，每戶有上限）或<strong>分離</strong>（單一 <strong>28%</strong>，分開算那條路）。
        </p>
        <p className={styles.grafTight}>
          用<strong>分離 28%</strong>粗估：30,000 × 28% = <strong>8,400</strong>。再把補充保費一起算，實拿常落在「兩萬多」——互動題裡 <strong>B</strong> 比較像現實（個案仍不同）。
        </p>

        <h3>（2）單筆 100,000：差距會被放大</h3>
        <p className={styles.grafTight}>
          補充保費試算：100,000 × 2.11% = <strong>2,110</strong>。走<strong>分離 28%</strong>：稅額試算 <strong>28,000</strong>。
        </p>
        <p className={styles.grafTight}>
          邊際不高的族群，<strong>合併</strong>有時靠<strong>抵減 8.5%</strong>把淨稅負拉回一大截（上限要盯）。<strong>存股 稅</strong>不是單一公式，是<strong>整張所得拼圖</strong>決定的。
        </p>

        <DividendTaxInteractive />

        <h2>數字攤開，心裡才踩得到地</h2>
        <p className={styles.innerVoice}>「所以我到底少拿多少？離目標還差幾步？」</p>
        <p className={`${styles.toolLine} ${styles.grafTight}`}>
          <strong>財富自由計算機</strong>把<strong>稅、健保、再投入、目標</strong>塞同一張圖——不是讓你更慌，是讓你少瞎猜。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            同時看<strong>目標、股利、稅與補充保費、實拿</strong>。不是算命，是把腦中散落的數字拉回同一套假設。
          </p>
        </div>
        <p className={styles.grafTight}>
          改一個假設，看曲線怎麼動。<strong>財富自由 計算機</strong>的用處在這裡：少賭氣，多看區間。
        </p>

        <h2>合併 vs 分離：先懂差異，再談選</h2>
        <p className={styles.grafTight}>
          <strong>合併</strong>：股利併進綜所，可試<strong>股利抵減 8.5%</strong>（每戶上限）。吃不吃香，看邊際、其他所得、扣除、家庭狀況。
        </p>
        <p className={styles.grafTight}>
          <strong>分離</strong>：股利單打 <strong>28%</strong>，不跟別的所得擠累進。聽起來直覺，對不少人<strong>其實不一定划算</strong>。
        </p>
        <p className={styles.punchLine}>
          <strong>很多人選錯，不是笨，是每年報稅像趕作業</strong>——股利、薪資、其他所得沒放同一個情境比。
        </p>

        <h2>金額一拉開，你會很有感</h2>
        <p className={styles.grafTight}>
          同樣 100,000 股利，<strong>分離 28%</strong>那刀（28,000）跟某些<strong>合併＋抵減 8.5%</strong>後的淨稅負，差距拉到一兩萬以上不稀奇——<strong>這是制度下的結構落差</strong>，不是嚇你。
        </p>
        <p className={styles.grafTight}>
          換成心理帳：等於多領<strong>一兩個月被動收入子彈</strong>，在報稅選項上被擦掉。要再投入、要拉現金流，這一刀很實在。
        </p>

        <h2>節稅不是投機，是留子彈</h2>
        <p className={styles.grafTight}>
          談<strong>財富自由</strong>都在找更高殖利率、更飆的標的。長期存股族有句話更刺耳：
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            <strong>不是賺更多，是留下更多。</strong>
          </p>
        </div>
        <p className={styles.grafTight}>
          <strong>存股 稅</strong>、<strong>ETF 稅</strong>搞懂，不是走後門，是讓曲線貼近現實。留下的錢變多，複利才像複利，而不是被稅默默打折。
        </p>

        <h2>今晚就做這三件事</h2>
        <ul>
          <li>寫下去年的<strong>股利</strong>總額（現金／配息）。</li>
          <li>粗算稅＋補充保費後，<strong>實拿區間</strong>在哪。</li>
          <li>同一組數字丟進<strong>財富自由計算機</strong>，看曲線差在哪幾個假設。</li>
        </ul>
        <Link
          id={WF_BLOG_CALCULATOR_CTA_ID}
          href="/"
          className={styles.cta}
          target="_blank"
          rel="noopener noreferrer"
        >
          前往財富自由計算機（另開分頁）→
        </Link>

        <h2>靈魂拷問</h2>
        <p className={styles.punchLine}>
          <strong>你現在領到的，不一定是你最後能留下的；稅與健保算進去，自由才比較像真的。</strong>
        </p>

        {/* 10 免責 */}
        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文章僅為一般性財經資訊分享，不構成投資、稅務、法律或會計建議。
          </p>
          <p>
            實際稅負、可抵減金額、補充保費與申報結果，依個人情形、年度法規、稽徵實務與主管機關解釋為準。
          </p>
          <p>若涉及報稅選項與節稅規劃，建議諮詢合格會計師或稅務顧問。</p>
        </div>
      </div>

      <BlogScrollMilestoneModal sessionKey={SCROLL_MILESTONE_SESSION_KEY} />
      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function BlogPost2026DividendTaxGuide() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <BlogPost2026DividendTaxGuidePublished />;
}
