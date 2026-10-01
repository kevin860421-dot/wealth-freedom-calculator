/**
 * 部落格文章登錄（單一真相來源）
 *
 * ## 新增一篇文章時
 * 1. 在此陣列新增一筆 `BlogPostRegistryEntry`（建議新文放在陣列**上方**，列表會依此順序顯示）。
 * 2. 建立對應路由資料夾：`app/blog/<slug>/page.tsx`。
 * 3. 在該 `page.tsx` 內：
 *    - `const SLUG = "<slug>" as const`
 *    - `const entry = getBlogPostBySlug(SLUG)!`（或自行處理 undefined）
 *    - 未到 `publishAtIso`：render `<BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />`
 *    - `generateMetadata`：未公開時 `robots: { index: false, follow: false }`
 *    - 已公開：完整 SEO metadata；`ArticlePublishStamp` 用 `entry.publishAtIso`
 *
 * 未到 `publishAtIso` 時（全站自動）—**基本邏輯：不對外露出**
 * - `/blog` 列表不顯示該篇
 * - 首頁 Hero 第一篇連結不出現；`featureHomeFooter` 捷徑不出現
 * - **文內系列互相引用**請用 `BlogPublishedLink`，未到時間不渲染成連結（避免導向「準備中」）
 * - sitemap 不含該 URL
 * - 直接開 `/blog/<slug>` 只看到「準備中」頁
 *
 * ## 本機預覽（未到時間也想看全文）
 * 在 **開發模式**（`npm run dev`）且專案根目錄 `.env.local` 設：
 * `NEXT_PUBLIC_BLOG_PREVIEW_ALL=true`
 * 會暫時**忽略**排程，列表／首頁／內文皆當「已公開」顯示。
 * **正式站**（`NODE_ENV=production`）不會套用此變數，無需擔心誤公開。
 */

export type BlogPostRegistryEntry = {
  /** URL 最後一段，例如 2026-dividend-tax-guide */
  slug: string;
  /** ISO 8601（建議含 +08:00）。未到時間＝不公開。 */
  publishAtIso: string;
  /** /blog 列表標題 */
  listTitle: string;
  listDescription: string;
  /** 達公開時間後，可搭配 `getHomeHeroBlogPosts()` 多篇主打；首頁目前改為只連「第一篇」，此旗標可維持 false */
  featureHomeHero?: boolean;
  /** 首頁 Hero 連結文案（僅第一篇使用時可填，未填則用 listTitle） */
  homeHeroLabel?: string;
  /** 達公開時間後，是否顯示在首頁頁尾「·」旁連結 */
  featureHomeFooter?: boolean;
  homeFooterLabel?: string;
};

