export type Quick1ExclusiveSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Quick1ExclusivePost = {
  slug: string;
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  publishAtIso: string;
  calculatorRoute: "/quick-1" | "/quick-2" | "/quick-3";
  calculatorTitle: string;
  calculatorNote: string;
  sections: Quick1ExclusiveSection[];
  closeQuestion: string;
  disclaimer: string;
};

type TopicSeed = {
  slug: string;
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  focus: string;
  keywordA: string;
  keywordB: string;
  keywordC: string;
  closeQuestion: string;
  calculatorRoute?: "/quick-1" | "/quick-2" | "/quick-3";
  calculatorName?: string;
  calculatorNote?: string;
};

const PUBLISH_DATES = [
  "2026-05-04T09:00:00+08:00",
  "2026-05-16T09:00:00+08:00",
  "2026-05-28T09:00:00+08:00",
  "2026-06-09T09:00:00+08:00",
  "2026-06-21T09:00:00+08:00",
  "2026-07-03T09:00:00+08:00",
  "2026-07-15T09:00:00+08:00",
  "2026-07-27T09:00:00+08:00",
  "2026-08-08T09:00:00+08:00",
  "2026-08-20T09:00:00+08:00",
  "2026-09-01T09:00:00+08:00",
  "2026-09-13T09:00:00+08:00",
  "2026-09-25T09:00:00+08:00",
  "2026-10-07T09:00:00+08:00",
  "2026-10-19T09:00:00+08:00",
  "2026-10-31T09:00:00+08:00",
  "2026-11-12T09:00:00+08:00",
  "2026-11-24T09:00:00+08:00",
  "2026-12-06T09:00:00+08:00",
  "2026-12-18T09:00:00+08:00",
  "2026-12-30T09:00:00+08:00",
  "2027-01-11T09:00:00+08:00",
] as const;

