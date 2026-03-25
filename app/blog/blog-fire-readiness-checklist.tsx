"use client";

import { useMemo, useState } from "react";
import styles from "./blog-fire-readiness-checklist.module.css";

const ITEMS: { id: string; text: string }[] = [
  {
    id: "a",
    text: "現金流目標以「稅後、可花用」口徑設定（非僅配息入帳金額）。",
  },
  {
    id: "b",
    text: "股利課稅（合併／分離）曾用試算或工具比對過情境，而非預設直覺。",
  },
  {
    id: "c",
    text: "二代健保補充保費與 54C 占比對實拿的影響，已納入心理帳或模型。",
  },
  {
    id: "d",
    text: "再投入比例、申購／再投入手續費假設有寫進長期試算。",
  },
  {
    id: "e",
    text: "單一標的、產業或配息集中度有設定監控或上限（流動性／信用風險意識）。",
  },
];

function verdict(count: number): string {
  if (count <= 1) return "模型風險偏高：建議優先補齊稅後口徑與課稅選項，再談資產增速。";
  if (count <= 3) return "架構尚可：關鍵缺口通常在「稅後現金流」與「再投入假設」兩塊，適合用計算機跑一次敏感性分析。";
  if (count === 4) return "接近專業自檢：剩餘一項往往是集中度或手續費細節，可與計算機表格交叉驗證。";
  return "五項齊備：仍請以計算機對齊個案數字；清單只協助結構，不替代申報與投顧。";
}

export function BlogFireReadinessChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const count = useMemo(() => ITEMS.filter((i) => checked[i.id]).length, [checked]);
  const pct = Math.round((count / ITEMS.length) * 100);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.wrap} role="region" aria-label="FIRE 試算專業自檢清單">
      <p className={styles.title}>專業自檢：五項是否已納入你的「試算架構」</p>
      <p className={styles.sub}>勾選不代表合法或報稅正確；僅協助與本站計算機的假設對齊。</p>
      <ul className={styles.list}>
        {ITEMS.map((item) => (
          <li key={item.id} className={styles.item}>
            <input
              id={`fire-check-${item.id}`}
              type="checkbox"
              className={styles.checkbox}
              checked={!!checked[item.id]}
              onChange={() => toggle(item.id)}
            />
            <label className={styles.label} htmlFor={`fire-check-${item.id}`}>
              {item.text}
            </label>
          </li>
        ))}
      </ul>
      <div className={styles.meter}>
        <div className={styles.meterTop}>
          <span>架構完整度（自評）</span>
          <span>
            {count}/{ITEMS.length}（{pct}%）
          </span>
        </div>
        <div className={styles.meterBar} aria-hidden>
          <div className={styles.meterFill} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.verdict}>
          <strong>摘要：</strong>
          {verdict(count)}
        </p>
      </div>
    </div>
  );
}
