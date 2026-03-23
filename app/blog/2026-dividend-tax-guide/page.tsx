import type { Metadata } from "next";
import Link from "next/link";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScrollMilestoneModal } from "../blog-scroll-milestone-modal";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import { DividendTaxInteractive } from "../dividend-tax-interactive";
import { TaxBracketCompareChart } from "../tax-bracket-compare-chart";
import { PUBLISH_AT_ISO } from "../posts/2026-dividend-tax-guide.config";
import styles from "../blog.module.css";

const SCROLL_MILESTONE_SESSION_KEY = "wf-blog-scroll-milestone-2026-dividend-v1";

const ARTICLE_PATH = "/blog/2026-dividend-tax-guide";
const ARTICLE_HEADLINE = "2026 存股節稅：股利抵減 8.5% 與實拿";

export const metadata: Metadata = {
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
    publishedTime: PUBLISH_AT_ISO,
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

function articleJsonLd() {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ARTICLE_HEADLINE,
    inLanguage: "zh-TW",
    datePublished: PUBLISH_AT_ISO,
    dateModified: PUBLISH_AT_ISO,
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

export default function BlogPost2026DividendTaxGuide() {
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
      <p className={styles.subtitle}>搞懂合併／分離課稅、二代健保，再談被動收入與財富自由。</p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        {/* 1 開頭 */}
        <p>
          你每年領股利，有算過「真正進口袋」是多少嗎？還是你只看殖利率、配息金額，覺得「有配就好」？
        </p>
        <p>
          很多人存股、買{" "}
          <strong>ETF</strong>，第一個迷思是：報酬只看票面。其實在台灣，<strong>股利課稅</strong>、
          <strong>合併課稅 分離課稅</strong>怎麼選，再加上<strong>二代健保 股利</strong>補充保費，會直接決定你是「看得到」還是「拿得到」。
        </p>
        <p>
          這篇文章想聊的核心很簡單：<strong>稅，才是很多存股族忽略的那條線。</strong>
          搞懂<strong>股利抵減 8.5%</strong>在什麼情境有用，你才有機會把被動收入留久一點、離<strong>財富自由</strong>近一點。
        </p>

        <h2>邊際 5% 與 12%：同一筆股利，實拿差一截</h2>
        <p>
          在<strong>合併課稅</strong>下，若你已適用較低的綜所稅邊際（例如 <strong>5%</strong>），股利抵減 8.5% 往往能幫你「多留一點」；若邊際落在{" "}
          <strong>12%</strong> 等較高級距，同筆股利在試算上<strong>被扣的所得稅</strong>會明顯不同。下面用與本站計算機相同的假設畫成折線：先看趨勢，再往下讀細節。
        </p>
        <TaxBracketCompareChart />

        {/* 2 互動 */}
        <h2>先別滑走：你心裡的答案是多少？</h2>
        <p>假設今年現金股利入帳 <strong>30,000</strong> 元（單筆、已入戶），你覺得「扣完該扣的」之後，實拿比較接近哪一個？</p>
        <div className={styles.quiz} role="group" aria-label="互動題組">
          <p>
            <strong>A.</strong> 大概 28,000～30,000 元（覺得差不多全拿）
          </p>
          <p>
            <strong>B.</strong> 大概 20,000～23,000 元（知道會被扣一些）
          </p>
          <p>
            <strong>C.</strong> 大概 15,000 元以下（覺得會扣很凶）
          </p>
        </div>
        <p>
          先選一個你直覺的答案。下面我們用「合理、可對帳的算法」拆給你看——你會發現：<strong>選對課稅方式</strong>，比糾結 0.1% 殖利率更重要。
        </p>

        {/* 3 案例 */}
        <h2>兩個很常見的金額：30,000 與 100,000</h2>
        <p>
          以下數字是<strong>教學用試算</strong>，用來理解制度怎麼「咬」你的現金流；每個人適用所得級距、可抵減金額上限、申報細節都不同，實際以報稅與法規為準。
        </p>

        <h3>（1）單筆 30,000 元：二代健保先登場</h3>
        <p>
          在台灣，股利等單筆給付若<strong>超過 2 萬元門檻</strong>，通常會涉及<strong>二代健保</strong>補充保費（常聽到的比例是<strong>2.11%</strong>，依給付全額計算）。所以 30,000 元這一筆，先記得：它不是「免費入袋」。
        </p>
        <ul>
          <li>
            二代健保補充保費（試算）：30,000 × 2.11% = <strong>633</strong> 元（級距與實務扣繳依單位與年度規定）
          </li>
        </ul>
        <p>
          接著才是<strong>股利課稅</strong>的主戲：你可以選<strong>合併課稅</strong>（把股利併入綜合所得稅，並有機會用到<strong>股利抵減 8.5%</strong>的可抵減稅額，且每戶有上限）或選<strong>分離課稅</strong>（單一稅率 <strong>28%</strong>，常聽到的「分開算」那條路）。
        </p>
        <p>
          若用<strong>分離課稅 28%</strong>做「粗估」：30,000 × 28% = <strong>8,400</strong> 元。再把前面提到的補充保費一起納入想像，你會發現：實拿往往落在「兩萬多」這個區間——也就是互動題裡的 <strong>B</strong> 比較接近現實（但仍因個案而不同）。
        </p>

        <h3>（2）單筆 100,000 元：差距會被放大</h3>
        <p>
          同樣邏輯，100,000 元的補充保費試算：100,000 × 2.11% = <strong>2,110</strong> 元。
          若走<strong>分離課稅 28%</strong>，稅額試算：100,000 × 28% = <strong>28,000</strong> 元。
        </p>
        <p>
          但如果你是那種「綜合所得稅邊際稅率不高」的人，<strong>合併課稅</strong>有時會讓你透過<strong>股利抵減 8.5%</strong>，把可抵減稅額拉回一大截（每戶還有上限要留意）。換句話說：<strong>存股 稅</strong>這件事，不是單一公式，而是「你的整張所得拼圖」決定的。
        </p>

        <DividendTaxInteractive />

        {/* 4 工具導入 */}
        <h2>用數字把「焦慮」變成「可控」</h2>
        <p>
          講到這裡，你可能會想：「所以我到底少拿多少？離我的財富自由目標又差多少？」
        </p>
        <p className={styles.toolLine}>
          我們用這個<strong>財富自由計算機</strong>幫你算一次——不是要你更焦慮，而是把「稅、健保、再投入、目標」放在同一張圖上。
        </p>
        <div className={styles.callout}>
          <p>
            你可以同時試著看：<strong>財富自由目標</strong>、<strong>股利</strong>、<strong>稅金與補充保費想像</strong>、以及<strong>實拿金額</strong>對路徑的影響。它不是算命，是把你本來散落在腦袋裡的數字，拉回同一套假設裡。
          </p>
        </div>
        <p>
          把它當成「順手驗證」：你改一個假設，看曲線怎麼動；你會更清楚——<strong>財富自由 計算機</strong>這種工具，價值不在預言未來，而在讓你少猜、少賭氣。
        </p>
        <Link href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          開啟財富自由計算機（另開分頁）→
        </Link>

        {/* 5 合併 vs 分離 */}
        <h2>合併課稅 vs 分離課稅：先懂差異，再談選擇</h2>
        <p>
          <strong>合併課稅</strong>：股利併入綜所稅一起算，並可適用<strong>股利抵減 8.5%</strong>的可抵減稅額（每戶有上限）。適合與否，取決於你的邊際稅率、其他所得、扣除額與家庭狀況。
        </p>
        <p>
          <strong>分離課稅</strong>：股利用單一稅率 <strong>28%</strong> 分開算，不和其它所得混在一起用累進。聽起來很「直覺」，但對不少人來說——<strong>其實不一定划算</strong>。
        </p>
        <p>
          我想講得很直白：<strong>大部分人其實選錯</strong>，不是因為笨，而是因為每年報稅都像在趕作業，沒把「股利＋薪資＋其他」放進同一個情境裡比較。
        </p>

        {/* 6 放大差距 */}
        <h2>金額一拉開，你會很有感</h2>
        <p>
          延續前面的「教學用」方向：同樣 100,000 元股利，<strong>分離課稅 28%</strong>的稅負想像（28,000）與某些<strong>合併課稅</strong>情境下，透過<strong>股利抵減 8.5%</strong>後的淨稅負差距，常見可以拉到「一兩萬、甚至更高」的級距——這不是恐嚇，是制度下可能出現的<strong>結構性落差</strong>。
        </p>
        <p>
          你可以把它換算成心理帳：這等於你多領<strong>一到兩個月的「被動收入子彈」</strong>，結果在報稅選項上被擦掉。對正在累積資產的人來說，這種落差會直接影響你能不能再投入、能不能更快接近你想要的現金流。
        </p>

        {/* 7 拉回財富自由 */}
        <h2>節稅不是投機，是「把留下來的錢變大」</h2>
        <p>
          很多人談<strong>財富自由</strong>，都在找「更高殖利率、更飆的標的」。但對長期存股族來說，更重要的一句可能是：
        </p>
        <div className={styles.callout}>
          <p>
            <strong>不是賺更多，而是「留下更多」。</strong>
          </p>
        </div>
        <p>
          你把<strong>存股 稅</strong>、<strong>ETF 稅</strong>相關成本搞懂，不是為了走後門，而是讓你的被動收入曲線更貼近現實。當你「留下的錢」變多，複利才比較像複利，而不是被稅負默默打折。
        </p>

        {/* 8 再次互動 */}
        <h2>最後問你兩個問題</h2>
        <ul>
          <li>你去年實際領了多少<strong>股利</strong>（現金股利／配息）？</li>
          <li>你<strong>真的</strong>算過稅與補充保費後，實拿大概多少嗎？</li>
        </ul>
        <p>
          如果第二題你答不太出來，那很正常——但今年你可以換個做法：回到同一個頁面，把數字丟進去試算，讓工具幫你把「感覺」變成「區間」。
        </p>
        <p>
          👉 用<strong>財富自由計算機</strong>自己算一遍，你會更知道：你現在看到的被動收入，距離你想守住的自由，還差哪幾個假設。
        </p>
        <Link href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        {/* 9 結尾強句 */}
        <h2>一句話記住就好</h2>
        <p style={{ fontSize: "1.05rem", color: "var(--morandi-text, #f0ebe5)", fontWeight: 600 }}>
          你現在領到的錢，不一定是你「最後能留下」的錢；把稅與健保算進去，你的財富自由才會更接近真實。
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
      <ArticlePublishStamp publishAtIso={PUBLISH_AT_ISO} />
    </article>
  );
}
