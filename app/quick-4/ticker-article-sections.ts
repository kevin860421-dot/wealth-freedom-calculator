import type { Quick1ExclusiveSection, TopicSeed } from "@/app/mini-blog/posts/topic-types";
import { publishAtUsesHumanStoryOpening } from "@/lib/human-story-opening";
import { findTickerPreset, quick4TrialConditionsLine, tickerShortName, tickerYieldHint } from "./ticker-scenarios";

type Archetype =
  | "milestone"
  | "dca"
  | "frequency"
  | "lots"
  | "late"
  | "tax"
  | "stepup"
  | "couple"
  | "drawdown"
  | "retire"
  | "core"
  | "annual";

function archetypeFromFocus(focus: string): Archetype {
  if (focus.includes("月領門檻")) return "milestone";
  if (focus.includes("定期定額")) return "dca";
  if (focus.includes("配息頻率")) return "frequency";
  if (focus.includes("張數")) return "lots";
  if (focus.includes("晚開始")) return "late";
  if (focus.includes("稅費")) return "tax";
  if (focus.includes("加薪")) return "stepup";
  if (focus.includes("家庭")) return "couple";
  if (focus.includes("回檔")) return "drawdown";
  if (focus.includes("退休倒數")) return "retire";
  if (focus.includes("核心")) return "core";
  return "annual";
}

function freqNote(preset: ReturnType<typeof findTickerPreset>): string {
  if (!preset) return "配息月份依試算預設";
  if (preset.frequency === "month") return "此標的為月配，非配息月較少見";
  if (preset.frequency === "quarter") return "季配標的：請在試算中切換「第幾期／年月」，看非配息月可月領是否為 0";
  if (preset.frequency === "semiannual") return "半年配：現金流較集中，別用「每月都有感」去想像";
  return "年配標的：現金流節奏與高股息 ETF 差很多，請按期別查看";
}

