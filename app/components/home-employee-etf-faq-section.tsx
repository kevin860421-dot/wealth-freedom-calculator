"use client";

import { HomeFooterMobileExpand } from "./home-footer-mobile-expand";
import styles from "./home-employee-etf-faq-section.module.css";

const FAQ_ITEMS = [
  {
    title: "問題一：00878、00919 存到幾張可以退休？如何規劃月領 3 萬被動收入？",
    body: "很多年輕上班族常搜尋 00878 存到幾張可以退休。以目標月領 3 萬高股息為例，利用本站的 ETF 複利計算機，輸入每月定期定額一萬，系統會自動幫你試算除權息股利再投入後，需要多少張數與達標年期才能完成小資族被動收入規劃。",
  },
  {
    title: "問題二：00929 與高股息 ETF 的二代健保免扣門檻（2萬元）怎麼算？",
    body: "單期配息超過 2 萬元就會被扣 2.11% 的二代健保補充保費。存股族在網上瘋傳的 00929 二代健保免扣門檻，關鍵在於搞懂 54C 應稅股利占比。本大計算機直接幫你把 54C 占比、8.5% 抵減稅額與二代健保門檻鎖定，輸入預計持有張數即可精準進行壓力測試，避免股利被稅費白白吃掉。",
  },
  {
    title: "問題三：長期投資存股，選 0050 定期定額還是買正二（00631R）開槓桿？",
    body: "在 PTT 與論壇上熱議的 0050 定期定額試算與正二（00631R）槓桿流抉擇，核心差異在於稅務流失。00631R 台灣50正2屬於期貨型 ETF 不發股利，能做到 54C 占比為 0% 且免疫二代健保。在本工具中，你可以將兩者下修報酬率進行壓力測試，看看到底誰的實質複利資產成長最驚人。",
  },
  {
    title: "問題四：手上有閒錢，應該先還清房貸、信貸，還是拿去買 ETF 定期定額存股？",
    body: "這在理財社群上是天天熱議的話題。許多人搜尋「有錢先還房貸還是存股」或「借信貸買 00878 划算嗎」。核心關鍵在於你的實質利差空間。利用本站的槓桿抉擇計算機，你可以輸入貸款利率與 ETF 預估報酬率，它會自動幫你扣除台灣的股利所得稅與二代健保費，幫你精準評估利用低利貸款進行套利是否真的具備實質利差，避免盲目開槓桿導致財務翻車。",
  },
  {
    title: "問題五：高股息 ETF 換成月配息（如 00929）或季配息，頻繁配息會有哪些缺點？",
    body: "配息頻率越高（例如從半年配改成月配息），每次配息被銀行扣除的匯費與股利再投入的手續費次數就越多。網路上常有人搜尋「月配息缺點」與「手續費損耗」，本萬萬稅計算機直接將配息頻率與每期扣除資金明細化。如果每期定期定額投入的金額不夠大，頻繁配息產生的摩擦成本會嚴重吃掉你的複利速度，你必須看扣完稅費後的再投入，才是最真實的財富自由年期。",
  },
] as const;

/**
 * 首頁 FAQ：桌機完整五題；手機可展開全文。
 */
export function HomeEmployeeEtfFaqSection() {
  return (
    <section className={styles.root} aria-labelledby="employee-etf-faq-heading">
      <h2 id="employee-etf-faq-heading" className={styles.title}>
        上班族最常搜尋的 ETF 存股常見問題 (FAQ)
      </h2>
      <p className={styles.intro}>
        這裡不談空泛理財雞湯，只整理上班族做 ETF 存股、月領被動收入、二代健保與正二槓桿試算時，最容易算錯的五個問題。
      </p>

      <HomeFooterMobileExpand expandLabel="展開常見問題 ▼" collapseLabel="收合常見問題 ▲">
        <ol className={styles.list}>
          {FAQ_ITEMS.map((item) => (
            <li key={item.title} className={styles.item}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemBody}>{item.body}</p>
            </li>
          ))}
        </ol>
      </HomeFooterMobileExpand>
    </section>
  );
}
