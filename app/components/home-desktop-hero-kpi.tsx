"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import heroGold from "./hero-gold-title.module.css";
import type { BlogPostRegistryEntry } from "../blog/posts/registry";

export type HomeDesktopHeroKpiProps = {
  cardStyle: CSSProperties;
  fireEtaStr: string;
  achievementPercent: number;
  targetQuarterIncomeNum: number;
  showHomeHeroFirstLink: boolean;
  homeHeroFirstEntry: BlogPostRegistryEntry | null | undefined;
  heroBlogHref: string;
  simulationAtTargetYears: { finalBalance: number; totalDividends: number };
};

/**
 * 桌機專用：Hero 標題列 + 三欄 KPI。與手機 `MobileHeroSection` 分檔、分 DOM，僅共用父層傳入的數值。
 */
export function HomeDesktopHeroKpi({
  cardStyle,
  fireEtaStr,
  achievementPercent,
  targetQuarterIncomeNum,
  showHomeHeroFirstLink,
  homeHeroFirstEntry,
  heroBlogHref,
  simulationAtTargetYears,
}: HomeDesktopHeroKpiProps) {
  return (
    <>
      <header
        style={{
          ...cardStyle,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#39ff14", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
            WEALTH FREEDOM
          </div>
          <h1 className={heroGold.desktopH1}>財富自由計算機</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8, marginBottom: 0 }}>
            月領 {targetQuarterIncomeNum.toLocaleString("zh-TW")}，不是夢，是複利紀律。
          </p>
          {showHomeHeroFirstLink && homeHeroFirstEntry ? (
            <p style={{ marginTop: 10, marginBottom: 0 }}>
              <Link
                href={heroBlogHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "#6ee7b7",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  transition: "none",
                }}
              >
                最近發佈的部落格 →
              </Link>
            </p>
          ) : null}
        </div>
        <div style={{ padding: "10px 0", background: "transparent", fontSize: 12, color: "#6b7280", lineHeight: 1.85 }}>
          <p style={{ margin: "0 0 6px 0" }}>◆ 月領 50,000 不是夢。年化 7%～10% 情境下，最快約 15 年可達成。</p>
          <p style={{ margin: "0 0 6px 0" }}>◆ 不是 3 年翻倍，而是長期複利。</p>
          <p style={{ margin: 0 }}>◆ 模擬每月投入與股利再投入，提早達到屬於你的退休生活，用數據畫出財富自由時間表。</p>
        </div>
        <div style={{ textAlign: "right", minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>FIRE ETA</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#39ff14" }}>只需{fireEtaStr}</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>
              目標 {targetQuarterIncomeNum.toLocaleString("zh-TW")} 元/月 · 達成率 {achievementPercent}%
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, achievementPercent)}%`, height: "100%", background: "#39ff14", borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,23,42,0.7)",
            backgroundImage:
              "linear-gradient(to top, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 88%, rgba(255,255,255,0.04) 0%, transparent 5%), radial-gradient(circle at 80% 92%, rgba(57,255,20,0.05) 0%, transparent 6%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 -2px 16px 2px rgba(57,255,20,0.12)",
            borderBottom: "2px solid rgba(57,255,20,0.35)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>預計達成年數</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb" }}>{fireEtaStr}</div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,23,42,0.7)",
            backgroundImage:
              "linear-gradient(to top, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 88%, rgba(255,255,255,0.04) 0%, transparent 5%), radial-gradient(circle at 80% 92%, rgba(57,255,20,0.05) 0%, transparent 6%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 -2px 16px 2px rgba(57,255,20,0.12)",
            borderBottom: "2px solid rgba(57,255,20,0.35)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>模擬期末資產</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#39ff14" }}>
            {Math.round(simulationAtTargetYears.finalBalance).toLocaleString("zh-TW")} 元
          </div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,23,42,0.7)",
            backgroundImage:
              "linear-gradient(to top, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 88%, rgba(255,255,255,0.04) 0%, transparent 5%), radial-gradient(circle at 80% 92%, rgba(57,255,20,0.05) 0%, transparent 6%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 -2px 16px 2px rgba(57,255,20,0.12)",
            borderBottom: "2px solid rgba(57,255,20,0.35)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>累積股利</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f5c451" }}>
            {Math.round(simulationAtTargetYears.totalDividends).toLocaleString("zh-TW")} 元
          </div>
        </div>
      </div>
    </>
  );
}