const TOPIC_SEEDS: TopicSeed[] = [
  {
    slug: "quick1-monthly-20000-compound-playbook",
    title: "每月投入兩萬，20 年後會自由嗎？先把存股複利計算機打開再說",
    subtitle: "先把焦慮翻成數字，你會比昨天更靠近自由。",
    seoTitle: "每月投入兩萬 20 年後有多少？存股複利計算機複利試算與月領估算教學",
    metaDescription: "以存股複利計算機示範每月投入兩萬的複利路徑，從月投、年數到月領估算，幫你把理想變成可執行計畫。",
    focus: "每月投入兩萬",
    keywordA: "每月投入兩萬 20 年後有多少",
    keywordB: "定期定額多久能退休",
    keywordC: "複利計算器月領怎麼算",
    closeQuestion: "你會先調高月投入，還是先調高「不中斷投入」的穩定度？",
  },
  {
    slug: "quick1-first-million-discipline-map",
    title: "第一個一百萬不是天分題，是節奏題：用存股複利計算機把路線畫出來",
    subtitle: "你需要的不是神準預測，而是能活 10 年的投入節奏。",
    seoTitle: "第一桶金要多久？存股複利計算機解析每月投入與複利時間軸",
    metaDescription: "用存股複利計算機拆解第一桶金累積時間，實測不同月投入與年數設定，找到最能長期執行的版本。",
    focus: "第一桶金時間軸",
    keywordA: "第一桶金要多久",
    keywordB: "每月存多少可以到一百萬",
    keywordC: "複利計算器設定方式",
    closeQuestion: "你現在的月投入，是能做 36 個月的版本嗎？",
  },
  {
    slug: "quick1-retirement-monthly-cashflow-baseline",
    title: "退休月領怎麼抓才不自欺？先用存股複利計算機算出你的底線版本",
    subtitle: "退休不是喊口號，是每個月把底線往上墊高。",
    seoTitle: "退休月領金額如何估算？存股複利計算機實作月投與年數規劃",
    metaDescription: "從退休月領倒推月投入，利用存股複利計算機建立可執行的退休現金流底線，減少焦慮與瞎猜。",
    focus: "退休月領底線",
    keywordA: "退休月領金額如何估算",
    keywordB: "每月投入多少才有被動收入",
    keywordC: "退休試算怎麼做",
    closeQuestion: "你想要的是「不用上班」，還是「可以自由選工作」？",
  },
  {
    slug: "quick1-monthly-10000-vs-15000-gap",
    title: "月投一萬和一萬五，差在哪？不是 5000 而已",
    subtitle: "差距會被時間放大，重點是你願不願意看見它。",
    seoTitle: "月投一萬 vs 一萬五差多少？存股複利計算機比較 20 年資產差距",
    metaDescription: "比較月投一萬與一萬五在不同年數下的複利結果，搭配存股複利計算機找出你可負擔且有感的加碼策略。",
    focus: "月投級距比較",
    keywordA: "月投一萬和一萬五差多少",
    keywordB: "提高月投入有用嗎",
    keywordC: "複利差距比較",
    closeQuestion: "你現在可以多加多少，才不會讓生活直接失衡？",
  },
  {
    slug: "quick1-bonus-lump-sum-yearly-plan",
    title: "年終獎金該花掉還是加碼？用一個按鈕看 10 年差距",
    subtitle: "不是不能花，而是先算過再花。",
    seoTitle: "年終獎金投資怎麼分配？存股複利計算機看一次加碼的長期效果",
    metaDescription: "以存股複利計算機模擬年終加碼與不加碼兩種路線，幫你評估獎金分配和長期資產成長的關係。",
    focus: "年終獎金加碼",
    keywordA: "年終獎金要不要投資",
    keywordB: "一次加碼有用嗎",
    keywordC: "獎金投資規劃",
    closeQuestion: "今年的獎金，你要全部花掉，還是留一部分給未來的你？",
  },
  {
    slug: "quick1-salary-growth-stepup-plan",
    title: "加薪後月投該怎麼調？先調多少才不會三個月後崩掉",
    subtitle: "加薪不是全拿去升級消費，留一點給複利會很有感。",
    seoTitle: "加薪後要提高多少月投？存股複利計算機試算最穩升級幅度",
    metaDescription: "加薪後如何調整月投入才可持續？用存股複利計算機比較不同加碼比例，避免短期衝動長期斷線。",
    focus: "加薪後月投調整",
    keywordA: "加薪後月投要加多少",
    keywordB: "加薪理財分配",
    keywordC: "提高投入不痛苦方法",
    closeQuestion: "你會把加薪的幾成交給未來，而不是全部留給當下？",
  },
  {
    slug: "quick1-bear-market-keep-investing",
    title: "市場下跌還要繼續投入嗎？先別靠感覺，先看長線",
    subtitle: "最難的不是看懂走勢，是在波動裡保持節奏。",
    seoTitle: "股市下跌還要定期定額嗎？存股複利計算機看長期投入優勢",
    metaDescription: "面對市場回檔，透過存股複利計算機觀察持續投入與停扣的長期差異，建立可執行的抗波動策略。",
    focus: "下跌時持續投入",
    keywordA: "股市下跌還要定期定額嗎",
    keywordB: "停扣影響有多大",
    keywordC: "熊市投資心態",
    closeQuestion: "下次下跌來時，你要停手，還是照計畫慢慢買？",
  },
  {
    slug: "quick1-inflation-adjusted-goals",
    title: "你以為目標是 2000 萬？加上時間後可能根本不夠",
    subtitle: "目標不是固定數字，而是會隨時間變動的生活成本。",
    seoTitle: "退休目標金額怎麼抓？存股複利計算機搭配通膨思維調整目標",
    metaDescription: "用存股複利計算機先看資產路徑，再以通膨思維校正退休目標，避免只看名目數字造成判斷偏差。",
    focus: "目標金額校正",
    keywordA: "退休目標金額怎麼算",
    keywordB: "通膨下資產規劃",
    keywordC: "名目和實質差異",
    closeQuestion: "你的目標數字，有把未來的生活成本算進去嗎？",
  },
  {
    slug: "quick1-couple-joint-invest-plan",
    title: "伴侶理財常吵架？先用同一張圖看同一件事",
    subtitle: "不是誰對誰錯，而是你們看的是不同版本的未來。",
    seoTitle: "情侶夫妻如何一起投資？存股複利計算機建立共同月投計畫",
    metaDescription: "提供伴侶共同理財流程，透過存股複利計算機對齊月投入與年數期待，減少情緒衝突與目標落差。",
    focus: "伴侶共同規劃",
    keywordA: "夫妻理財怎麼分配",
    keywordB: "情侶共同投資規劃",
    keywordC: "家庭月投設定",
    closeQuestion: "你們吵的是錢，還是其實沒對齊同一個時間軸？",
  },
  {
    slug: "quick1-late-start-catchup-strategy",
    title: "30 歲才開始會太晚嗎？你真正需要的是追回路徑",
    subtitle: "晚開始不等於沒機會，怕的是晚開始又不開始。",
    seoTitle: "30 歲才開始投資來得及嗎？存股複利計算機追回策略教學",
    metaDescription: "針對晚起步族群，示範如何用存股複利計算機調整月投入與年數，建立可追趕但不爆壓的理財路線。",
    focus: "晚開始追趕",
    keywordA: "30歲開始投資來得及嗎",
    keywordB: "晚開始理財怎麼追",
    keywordC: "追趕複利策略",
    closeQuestion: "你要花時間後悔，還是花時間把路線追回來？",
  },
  {
    slug: "quick1-freelancer-irregular-income-plan",
    title: "收入不固定怎麼月投？接案族的穩定投入方法",
    subtitle: "不規律收入，也能做出有規律的投入。",
    seoTitle: "自由工作者如何定期定額？存股複利計算機設計彈性月投法",
    metaDescription: "給接案與收入波動族群的月投配置建議，透過存股複利計算機建立高低月雙版本，降低中斷機率。",
    focus: "不固定收入月投",
    keywordA: "收入不固定怎麼投資",
    keywordB: "接案族定期定額",
    keywordC: "彈性月投規劃",
    closeQuestion: "你的投資計畫，有替淡季預留呼吸空間嗎？",
  },
  {
    slug: "quick1-parenting-education-retire-balance",
    title: "有小孩後還能存退休嗎？先把兩個目標拆開算",
    subtitle: "教育金和退休金都重要，先排序就不會亂。",
    seoTitle: "有小孩怎麼規劃退休？存股複利計算機平衡教育金與退休金",
    metaDescription: "示範家庭在教育支出與退休準備並行時，如何用存股複利計算機設計雙軌月投與年期策略。",
    focus: "教育與退休平衡",
    keywordA: "有小孩怎麼存退休",
    keywordB: "教育金退休金分配",
    keywordC: "家庭理財月投",
    closeQuestion: "你家目前的理財順序，真的符合你們最在意的生活嗎？",
  },
  {
    slug: "quick1-debt-first-or-invest-first",
    title: "先還債還是先投資？不是二選一，重點在比例",
    subtitle: "極端答案很爽，但通常不適合真實生活。",
    seoTitle: "先還債還是先投資？存股複利計算機拆解現金流比例配置",
    metaDescription: "透過存股複利計算機模擬不同還債與月投比例，找出兼顧壓力管理與資產成長的務實解法。",
    focus: "還債投資比例",
    keywordA: "先還債還是先投資",
    keywordB: "負債時怎麼理財",
    keywordC: "現金流比例配置",
    closeQuestion: "你現在的分配，是在降低焦慮，還是在放大焦慮？",
  },
  {
    slug: "quick1-year-end-rebalance-checklist",
    title: "年底理財健檢怎麼做？每年一次就很有感",
    subtitle: "不用複雜，只要固定檢查三個數字。",
    seoTitle: "年底理財健檢清單：用存股複利計算機回顧月投與年數進度",
    metaDescription: "提供年度理財檢查流程，搭配存股複利計算機回顧月投入、年數進度與月領目標，建立長期迭代習慣。",
    focus: "年度健檢",
    keywordA: "年底理財健檢怎麼做",
    keywordB: "年度投資回顧",
    keywordC: "理財檢查清單",
    closeQuestion: "今年你的理財成績，是靠運氣還是靠流程？",
  },
  {
    slug: "quick1-emergency-fund-before-invest",
    title: "緊急預備金要先存嗎？先存多少才算夠",
    subtitle: "先把安全墊鋪好，投資才不會遇事就停。",
    seoTitle: "緊急預備金要存多少？存股複利計算機搭配安全墊與月投規劃",
    metaDescription: "說明緊急預備金與月投的先後與並行方式，透過存股複利計算機設計不易中斷的長期策略。",
    focus: "安全墊與月投",
    keywordA: "緊急預備金要存多少",
    keywordB: "先存錢還是先投資",
    keywordC: "預備金與月投比例",
    closeQuestion: "你現在的策略，遇到一次突發支出會不會整套中斷？",
  },
  {
    slug: "quick1-etf-dividend-reinvest-idea",
    title: "配息到底該花還是再投入？一個選擇，十年差很多",
    subtitle: "再投入不是神話，但長期很誠實。",
    seoTitle: "ETF 配息要花掉還是再投入？存股複利計算機看長期差異",
    metaDescription: "以存股複利計算機比較配息再投入與不再投入兩種路徑，協助你建立符合生活與目標的資金使用規則。",
    focus: "配息再投入",
    keywordA: "配息要不要再投入",
    keywordB: "ETF配息理財",
    keywordC: "再投入效果",
    closeQuestion: "你想要的是短期舒服，還是長期更有選擇權？",
  },
  {
    slug: "quick1-target-30000-passive-income",
    title: "目標月領 3 萬，月投要多少才比較有機會",
    subtitle: "先看到底線，再決定要加碼還是延長時間。",
    seoTitle: "月領 3 萬怎麼規劃？存股複利計算機倒推月投入與年期",
    metaDescription: "針對月領三萬元目標，利用存股複利計算機倒推所需月投入與年數，建立可執行退休現金流路線。",
    focus: "月領3萬倒推",
    keywordA: "月領三萬要存多少",
    keywordB: "被動收入三萬規劃",
    keywordC: "退休月領倒推",
    closeQuestion: "你會先提高投入，還是先延長計畫年期？",
  },
  {
    slug: "quick1-monthly-5min-review-system",
    title: "每月只花 5 分鐘，也能把理財做得很穩",
    subtitle: "不是你沒時間，是沒有固定節奏。",
    seoTitle: "每月理財回顧怎麼做？存股複利計算機 5 分鐘檢查流程",
    metaDescription: "建立每月五分鐘理財檢查習慣，透過存股複利計算機追蹤月投、年數與月領偏差，持續修正不焦慮。",
    focus: "每月5分鐘回顧",
    keywordA: "每月理財回顧流程",
    keywordB: "理財習慣怎麼養成",
    keywordC: "5分鐘檢查法",
    closeQuestion: "你願意每月固定 5 分鐘，換長期少很多焦慮嗎？",
  },
  {
    slug: "quick1-avoid-over-optimistic-return",
    title: "報酬率別一開始就填太高，這是最常見的自我欺騙",
    subtitle: "樂觀不是錯，但只用樂觀一定會痛。",
    seoTitle: "複利試算報酬率怎麼設定？存股複利計算機的保守中性樂觀三版法",
    metaDescription: "示範保守、中性、樂觀三組報酬率的試算方法，搭配存股複利計算機降低過度樂觀帶來的規劃失真。",
    focus: "報酬率三版法",
    keywordA: "複利報酬率怎麼設定",
    keywordB: "理財假設太樂觀",
    keywordC: "保守中性樂觀試算",
    closeQuestion: "你現在用的報酬率，是你希望的，還是你承受得了的？",
  },
  {
    slug: "quick1-build-30year-freedom-habit",
    title: "30 年自由不是一個決定，是一個可以活下去的習慣",
    subtitle: "先把節奏守住，時間自然會幫你放大結果。",
    seoTitle: "30 年財富自由路線圖：存股複利計算機建立長期投入習慣",
    metaDescription: "以存股複利計算機打造 30 年可持續投入習慣，從月投紀律到年期管理，建立穩定放大的資產引擎。",
    focus: "30年長期習慣",
    keywordA: "30年投資規劃",
    keywordB: "長期投入習慣",
    keywordC: "財富自由路線圖",
    closeQuestion: "你今天做的哪個小動作，能讓 10 年後的你說聲謝謝？",
  },
  {
    slug: "quick2-freedom-countdown-target-years",
    title: "💣 財富自由倒數計時器怎麼用？先算清楚你距離目標還有幾年",
    subtitle: "這台不是拿來做夢，是拿來把時間壓力說清楚。",
    seoTitle: "財富自由倒數計時器教學：目標月領與月投入怎麼設定才務實",
    metaDescription:
      "用第二台財富自由倒數計時器，從目標月領與每月投入倒推達標年數。適合想快速看清退休時間軸與調整方向的讀者。",
    focus: "財富自由倒數計時器",
    keywordA: "財富自由倒數計時器怎麼用",
    keywordB: "目標月領要設多少",
    keywordC: "每月投入幾年達成",
    closeQuestion: "你比較想先拉高月投入，還是先把目標月領調到能長期承受的版本？",
    calculatorRoute: "/quick-2",
    calculatorName: "財富自由倒數計時器",
    calculatorNote: "先填目標月領，再填每月投入，直接看達標年數。先求可執行，再求速度。",
  },
  {
    slug: "quick3-dream-monthly-income-simulator",
    title: "💣 夢想月領試算器：先算出你的夢想月領，才知道月投要多誠實",
    subtitle: "夢想不是不能大，先讓它變成可執行的數字。",
    seoTitle: "夢想月領試算器教學：想月領 5 萬，每月要投多少才合理？",
    metaDescription:
      "用第三台夢想月領試算器，從希望月領與預計年數倒推出建議月投金額，快速建立可執行的退休準備路線。",
    focus: "夢想月領試算器",
    keywordA: "夢想月領試算器怎麼用",
    keywordB: "希望月領5萬要投多少",
    keywordC: "月領倒推月投工具",
    closeQuestion: "你會先調高希望月領，還是先把年數拉長，換一條壓力更低的路？",
    calculatorRoute: "/quick-3",
    calculatorName: "夢想月領試算器",
    calculatorNote: "先填希望月領，再選預計年數，直接看建議月投。先求能執行，再求更漂亮。",
  },
];

