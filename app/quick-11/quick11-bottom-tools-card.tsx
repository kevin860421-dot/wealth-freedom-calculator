"use client";

import Link from "next/link";
import { trackClickMainCalculator } from "@/lib/gtag-events";
import { pickQuickCrossLinks } from "@/lib/quick-cross-links";
import styles from "./quick11-bottom-tools-card.module.css";

const TOOL_ICONS: Record<number, { icon: string; bg: string }> = {
  6: { icon: "🏠", bg: styles.iconBlue },
  7: { icon: "🚗", bg: styles.iconGreen },
  12: { icon: "📊", bg: styles.iconPurple },
};

type Quick11BottomToolsCardProps = {
  isLight?: boolean;
};

/** 破產計算機頁底：互導工具卡（對齊設計稿 Card 3 樣式） */
export function Quick11BottomToolsCard({ isLight = false }: Quick11BottomToolsCardProps) {
  const links = pickQuickCrossLinks(11, 3);

  return (
    <nav
      aria-labelledby="quick11-more-tools-heading"
      className={`${styles.card} ${isLight ? styles.cardLight : ""}`}
    >
      <div className={styles.head}>
        <span className={styles.rocket} aria-hidden>
          🚀
        </span>
        <div>
          <h2 id="quick11-more-tools-heading" className={`${styles.title} ${isLight ? styles.titleLight : ""}`}>
            想試算更多情境？
          </h2>
          <p className={`${styles.sub} ${isLight ? styles.subLight : ""}`}>使用專業計算機，規劃更好的財務未來</p>
        </div>
      </div>

      <ul className={styles.list}>
        <li>
          <Link href="/" className={`${styles.row} ${styles.rowWithDesc}`} onClick={() => trackClickMainCalculator(11)}>
            <span className={`${styles.iconWrap} ${styles.iconPurple}`} aria-hidden>
              🧮
            </span>
            <span className={styles.rowText}>
              <span className={`${styles.rowTitle} ${isLight ? styles.rowTitleLight : ""}`}>財富自由計算機</span>
              <span className={`${styles.rowDesc} ${isLight ? styles.rowDescLight : ""}`}>完整版試算工具</span>
            </span>
            <span className={styles.chevron} aria-hidden>
              ›
            </span>
          </Link>
        </li>
        {links.map((item) => {
          const visual = TOOL_ICONS[item.id] ?? { icon: "📈", bg: styles.iconBlue };
          return (
            <li key={item.id}>
              <Link href={item.href} className={styles.row}>
                <span className={`${styles.iconWrap} ${visual.bg}`} aria-hidden>
                  {visual.icon}
                </span>
                <span className={styles.rowText}>
                  <span className={`${styles.rowTitle} ${isLight ? styles.rowTitleLight : ""}`}>{item.title}</span>
                </span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
