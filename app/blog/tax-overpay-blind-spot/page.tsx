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
  title: "存股節稅（2）｜稅後真相｜財富自由計算機",
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
        選股再準，沒把<strong>股利課稅</strong>算進去，複利像在深海撒網——網很大，拉上來才發現洞在漏水。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <h2>兩題，答完再滑</h2>
        <p className={styles.grafTight}>
          你有在<strong>存股</strong>、買<strong>ETF</strong>、長期領配息嗎？
        </p>
        <p className={styles.grafTight}>
          第二題刺一點：<strong>你確定沒有多繳一截稅？</strong>
        </p>
        <p className={styles.innerVoice}>「我又沒報錯，政府怎麼可能多收？」</p>
        <p className={styles.grafTight}>
          老實說，多半不是「報錯」。是很多人把<strong>配息簡訊</strong>當終點，卻從沒把<strong>合併／分離課稅</strong>、<strong>股利抵減 8.5%</strong>、<strong>二代健保 股利</strong>，跟<strong>實拿</strong>對在同一條線上。
        </p>
        <p className={styles.grafTight}>
          結果腦中的複利曲線很帥，口袋進度像被抽一成——<strong>你以為在存錢，其實在存一個稅前故事。</strong>
        </p>

        <h2>殖利率很香？那是海面上的油花</h2>
        <p className={styles.grafTight}>多數人盯兩件事：</p>
        <ul>
          <li>
            <strong>殖利率</strong>（看起來很香）
          </li>
          <li>
            <strong>配息</strong>（入帳很療癒）
          </li>
        </ul>
        <p className={styles.grafTight}>水面下還有第三件事，硬得像石頭：</p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            <strong>稅。</strong>能丟回去複利的那一包，是<strong>稅後</strong>，不是簡訊上的數字。
          </p>
        </div>
        <p className={styles.punchLine}>
          <strong>你複利的，是稅前還是稅後？</strong>
        </p>
        <p className={styles.grafTight}>
          答不出來？別糗，代表你該把假設丟進試算，讓畫面出來。
        </p>

        <BlogTaxLeakMeter />

        <h2>四個坑，踩一個就痛</h2>
        <p>
          <span className={styles.num}>1</span>
          <strong>合併 vs 分離</strong>搞不清：不是選省事，是選「在你這張所得拼圖上，哪個比較不虧」。
        </p>
        <p>
          <span className={styles.num}>2</span>
          <strong>股利抵減 8.5%</strong>什麼時候真的有用：有上限，不是口號，會直接影響你口袋剩多少。
        </p>
        <p>
          <span className={styles.num}>3</span>
          <strong>二代健保 2.11%</strong>的門檻感：股利一筆一筆來，那條線會把你的現金流長成另一種形狀。
        </p>
        <p>
          <span className={styles.num}>4</span>
          <strong>從沒認真算實拿</strong>：以為在做被動收入，曲線可能還停在稅前劇本。
        </p>

        <h2>十萬股利，你覺得實拿多少？</h2>
        <p className={styles.grafTight}>先別查，憑直覺。</p>
        <p className={styles.innerVoice}>「感覺扣一點吧……應該還行？」</p>
        <p className={styles.grafTight}>這題就是要讓「感覺」跟「制度粗估」撞一下。</p>
        <BlogOverpayQuiz />

        <h2>同一個數字，把差距畫出來</h2>
        <p className={styles.grafTight}>
          用 <strong>100,000</strong> 元當教學假設（不是幫你報稅）。很多人第一次看到<strong>分離 28%</strong>粗估，會愣住：
        </p>
        <p className={styles.innerVoice}>「靠，這一刀這麼厚？」</p>
        <BlogCaseGapBars />

        <h3>跨過門檻，二代健保再抽一小包</h3>
        <p className={styles.grafTight}>
          上面長條圖<strong>刻意還沒算</strong>補充保費。下面試算把<strong>有／沒有</strong> 2.11% 的差額拉出來。
        </p>
        <p className={styles.grafTight}>
          門檻看的是<strong>54C 計入</strong>，別只看配息簡訊總額就自我感覺良好。
        </p>
        <BlogNhi2Compare />

        <p className={styles.grafTight}>
          把這包跟<strong>分離 28%</strong>、合併下的<strong>抵減 8.5%</strong>一起想，就懂為什麼「存股 稅」要跟<strong>ETF 稅</strong>一起被正視。
        </p>

        <h2>說白了：你在存被動收入，還是在存誤會？</h2>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            很多人以為自己在做<strong>被動收入</strong>，其實是用<strong>稅前配息</strong>說服自己很努力。
          </p>
          <p className={styles.grafTight} style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            <strong>把稅算進去，你才會知道能留下多少錢繼續往前。</strong>這不是嚇你，是讓你難騙一點。
          </p>
        </div>

        <h2>計算機：當健檢，不當廣告</h2>
        <p className={styles.grafTight}>假設丟進去，數字對齊，比在心裡開股東會誠實。</p>
        <p className={`${styles.toolLine} ${styles.grafTight}`}>
          <strong>財富自由計算機</strong>一次看<strong>進度、股利、稅、實拿</strong>，把「大概」收成「區間」。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            今年配息變多，是真的變有錢，還是稅前變好看？<strong>同一張圖上見真章。</strong>
          </p>
        </div>

        <h2>節稅不是投機，是留子彈</h2>
        <p className={styles.grafTight}>
          把<strong>存股 稅</strong>搞懂，不是叫你鑽漏洞，是叫你把路走實。
        </p>
        <div className={styles.callout}>
          <p className={styles.grafTight}>
            <strong>重點不是賺更多，是留下更多。</strong>
          </p>
        </div>
        <p className={styles.grafTight}>留下的錢，才會真的進複利。</p>

        <h2>今晚就做這三件事</h2>
        <ul>
          <li>寫下今年大概領多少<strong>股利</strong>（現金／配息）。</li>
          <li>用紙筆粗算：稅＋補充保費後，<strong>實拿區間</strong>在哪。</li>
          <li>打開計算機，把同一組數字丟進去，看<strong>差距</strong>在哪裡冒出來。</li>
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
          <strong>你不是投資錯，你是算錯。</strong>
        </p>
        <p className={styles.grafTight}>稅後算進去，自由才比較像真的。</p>

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
