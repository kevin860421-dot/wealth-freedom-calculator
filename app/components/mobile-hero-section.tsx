"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BlogPostRegistryEntry } from "../blog/posts/registry";
import heroGold from "./hero-gold-title.module.css";
import styles from "./mobile-hero-section.module.css";

type Props = {
  fireEtaStr: string;
  achievementPercent: number;
  targetQuarterIncomeNum: number;
  showHomeHeroFirstLink: boolean;
  homeHeroFirstEntry: BlogPostRegistryEntry | undefined | null;
  blogHref: string;
  simulationAtTargetYears: { finalBalance: number; totalDividends: number };
};

const CTA_LABEL = "🔥 看節稅攻略（已幫你算好）";

/**
 * 僅供 #mobile-app-view。手機財富自由卡片區（與桌機資料同源，不影響其他頁面）。
 */
export function MobileHeroSection({
  fireEtaStr,
  achievementPercent,
  targetQuarterIncomeNum,
  showHomeHeroFirstLink,
  homeHeroFirstEntry,
  blogHref,
  simulationAtTargetYears,
}: Props) {
  const metricsReady = fireEtaStr !== "—";
  const [barPct, setBarPct] = useState(0);

  useEffect(() => {
    if (!metricsReady) {
      setBarPct(0);
      return;
    }
    setBarPct(0);
    const t = window.setTimeout(() => setBarPct(Math.min(100, achievementPercent)), 80);
    return () => window.clearTimeout(t);
  }, [metricsReady, achievementPercent]);

  const pctDisplay = metricsReady ? achievementPercent : 0;

  return (
    <section className={styles.root}>
      {/* 1️⃣ 標題區 */}
      <header className={styles.titleBlock}>
        <p className={styles.eyebrow}>WEALTH FREEDOM</p>
        <h1 className={heroGold.mobileH1}>財富自由計算機</h1>
        <div>
          <p className={`${heroGold.mobileTagline} ${heroGold.taglineMobileCenter}`}>
            自由
            <br />
            從面對數字開始
          </p>
          <a
            href="/hero-tagline-freedom-from-numbers.png"
            download="hero-tagline-freedom-from-numbers.png"
            className={heroGold.heroAssetDownload}
            style={{ display: "block", textAlign: "center" }}
          >
            下載主視覺 PNG
          </a>
        </div>
      </header>

      {/* 2️⃣ 預估達成時間 */}
      <div className={styles.etaCard} role="region" aria-label="預估達成時間">
        <p className={styles.etaLabel}>預估達成時間</p>
        <p className={`${styles.etaMain} ${!metricsReady ? styles.etaMainMuted : ""}`}>
          {metricsReady ? fireEtaStr : "—"}
        </p>
        <p className={styles.etaSub}>距離財富自由</p>
      </div>

      {/* 3️⃣ 進度 */}
      <div className={styles.progressCard}>
        <div className={styles.progressTop}>
          <div className={styles.progressLines}>
            <div className={styles.progressLinePrimary}>
              目標：{targetQuarterIncomeNum.toLocaleString("zh-TW")} / 月
            </div>
            <div className={styles.progressLineSecondary}>已達成：{pctDisplay}%</div>
          </div>
          <div className={styles.pctBadge} aria-hidden>
            {pctDisplay}%
          </div>
        </div>
        <div className={styles.progressBarRow}>
          <span className={styles.startDot} aria-hidden />
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${barPct}%` }} />
          </div>
        </div>
      </div>

      {/* 4️⃣ CTA */}
      {showHomeHeroFirstLink && homeHeroFirstEntry ? (
        <Link href={blogHref} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          {CTA_LABEL}
        </Link>
      ) : null}

      {/* 5️⃣ KPI */}
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
    </section>
  );
}