export const BLOG_POST_REGISTRY: BlogPostRegistryEntry[] = [
  // ─────────────────────────────────────────────────────────
  // 稅後實領月報：獨立系列，不插入 mini-blog，也不挪動下面試算筆記的 publishAtIso
  // 新的一期一律台北 09:30。下面 9/30 20:00 是已公開的 8 月文與總覽，不要照抄。
  // ─────────────────────────────────────────────────────────
  {
    slug: "2026-10-after-tax-dividend-rank",
    publishAtIso: "2026-11-01T09:30:00+08:00",
    listTitle: "稅後實領月報｜2026年10月配息排行：月領一萬要多少",
    listDescription:
      "10月榜待截止日後，沿用同一套稅後實領欄位試算月領一萬要多少本金。數字未結算前不公開。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "after-tax-dividend-rank",
    publishAtIso: "2026-09-30T20:00:00+08:00",
    listTitle: "月領一萬要多少本金｜稅後實領月報最新一期",
    listDescription:
      "固定入口，網址不帶月份。打開就是最新一期，並連到該期完整頁。各期網址各自保留。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "2026-08-after-tax-dividend-rank",
    publishAtIso: "2026-09-30T20:00:00+08:00",
    listTitle: "稅後實領月報（1）｜2026年8月配息排行：月領一萬要多少",
    listDescription:
      "截止2026/08/31。用證交所收盤與e添富已除息金額，試算扣稅與二代健保後平均月領一萬所需本金。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  // ─────────────────────────────────────────────────────────
  // 財富試算筆記（1）～（50）：主試算／長尾 SEO（排程見各 publishAtIso）
  // ─────────────────────────────────────────────────────────
  {
    slug: "tw-etf-dca-tax-dividend-checklist",
    publishAtIso: "2026-05-14T20:00:00+08:00",
    listTitle: "財富試算筆記（1）｜台股ETF定期定額：退休試算前先釐清的三個「扣除」",
    listDescription: "台股ETF定期定額怎麼試算才務實？整理股利課稅、54C、二代健保補充保費與手續費，對齊財富自由達標年期與稅後月領假設。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "nhi2-single-dividend-20000-threshold",
    publishAtIso: "2026-05-16T09:30:00+08:00",
    listTitle: "財富試算筆記（2）｜股利單筆超過兩萬：二代健保補充保費怎麼影響現金流",
    listDescription: "說明單筆股利2萬元門檻與補充保費2.11%在長期試算中如何呈現，並建議用主試算頁對照每期須扣除與財富自由年期。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "dividend-merge-vs-separate-when-high",
    publishAtIso: "2026-05-19T09:00:00+08:00",
    listTitle: "財富試算筆記（3）｜股利較多時：合併申報與分離課稅要怎麼比較才不盲選",
    listDescription: "用台灣股利課稅常見框架說明合併與分離的取捨思路，並建議以試算頁逐年檢視每期須扣除與退休達標年變化。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "54c-imputation-cashflow-not-yield",
    publishAtIso: "2026-05-21T20:30:00+08:00",
    listTitle: "財富試算筆記（4）｜54C可分金額：為什麼殖利率不等於實拿現金流",
    listDescription: "解釋54C與股利所得的關係，說明為何試算退休現金流不宜只用殖利率，並建議用主試算頁檢視每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "reinvest-fee-compound-fire-year-gap",
    publishAtIso: "2026-05-24T09:00:00+08:00",
    listTitle: "財富試算筆記（5）｜股利再投入的手續費：為什麼小錢也能改寫財富自由達標年",
    listDescription: "說明再投入手續費如何影響長期可投資本金，並建議用主試算頁把費用假設納入同一條時間軸比較。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "target-monthly-50k-after-tax-assumptions",
    publishAtIso: "2026-05-26T09:30:00+08:00",
    listTitle: "財富試算筆記（6）｜目標月領五萬：稅後現金流試算最常漏的假設有哪些",
    listDescription: "整理目標月領五萬在試算時應同步檢視的稅費與生活假設，並建議用主試算頁逐年檢視每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "inflation-assumption-fire-calculator-sanity",
    publishAtIso: "2026-05-29T20:00:00+08:00",
    listTitle: "財富試算筆記（7）｜通膨假設加進退休試算：年期會怎麼動才合理",
    listDescription: "說明通膨假設在長期試算中的角色與保守取法，並建議用主試算頁做情境對照，避免只看名義報酬。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "annual-vs-monthly-dividend-tax-rhythm",
    publishAtIso: "2026-05-31T09:30:00+08:00",
    listTitle: "財富試算筆記（8）｜年配改月配：現金流變密了，稅負節奏也會跟著變嗎",
    listDescription: "從配息頻率切入，說明現金流密度改變時試算應注意的事項，並建議用主試算頁對照每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "salary-investor-dca-payroll-alignment",
    publishAtIso: "2026-06-03T09:00:00+08:00",
    listTitle: "財富試算筆記（9）｜薪資族ETF存股：怎麼把「每期須扣除」對回薪轉現實",
    listDescription: "給薪資族的試算對帳方式：把薪轉、固定支出與投資扣款放在同一條時間軸，並用主試算頁檢視稅後再投入。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "high-dividend-etf-nav-dividend-myth",
    publishAtIso: "2026-06-05T20:30:00+08:00",
    listTitle: "財富試算筆記（10）｜高股息ETF：除息後淨值與股利課稅要一起想才不誤會",
    listDescription: "釐清高股息ETF除息與淨值變化的基本概念，並回到稅後現金流與每期須扣除的試算重心。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "dividend-imputation-credit-cap-sanity",
    publishAtIso: "2026-06-08T09:00:00+08:00",
    listTitle: "財富試算筆記（11）｜股利可扣抵稅額：試算時別默默假設「永遠能抵到滿」",
    listDescription: "說明股利課稅試算中抵減項目對實拿的影響，並建議用主試算頁逐年檢視每期須扣除與合併／分離假設。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "fire-capital-vs-cashflow-definition",
    publishAtIso: "2026-06-10T09:30:00+08:00",
    listTitle: "財富試算筆記（12）｜FIRE試算先問：你要的是「本金厚」還是「月領穩」",
    listDescription: "釐清FIRE目標是資產累積還是稅後月領現金流，並建議用主試算頁把每期須扣除與達標年放在同一條時間軸檢視。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "education-fund-separate-fire-cashflow",
    publishAtIso: "2026-06-13T20:00:00+08:00",
    listTitle: "財富試算筆記（13）｜教育費要不要獨立一筆：跟財富自由月領放同張表會怎樣",
    listDescription: "說明教育支出與退休月領試算分開或合併的取捨，並建議用主試算頁檢視稅後現金流與每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "labor-pension-self-select-six-percent",
    publishAtIso: "2026-06-15T09:30:00+08:00",
    listTitle: "財富試算筆記（14）｜勞退自提6%與自選ETF：兩條管線怎麼用試算對齊",
    listDescription: "整理勞退自提與自有投資在現金流與長期試算上的分工思路，並建議主試算頁專注可自主調整的再投入與扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "mortgage-stress-test-investable-cashflow",
    publishAtIso: "2026-06-18T09:00:00+08:00",
    listTitle: "財富試算筆記（15）｜房貸壓力下還能投資多少：試算表最忌諱的「假裝還有錢」",
    listDescription: "說明房貸與投資扣款並存時的試算要點，建議用主試算頁誠實輸入可投入金額並檢視每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "emergency-fund-six-months-allocation",
    publishAtIso: "2026-06-22T20:30:00+08:00",
    listTitle: "財富試算筆記（16）｜緊急預備金六個月：該算在「資產」還是「先扣掉的洞」",
    listDescription: "討論預備金在退休試算中的定位，並建議用主試算頁把可投資本金與生活緩衝分開思考。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "single-stock-concentration-fire-years",
    publishAtIso: "2026-06-25T09:00:00+08:00",
    listTitle: "財富試算筆記（17）｜單一標的重押：波動不是道德問題，是達標年會不會位移",
    listDescription: "說明集中持股對長期路徑的影響，並建議用主試算頁搭配保守報酬與較高中斷風險假設做對照。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "rebalance-twice-year-friction",
    publishAtIso: "2026-06-27T09:30:00+08:00",
    listTitle: "財富試算筆記（18）｜一年再平衡兩次：摩擦成本要怎麼寫進長期試算才誠實",
    listDescription: "整理再平衡與交易摩擦對複利路徑的影響，並建議用主試算頁把費用與再投入假設對齊。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "single-parent-income-shock-fire",
    publishAtIso: "2026-06-30T20:00:00+08:00",
    listTitle: "財富試算筆記（19）｜單親／單一收入：試算表為什麼要更嚴格看「中斷」而不是看「平均」",
    listDescription: "從單一收入家庭角度說明退休試算的保守取法，並建議用主試算頁模擬投入中斷與支出上升。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "labor-pension-annuity-floor-dividend",
    publishAtIso: "2026-07-02T09:30:00+08:00",
    listTitle: "財富試算筆記（20）｜勞保年金／勞退月領：要不要當成股利之外的「安全下限」",
    listDescription: "討論社會保險給付在退休現金流試算中的定位，並建議主試算頁仍以可自行掌握的投資與股利為主線。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "self-employed-two-track-tax-warning",
    publishAtIso: "2026-07-05T09:00:00+08:00",
    listTitle: "財富試算筆記（21）｜自營業兩條稅路：為什麼不該拿同一張股利試算表硬套全部人生",
    listDescription: "提醒自營業者退休試算應分開處理營業現金流與投資股利，並建議主試算頁專注可清楚定義的投資管線。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "ipo-54c-long-hold-etf-difference",
    publishAtIso: "2026-07-07T20:30:00+08:00",
    listTitle: "財富試算筆記（22）｜抽籤新股54C話題很多：跟長抱台股ETF的試算重心差在哪",
    listDescription: "釐清54C在抽籤與長期ETF存股語境下的不同關注點，並回到主試算頁的每期須扣除與配息節奏。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "twd-etf-us-underlying-fx-note",
    publishAtIso: "2026-07-10T09:00:00+08:00",
    listTitle: "財富試算筆記（23）｜台幣計價ETF背後有美元資產：匯率不是主試算主角，但不能假裝不存在",
    listDescription: "說明台幣計價ETF與匯率敏感度在退休試算中的定位，並建議仍以主試算頁對齊股利與每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "reinvest-delay-one-quarter-compound",
    publishAtIso: "2026-07-12T09:30:00+08:00",
    listTitle: "財富試算筆記（24）｜股利再投入延後一季：長期曲線會怎麼變，別用感覺估",
    listDescription: "說明再投入延遲對長期資產路徑的影響，並建議用主試算頁對照配息與再投入節奏。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "living-cost-growth-two-vs-three-percent",
    publishAtIso: "2026-07-15T20:00:00+08:00",
    listTitle: "財富試算筆記（25）｜生活費年增2%與3%：同一套投資下，達標年差距可能比你以為大",
    listDescription: "比較生活費成長假設對財富自由年期的影響，並建議用主試算頁做保守與中性情境對照。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "retire-early-ten-years-capital-buffer",
    publishAtIso: "2026-07-17T09:30:00+08:00",
    listTitle: "財富試算筆記（26）｜想提早十年退休：本金要多準備幾成，才像「真的提早」而不是「提早焦慮」",
    listDescription: "討論提早退休對本金與現金流緩衝的要求，並建議用主試算頁檢視達標年與每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "monthly-60k-to-70k-target-nonlinear",
    publishAtIso: "2026-07-20T09:00:00+08:00",
    listTitle: "財富試算筆記（27）｜目標月領從六萬調到七萬：為什麼達標年不是「線性」往後移一點點",
    listDescription: "說明目標月領調升對達標年的非線性影響，並建議用主試算頁逐年檢視每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "overlapping-dividends-multiple-20k-nhi2",
    publishAtIso: "2026-07-22T20:30:00+08:00",
    listTitle: "財富試算筆記（28）｜高配息月份重疊：多筆股利各超兩萬時，試算表要更在意「入帳節奏」",
    listDescription: "說明多筆股利入帳對補保費與現金流的影響，並建議用主試算頁對齊配息頻率與每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "dca-through-crash-more-units",
    publishAtIso: "2026-07-25T09:00:00+08:00",
    listTitle: "財富試算筆記（29）｜崩盤年定期定額買到更多單位：試算裡該怎麼解讀，才不變成過度自信",
    listDescription: "討論下跌期間定投的數學效果與行為風險，並建議用主試算頁模擬停扣對達標年的影響。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "stabilization-dividend-54c-tax-logic",
    publishAtIso: "2026-07-27T09:30:00+08:00",
    listTitle: "財富試算筆記（30）｜平準金與配息組成：退休試算真正在意的是課稅邏輯，不是八卦",
    listDescription: "從配息組成角度說明為何退休試算要對齊課稅邏輯，並建議用主試算頁檢視每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "tw-stock-long-hold-conservative-return",
    publishAtIso: "2026-07-30T20:00:00+08:00",
    listTitle: "財富試算筆記（31）｜台股長抱的報酬假設：為什麼試算表仍建議保留保守餘裕",
    listDescription: "討論長期報酬假設在財富自由試算中的保守取法，並建議用主試算頁對照達標年與每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "estate-tax-mindset-not-fire-math",
    publishAtIso: "2026-08-01T09:30:00+08:00",
    listTitle: "財富試算筆記（32）｜遺產稅與贈與：多半不是FIRE主試算的主角，但別讓它變成心態漏洞",
    listDescription: "釐清退休現金流試算與資產移轉規劃的分工，並建議主試算頁專注每期須扣除與達標年。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "pretax-seven-percent-vs-reinvestable",
    publishAtIso: "2026-08-04T09:00:00+08:00",
    listTitle: "財富試算筆記（33）｜年化7%：你說的是「資產帳面」還是「扣完費用後可再投入」",
    listDescription: "釐清報酬率定義與費用扣除在試算中的位置，並建議用主試算頁對齊每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "retire-at-45-medical-buffer",
    publishAtIso: "2026-08-06T20:30:00+08:00",
    listTitle: "財富試算筆記（34）｜45歲提早退休想像：醫保全額與自費醫療常比報酬率先咬人",
    listDescription: "提醒提早退休在醫療保障與支出上的試算要點，並建議用主試算頁保守估月領與支出。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "dual-income-vs-single-buffer-thickness",
    publishAtIso: "2026-08-09T09:00:00+08:00",
    listTitle: "財富試算筆記（35）｜雙薪與單薪：同樣目標月領，緩衝厚度為什麼要寫得不一樣",
    listDescription: "比較雙薪與單薪在退休試算上的緩衝假設差異，並建議用主試算頁模擬收入中斷。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "bond-etf-distribution-tax-caution-tw",
    publishAtIso: "2026-08-11T09:30:00+08:00",
    listTitle: "財富試算筆記（36）｜債券ETF配息：台灣投資人試算前先把「性質」分清楚再談穩定",
    listDescription: "提醒債券型商品在退休現金流試算中的定位，並建議用主試算頁專注可理解的稅後現金流假設。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "rising-rate-cash-drag-fire-years",
    publishAtIso: "2026-08-14T20:00:00+08:00",
    listTitle: "財富試算筆記（37）｜定存利率上升：保守資產報酬變好，為什麼達標年不一定變快",
    listDescription: "討論利率環境變動對保守部位與整體試算的影響，並建議用主試算頁做多情境對照。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "retirement-medical-copay-in-monthly-target",
    publishAtIso: "2026-08-16T09:30:00+08:00",
    listTitle: "財富試算筆記（38）｜退休後門診與自費：要不要直接加進「目標月領」比較不會漏",
    listDescription: "建議把醫療自費以保守方式納入退休月領試算，並用主試算頁檢視稅後現金流。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "high-earner-spouse-merge-dividend-pressure",
    publishAtIso: "2026-08-19T09:00:00+08:00",
    listTitle: "財富試算筆記（39）｜配偶高薪合併申報：股利很多的時候，邊際壓力可能悄悄變陡",
    listDescription: "說明家戶所得結構對股利課稅試算的影響，並建議用主試算頁切換課稅假設做對照。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "diy-dividend-calendar-nhi2-withholding",
    publishAtIso: "2026-08-21T20:30:00+08:00",
    listTitle: "財富試算筆記（40）｜自建除息行事曆：把入帳、補保費與可再投入日對齊同一條軸",
    listDescription: "建議用除息與入帳節奏管理補保費與再投入，並以主試算頁對照長期每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "broad-vs-high-dividend-tax-cadence-tw",
    publishAtIso: "2026-08-24T09:00:00+08:00",
    listTitle: "財富試算筆記（41）｜大盤型與高股息型：配息節奏不同，稅負節奏也不該用同一套直覺",
    listDescription: "比較不同配息節奏對家戶現金流與試算的影響，並建議用主試算頁選擇合適配息頻率假設。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "etf-expense-ratio-long-haul-discount",
    publishAtIso: "2026-08-26T09:30:00+08:00",
    listTitle: "財富試算筆記（42）｜內扣費用率：為什麼它應該被看成長期報酬的「折讓」而不是雜訊",
    listDescription: "說明內扣費用率在長期複利試算中的折讓效果，並建議用主試算頁做保守報酬假設。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "semi-fire-side-income-modeling",
    publishAtIso: "2026-08-29T20:00:00+08:00",
    listTitle: "財富試算筆記（43）｜半退休兼職：試算表要怎麼寫才不變成自我安慰的「假收入」",
    listDescription: "討論兼職收入在財富自由試算中的保守寫法，並建議用主試算頁分開「可投資」與「生活補貼」。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "zero-dividend-year-vs-peak-dividend-year",
    publishAtIso: "2026-08-31T09:30:00+08:00",
    listTitle: "財富試算筆記（44）｜零股利年與高配息年：為什麼試算要兩年都看，而不是只看平均",
    listDescription: "建議用低配息與高配息情境對照退休路徑，並以主試算頁檢視每期須扣除與可再投入。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "marginal-rate-dividend-merge-sensitivity",
    publishAtIso: "2026-09-03T09:00:00+08:00",
    listTitle: "財富試算筆記（45）｜邊際稅率變陡：股利合併申報時，為什麼試算要更在意「多領一元」",
    listDescription: "說明所得級距對股利合併試算的敏感度，並建議用主試算頁固定其他變數做對照。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "nhi2-salary-bonus-dividend-same-month",
    publishAtIso: "2026-09-05T20:30:00+08:00",
    listTitle: "財富試算筆記（46）｜薪獎與股利同月爆量：家戶現金流看起來很好，為什麼下個月反而更緊",
    listDescription: "討論集中入帳月份的家戶預算與補保費節奏，並建議用主試算頁對齊長期每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "lump-sum-bonus-invest-vs-spread",
    publishAtIso: "2026-09-08T09:00:00+08:00",
    listTitle: "財富試算筆記（47）｜年終一筆大額：一次投入還是分月攤：試算要看摩擦與情緒哪個先爆",
    listDescription: "比較大額資金一次投入與分批投入的試算取捨，並建議用主試算頁對照達標年與手續費假設。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "year-end-tax-dividend-voucher-habit",
    publishAtIso: "2026-09-10T09:30:00+08:00",
    listTitle: "財富試算筆記（48）｜報稅季前整理股利憑證：為什麼這習慣會回饋到你的試算假設",
    listDescription: "建議用報稅資料回校退休試算中的股利與扣除假設，並以主試算頁逐年對齊每期須扣除。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "excel-export-two-scenarios-dividend-tax",
    publishAtIso: "2026-09-13T20:00:00+08:00",
    listTitle: "財富試算筆記（49）｜匯出Excel比兩套情境：股利課稅與手續費各動一個變數就好",
    listDescription: "建議用主試算頁匯出Excel做保守與中性情境對照，專注每期須扣除與達標年變化，避免一次調太多參數。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  {
    slug: "annual-salary-bonus-withholding-cash-bridge",
    publishAtIso: "2026-09-15T09:30:00+08:00",
    listTitle: "財富試算筆記（50）｜薪扣與預扣：大月看起來入帳很多，為什麼試算仍要留「橋接現金」",
    listDescription: "說明薪資預扣與各類扣款對當月可投資金額的影響，並建議用主試算頁誠實輸入可長期投入金額。",
    featureHomeHero: false,
    featureHomeFooter: false,
  },
  // ─────────────────────────────────────────────────────────
  // 實戰對決（19）～（30）：消費／投資／崩盤／退休路徑
  // ─────────────────────────────────────────────────────────
  {
    slug: "delay-gratification-retirement-speed",
    publishAtIso: "2026-05-02T21:00:00+08:00",
    listTitle: "實戰對決（30）｜延遲享樂不是苦行，是加速退休自由",
    listDescription: "你少買的不是快樂，而是把現金流換成未來更大的選擇權。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（30）",
  },
  {
    slug: "emergency-fund-vs-invest-order",
    publishAtIso: "2026-05-02T20:00:00+08:00",
    listTitle: "實戰對決（29）｜先存緊急預備金，還是先全力投資？",
    listDescription: "沒有安全墊的投資，通常在第一個意外來時就中斷。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（29）",
  },
  {
    slug: "split-payment-illusion-cost",
    publishAtIso: "2026-05-02T19:00:00+08:00",
    listTitle: "實戰對決（28）｜分期讓你比較敢買，還是比較敢忽略成本？",
    listDescription: "每月看起來不痛，但總成本與機會成本常比你想像更高。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（28）",
  },
  {
    slug: "retire-by-40-starting-25",
    publishAtIso: "2026-05-02T18:00:00+08:00",
    listTitle: "實戰對決（27）｜25 歲開始，40 歲退休真的可行嗎？",
    listDescription: "可行與否取決於投入率、現金流紀律與你能否熬過崩盤。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（27）",
  },
  {
    slug: "downpayment-vs-all-in-index",
    publishAtIso: "2026-05-02T17:00:00+08:00",
    listTitle: "實戰對決（26）｜頭期款先留著，還是全數投入大盤？",
    listDescription: "當資金有明確時程，流動性常比報酬率更重要。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（26）",
  },
  {
    slug: "monthly-10000-after-10-years",
    publishAtIso: "2026-05-02T16:00:00+08:00",
    listTitle: "實戰對決（25）｜每個月存一萬，十年後到底差多少？",
    listDescription: "答案不只看年化，還要把稅費、扣除與手續費算進去。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（25）",
  },
  {
    slug: "buy-now-pay-later-vs-etf",
    publishAtIso: "2026-05-02T15:00:00+08:00",
    listTitle: "實戰對決（24）｜買東西用分期很聰明？先看你少掉多少 ETF 部位",
    listDescription: "分期不一定錯，但它會先綁住你的資金機動性。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（24）",
  },
  {
    slug: "small-spending-800-compound",
    publishAtIso: "2026-05-02T14:00:00+08:00",
    listTitle: "實戰對決（23）｜小資族的 800 元剁手術：從手搖到複利",
    listDescription: "每天 800 看似不痛，拉到長期就是退休速度的差距。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（23）",
  },
  {
    slug: "rent-vs-buy-asset-truth",
    publishAtIso: "2026-05-02T13:00:00+08:00",
    listTitle: "實戰對決（22）｜不買房真的會比較有錢？數據告訴你真相",
    listDescription: "租屋與買房不是立場戰，核心是現金流壓力與流動性。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（22）",
  },
  {
    slug: "market-crash-20000-bankrupt",
    publishAtIso: "2026-05-02T12:00:00+08:00",
    listTitle: "實戰對決（21）｜如果大盤跌回兩萬點，我會破產嗎？",
    listDescription: "先看每期扣除後還剩多少，再談你扛不扛得住崩盤。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（21）",
  },
  {
    slug: "mercedes-monthly-10000-cost",
    publishAtIso: "2026-05-02T11:00:00+08:00",
    listTitle: "實戰對決（20）｜學弟的賓士夢：月付一萬的背後是千萬代價",
    listDescription: "每月一萬看起來不重，拉到二十年會變成巨大的機會成本。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（20）",
  },
  {
    slug: "duel-iphone15-buy-or-invest",
    publishAtIso: "2026-05-02T10:00:00+08:00",
    listTitle: "實戰對決（19）｜【對決】換 iPhone 15 是痛還是致命？",
    listDescription: "用分期與定投對照，四年後差距不是感覺，是資產數字。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "實戰對決（19）",
  },

  // ─────────────────────────────────────────────────────────
  // 痛點短評（6）～（12）：短篇、焦慮點拆解（買不起房／勞保／中年失業）
  // ─────────────────────────────────────────────────────────
  {
    slug: "painpoint-12-stop-playing-pretend",
    publishAtIso: "2026-04-30T09:00:00+08:00",
    listTitle: "痛點短評（17）｜別再假裝「沒事」",
    listDescription: "焦慮不是問題；不敢算清楚才是。把風險攤開，你才有選擇權。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（17）",
  },
  {
    slug: "painpoint-18-parent-care-cost",
    publishAtIso: "2026-05-02T09:00:00+08:00",
    listTitle: "痛點短評（18）｜長照費用最殘酷的是「不確定」",
    listDescription: "不是每月多少錢最可怕，是你不知道要燒多久。把成本與期間寫成區間，才有選擇權。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（18）",
  },
  {
    slug: "painpoint-11-middle-age-job-loss",
    publishAtIso: "2026-04-28T09:30:00+08:00",
    listTitle: "痛點短評（16）｜中年失業最殘酷的不是收入歸零",
    listDescription: "是現金流斷掉時，你才發現自己沒有『可延展』的備案。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（16）",
  },
  {
    slug: "painpoint-10-labor-insurance-collapse",
    publishAtIso: "2026-04-25T09:00:00+08:00",
    listTitle: "痛點短評（15）｜勞保破產焦慮：你該做的不是轉發貼文",
    listDescription: "先把『缺口』量出來：你要補的是錢、時間，還是風險承受度？",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（15）",
  },
  {
    slug: "painpoint-9-cant-afford-house",
    publishAtIso: "2026-04-23T09:30:00+08:00",
    listTitle: "痛點短評（14）｜買不起房不是你不努力",
    listDescription: "但你更不能用『我先不算』來逃避：時間一過，成本只會更硬。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（14）",
  },
  {
    slug: "painpoint-8-inflation-is-silent-tax",
    publishAtIso: "2026-04-21T09:00:00+08:00",
    listTitle: "痛點短評（13）｜通膨是最安靜的稅",
    listDescription: "你以為你存得很穩，其實購買力在慢慢掉。焦慮感通常來自這裡。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（13）",
  },
  {
    slug: "painpoint-7-no-buffer-is-real-risk",
    publishAtIso: "2026-04-18T09:00:00+08:00",
    listTitle: "痛點短評（12）｜真正的風險不是下跌",
    listDescription: "是你沒有緩衝：一個意外，就讓你被迫在最差的時點做決策。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（12）",
  },
  {
    slug: "painpoint-6-anxiety-about-retirement",
    publishAtIso: "2026-04-16T09:30:00+08:00",
    listTitle: "痛點短評（11）｜退休焦慮其實是一種「未知成本」",
    listDescription: "你不是怕努力沒回報，你是怕『扣完還剩多少』永遠沒人講清楚。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "痛點短評（11）",
  },
  {
    slug: "dividend-tax-return-filing-check",
    /**（6）密集但不每天：週一 4/20 */
    publishAtIso: "2026-04-20T09:00:00+08:00",
    listTitle: "存股節稅（10）｜報稅前最後一張清單",
    listDescription: "把今年的股利、54C、抵減與二代健保，用一張表對齊到「稅後實拿」。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "報稅清單（10）",
  },
  {
    slug: "dividend-tax-credit-cap-and-timing",
    /**（9）週五 */
    publishAtIso: "2026-04-17T09:30:00+08:00",
    listTitle: "存股節稅（9）｜8.5% 抵減上限怎麼影響你",
    listDescription: "不是每一塊股利都能抵滿 8 萬；先懂上限與級距，才知道該不該糾結。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "抵減上限（9）",
  },
  {
    slug: "dividend-tax-54c-ratio-why-it-matters",
    /**（8）週三 */
    publishAtIso: "2026-04-15T09:00:00+08:00",
    listTitle: "存股節稅（8）｜54C 占比：你以為的股利，不一定都算進去",
    listDescription: "ETF 平準金、資本利得與 54C 占比，會改寫你的二代健保門檻與稅後再投入。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "54C 占比（8）",
  },
  {
    slug: "dividend-tax-nhi2-threshold-strategy",
    /**（7）週六（避開連兩天） */
    publishAtIso: "2026-04-12T09:30:00+08:00",
    listTitle: "存股節稅（7）｜二代健保 2 萬門檻：你該在意的是「哪一筆」",
    listDescription: "同樣年股利，按次數入帳會差很多：先找出你最容易踩線的那筆。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "二代健保（7）",
  },
  {
    slug: "dividend-tax-merge-vs-separate-decision",
    /**（6）週四 */
    publishAtIso: "2026-04-09T09:00:00+08:00",
    listTitle: "存股節稅（6）｜合併 vs 分離：用三個問題做決策",
    listDescription: "不用背法條：先用邊際稅率、抵減上限、二代健保把方向選對。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "合併/分離（6）",
  },
  {
    slug: "household-dividend-tax-checklist",
    /** 清明連假 4/3–4/6 後首個上班日（週二）；與（4）隔 5 日（中間為連假） */
    publishAtIso: "2026-04-07T09:30:00+08:00",
    listTitle: "存股節稅（5）｜合併申報與股利抵減",
    listDescription: "雙薪＋股利：整戶級距、每戶抵減上限，別只算個人科目。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "家庭申報／股利（5）",
  },
  {
    slug: "etf-dividend-54c-structure",
    /** 連假前最後上班日（週四）；與（3）隔 2 日 */
    publishAtIso: "2026-04-02T09:00:00+08:00",
    listTitle: "存股節稅（4）｜ETF 配息與 54C",
    listDescription: "入帳總額≠全進 54C：平準金、占比，對齊補充保費與試算表。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "ETF 配息／54C（4）",
  },
  {
    slug: "passive-income-fire-blueprint",
    /** 與（2）隔 5 日；連假前最後一篇週間檔 */
    publishAtIso: "2026-03-31T09:30:00+08:00",
    listTitle: "存股節稅（3）｜FIRE 與稅後現金流",
    listDescription: "目標用稅後、回顧別只看稅前：三槓桿沙盒＋五項自檢。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "FIRE／稅後（3）",
  },
  {
    slug: "tax-overpay-blind-spot",
    /** 延後檔期（原 3/26）；仍早於（3）3/31 */
    publishAtIso: "2026-03-30T09:00:00+08:00",
    listTitle: "存股節稅（2）｜稅後真相",
    listDescription: "複利的是稅前還稅後？課稅、抵減、二代健保，實拿先算清。",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "稅後真相（2）",
  },
  {
    slug: "2026-dividend-tax-guide",
    publishAtIso: "2026-03-24T08:30:00+08:00",
    listTitle: "存股節稅（1）｜抵減 8.5% 與實拿",
    listDescription: "合併／分離、二代健保、抵減上限：實拿別只靠殖利率。",
    homeHeroLabel: "部落格：存股節稅（1）→",
    featureHomeHero: false,
    featureHomeFooter: true,
    homeFooterLabel: "存股節稅（1）",
  },
  // 下一篇範例（複製後改 slug、時間、文案即可）：
  // {
  //   slug: "your-next-post",
  //   publishAtIso: "2026-04-01T09:00:00+08:00",
  //   listTitle: "標題",
  //   listDescription: "列表簡述。",
  //   featureHomeHero: false,
  //   featureHomeFooter: false,
  // },
];

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`;
}

/** 僅開發模式：略過 publishAtIso，方便本機預覽全文（見 .env.example） */
function isSchedulePreviewBypassed(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const v = process.env.NEXT_PUBLIC_BLOG_PREVIEW_ALL;
  return v === "1" || v === "true";
}

export function isBlogPostPublished(publishAtIso: string, now: Date = new Date()): boolean {
  if (isSchedulePreviewBypassed()) return true;
  const t = new Date(publishAtIso);
  if (Number.isNaN(t.getTime())) return true;
  return now >= t;
}

export function formatPublishLabel(publishAtIso: string): string {
  const d = new Date(publishAtIso);
  if (Number.isNaN(d.getTime())) return publishAtIso;
  return d.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getBlogPostBySlug(slug: string): BlogPostRegistryEntry | undefined {
  return BLOG_POST_REGISTRY.find((p) => p.slug === slug);
}

/** 已達公開時間的文章（順序同 registry，新文建議放在陣列前段） */
export function getPublishedBlogPosts(now: Date = new Date()): BlogPostRegistryEntry[] {
  return BLOG_POST_REGISTRY.filter((p) => isBlogPostPublished(p.publishAtIso, now));
}

export function getHomeHeroBlogPosts(now: Date = new Date()): BlogPostRegistryEntry[] {
  return BLOG_POST_REGISTRY.filter(
    (p) => p.featureHomeHero && isBlogPostPublished(p.publishAtIso, now),
  );
}

export function getHomeFooterBlogPosts(now: Date = new Date()): BlogPostRegistryEntry[] {
  return BLOG_POST_REGISTRY.filter(
    (p) => p.featureHomeFooter && isBlogPostPublished(p.publishAtIso, now),
  );
}
