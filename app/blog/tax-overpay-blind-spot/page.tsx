import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogCaseGapBars } from "../blog-case-gap-bars";
import { BlogNhi2Compare } from "../blog-nhi2-compare";
import { BlogOverpayQuiz } from "../blog-overpay-quiz";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import { BlogTaxLeakMeter } from "../blog-tax-leak-meter";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "tax-overpay-blind-spot" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const SCROLL_MILESTONE_SESSION_KEY = "wf-blog-scroll-milestone-tax-overpay-v1";

const ARTICLE_PATH = blogPostPath(SLUG);
const ARTICLE_HEADLINE = "為什麼存股的人，八成都在多繳一截稅？";

const publishedArticleMetadata: Metadata = {
  title: "存股節稅（2）｜八成存股族忽略的事：股利課稅與實拿｜財富自由計算機",
  description:
    "存股 稅、股利課稅、合併課稅 分離課稅、股利抵減 8.5%、二代健保 股利、ETF 稅——你複利的是稅前還是稅後？用財富自由計算機對齊實拿與 FIRE 進度。僅供參考。",
  keywords: [
    "存股 稅",
    "股利課稅",
    "合併課稅 分離課稅",
    "股利抵減 8.5%",
    "二代健保 股利",
    "ETF 稅",
    "財富自由 計算機",
  ],
  alternates: {
    canonical: ARTICLE_PATH,
  },
  openGraph: {
    title: "存股節稅（2）｜你複利的是稅前，還是稅後？",
    description:
      "別只用殖利率說服自己。股利課稅、分離 28%、抵減 8.5%、二代健保——不算清，複利故事可能是稅前版本。",
    type: "article",
    url: ARTICLE_PATH,
    locale: "zh_TW",
    siteName: "財富自由計算機",
    publishedTime: entry.publishAtIso,
  },
  twitter: {
    card: "summary_large_image",
    title: "存股節稅（2）｜你複利的是稅前，還是稅後？",
    description:
      "別只用殖利率說服自己。股利課稅、分離 28%、抵減 8.5%、二代健保——不算清，複利故事可能是稅前版本。",
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
      "存股與股利課稅觀念：合併課稅與分離課稅、股利抵減 8.5%、二代健保 股利與實拿試算參考。僅供一般資訊。",
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

function TaxOverpayArticleBody() {
  return (
    <article className={styles.wrap}>
      {articleJsonLd()}
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜稅務專欄 · 2</span>
      </div>
      <h1 className={styles.title}>為什麼存股的人，八成都在「多繳一截稅」？</h1>
      <p className={styles.subtitle}>
        你不是不會選股。你是還沒把<strong>股利課稅</strong>算進人生複利裡。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <h2>先問兩個很直白的問題</h2>
        <p>
          你有在<strong>存股</strong>嗎？或買<strong>ETF</strong>、長期領配息那種？
        </p>
        <p>
          好，第二題更刺一點——<strong>你確定你沒有多繳一截稅？</strong>
        </p>
        <p>
          不是說你一定報錯、也不是說政府多收你錢。而是：很多人把「配息」當成終點，卻從來沒把<strong>合併課稅 分離課稅</strong>、<strong>股利抵減 8.5%</strong>、<strong>二代健保 股利</strong>這幾個字，跟自己的<strong>實拿金額</strong>對起來。
        </p>
        <p>結果就是——心裡的複利曲線很帥，口袋進度卻慢半拍。</p>

        <h2>打破迷思：你複利的，是稅前還是稅後？</h2>
        <p>多數人只看兩件事：</p>
        <ul>
          <li>
            <strong>殖利率</strong>（看起來很香）
          </li>
          <li>
            <strong>配息</strong>（入帳很療癒）
          </li>
        </ul>
        <p>但現實還有第三件事，而且超級務實：</p>
        <div className={styles.callout}>
          <p>
            <strong>稅。</strong>更精準地說：你留下來可以再放回去複利的，是<strong>稅後</strong>那一包，不是配息簡訊上的數字。
          </p>
        </div>
        <p>
          所以我想把這句話放在這裡，讓你停三秒：<strong>你複利的，是稅前還是稅後？</strong>
        </p>
        <p>答不出來沒關係。答不出來，通常代表你值得用工具把假設補齊。</p>

        <BlogTaxLeakMeter />

        <h2>四個「超常見」的忽略點（中一個就很痛）</h2>
        <p>
          <span className={styles.num}>1</span>
          <strong>搞不清合併課稅 vs 分離課稅</strong>：不是選「感覺省事」那個，而是選「在你這張所得拼圖下，哪個比較不虧」。
        </p>
        <p>
          <span className={styles.num}>2</span>
          <strong>不知道股利抵減 8.5% 在什麼情境真的有用</strong>：它不是口號，是會影響你可留下多少現金的制度設計（還有每戶上限要留意）。
        </p>
        <p>
          <span className={styles.num}>3</span>
          <strong>低估二代健保 2.11% 的「單筆門檻感」</strong>：股利一筆一筆來時，常聽到的那條線，會讓你的現金流長得不一樣。
        </p>
        <p>
          <span className={styles.num}>4</span>
          <strong>從來沒認真算過實拿</strong>：你以為自己在做被動收入，其實曲線可能還停在「稅前故事版」。
        </p>

        <h2>互動一下：十萬股利，你覺得實拿多少？</h2>
        <p>別查資料，先憑直覺。這題的目的只有一個：讓你發現「感覺」跟「制度粗估」可能差很多。</p>
        <BlogOverpayQuiz />

        <h2>用同一個數字，把「差距」畫出來</h2>
        <p>
          我們用 <strong>100,000</strong> 元當教學用假設（不是幫你報稅）。很多人第一次看到<strong>分離課稅 28%</strong>的粗估稅額，會愣一下：「原來這一刀這麼厚。」
        </p>
        <BlogCaseGapBars />

        <h3>互動：跨過門檻後，二代健保會再拿走一小包</h3>
        <p>
          上一段長條圖刻意<strong>還沒算</strong>補充保費。下面這個試算把<strong>有／沒有</strong>扣到 2.11% 的差額拉出來——記得：門檻看的是<strong>54C 計入</strong>，不是只看配息簡訊上的總額。
        </p>
        <BlogNhi2Compare />

        <p>
          把這包跟前面的<strong>分離課稅 28%</strong>、以及合併課稅下的<strong>股利抵減 8.5%</strong>一起想，你會更清楚：為什麼「存股 稅」三個字，值得跟<strong>ETF 稅</strong>一起被正視。
        </p>

        <h2>把情緒拉到滿：你不是在存被動收入，你是在存一個誤會</h2>
        <div className={styles.callout}>
          <p>
            很多人以為自己在做<strong>被動收入</strong>，其實是在用「稅前配息」說服自己很努力。
          </p>
          <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            我不是要恐嚇你，我是要你變難騙：<strong>把稅算進去，你才會知道自己到底留下多少錢可以繼續往前。</strong>
          </p>
        </div>

        <h2>我們用財富自由計算機幫你「驗證一次」</h2>
        <p>這裡不像廣告，比較像健檢：你把假設丟進去，工具幫你對齊。</p>
        <p className={styles.toolLine}>
          我們用這個<strong>財富自由計算機</strong>幫你算一次——同時看<strong>財富自由</strong>進度、<strong>股利</strong>、<strong>稅金</strong>與<strong>實拿</strong>想像，把「感覺」變成「區間」。
        </p>
        <div className={styles.callout}>
          <p>
            你可以把它當成年度自省：今年配息變多，是真的變有錢？還是只是稅前變好看？<strong>財富自由 計算機</strong>的價值，是把這些變數拉回同一張圖上。
          </p>
        </div>

        <h2>節稅不是投機，是留下更多子彈</h2>
        <p>把<strong>存股 稅</strong>搞懂，不是要你鑽漏洞，是要你把自由的路走實。</p>
        <div className={styles.callout}>
          <p>
            <strong>不是賺更多，而是留下更多。</strong>
          </p>
        </div>
        <p>留下的錢，才會真的進到你的複利裡。</p>

        <h2>兩個問題，問完就去按計算機</h2>
        <ul>
          <li>你今年大概領多少<strong>股利</strong>（現金／配息）？</li>
          <li>你<strong>真的</strong>算過稅與補充保費後，實拿大概多少嗎？</li>
        </ul>
        <p>第二題答不出來？很好，代表你接下來十分鐘會很有產出。</p>
        <Link
          id={WF_BLOG_CALCULATOR_CTA_ID}
          href="/"
          className={styles.cta}
          target="_blank"
          rel="noopener noreferrer"
        >
          前往財富自由計算機（另開分頁）→
        </Link>

        <h2>一句話，算清再談自由</h2>
        <p style={{ fontSize: "1.05rem", color: "var(--morandi-text, #f0ebe5)", fontWeight: 600 }}>
          你不是投資錯，你是算錯。
        </p>
        <p>把稅後算進去，你的自由才比較像真的。</p>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文章僅為一般性財經資訊分享，不構成投資、稅務、法律或會計建議。
          </p>
          <p>實際稅負、可抵減金額、補充保費與申報結果，依個人情形、年度法規、稽徵實務與主管機關解釋為準。</p>
          <p>若涉及報稅選項與節稅規劃，建議諮詢合格會計師或稅務顧問。</p>
        </div>
      </div>

      <BlogScrollMilestoneModal sessionKey={SCROLL_MILESTONE_SESSION_KEY} />
      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function BlogPostTaxOverpayBlindSpot() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <TaxOverpayArticleBody />;
}
