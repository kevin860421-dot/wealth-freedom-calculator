"use client";

import Link from "next/link";
import {
  getQuick1ExclusivePostBySlug,
  isQuick1ExclusivePostPublished,
  QUICK11_ROUTE_LINK_ITEMS,
} from "../mini-blog/posts/quick1-exclusive";
import { QUICK12_ROUTE_LINK_ITEMS } from "../mini-blog/posts/quick12-posts-2-100";

type QuickRoute =
  | "/quick-1"
  | "/quick-2"
  | "/quick-3"
  | "/quick-4"
  | "/quick-5"
  | "/quick-6"
  | "/quick-7"
  | "/quick-8"
  | "/quick-9"
  | "/quick-10"
  | "/quick-11"
  | "/quick-12";

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
      title: "ETF 領息夢想模擬器：先看每月現金流",
      description: "先校準可月領，再談報酬想像。",
    },
    {
      href: "/mini-blog/quick4-first-10000-dividend-milestone",
      title: "月領 1 萬門檻怎麼拆",
      description: "先看第幾期，別只看終點。",
    },
    {
      href: "/mini-blog/quick4-monthly-20000-dividend-blueprint",
      title: "月領 2 萬路線圖",
      description: "投入、年數、節奏一起看。",
    },
    {
      href: "/mini-blog/quick4-monthly-30000-dividend-reality-check",
      title: "月領 3 萬現實校正",
      description: "先確認現金流能不能撐住。",
    },
    {
      href: "/mini-blog/quick4-which-period-can-i-start-withdraw",
      title: "第幾期可以開始領息",
      description: "直接用期別選擇看答案。",
    },
    {
      href: "/mini-blog/quick4-dividend-frequency-monthly-vs-quarterly",
      title: "月配 vs 季配差異",
      description: "重點在你每月現金流體感。",
    },
    {
      href: "/mini-blog/quick4-reinvest-vs-cashout-dividend-choice",
      title: "配息再投入或領出",
      description: "兩條路會慢慢分岔。",
    },
    {
      href: "/mini-blog/quick4-tax-fee-impact-on-dividend-cashflow",
      title: "稅費對領息的真實影響",
      description: "別只看稅前殖利率。",
    },
    {
      href: "/mini-blog/quick4-0050-vs-high-dividend-etf-cashflow",
      title: "0050 vs 高股息 ETF",
      description: "先比現金流穩定度。",
    },
    {
      href: "/mini-blog/quick4-year-month-selector-practical-planning",
      title: "年份月份怎麼選最實用",
      description: "直接對應未來生活節點。",
    },
    {
      href: "/mini-blog/quick4-late-start-dividend-catchup-plan",
      title: "晚開始怎麼追領息目標",
      description: "先做可持續版本。",
    },
    {
      href: "/mini-blog/quick4-salary-growth-dividend-stepup",
      title: "加薪後如何加速領息",
      description: "先加穩，再加快。",
    },
    {
      href: "/mini-blog/quick4-single-income-dividend-safety-margin",
      title: "單薪族領息安全邊際",
      description: "不中斷比衝太快重要。",
    },
    {
      href: "/mini-blog/quick4-couple-dividend-goal-alignment",
      title: "伴侶領息目標怎麼對齊",
      description: "同一時間軸比較不會吵。",
    },
    {
      href: "/mini-blog/quick4-bonus-topup-dividend-acceleration",
      title: "獎金加碼怎麼放最有感",
      description: "加在對的期數更有效。",
    },
    {
      href: "/mini-blog/quick4-dividend-vs-selling-shares-cashflow",
      title: "領息 vs 賣股換現金流",
      description: "兩者邏輯要分開看。",
    },
    {
      href: "/mini-blog/quick4-stress-test-dividend-during-drawdown",
      title: "回檔時領息計畫怎麼守",
      description: "先有逆風劇本。",
    },
    {
      href: "/mini-blog/quick4-annual-reset-dividend-plan-checklist",
      title: "每年重設領息計畫清單",
      description: "參數要跟現況一起更新。",
    },
    {
      href: "/mini-blog/quick4-export-excel-compare-two-scenarios",
      title: "匯出 Excel 比兩套路線",
      description: "一次只改一個變數最好。",
    },
    {
      href: "/mini-blog/quick4-build-30year-dividend-discipline",
      title: "30 年領息紀律怎麼養",
      description: "靠流程，不靠情緒。",
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
      href: "/mini-blog/quick6-leverage-choice-property-vs-global-stocks",
      title: "槓桿抉擇：房產 vs 全球股市",
      description: "先看現金流壓力，再看報酬想像。",
    },
    {
      href: "/mini-blog/quick6-rent-vs-buy-cashflow-truth",
      title: "租房還是買房：先看真實現金流",
      description: "先看可持續，再談立場。",
    },
    {
      href: "/mini-blog/quick6-down-payment-vs-monthly-invest-gap",
      title: "頭期款 vs 分批投入差在哪",
      description: "一次決策會改寫十年彈性。",
    },
    {
      href: "/mini-blog/quick6-interest-rate-shock-stress-test",
      title: "利率上升，你的路線撐得住嗎",
      description: "壓力測試比樂觀假設重要。",
    },
    {
      href: "/mini-blog/quick6-15year-vs-30year-loan-impact",
      title: "房貸 15 年 vs 30 年",
      description: "重點是可持續，不是逞強。",
    },
    {
      href: "/mini-blog/quick6-home-ownership-cost-hidden-list",
      title: "買房最常漏算的持有成本",
      description: "漏一筆，整條路會失真。",
    },
    {
      href: "/mini-blog/quick6-liquidity-trap-property-heavy-portfolio",
      title: "資產都在房子裡的流動性陷阱",
      description: "看起來有資產，不等於可動用。",
    },
    {
      href: "/mini-blog/quick6-first-home-or-first-million",
      title: "先買房還是先存第一桶金",
      description: "先後順序很關鍵。",
    },
    {
      href: "/mini-blog/quick6-couple-buy-home-invest-balance",
      title: "伴侶買房與投資怎麼平衡",
      description: "先對齊，才不內耗。",
    },
    {
      href: "/mini-blog/quick6-single-income-mortgage-pressure-map",
      title: "單薪房貸壓力地圖",
      description: "先不爆，再求快。",
    },
    {
      href: "/mini-blog/quick6-inflation-helps-or-hurts-home-buyer",
      title: "通膨到底幫不幫買房族",
      description: "取決於你的現金流體質。",
    },
    {
      href: "/mini-blog/quick6-global-etf-vs-local-property-bias",
      title: "本地房產偏誤 vs 全球股市",
      description: "熟悉感不等於最適解。",
    },
    {
      href: "/mini-blog/quick6-bear-market-while-paying-mortgage",
      title: "繳房貸時遇股市回檔怎麼守",
      description: "先有逆風劇本，才不亂改。",
    },
    {
      href: "/mini-blog/quick6-bonus-use-prepay-or-invest",
      title: "獎金先還貸還是先投資",
      description: "買安心還是買時間？",
    },
    {
      href: "/mini-blog/quick6-career-risk-and-mortgage-commitment",
      title: "工作不穩時的房貸承諾",
      description: "承諾大小要配風險承受度。",
    },
    {
      href: "/mini-blog/quick6-rebalance-after-buying-property",
      title: "買房後為何要重配資產",
      description: "風險結構已經改變。",
    },
    {
      href: "/mini-blog/quick6-retire-with-mortgage-plan",
      title: "退休前房貸未清怎麼規劃",
      description: "關鍵在現金流可承受。",
    },
    {
      href: "/mini-blog/quick6-property-upgrade-vs-portfolio-growth",
      title: "升級房子還是升級投資",
      description: "每次升級都有機會成本。",
    },
    {
      href: "/mini-blog/quick6-why-cashflow-beats-paper-wealth",
      title: "現金流為何勝過帳面富有",
      description: "活得穩，才走得遠。",
    },
    {
      href: "/mini-blog/quick6-build-30year-leverage-discipline",
      title: "30 年槓桿紀律路線",
      description: "不是衝動，而是長期校正。",
    },
  ],
  "/quick-7": [
    {
      href: "/mini-blog/quick7-leverage-choice-mortgage-vs-global-stocks",
      title: "買車還是存股？先看月付",
      description: "車貸路線 vs 直接投資。",
    },
    {
      href: "/mini-blog/quick7-rent-or-buy-global-portfolio-balance",
      title: "現金買車、車貸或先存股",
      description: "三條路怎麼比。",
    },
    {
      href: "/mini-blog/quick7-mortgage-term-20-vs-30-impact",
      title: "車貸 3／5／7 年怎麼選",
      description: "差的不只總利息。",
    },
    {
      href: "/mini-blog/quick7-down-payment-vs-dca-global-etf",
      title: "頭期款 vs 分批 ETF",
      description: "複利不會等你。",
    },
    {
      href: "/mini-blog/quick7-rate-hike-risk-check",
      title: "車貸利率調高怎麼辦",
      description: "先做壓力檢查。",
    },
    {
      href: "/mini-blog/quick7-single-income-mortgage-survival-map",
      title: "單薪背車貸生存地圖",
      description: "先不爆，再存股。",
    },
    {
      href: "/mini-blog/quick7-double-income-home-invest-strategy",
      title: "雙薪買車＋存股對齊",
      description: "先對齊月付。",
    },
    {
      href: "/mini-blog/quick7-bonus-prepay-or-invest-global",
      title: "獎金先還車貸還是投資",
      description: "買無債還是買時間。",
    },
    {
      href: "/mini-blog/quick7-liquidity-buffer-before-leverage",
      title: "辦車貸前的緩衝金",
      description: "留修車與失業空檔。",
    },
    {
      href: "/mini-blog/quick7-home-ownership-hidden-costs",
      title: "養車隱形成本清單",
      description: "付得起≠養得起。",
    },
    {
      href: "/mini-blog/quick7-property-concentration-risk",
      title: "資產卡在車上的風險",
      description: "車會折舊。",
    },
    {
      href: "/mini-blog/quick7-bear-market-while-paying-mortgage",
      title: "繳車貸遇股災怎麼守",
      description: "別亂停扣。",
    },
    {
      href: "/mini-blog/quick7-career-uncertainty-and-mortgage",
      title: "工作不穩還能貸款買車嗎",
      description: "月付要配收入。",
    },
    {
      href: "/mini-blog/quick7-inflation-and-mortgage-choice",
      title: "通膨下還要買新車嗎",
      description: "先看真實壓力。",
    },
    {
      href: "/mini-blog/quick7-global-diversification-vs-local-home-bias",
      title: "買車情緒 vs 全球分散",
      description: "別把投資也鎖本地。",
    },
    {
      href: "/mini-blog/quick7-retire-with-mortgage-plan",
      title: "退休前還在繳車貸",
      description: "看可承受月付。",
    },
    {
      href: "/mini-blog/quick7-asset-rebalance-after-home-buy",
      title: "買車後資產重配",
      description: "月付結構已變。",
    },
    {
      href: "/mini-blog/quick7-upgrade-home-vs-upgrade-portfolio",
      title: "換新車還是加碼投資",
      description: "升級有機會成本。",
    },
    {
      href: "/mini-blog/quick7-cashflow-first-paper-wealth-second",
      title: "現金流優先於帳面",
      description: "車貸會先教會你。",
    },
    {
      href: "/mini-blog/quick7-build-30year-leverage-discipline",
      title: "車貸＋存股長期紀律",
      description: "持續校正。",
    },
  ],
  "/quick-8": [
    {
      href: "/mini-blog/quick8-delay-gratification-simulator-guide",
      title: "延遲享樂計算機：晚點花差多少？",
      description: "先看可投資金額，再決定現在就買。",
    },
    {
      href: "/mini-blog/quick8-installment-vs-invest-3000-gap",
      title: "每月分期 3000 的長期差距",
      description: "小額固定支出也很關鍵。",
    },
    {
      href: "/mini-blog/quick8-installment-vs-invest-5000-gap",
      title: "每月分期 5000 vs 每月投資",
      description: "差距可以被量化。",
    },
    {
      href: "/mini-blog/quick8-new-phone-now-or-later",
      title: "手機現在換還是晚一年",
      description: "先看曲線再決定。",
    },
    {
      href: "/mini-blog/quick8-subscription-creep-vs-freedom-speed",
      title: "訂閱膨脹拖慢自由速度",
      description: "總和比單筆更可怕。",
    },
    {
      href: "/mini-blog/quick8-weekend-shopping-habit-audit",
      title: "週末慣性購物檢查",
      description: "小習慣長期很有感。",
    },
    {
      href: "/mini-blog/quick8-couple-spending-alignment-framework",
      title: "伴侶消費觀怎麼對齊",
      description: "先有同一張圖。",
    },
    {
      href: "/mini-blog/quick8-year-end-sale-trap-analysis",
      title: "年底促銷到底有沒有賺",
      description: "便宜不一定划算。",
    },
    {
      href: "/mini-blog/quick8-bonus-spend-or-invest-split",
      title: "獎金要花還是投資",
      description: "關鍵在分配規則。",
    },
    {
      href: "/mini-blog/quick8-travel-budget-vs-longterm-assets",
      title: "旅行預算和長期資產平衡",
      description: "享受與規劃可以並存。",
    },
    {
      href: "/mini-blog/quick8-lifestyle-upgrade-timing-choice",
      title: "生活升級要不要晚一年",
      description: "時間是便宜槓桿。",
    },
    {
      href: "/mini-blog/quick8-emotion-buying-cooldown-system",
      title: "情緒購物冷卻系統",
      description: "流程比意志力可靠。",
    },
    {
      href: "/mini-blog/quick8-credit-card-installment-hidden-cost",
      title: "信用卡分期隱形成本",
      description: "無痛常是最痛。",
    },
    {
      href: "/mini-blog/quick8-low-buy-impulse-high-invest-routine",
      title: "降低衝動提高投入習慣",
      description: "把行為變成系統。",
    },
    {
      href: "/mini-blog/quick8-pay-yourself-first-delay-gratification",
      title: "先支付自己再消費",
      description: "順序一改，結果就變。",
    },
    {
      href: "/mini-blog/quick8-family-budget-priority-map",
      title: "家庭預算優先順序地圖",
      description: "先排序再分配。",
    },
    {
      href: "/mini-blog/quick8-side-income-do-not-inflate-lifestyle",
      title: "副業收入別膨脹生活",
      description: "額外收入是加速器。",
    },
    {
      href: "/mini-blog/quick8-minimalism-vs-consumption-balance",
      title: "極簡與消費如何平衡",
      description: "重點是可持續。",
    },
    {
      href: "/mini-blog/quick8-annual-reset-delay-gratification-plan",
      title: "每年重設延遲享樂計畫",
      description: "不重設會過期。",
    },
    {
      href: "/mini-blog/quick8-build-30year-delay-gratification-habit",
      title: "30 年延遲享樂習慣",
      description: "小習慣累積大結果。",
    },
  ],
  "/quick-9": [
    {
      href: "/mini-blog/quick9-delay-spending-value-calculator-guide",
      title: "延遲享樂計算機 2：重算每次刷卡",
      description: "3/5/10 年切換，看清消費機會成本。",
    },
    {
      href: "/mini-blog/quick9-3year-5year-10year-compare",
      title: "3年/5年/10年幅度比較",
      description: "年限一換，答案就變。",
    },
    {
      href: "/mini-blog/quick9-buy-now-vs-buy-later-laptop-case",
      title: "筆電現在買或延後買",
      description: "用數字取代直覺。",
    },
    {
      href: "/mini-blog/quick9-installment-or-cash-global-invest-impact",
      title: "分期或現金差在哪",
      description: "付款方式會改變路線。",
    },
    {
      href: "/mini-blog/quick9-impulse-purchase-cooldown-72h",
      title: "72 小時冷卻機制",
      description: "流程化降低衝動購買。",
    },
    {
      href: "/mini-blog/quick9-monthly-wants-budget-cap-system",
      title: "想要型支出上限系統",
      description: "設上限是保留選擇權。",
    },
    {
      href: "/mini-blog/quick9-credit-card-points-vs-real-cost",
      title: "回饋 vs 真實成本",
      description: "別被回饋推著多花。",
    },
    {
      href: "/mini-blog/quick9-year-end-discount-vs-longterm-value",
      title: "折扣 vs 長期價值",
      description: "便宜不一定划算。",
    },
    {
      href: "/mini-blog/quick9-subscription-stack-cleanup-plan",
      title: "訂閱堆疊清理流程",
      description: "砍對比砍多更重要。",
    },
    {
      href: "/mini-blog/quick9-iphone-upgrade-cycle-choice",
      title: "手機升級週期選擇",
      description: "延後一年差很多。",
    },
    {
      href: "/mini-blog/quick9-car-upgrade-delay-value",
      title: "車子升級延後價值",
      description: "晚一點未必吃虧。",
    },
    {
      href: "/mini-blog/quick9-home-appliance-replace-or-repair",
      title: "家電換新或維修",
      description: "先看總成本再決定。",
    },
    {
      href: "/mini-blog/quick9-side-income-spend-or-invest-rule",
      title: "副業收入花或投規則",
      description: "沒規則就難留住錢。",
    },
    {
      href: "/mini-blog/quick9-couple-big-ticket-decision-framework",
      title: "伴侶大額消費決策框架",
      description: "先對齊再決定。",
    },
    {
      href: "/mini-blog/quick9-family-consumption-priority-order",
      title: "家庭消費優先順序",
      description: "排序比節省更重要。",
    },
    {
      href: "/mini-blog/quick9-buy-experience-or-buy-asset-balance",
      title: "買體驗或買資產平衡",
      description: "重點在比例設計。",
    },
    {
      href: "/mini-blog/quick9-annual-reset-consumption-value-map",
      title: "年度消費價值重設",
      description: "不重設會過期。",
    },
    {
      href: "/mini-blog/quick9-low-consumption-high-freedom-routine",
      title: "低消費高自由習慣",
      description: "少衝動，多選擇。",
    },
    {
      href: "/mini-blog/quick9-avoid-lifestyle-inflation-checklist",
      title: "避免生活膨脹清單",
      description: "加薪別只加開銷。",
    },
    {
      href: "/mini-blog/quick9-build-30year-delay-spending-discipline",
      title: "30年延遲消費紀律",
      description: "小選擇累積大差距。",
    },
  ],
  "/quick-10": [
    {
      href: "/mini-blog/quick10-compound-dream-vs-crash-reality-guide",
      title: "複利美夢 VS 崩盤現實",
      description: "順風好看，逆風更該先看。",
    },
    {
      href: "/mini-blog/quick10-if-crash-hits-last-year-what-happens",
      title: "崩盤發生在最後一年",
      description: "接近終點更怕時序風險。",
    },
    {
      href: "/mini-blog/quick10-20percent-drop-stress-case",
      title: "-20% 回檔壓力測試",
      description: "先演練中度回檔。",
    },
    {
      href: "/mini-blog/quick10-30percent-drop-stress-case",
      title: "-30% 修正情境",
      description: "情緒分水嶺要先看。",
    },
    {
      href: "/mini-blog/quick10-40percent-drop-stress-case",
      title: "-40% 崩盤極端版本",
      description: "先看最壞再談最好。",
    },
    {
      href: "/mini-blog/quick10-withdrawal-need-during-crash",
      title: "崩盤時剛好要用錢",
      description: "提款需求會放大風險。",
    },
    {
      href: "/mini-blog/quick10-emergency-fund-before-risk-assets",
      title: "預備金先於風險資產",
      description: "避免低點被迫賣出。",
    },
    {
      href: "/mini-blog/quick10-sequence-risk-for-near-retire",
      title: "接近退休的時序風險",
      description: "順序比平均值更重要。",
    },
    {
      href: "/mini-blog/quick10-sell-in-panic-vs-hold-discipline",
      title: "恐慌賣出 vs 紀律持有",
      description: "長期差距常在行為。",
    },
    {
      href: "/mini-blog/quick10-recovery-years-after-big-drawdown",
      title: "大跌後回本要幾年",
      description: "回本時間別估太快。",
    },
    {
      href: "/mini-blog/quick10-asset-allocation-under-crash",
      title: "崩盤下配置比例怎麼看",
      description: "先求活下來再求快。",
    },
    {
      href: "/mini-blog/quick10-hedge-cash-bond-equity-balance",
      title: "現金債股平衡設計",
      description: "平衡是韌性來源。",
    },
    {
      href: "/mini-blog/quick10-income-stability-vs-risk-capacity",
      title: "收入穩定度與風險承受",
      description: "現金流條件決定配置。",
    },
    {
      href: "/mini-blog/quick10-job-loss-plus-market-crash-plan",
      title: "失業加崩盤雙壓力",
      description: "要有雙重逆風預案。",
    },
    {
      href: "/mini-blog/quick10-family-protection-during-drawdown",
      title: "家庭責任下的防線",
      description: "先保護現金流。",
    },
    {
      href: "/mini-blog/quick10-annual-crash-rehearsal-checklist",
      title: "年度崩盤演練清單",
      description: "沒演練就容易慌。",
    },
    {
      href: "/mini-blog/quick10-avoid-overoptimistic-return-setting",
      title: "避免過度樂觀報酬",
      description: "先務實再追快。",
    },
    {
      href: "/mini-blog/quick10-sleep-well-portfolio-design",
      title: "睡得著的投資組合",
      description: "能持有才是好配置。",
    },
    {
      href: "/mini-blog/quick10-build-30year-antifragile-habit",
      title: "30年抗脆弱習慣",
      description: "流程化撐過逆風。",
    },
    {
      href: "/mini-blog/quick10-crash-reality-longterm-discipline",
      title: "崩盤現實下長期紀律",
      description: "下一次大跌照流程走。",
    },
  ],
  /** 第 1～100 篇資料源 {@link QUICK11_ROUTE_LINK_ITEMS}；折疊區僅顯示已到 publishAtIso 的項目（本機 dev／Vercel Preview 可略過排程）。 */
  "/quick-11": QUICK11_ROUTE_LINK_ITEMS,
  /** 第 1～100 篇資料源 {@link QUICK12_ROUTE_LINK_ITEMS}；5/15 起每日 1～3 檔、時刻錯開 */
  "/quick-12": QUICK12_ROUTE_LINK_ITEMS,
};

export function QuickBlogLinksToggle({ quickRoute, title = "📚 本台小計算機延伸文章（點我展開）" }: QuickBlogLinksToggleProps) {
  const links = QUICK_ROUTE_LINKS[quickRoute].filter((item) => {
    const slug = item.href.replace(/^\/mini-blog\//, "");
    const post = getQuick1ExclusivePostBySlug(slug);
    if (!post) return false;
    return isQuick1ExclusivePostPublished(post.publishAtIso);
  });
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
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gap: 8,
          ...(quickRoute === "/quick-11" || quickRoute === "/quick-12"
            ? { maxHeight: "min(70vh, 520px)", overflowY: "auto", paddingRight: 4 }
            : {}),
        }}
      >
        {links.length === 0 ? (
          <div style={{ borderRadius: 10, border: "1px dashed rgba(148,163,184,0.35)", padding: "10px 12px", color: "rgba(191,219,254,0.92)", fontSize: 12 }}>
            文章排程中，尚未到公開時間。
          </div>
        ) : null}
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
