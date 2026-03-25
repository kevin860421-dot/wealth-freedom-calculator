"use client";

import { useMemo, useState } from "react";
import styles from "./blog-tax-leak-meter.module.css";

/**
 * 拖曳「我有多常忽略實拿」量表，動態填充隱喻條（非精算，情緒＋注意力引導）。
 */
export function BlogTaxLeakMeter() {
  const [v, setV] = useState(42);

  const label = useMemo(() => {
    if (v < 25) return "你其實很在意細節";
    if (v < 55) return "多數人落在這裡：知道有稅，沒算過";
    if (v < 80) return "高警覺：你感覺得到漏錢";
    return "是時候把感覺換成數字";
  }, [v]);

  return (
    <div className={styles.wrap} role="region" aria-label="稅務注意力自評">
      <div className={styles.labelRow}>
        <span>拖一下：你覺得自己有多常「只看配息、不看實拿」？</span>
        <span className={styles.value}>{v}%</span>
      </div>
      <div className={styles.track} aria-hidden>
        <div className={styles.fill} style={{ width: `${v}%` }} />
      </div>
      <input
        className={styles.range}
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-label="忽略實拿程度百分比"
      />
      <p className={styles.caption}>{label}——沒有標準答案，重點是你願不願意用計算機把假設對齊。</p>
    </div>
  );
}
