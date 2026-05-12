import type { ExtendedSeriesPost } from "./series-post-types";

export type { ExtendedSection, ExtendedSeriesPost } from "./series-post-types";

import { FIRE_SEO_LONGTAIL_2026_POSTS } from "./fire-seo-longtail-2026-posts";

const LEGACY_EXTENDED_SERIES_POSTS: ExtendedSeriesPost[] = [
  {
    slug: "duel-iphone15-buy-or-invest",
    seriesNo: 19,
    seriesLabel: "實戰對決",
    title: "【對決】換 iPhone 15 是痛還是致命？",
    subtitle: "你以為差一點點，拉到四年時間軸後，差的是退休彈性。",
    seoTitle: "換 iPhone 15 還是投資 ETF？四年總資產差距試算｜財富自由計算機",
    metaDescription:
      "以分期付款、手續費、複利試算比較：換 iPhone 15 與定投 ETF 四年後差多少。用數據看即時消費與延遲享樂。",
    calculatorRoute: "/quick-8",
    calculatorTitle: "小計算機內嵌：消費對複利侵蝕試算",
    calculatorNote: "適合這題，因為核心是『每月固定支出』對長期本金的侵蝕速度。",
    sections: [
      {
        heading: "先算現金流，不是先選顏色",
        paragraphs: [
          "買手機最容易忽略的不是價格，而是你把未來 24 到 36 個月的現金流先綁住。",
          "當你有分期付款，市場下跌時你更難加碼；這個機會成本，才是最貴的部分。",
        ],
        bullets: ["核心關鍵字：車貸試算、複利試算、延遲享樂", "長尾關鍵字：iPhone 分期划算嗎"],
      },
      {
        heading: "四年不是很久，但足夠讓差距成形",
        paragraphs: [
          "用每月同額資金比較：一條走消費，一條走定投。你會看到最明顯的差異不是總投入，而是再投入次數。",
          "每少一次再投入，複利就少一層。這就是『看起來只差幾千，最後差幾十萬』的原因。",
        ],
      },
    ],
    closeQuestion: "如果你把下一次換機延後 12 個月，你會把那筆錢拿去投資還是留現金？",
    disclaimer: "本文為情境試算分享，非投資建議；實際報酬、費用與稅務請以個人條件與法規為準。",
  },
  {
    slug: "mercedes-monthly-10000-cost",
    seriesNo: 20,
    seriesLabel: "實戰對決",
    title: "學弟的賓士夢：月付一萬的背後是千萬代價",
    subtitle: "問題不是車，而是你是否知道『每月一萬』放到 20 年後代表什麼。",
    seoTitle: "每月存一萬 20 年會變多少？買車 vs 投資總資產比較｜財富自由計算機",
    metaDescription:
      "比較買車貸款與每月一萬定投兩條路，解析複利試算、手續費、資產終值差距。適合想評估買車預算工具的人。",
    calculatorRoute: "/quick-9",
    calculatorTitle: "小計算機內嵌：每月一萬長期差距",
    calculatorNote: "這台能快速看固定扣款在不同年化假設下，20 年會拉開多大差距。",
    sections: [
      {
        heading: "月付一萬最容易被低估",
        paragraphs: [
          "因為它在當下看起來很小，像訂閱一樣無感。",
          "但長期規劃最怕這種無感支出，它會默默吃掉你的再投入能力。",
        ],
        bullets: ["核心關鍵字：買車預算試算工具、財富自由路徑", "長尾關鍵字：每個月存一萬十年後多少"],
      },
      {
        heading: "你買的不是車，是未來二十年的選擇權",
        paragraphs: [
          "若同時有房租、家庭支出、保險，這筆月付會直接壓縮你的安全緩衝。",
          "FIRE 規劃不是反對享受，而是先讓數字告訴你：現在花，未來少多少。",
        ],
      },
    ],
    closeQuestion: "你願意為了開心 5 年，交換掉 20 年後更大的選擇權嗎？",
    disclaimer: "本文為一般情境示意，非投資或購車建議；實際結果受報酬率、費用與個人現金流影響。",
  },
  {
    slug: "market-crash-20000-bankrupt",
    seriesNo: 21,
    seriesLabel: "實戰對決",
    title: "如果大盤跌回兩萬點，我會破產嗎？",
    subtitle: "先看你每期扣除後還剩多少，再談你扛不扛得住崩盤。",
    seoTitle: "大盤崩盤資產縮水多少？跌到兩萬點壓力測試｜財富自由計算機",
    metaDescription:
      "用崩盤情境測試資產抗壓能力：若指數跌回兩萬點，投入本金、順風資產與崩盤後底氣會如何變化。",
    calculatorRoute: "/quick-10",
    calculatorTitle: "小計算機內嵌：大盤崩盤資產抗壓模擬",
    calculatorNote: "這題最適合第十台，因為它直接看順風與崩盤兩條線的差距。",
    sections: [
      {
        heading: "恐慌來時，現金流比報酬率更重要",
        paragraphs: [
          "很多人說自己長期投資，但一遇到大跌就停止投入。不是策略錯，是現金流設計太脆弱。",
          "你要先知道每期扣除之後還能投入多少，這才是能不能活過熊市的關鍵。",
        ],
        bullets: ["核心關鍵字：大盤崩盤資產縮水多少", "長尾關鍵字：如果大盤跌兩萬點我會破產嗎"],
      },
      {
        heading: "把最壞情境先寫進計畫",
        paragraphs: [
          "試算時先看最壞，再看中性。若最壞都能接受，中性通常只會更輕鬆。",
          "這樣做不是悲觀，而是讓你在崩盤當下不用靠情緒決策。",
        ],
      },
    ],
    closeQuestion: "若明天就大跌，你的計畫是『停扣』還是『照扣』？",
    disclaimer: "本文僅為市場風險情境模擬，非投資建議；市場波動與個人資金配置請審慎評估。",
  },
  {
    slug: "rent-vs-buy-asset-truth",
    seriesNo: 22,
    seriesLabel: "實戰對決",
    title: "不買房真的會比較有錢？數據告訴你真相",
    subtitle: "租屋與買房不是立場戰，是現金流壓力與資產流動性的取捨。",
    seoTitle: "租屋 vs 買房哪個比較有錢？房貸與投資試算比較｜財富自由計算機",
    metaDescription:
      "比較租屋與買房的現金流、機會成本與流動性。用數據看房貸壓力、投資替代方案與財富自由達標年差距。",
    calculatorRoute: "/quick-9",
    calculatorTitle: "小計算機內嵌：租買房月現金流比較",
    calculatorNote: "先抓每月可投入差額，再放進長期試算，會比單看房價更接近真實。",
    sections: [
      {
        heading: "房子是資產，也是高黏著負債",
        paragraphs: [
          "買房的好處是穩定與槓桿，但它也會鎖住你的月現金流彈性。",
          "當你把頭期款與每月房貸全壓上去，你就要接受其他投資配置被迫縮水。",
        ],
        bullets: ["核心關鍵字：分期付款代價、財富自由路徑", "長尾關鍵字：買房預算試算工具"],
      },
      {
        heading: "關鍵不是買或租，而是是否可持續",
        paragraphs: [
          "若每月壓力讓你無法穩定投資，帳面資產再漂亮，也可能拖慢退休自由。",
          "把租買差額做兩套情境，並對照 10 年後淨資產，你會更容易做出不後悔的選擇。",
        ],
      },
    ],
    closeQuestion: "你現在的居住決策，是增加安心感，還是只是增加月壓力？",
    disclaimer: "本文為情境比較，非不動產或投資建議；實際購屋與租屋決策請依收入、負債與家庭需求評估。",
  },
  {
    slug: "small-spending-800-compound",
    seriesNo: 23,
    seriesLabel: "實戰對決",
    title: "小資族的 800 元剁手術：從手搖到複利",
    subtitle: "每天 800 聽起來不多，但它可以是你的退休資產起跑線。",
    seoTitle: "每天 800 元拿去投資會怎樣？小資複利試算與退休差距｜財富自由計算機",
    metaDescription:
      "從日常小額消費切入，試算每天 800 元改為定投的長期影響。看懂延遲享樂與複利曲線的實際差距。",
    calculatorRoute: "/quick-8",
    calculatorTitle: "小計算機內嵌：每天小額支出改投資試算",
    calculatorNote: "第 1 台最適合拿來看『日常小支出』累積成大差距的速度。",
    sections: [
      {
        heading: "你不是花太多，是沒看見累積速度",
        paragraphs: [
          "小額支出最難戒，因為它不痛。",
          "但複利的特性就是：你今天少投入一點，未來會少很多。",
        ],
        bullets: ["核心關鍵字：複利試算、延遲享樂", "長尾關鍵字：每天 800 元投資退休差多少"],
      },
      {
        heading: "先做可長期執行的版本",
        paragraphs: [
          "不用極端節省。先把每天 800 中的一部分改成固定投入，重點是不中斷。",
          "你追求的不是一次完美，而是每個月都能繼續做。",
        ],
      },
    ],
    closeQuestion: "如果只能改一個習慣，你會先從哪一筆小支出開始？",
    disclaimer: "本文僅為理財教育情境，非投資建議；實際報酬與風險請依個人配置與市場狀況調整。",
  },
  {
    slug: "buy-now-pay-later-vs-etf",
    seriesNo: 24,
    seriesLabel: "實戰對決",
    title: "買東西用分期很聰明？先看你少掉多少 ETF 部位",
    subtitle: "分期不是壞事，但它會先拿走你的資金機動性。",
    seoTitle: "分期付款會吃掉投資效率嗎？BNPL vs ETF 長期試算｜財富自由計算機",
    metaDescription:
      "解析分期付款與 ETF 定投的機會成本。從月現金流、手續費、再投入效率比較，評估分期決策是否合理。",
    calculatorRoute: "/quick-9",
    calculatorTitle: "小計算機內嵌：分期付款與投資機會成本",
    calculatorNote: "這台適合看分期造成的現金流占用，對定投節奏有多大干擾。",
    sections: [
      {
        heading: "分期最大的成本叫『不能臨時改變』",
        paragraphs: [
          "市場回檔時，現金最有價值；但分期把你的現金流先綁住。",
          "你以為你分散了壓力，實際上是把未來的選擇權先賣掉。",
        ],
        bullets: ["核心關鍵字：分期付款代價、財富自由路徑", "長尾關鍵字：iPhone 分期划算嗎 ETF 定投比較"],
      },
      {
        heading: "先問自己：這是必要支出還是情緒支出",
        paragraphs: [
          "必要支出可以分期，情緒支出建議先延後 30 天。",
          "若 30 天後你還覺得值得，再用不影響投資紀律的額度去買。",
        ],
      },
    ],
    closeQuestion: "你最近一筆分期，真的提高了生活品質，還是只是降低當下罪惡感？",
    disclaimer: "本文為一般現金流管理分享，非投資或信貸建議；分期條件與費用請以實際合約為準。",
  },
  {
    slug: "monthly-10000-after-10-years",
    seriesNo: 25,
    seriesLabel: "實戰對決",
    title: "每個月存一萬，十年後到底差多少？",
    subtitle: "答案不是一個數字，而是你是否把稅費與扣除算進去。",
    seoTitle: "每個月存一萬十年後多少？含稅費與手續費試算｜財富自由計算機",
    metaDescription:
      "每月存一萬十年後到底有多少？用情境比較報酬率、稅負、二代健保與手續費，避免過度樂觀估算。",
    calculatorRoute: "/quick-9",
    calculatorTitle: "小計算機內嵌：月存一萬十年情境比較",
    calculatorNote: "先用這台抓出長期級距，再回主工具加入更完整稅務細節。",
    sections: [
      {
        heading: "別再用稅前報酬想像未來",
        paragraphs: [
          "你真正能再投入的是稅後現金流，不是配息通知上的漂亮數字。",
          "把所得稅、54C、二代健保、手續費放進同一條時間軸，才叫真實。",
        ],
        bullets: ["核心關鍵字：複利試算、存股 vs 買車、財富自由路徑", "長尾關鍵字：每個月存一萬十年後多少"],
      },
      {
        heading: "十年差距常輸在中間的紀律",
        paragraphs: [
          "大多數人不是輸在起點，而是中間停扣、改目標、臨時挪用。",
          "所以請先設定你能長期執行的投入額度，再談高報酬目標。",
        ],
      },
    ],
    closeQuestion: "你現在的投入額，是你真的能連續做十年的金額嗎？",
    disclaimer: "本文為試算示意，非投資建議；結果受市場報酬、費用、稅務規則與個人行為影響。",
  },
  {
    slug: "downpayment-vs-all-in-index",
    seriesNo: 26,
    seriesLabel: "實戰對決",
    title: "頭期款先留著，還是全數投入大盤？",
    subtitle: "這題沒有標準答案，只有你能不能承受資產波動與生活事件。",
    seoTitle: "頭期款該留現金還是投資大盤？風險與報酬試算｜財富自由計算機",
    metaDescription:
      "比較頭期款保留與投入大盤兩條路，從流動性、崩盤風險與購屋時點彈性評估最合適的配置。",
    calculatorRoute: "/quick-10",
    calculatorTitle: "小計算機內嵌：頭期款情境壓力測試",
    calculatorNote: "用崩盤情境先看底線，再決定頭期款可以承受多少市場波動。",
    sections: [
      {
        heading: "頭期款是目標資金，不是風險資金",
        paragraphs: [
          "當你有明確購屋時間，資金主要任務是『準時可用』，不是『拚最大報酬』。",
          "若全數投入大盤，你要先接受在關鍵時點可能遇到回檔。",
        ],
        bullets: ["核心關鍵字：存股 vs 買車、分期付款代價", "長尾關鍵字：頭期款可以投資 ETF 嗎"],
      },
      {
        heading: "先定義你不能失去的東西",
        paragraphs: [
          "不能失去的是時間，還是本金？定義完才知道配置比例。",
          "把購屋時程寫進試算，你會更清楚該保守到什麼程度。",
        ],
      },
    ],
    closeQuestion: "如果兩年內一定要用到這筆錢，你還願意承受 20% 波動嗎？",
    disclaimer: "本文僅供教育與情境比較，非投資或購屋建議；資金配置請依個人風險承受度與時程決定。",
  },
  {
    slug: "retire-by-40-starting-25",
    seriesNo: 27,
    seriesLabel: "實戰對決",
    title: "25 歲開始，40 歲退休真的可行嗎？",
    subtitle: "可行與否不是夢想問題，是現金流紀律與費用控管問題。",
    seoTitle: "25 歲到 40 歲退休可行嗎？提早退休路徑與試算｜財富自由計算機",
    metaDescription:
      "解析 25 歲開始投資，40 歲退休的可行性。以投入率、生活成本、稅費與崩盤情境試算提早退休路徑。",
    calculatorRoute: "/quick-9",
    calculatorTitle: "小計算機內嵌：提早退休路徑試算",
    calculatorNote: "這台適合用來快速拉出不同投入率下的退休時間差。",
    sections: [
      {
        heading: "先把退休改成『可選擇工作』",
        paragraphs: [
          "多數人卡關在全有全無的退休想像。",
          "更實際的做法是先讓你有不被單一工作綁死的能力。",
        ],
        bullets: ["核心關鍵字：財富自由路徑、複利試算", "長尾關鍵字：25 歲投到 40 歲能退休嗎"],
      },
      {
        heading: "三件事決定速度",
        paragraphs: [
          "第一是投入率，第二是持續年數，第三是你能否度過崩盤不出場。",
          "只要其中一項崩掉，年限就會往後延。",
        ],
      },
    ],
    closeQuestion: "你想要的是『不用工作』，還是『可以選工作』？",
    disclaimer: "本文為財務規劃情境討論，非投資建議；退休規劃請依個人收入、支出與風險偏好調整。",
  },
  {
    slug: "split-payment-illusion-cost",
    seriesNo: 28,
    seriesLabel: "實戰對決",
    title: "分期讓你比較敢買，還是比較敢忽略成本？",
    subtitle: "每月看起來不痛，總成本卻常比你想像更重。",
    seoTitle: "分期付款到底多花多少？即時消費心理與長期成本試算｜財富自由計算機",
    metaDescription:
      "從行為財務角度解析分期付款錯覺，試算每月小額付款對總支出與投資機會成本的影響。",
    calculatorRoute: "/quick-8",
    calculatorTitle: "小計算機內嵌：分期錯覺與總成本試算",
    calculatorNote: "用這台把每月付款改成投資金額，就能看到真正的成本輪廓。",
    sections: [
      {
        heading: "人會對『小額定期』失去警覺",
        paragraphs: [
          "這是常見心理偏誤：你把注意力放在每月金額，而非總成本。",
          "所以分期最需要的不是衝動控制，而是計算習慣。",
        ],
        bullets: ["核心關鍵字：延遲享樂、分期付款代價", "長尾關鍵字：分期付款真的比較划算嗎"],
      },
      {
        heading: "先算總額，再決定是否值得",
        paragraphs: [
          "把總付款、手續費、少掉的投資部位一次列出，你會更快看出真相。",
          "看完數字還想買，通常才是你真正需要的東西。",
        ],
      },
    ],
    closeQuestion: "你最近一次分期，是因為需要，還是因為『看起來每月不貴』？",
    disclaimer: "本文為理財教育內容，非消費金融建議；分期利率、費用與條件請以各平台公告為準。",
  },
  {
    slug: "emergency-fund-vs-invest-order",
    seriesNo: 29,
    seriesLabel: "實戰對決",
    title: "先存緊急預備金，還是先全力投資？",
    subtitle: "沒有預備金的投資，通常在第一個意外來時就中斷。",
    seoTitle: "緊急預備金要先存多少？投資順序與現金流規劃｜財富自由計算機",
    metaDescription:
      "探討預備金與投資的先後順序，結合失業、家庭支出、崩盤情境，建立可持續的資產累積策略。",
    calculatorRoute: "/quick-9",
    calculatorTitle: "小計算機內嵌：預備金與投資順序",
    calculatorNote: "這台適合先把安全墊抓出來，再決定每月可投入比例。",
    sections: [
      {
        heading: "沒有安全墊，投資紀律很難活下來",
        paragraphs: [
          "市場波動通常不是你退出的主因，生活事件才是。",
          "失業、醫療、家庭支出一來，沒有預備金就只能被迫賣出部位。",
        ],
        bullets: ["核心關鍵字：財富自由路徑、複利試算", "長尾關鍵字：緊急預備金要先存多少再投資"],
      },
      {
        heading: "順序建議：先穩，再快",
        paragraphs: [
          "先完成基本預備金，再逐步提高投入率，通常比一開始全壓更容易長期存活。",
          "你要追求的是不中斷的十年，而不是熱血的三個月。",
        ],
      },
    ],
    closeQuestion: "如果下個月收入中斷，你現在的投資計畫能撐多久？",
    disclaimer: "本文為一般財務教育資訊，非投資建議；預備金規模請依家庭支出與收入穩定度調整。",
  },
  {
    slug: "delay-gratification-retirement-speed",
    seriesNo: 30,
    seriesLabel: "實戰對決",
    title: "延遲享樂不是苦行，是加速退休自由",
    subtitle: "你少買的不是快樂，而是用今天換更大的未來選擇權。",
    seoTitle: "延遲享樂如何加速財富自由？退休年期差距試算｜財富自由計算機",
    metaDescription:
      "解析延遲享樂與財富自由的關係，透過月支出調整與長期試算，觀察退休達標年期如何提前。",
    calculatorRoute: "/quick-8",
    calculatorTitle: "小計算機內嵌：延遲享樂與退休年期",
    calculatorNote: "第 1 台可以快速看『少花一點』在長期退休路徑上的放大效果。",
    sections: [
      {
        heading: "延遲享樂其實是資源重新排序",
        paragraphs: [
          "你不是不能花，而是把最有槓桿的幾年留給複利。",
          "越早開始，越能用小金額換到大時間差。",
        ],
        bullets: ["核心關鍵字：延遲享樂、財富自由路徑", "長尾關鍵字：延遲消費會讓退休提早幾年"],
      },
      {
        heading: "真正有效的是可持續習慣",
        paragraphs: [
          "每月固定調整 5% 到 10% 支出，比一次大砍更容易長期執行。",
          "當你建立這個習慣，你會發現退休不是遠方目標，而是正在被你每天推進。",
        ],
      },
    ],
    closeQuestion: "如果你只做一個改變，願不願意把下個月 10% 消費改成投資？",
    disclaimer: "本文為理財教育分享，非投資建議；實際退休年期與資產成果請依個人情境與市場表現為準。",
  },
];

/** 新 SEO 長尾系列置前，列表／查詢仍以 slug 為準 */
export const EXTENDED_SERIES_POSTS: ExtendedSeriesPost[] = [
  ...FIRE_SEO_LONGTAIL_2026_POSTS,
  ...LEGACY_EXTENDED_SERIES_POSTS,
];

export function getExtendedSeriesPostBySlug(slug: string): ExtendedSeriesPost | undefined {
  return EXTENDED_SERIES_POSTS.find((post) => post.slug === slug);
}

