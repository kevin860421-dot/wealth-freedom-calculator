"use client";

import Link from "next/link";
import type { BlogPostRegistryEntry } from "../blog/posts/registry";
import heroGold from "./hero-gold-title.module.css";
import styles from "./mobile-hero-section.module.css";

type Props = {
  fireEtaStr: string;
  /** 達成時間主卡已併入目標儀表板時隱藏，避免重複佔高 */
  hideEtaCard?: boolean;
  showHomeHeroFirstLink: boolean;
  homeHeroFirstEntry: BlogPostRegistryEntry | undefined | null;
  blogHref: string;
  simulationAtTargetYears: { finalBalance: number; totalDividends: number };
};

const CTA_LABEL = "🔥 看節稅攻略（已幫你算好）";

/** 手機首屏：僅主標題（存股參數緊接其下） */
export function MobileHeroTitleSection({ title = "財富自由計算機" }: { title?: string }) {
  return (
    <section className={styles.titleRoot} aria-label="財富自由計算機">
      <header className={styles.titleBlock}>
        <p className={styles.eyebrow}>WEALTH FREEDOM</p>
        <h1 className={heroGold.mobileH1}>{title}</h1>
      </header>
    </section>
  );
}

/**
 * 僅供 #mobile-app-view。手機 KPI／達成進度區（標題已拆至 MobileHeroTitleSection）。
 */
export function MobileHeroSection({
  fireEtaStr,
  hideEtaCard = false,
  showHomeHeroFirstLink,
  homeHeroFirstEntry,
  blogHref,
  simulationAtTargetYears,
}: Props) {
  return (
    <section className={styles.root} aria-label="達成進度與試算摘要">
      {!hideEtaCard ? (
        <div className={styles.etaCard} role="region" aria-label="預估達成時間">
          <p className={styles.etaLabel}>預估達成時間</p>
          <p className={`${styles.etaMain} ${fireEtaStr === "—" ? styles.etaMainMuted : ""}`}>
            {fireEtaStr !== "—" ? fireEtaStr : "—"}
          </p>
          <p className={styles.etaSub}>距離財富自由</p>
        </div>
      ) : null}

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>達成年數</div>
          <div className={`${styles.kpiValue} ${styles.kpiValueNeutral}`}>{fireEtaStr}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>模擬期末資產</div>
          <div className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>
            {Math.round(simulationAtTargetYears.finalBalance).toLocaleString("zh-TW")}
            <span className={styles.kpiUnit}>元</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>累積股利</div>
          <div className={`${styles.kpiValue} ${styles.kpiValueGold}`}>
            {Math.round(simulationAtTargetYears.totalDividends).toLocaleString("zh-TW")}
            <span className={styles.kpiUnit}>元</span>
          </div>
        </div>
      </div>

      {showHomeHeroFirstLink && homeHeroFirstEntry ? (
        <Link href={blogHref} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          {CTA_LABEL}
        </Link>
      ) : null}
    </section>
  );
}
