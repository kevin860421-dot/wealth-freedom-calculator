"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./blog-case-gap-bars.module.css";

/**
 * 進入視窗後動畫：10 萬股利 vs 分離 28% 粗估稅後現金（教學比例條，非個案）。
 */
export function BlogCaseGapBars() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.wrap} role="img" aria-label="十萬元股利與分離課稅粗估對照示意">
      <p className={styles.title}>同一筆 100,000 元股利（教學用粗估）</p>
      <div className={styles.row}>
        <div className={styles.rowLabel}>
          <span>帳面上的股利（入帳金額想像）</span>
          <span>100%</span>
        </div>
        <div className={styles.barBg}>
          <div className={`${styles.barFg} ${styles.gross} ${on ? styles.visible : ""}`} style={{ width: "100%" }} />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.rowLabel}>
          <span>若整筆走<strong>分離課稅 28%</strong>的「稅額想像」</span>
          <span>約 28% 稅</span>
        </div>
        <div className={styles.barBg}>
          <div className={`${styles.barFg} ${styles.sep28} ${on ? styles.visible : ""}`} style={{ width: "28%" }} />
        </div>
      </div>
      <p className={styles.note}>
        這裡只畫「28% 那一刀」讓你有感；還沒算二代健保（單筆逾 2 萬門檻時可能再 2.11%）、也還沒談合併課稅下<strong>股利抵減 8.5%</strong>能不能幫你留更多。
      </p>
    </div>
  );
}
