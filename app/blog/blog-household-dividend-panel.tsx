"use client";

import { useMemo, useState } from "react";
import styles from "./blog-household-dividend-panel.module.css";

type Scenario = "single" | "couple_merge" | "dual_income" | "single_earner_div";

const SCENARIO_COPY: Record<
  Scenario,
  { label: string; tip: string }
> = {
  single: {
    label: "單身／單一申報單位：股利與薪資併入綜所稅級距",
    tip: "重點在於「你的」邊際稅率與股利課稅選項（合併／分離）。股利抵減 8.5% 為可抵減稅額概念，且有每戶上限；單身戶仍適用「戶」的上限規定。實際以申報為準。",
  },
  couple_merge: {
    label: "夫妻合併申報：所得與扣除額在同一張綜合所得稅上匯總",
    tip: "合併後級距可能上移或下移，取決於兩人所得結構。股利是否選合併或分離，應以「整戶」試算比較；不要只看其中一方的股利金額。",
  },
  dual_income: {
    label: "雙薪＋股利：薪資已占級距，股利邊際效果常被低估",
    tip: "此情境下，分離課稅 28% 與合併課稅＋抵減的落差可能放大。建議用試算表同時輸入兩人薪資假設與股利，觀察「整戶」淨稅負變化。",
  },
  single_earner_div: {
    label: "單薪家庭＋配偶股利／配息：仍須以申報單位整體評估",
    tip: "即使主要薪資集中在一方，股利仍可能改變可抵減空間與適用級距。每戶 8.5% 抵減上限是否用滿，要放回整戶數字裡看。",
  },
};

export function BlogHouseholdDividendPanel() {
  const [scenario, setScenario] = useState<Scenario>("couple_merge");
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const tip = SCENARIO_COPY[scenario].tip;

  const checkScore = useMemo(() => ["cap", "merge", "tool"].filter((k) => checks[k]).length, [checks]);

  const toggle = (k: string) => setChecks((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className={styles.wrap} role="region" aria-label="家庭申報與股利情境（教學）">
      <p className={styles.title}>情境選擇：合併申報下，股利放哪裡一起算？</p>
      <p className={styles.lead}>
        下列為<strong>觀念導航</strong>，不預測你的報稅結果。選一種最接近的情境，閱讀提示後，再勾選下方檢核項。
      </p>

      <p className={styles.scenarioLabel}>申報結構</p>
      <div className={styles.options} role="radiogroup" aria-label="申報情境">
        {(Object.keys(SCENARIO_COPY) as Scenario[]).map((key) => (
          <label
            key={key}
            className={`${styles.option} ${scenario === key ? styles.optionSelected : ""}`}
          >
            <input
              className={styles.radio}
              type="radio"
              name="hh-scenario"
              checked={scenario === key}
              onChange={() => setScenario(key)}
              aria-checked={scenario === key}
            />
            <span>{SCENARIO_COPY[key].label}</span>
          </label>
        ))}
      </div>

      <div className={styles.tip}>{tip}</div>

      <div className={styles.checkBlock}>
        <p className={styles.checkTitle}>專業檢核（可複選）</p>
        <label className={styles.checkRow}>
          <input className={styles.cb} type="checkbox" checked={!!checks.cap} onChange={() => toggle("cap")} />
          <span>已查過或理解：股利抵減 8.5% 涉及<strong>每戶可抵減稅額上限</strong>（常聞 8 萬元上限），不是無上限折抵。</span>
        </label>
        <label className={styles.checkRow}>
          <input className={styles.cb} type="checkbox" checked={!!checks.merge} onChange={() => toggle("merge")} />
          <span>知道合併申報時，應以<strong>同一申報單位</strong>的所得總額看級距，而不是單看股利那一行。</span>
        </label>
        <label className={styles.checkRow}>
          <input className={styles.cb} type="checkbox" checked={!!checks.tool} onChange={() => toggle("tool")} />
          <span>打算用<strong>財富自由計算機</strong>或國稅局試算，對「合併 vs 分離」至少做過一次並列比較。</span>
        </label>
        <p className={styles.note} style={{ marginTop: "0.65rem", marginBottom: 0 }}>
          已勾選 {checkScore}/3 項。勾滿不代表報稅正確，只代表較接近完整決策流程。
        </p>
      </div>

      <p className={styles.note}>
        夫妻是否分開計稅、特殊扣除、扶養親屬等均未在此展開；涉及個案請洽國稅局或稅務專業人士。
      </p>
    </div>
  );
}
