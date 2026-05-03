"use client";

import Link from "next/link";

type QuickRoute = "/quick-1" | "/quick-2" | "/quick-3" | "/quick-4" | "/quick-5" | "/quick-6" | "/quick-7" | "/quick-8" | "/quick-9" | "/quick-10";

type QuickBlogLinksToggleProps = {
  quickRoute: QuickRoute;
  title?: string;
};

const QUICK_ROUTE_LINKS: Record<QuickRoute, readonly { href: string; title: string; description: string }[]> = {
  "/quick-1": [
    {
      href: "/mini-blog/quick1-monthly-20000-compound-playbook",
      title: "每月投入兩萬，20 年後會自由嗎？",
      description: "從月投與年數出發，看清可執行自由。",
    },
    {
      href: "/mini-blog/quick1-first-million-discipline-map",
      title: "第一個一百萬不是天分題，是節奏題",
      description: "先找能長期執行的投入節奏。",
    },
    {
      href: "/mini-blog/quick1-retirement-monthly-cashflow-baseline",
      title: "退休月領怎麼抓？先算底線版本",
      description: "從月領倒推月投與年數。",
    },
    {
      href: "/mini-blog/quick1-monthly-10000-vs-15000-gap",
      title: "月投一萬 vs 一萬五，差在哪？",
      description: "同一時間軸下看差距被放大。",
    },
    {
      href: "/mini-blog/quick1-bonus-lump-sum-yearly-plan",
      title: "年終獎金該花還是加碼？",
      description: "先算十年差距，再做決定。",
    },
    {
      href: "/mini-blog/quick1-salary-growth-stepup-plan",
      title: "加薪後月投該怎麼調才不崩？",
      description: "先求可持續，再求速度。",
    },
    {
      href: "/mini-blog/quick1-bear-market-keep-investing",
      title: "市場下跌還要繼續投入嗎？",
      description: "看懂停扣與持續投入的長期差。",
    },
    {
      href: "/mini-blog/quick1-inflation-adjusted-goals",
      title: "目標金額要不要算通膨？",
      description: "避免只看名目數字。",
    },
    {
      href: "/mini-blog/quick1-couple-joint-invest-plan",
      title: "伴侶理財常吵架？先看同一張圖",
      description: "對齊投入與年數期待。",
    },
    {
      href: "/mini-blog/quick1-late-start-catchup-strategy",
      title: "30 歲才開始會太晚嗎？",
      description: "晚開始也能追回節奏。",
    },
    {
      href: "/mini-blog/quick1-freelancer-irregular-income-plan",
      title: "收入不固定怎麼月投？",
      description: "接案族可執行的彈性版本。",
    },
    {
      href: "/mini-blog/quick1-parenting-education-retire-balance",
      title: "有小孩後，教育金和退休金怎麼平衡？",
      description: "先排序，才不會兩頭亂。",
    },
    {
      href: "/mini-blog/quick1-debt-first-or-invest-first",
      title: "先還債還是先投資？",
      description: "重點在比例，不是二選一。",
    },
    {
      href: "/mini-blog/quick1-year-end-rebalance-checklist",
      title: "年底理財健檢：每年一次就有感",
      description: "固定檢查三個關鍵數字。",
    },
    {
      href: "/mini-blog/quick1-emergency-fund-before-invest",
      title: "緊急預備金要先存嗎？",
      description: "先鋪安全墊，投資才不易中斷。",
    },
    {
      href: "/mini-blog/quick1-etf-dividend-reinvest-idea",
      title: "配息該花還是再投入？",
      description: "一個選擇，十年差很多。",
    },
    {
      href: "/mini-blog/quick1-target-30000-passive-income",
      title: "目標月領 3 萬，月投要多少？",
      description: "先看底線，再調投入或年數。",
    },
    {
      href: "/mini-blog/quick1-monthly-5min-review-system",
      title: "每月 5 分鐘理財檢查法",
      description: "流程化，才能長期不焦慮。",
    },
    {
      href: "/mini-blog/quick1-avoid-over-optimistic-return",
      title: "報酬率別一開始就填太高",
      description: "保守/中性/樂觀三版更務實。",
    },
    {
      href: "/mini-blog/quick1-build-30year-freedom-habit",
      title: "30 年自由靠的是習慣，不是運氣",
      description: "先守節奏，時間會放大結果。",
    },
  ],
  "/quick-2": [
    {
      href: "/mini-blog/quick2-freedom-countdown-target-years",
      title: "財富自由倒數計時器怎麼用？",
      description: "目標月領與月投入，如何對齊時間壓力。",
    },
    {
      href: "/mini-blog/quick2-monthly-40000-countdown",
      title: "月領 4 萬倒數怎麼抓？",
      description: "先看幾年達標，再談加碼。",
    },
    {
      href: "/mini-blog/quick2-monthly-50000-countdown",
      title: "目標月領 5 萬，年數為何差這麼多？",
      description: "同樣努力，不同起跑值。",
    },
    {
      href: "/mini-blog/quick2-monthly-60000-countdown",
      title: "月領 6 萬能追嗎？先看交換條件",
      description: "時間、投入、壓力要平衡。",
    },
    {
      href: "/mini-blog/quick2-raise-invest-or-extend-years",
      title: "該加碼還是延長年數？",
      description: "倒數計時器一看就懂。",
    },
    {
      href: "/mini-blog/quick2-first-10-years-gap",
      title: "前 10 年最容易放棄怎麼辦？",
      description: "先做可執行版本。",
    },
    {
      href: "/mini-blog/quick2-salary-plateau-countdown",
      title: "薪水卡住時怎麼重排路線？",
      description: "收入不變更要配好節奏。",
    },
    {
      href: "/mini-blog/quick2-double-income-household-target",
      title: "雙薪家庭如何定目標月領？",
      description: "先對齊共同時間軸。",
    },
    {
      href: "/mini-blog/quick2-single-income-pressure-map",
      title: "單薪壓力大？先找不爆表版本",
      description: "先活得下去，才走得下去。",
    },
    {
      href: "/mini-blog/quick2-bonus-allocation-countdown",
      title: "有獎金時怎麼縮短倒數最有感？",
      description: "一次加碼要放對位置。",
    },
    {
      href: "/mini-blog/quick2-lifestyle-upgrade-warning",
      title: "生活升級前，先看倒數會不會變遠",
      description: "收入增不一定更接近自由。",
    },
    {
      href: "/mini-blog/quick2-early-retire-vs-slower-path",
      title: "提早退休還是慢慢退？",
      description: "不只選年份，也在選節奏。",
    },
    {
      href: "/mini-blog/quick2-bear-market-delay-check",
      title: "市場下跌會讓倒數延長嗎？",
      description: "先把心理預期校正。",
    },
    {
      href: "/mini-blog/quick2-annual-review-reset-plan",
      title: "每年重算一次倒數，為何重要？",
      description: "不重算，計畫會過期。",
    },
    {
      href: "/mini-blog/quick2-40000-to-60000-upgrade-roadmap",
      title: "目標從 4 萬升到 6 萬怎麼調？",
      description: "升級目標也要升級節奏。",
    },
    {
      href: "/mini-blog/quick2-starting-late-with-high-goal",
      title: "晚開始又高目標，怎麼追？",
      description: "你需要策略，不是自責。",
    },
    {
      href: "/mini-blog/quick2-stress-free-monthly-input",
      title: "月投入要痛還是無痛？",
      description: "重點是長期平衡。",
    },
    {
      href: "/mini-blog/quick2-housing-cost-impact-countdown",
      title: "房租變動會影響退休倒數嗎？",
      description: "固定支出一變，整條軸會動。",
    },
    {
      href: "/mini-blog/quick2-family-support-pressure",
      title: "要支援家人時，倒數怎麼調？",
      description: "守責任也能守未來。",
    },
    {
      href: "/mini-blog/quick2-side-income-accelerator",
      title: "副業收入怎麼用最能縮短倒數？",
      description: "最怕額外收入只是額外花掉。",
    },
  ],
  "/quick-3": [
    {
      href: "/mini-blog/quick3-dream-monthly-income-simulator",
      title: "夢想月領試算器：先算再追夢",
      description: "先反推月投，再決定要調目標還是調年數。",
    },
    {
      href: "/mini-blog/quick3-monthly-30000-reverse-plan",
      title: "夢想月領 3 萬怎麼反推？",
      description: "先算月投，再談速度。",
    },
    {
      href: "/mini-blog/quick3-monthly-40000-reverse-plan",
      title: "夢想月領 4 萬：最常算錯哪裡？",
      description: "避免設定太理想。",
    },
    {
      href: "/mini-blog/quick3-monthly-50000-reverse-plan",
      title: "月領 5 萬反推後壓力有多大？",
      description: "先看可承受度。",
    },
    {
      href: "/mini-blog/quick3-monthly-60000-reverse-plan",
      title: "月領 6 萬可以追，但要先看代價",
      description: "時間、投入、壓力要平衡。",
    },
    {
      href: "/mini-blog/quick3-how-much-per-month-for-15-years",
      title: "15 年內達標要月投多少？",
      description: "縮短時間會提高投入。",
    },
    {
      href: "/mini-blog/quick3-how-much-per-month-for-20-years",
      title: "20 年反推：怎麼做才不自欺？",
      description: "先求可持續。",
    },
    {
      href: "/mini-blog/quick3-how-much-per-month-for-25-years",
      title: "25 年版本會不會輕鬆很多？",
      description: "有時延長年數更有效。",
    },
    {
      href: "/mini-blog/quick3-increase-goal-or-extend-years",
      title: "升目標還是延長年數？",
      description: "順序錯了容易崩。",
    },
    {
      href: "/mini-blog/quick3-salary-growth-reverse-strategy",
      title: "加薪後怎麼反推新目標？",
      description: "別讓升級消費吃掉加薪。",
    },
    {
      href: "/mini-blog/quick3-single-income-reverse-plan",
      title: "單薪版反推：如何不爆壓",
      description: "先守節奏再加速。",
    },
    {
      href: "/mini-blog/quick3-double-income-reverse-plan",
      title: "雙薪反推：怎麼對齊節奏",
      description: "同一張時間軸才有共識。",
    },
    {
      href: "/mini-blog/quick3-bonus-topup-reverse-plan",
      title: "有獎金時怎麼優化反推結果？",
      description: "一次加碼要加在對的位置。",
    },
    {
      href: "/mini-blog/quick3-late-start-reverse-path",
      title: "晚開始怎麼反推？",
      description: "晚不代表沒機會。",
    },
    {
      href: "/mini-blog/quick3-inflation-adjusted-monthly-goal",
      title: "月領目標要不要加通膨？",
      description: "名目好看不代表夠用。",
    },
    {
      href: "/mini-blog/quick3-risk-buffer-before-goal-upgrade",
      title: "升目標前先留緩衝",
      description: "不然很容易半路掉隊。",
    },
    {
      href: "/mini-blog/quick3-side-income-accelerate-goal",
      title: "副業收入怎麼用才會加速",
      description: "最怕只是額外花掉。",
    },
    {
      href: "/mini-blog/quick3-annual-reset-reverse-checklist",
      title: "每年一次反推重設清單",
      description: "不重設，計畫會脫節。",
    },
    {
      href: "/mini-blog/quick3-expense-cut-vs-income-rise",
      title: "省支出還是增收入比較快？",
      description: "重點是先後順序。",
    },
    {
      href: "/mini-blog/quick3-avoid-overoptimistic-goal-gap",
      title: "反推太樂觀會放大焦慮",
      description: "先誠實，再樂觀。",
    },
  ],
  "/quick-4": [
    {
      href: "/mini-blog/quick4-etf-monthly-income-simulator-guide",
      title: "ETF 月領試算器：先算現金流再配置",
      description: "從目標月領反推路線，避免只追高配息。",
    },
  ],
  "/quick-5": [
    {
      href: "/mini-blog/quick5-principal-vs-compound-reality",
      title: "雪球效應：本金 vs 複利，你在買時間",
      description: "看懂本金線與複利線的長期分岔。",
    },
    {
      href: "/mini-blog/quick5-first-100k-snowball-start",
      title: "第一個 10 萬怎麼開始滾",
      description: "最難在起步，先守節奏。",
    },
    {
      href: "/mini-blog/quick5-first-500k-compound-curve",
      title: "為什麼 50 萬前看起來很慢",
      description: "你其實正要進入加速區。",
    },
    {
      href: "/mini-blog/quick5-first-million-snowball-moment",
      title: "第一個 100 萬後，路線怎麼走",
      description: "到這裡才是真正有感。",
    },
    {
      href: "/mini-blog/quick5-10year-vs-20year-gap",
      title: "10 年 vs 20 年差距",
      description: "不是多 10 年而已。",
    },
    {
      href: "/mini-blog/quick5-20year-vs-30year-gap",
      title: "20 年 vs 30 年後段威力",
      description: "複利斜率常在後面爆發。",
    },
    {
      href: "/mini-blog/quick5-stop-investing-for-1year-impact",
      title: "中斷一年，長期代價有多大",
      description: "停一下可能差很多。",
    },
    {
      href: "/mini-blog/quick5-small-increase-big-longterm-gap",
      title: "每月多 1000，長期有感嗎",
      description: "微調也能放大結果。",
    },
    {
      href: "/mini-blog/quick5-monthly-10000-vs-12000",
      title: "月投 10000 vs 12000",
      description: "差的不只 2000。",
    },
    {
      href: "/mini-blog/quick5-monthly-15000-vs-20000",
      title: "月投 15000 vs 20000",
      description: "差距何時開始擴大？",
    },
    {
      href: "/mini-blog/quick5-lump-sum-plus-monthly-plan",
      title: "一次投入加月投怎麼配",
      description: "組合打法，重點在節奏。",
    },
    {
      href: "/mini-blog/quick5-bear-market-continue-or-stop",
      title: "下跌時停還是續投？",
      description: "先看長線再做決定。",
    },
    {
      href: "/mini-blog/quick5-inflation-vs-nominal-balance",
      title: "名目成長 vs 真實購買力",
      description: "數字有長不等於夠用。",
    },
    {
      href: "/mini-blog/quick5-expense-growth-eats-snowball",
      title: "支出長大會吃掉雪球速度",
      description: "先算才不會後知後覺。",
    },
    {
      href: "/mini-blog/quick5-salary-growth-boost-compound",
      title: "加薪後怎麼放大複利",
      description: "先分配，再加碼。",
    },
    {
      href: "/mini-blog/quick5-risk-buffer-before-acceleration",
      title: "加速前先放安全墊",
      description: "不中斷比更快更重要。",
    },
    {
      href: "/mini-blog/quick5-annual-rebalance-snowball-check",
      title: "每年一次雪球健檢",
      description: "校正路線比盯盤有用。",
    },
    {
      href: "/mini-blog/quick5-dividend-reinvest-snowball",
      title: "配息再投入的雪球差距",
      description: "看起來小，長期很關鍵。",
    },
    {
      href: "/mini-blog/quick5-why-time-beats-perfect-timing",
      title: "時間勝過完美進場",
      description: "長時間在場更務實。",
    },
    {
      href: "/mini-blog/quick5-build-30year-snowball-habit",
      title: "30 年雪球靠習慣",
      description: "習慣比天分更重要。",
    },
  ],
  "/quick-6": [
    {
      href: "/mini-blog/quick6-house-vs-invest-decision-map",
      title: "買房跟投資試算器：先看壓力",
      description: "同樣是資產，現金流體感可能完全不同。",
    },
  ],
  "/quick-7": [
    {
      href: "/mini-blog/quick7-car-vs-invest-decision-map",
      title: "買車跟投資試算器：先看代價",
      description: "一筆車款，可能換走十年的選擇權。",
    },
  ],
  "/quick-8": [
    {
      href: "/mini-blog/quick8-delay-gratification-simulator-guide",
      title: "延遲享樂模擬器：晚點花差多少？",
      description: "先看可投資金額，再決定現在就買。",
    },
  ],
  "/quick-9": [
    {
      href: "/mini-blog/quick9-delay-spending-value-calculator-guide",
      title: "延遲消費價值計算機：重算每次刷卡",
      description: "3/5/10 年切換，看清消費機會成本。",
    },
  ],
  "/quick-10": [
    {
      href: "/mini-blog/quick10-asset-stress-test-simulator-guide",
      title: "資產抗壓模擬器：逆風也要能走",
      description: "先測脆弱點，再調整可持續策略。",
    },
  ],
};

export function QuickBlogLinksToggle({ quickRoute, title = "📚 本台小計算機延伸文章（點我展開）" }: QuickBlogLinksToggleProps) {
  const links = QUICK_ROUTE_LINKS[quickRoute];
  return (
    <details
      className="quick-blog-links-toggle"
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.16)",
        padding: 12,
      }}
    >
      <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 900, color: "rgba(226,232,240,0.98)" }}>{title}</summary>
      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.55)",
              padding: "10px 12px",
              textDecoration: "none",
              color: "#e8eefc",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.45 }}>{item.title}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "rgba(191,219,254,0.92)", lineHeight: 1.45 }}>{item.description}</div>
          </Link>
        ))}
      </div>
    </details>
  );
}