function buildSections(seed: TopicSeed, calculatorName: string): Quick1ExclusiveSection[] {
  return [
    {
      heading: `先把問題說白：${seed.focus}，不是靠感覺`,
      paragraphs: [
        `很多人一開始都會問：「${seed.focus}到底要怎麼做才對？」`,
        "我通常會先回一句內心戲：\"先別急著找標準答案，先看你現在做不做得到。\"",
        `${calculatorName}的價值很務實：把你現在的月投入、年數，直接翻成看得懂的結果。`,
        "當數字攤開，你就不再靠想像做決策...而是靠可驗證的路線在前進。",
      ],
      bullets: [`🔎 你可能也在找：${seed.keywordA}`, `🔎 你可能也在找：${seed.keywordB}`, `🔎 你可能也在找：${seed.keywordC}`],
    },
    {
      heading: "最常見的卡點：不是不努力，是路線太硬",
      paragraphs: [
        "很多計畫一開始很熱血，三個月後就停下來。不是你不行，而是你把起跑值設得太吃緊。",
        "我自己的原則很簡單：可以慢，但不要斷。因為一旦中斷，重啟的心理成本會比你想像高。",
        "把目標拆成可調旋鈕最實際——提高月投入、延長年數、或先調整生活版本。",
        "你不需要一次完美；你只需要每次都比上一次更可持續。",
      ],
    },
    {
      heading: "給你一套可執行版 ✅",
      paragraphs: [
        "① 先填你「下個月也做得到」的月投入。",
        "② 用 15 / 20 / 25 年三組比較，別只看單一答案。",
        "③ 看月領示意時，問自己一句：\"這個生活版本我願意長期承擔嗎？\"",
        "④ 每 30 天回來校正一次，只調參數，不用自責。",
        "一句話收尾：理財不是比賽誰最猛，而是看誰最能長期不掉線。",
      ],
    },
  ];
}

export const QUICK1_EXCLUSIVE_POSTS: Quick1ExclusivePost[] = TOPIC_SEEDS.map((seed, idx) => {
  const calculatorRoute = seed.calculatorRoute ?? "/quick-1";
  const calculatorName = seed.calculatorName ?? "存股複利計算機";
  return {
    slug: seed.slug,
    title: seed.title,
    subtitle: seed.subtitle,
    seoTitle: seed.seoTitle,
    metaDescription: seed.metaDescription,
    publishAtIso: PUBLISH_DATES[idx],
    calculatorRoute,
    calculatorTitle: `${calculatorName}（直接放入）`,
    calculatorNote: seed.calculatorNote ?? "先改月投，再改年數，最後看月領示意。先求做得到，再求做得快。",
    sections: buildSections(seed, calculatorName),
    closeQuestion: seed.closeQuestion,
    disclaimer: "本文為情境試算與經驗分享，非投資建議；實際結果受市場、費用、稅務與個人行為影響。",
  };
});

export function getQuick1ExclusivePostBySlug(slug: string): Quick1ExclusivePost | undefined {
  return QUICK1_EXCLUSIVE_POSTS.find((post) => post.slug === slug);
}