/** 第 4 台標的專文：12 種架構輪替，避免 100 篇同構 */
export function buildQuick4TickerExclusiveSections(
  seed: TopicSeed,
  calculatorName: string,
  publishAtIso: string,
): Quick1ExclusiveSection[] {
  const code = seed.tickerCode?.toUpperCase() ?? "0050";
  const preset = findTickerPreset(code);
  const name = preset ? tickerShortName(preset) : code;
  const trial = quick4TrialConditionsLine(code, preset);
  const yieldHint = preset ? tickerYieldHint(preset) : "";
  const human = publishAtUsesHumanStoryOpening(publishAtIso);
  const arch = archetypeFromFocus(seed.focus);

  const embedLine =
    seed.calculatorNote ??
    `請下滑開啟「${calculatorName}」：已預帶 ${code}（${name}），開頁即跑月投 2 萬、20 年示意。`;

  const introBase = human
    ? [
        `很多人搜「${seed.keywordA}」，其實想問的是：${name} 這條路，我撐不撐得住？`,
        trial,
        `${yieldHint}；${freqNote(preset)}。（示意，非報酬保證）`,
        embedLine,
      ]
    : [
        `這篇把 ${code}（${name}）的「${seed.focus.split("｜")[1] ?? seed.focus}」拉回可核對數字。`,
        trial,
        `${yieldHint}；${freqNote(preset)}。`,
        embedLine,
      ];

  switch (arch) {
    case "milestone":
      return [
        { heading: "前言：別只看終點資產", paragraphs: introBase },
        {
          heading: "第幾期可月領，比「幾年後」更實用",
          paragraphs: [
            `同樣是 ${code}，有人盯總資產，有人盯「第 n 期可月領」。前者像期末考成績，後者像每個月能不能付帳單。`,
            `在試算裡把「第幾次投入」從 1 慢慢往上拉，你會看見：可月領不是線性長大，配息月與非配息月體感差很多。`,
          ],
          bullets: [`🔎 ${seed.keywordA}`, `🔎 ${seed.keywordB}`, "先找「第一個有感期」，再談放大目標"],
        },
        {
          heading: "操作：一次只改一個旋鈕",
          paragraphs: [
            `① 確認標的已是 ${code}。② 固定月投 20,000，只改「第幾期／年月」。③ 若可月領仍為 0，先看是否落在非配息月。`,
            `想延伸「${seed.keywordC}」：把年期改 15／20 年各跑一次，對照達標期差幾年。`,
          ],
        },
      ];
    case "dca":
      return [
        { heading: "前言：複利在「扣完還能再投」", paragraphs: introBase },
        {
          heading: "月投 1 萬 vs 2 萬，差距會被時間放大",
          paragraphs: [
            `${name} 這類標的，定期定額的關鍵不是口號，是每期扣完稅費、手續費後，還能不能維持紀律。`,
            `建議在試算把月投改成 10,000 與 20,000 各跑一次（其他不動），看總資產與可月領差多少。`,
          ],
        },
        {
          heading: "三步對照",
          paragraphs: [
            "① 固定 20 年。② 只動月投。③ 記下第 120 期（或你關心的年月）的可月領。",
            `別一次改報酬假設又改月投；那樣讀不懂「${seed.keywordA}」到底誰在拖累。`,
          ],
        },
      ];
    case "frequency":
      return [
        { heading: "前言：配息頻率不是小細節", paragraphs: introBase },
        {
          heading: "月配體感 vs 季配現實",
          paragraphs: [
            `${code} 的配息節奏會直接影響「可月領」欄位：非配息月可能是 0，這不是試算壞掉，是現金流本來就這樣。`,
            `若你心理需要每月都有進帳，却選季配標的，計畫容易在空窗月崩潰。`,
          ],
          bullets: [freqNote(preset), "用「年月選擇器」對照除息月份", seed.keywordB],
        },
        {
          heading: "怎麼在試算裡看節奏",
          paragraphs: [
            "連續挑 3～4 個相鄰月份，看可月領是否跳動。",
            "再決定：你能接受「季配一次較厚」，還是要另做現金緩衝。",
          ],
        },
      ];
    case "lots":
      return [
        { heading: "前言：張數是結果，不是起點", paragraphs: introBase },
        {
          heading: "先算資產，再粗算張數",
          paragraphs: [
            `「${code} 要存幾張」常是倒推問題：你先要月投、年期與可月領路線，總資產出來後，再除以參考股價粗算張數。`,
            `只看張數、不看期別可月領，很容易高估退休時間表。`,
          ],
        },
        {
          heading: "實作順序",
          paragraphs: [
            `① 試算預帶 ${code}，跑滿 20 年看總資產。② 用你接受的股價假設去除。③ 回頭問：這張數對應的月投你付得起嗎？`,
          ],
        },
      ];
    case "late":
      return [
        { heading: "前言：晚開始不是判死刑", paragraphs: introBase },
        {
          heading: "10 年 vs 20 年，心態要換",
          paragraphs: [
            `35 歲才開始存 ${name}，通常要在「月投加大、目標下修、年限延長」三選二——試算就是把取捨攤開。`,
            `把年期改成 10 年，看可月領落差；再改回 20 年，看哪個版本你真正做得到。`,
          ],
        },
        {
          heading: "可執行版",
          paragraphs: ["先求不斷扣，再求加速。", `關鍵字「${seed.keywordA}」請留在同一試算對照，別另開樂觀表。`],
        },
      ];
    case "tax":
      return [
        { heading: "前言：毛配息好看，稅後才是真實", paragraphs: introBase },
        {
          heading: "54C、二代健保與可月領",
          paragraphs: [
            `${code} 配息若單次超過 2 萬門檻，二代健保補充保費會進來；54C 占比也會影響股利課稅體感。`,
            `試算的可月領欄位已納入示意扣款——請用它對齊「稅後能再投多少」，不是只看殖利率海報。`,
          ],
          bullets: ["稅前殖利率 ≠ 可月領", seed.keywordB, seed.keywordC],
        },
        {
          heading: "建議對照",
          paragraphs: ["挑一個配息月與非配息月各看一次。", "若稅後落差讓你不舒服，代表目標要下修或月投要加。"],
        },
      ];
    case "stepup":
      return [
        { heading: "前言：多 5000 不是小數", paragraphs: introBase },
        {
          heading: "加薪加碼的複利效果",
          paragraphs: [
            `在 ${code} 路線上，月投從 20,000 拉到 25,000，可月領與總資產常不是線性 +25%，因為配息再投入也會被放大。`,
            `一次只改月投，其他參數鎖死，才看得懂加薪紅利。`,
          ],
        },
        {
          heading: "三步",
          paragraphs: ["① 基準 20,000。② +5,000 版。③ 比第 60、120 期可月領。"],
        },
      ];
    case "couple":
      return [
        { heading: "前言：家庭目標要加總月投", paragraphs: introBase },
        {
          heading: "雙薪不是各算各的",
          paragraphs: [
            `兩人各存 ${code} 或同一標的加總月投，要在試算用「家庭月投」思考——例如兩人各 2 萬，表上改 40,000 試一次。`,
            `對齊的是期別與可月領，不是誰口頭比較會存。`,
          ],
        },
        {
          heading: "溝通用同一張表",
          paragraphs: ["截圖保存基準版。", "只討論一個變數再改。", seed.closeQuestion],
        },
      ];
    case "drawdown":
      return [
        { heading: "前言：回檔時最危險是停扣", paragraphs: introBase },
        {
          heading: "壓力測試不是悲觀，是演練",
          paragraphs: [
            `回檔時 ${name} 帳面綠很正常；領息計畫要守的是：仍維持月投、仍看得懂配息月現金流。`,
            `試算不能預測跌幅，但能讓你在順風時先決定逆風流程。`,
          ],
        },
        {
          heading: "流程",
          paragraphs: ["固定月投與標的。", "只改期別看不同年月的可月領。", "寫下「回檔不停扣」規則貼在桌邊。"],
        },
      ];
    case "retire":
      return [
        { heading: "前言：退休倒數時間變短", paragraphs: introBase },
        {
          heading: "15 年內能動的旋鈕不多",
          paragraphs: [
            `距退休 15 年時，${code} 這條路通常要在月投、目標月領、工作年限之間取捨。`,
            `把試算年期改 15 年，看可月領是否達標；不達標再回來加月投或延長。`,
          ],
        },
        {
          heading: "務實順序",
          paragraphs: ["先保生活費不爆。", "再加碼到可持續上限。", "最後才追理想月領。"],
        },
      ];
    case "core":
      return [
        { heading: "前言：適不適合當領息核心", paragraphs: introBase },
        {
          heading: "核心標的三問",
          paragraphs: [
            `① 你能長期扣 ${code} 嗎？② 配息節奏符合生活嗎？③ 稅後可月領你睡得著嗎？`,
            `${yieldHint} 只是起點；${freqNote(preset)}`,
          ],
        },
        {
          heading: "用試算回答",
          paragraphs: [
            "看第 1 期與中後期可月領。", "看總資產路徑是否可接受。", `再決定 ${code} 是核心還是衛星。`],
        },
      ];
    default:
      return [
        { heading: "前言：每年都要重算一次", paragraphs: introBase },
        {
          heading: "年度檢視三數字",
          paragraphs: [
            "月投是否仍做得到？",
            "年期要不要因人生事件調整？",
            `可月領是否仍符合 ${code} 的配息現實？`,
          ],
        },
        {
          heading: "操作",
          paragraphs: [
            "每年同一套參數重跑。", "只改一欄做敏感度。", "舊截圖與新結果並排比。"],
        },
      ];
  }
}
