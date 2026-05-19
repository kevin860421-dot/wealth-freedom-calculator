"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickMainCalculatorCta } from "@/app/components/quick-main-calculator-cta";
import { clampNum, monthsToReachTarget } from "@/lib/quick-calculator-math";
import { ANNUAL_PCT, MONEY_MAX, MONEY_MIN, commitMoney, formatTwd, sanitizeCalcInput } from "./logic";

export default function QuickCalculator2View() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [targetMonthly, setTargetMonthly] = useState(50000);
  const [targetMonthlyText, setTargetMonthlyText] = useState(formatTwd(50000));
  const [monthlyInvest, setMonthlyInvest] = useState(20000);
  const [monthlyInvestText, setMonthlyInvestText] = useState(formatTwd(20000));

  const commitTargetMonthly = () => {
    const next = commitMoney(targetMonthlyText, targetMonthly);
    setTargetMonthly(next);
    setTargetMonthlyText(formatTwd(next));
  };

  const commitMonthlyInvest = () => {
    const next = commitMoney(monthlyInvestText, monthlyInvest);
    setMonthlyInvest(next);
    setMonthlyInvestText(formatTwd(next));
  };

  const bumpTarget = (delta: number) => {
    const next = Math.round(clampNum(targetMonthly + delta, MONEY_MIN, MONEY_MAX) / 100) * 100;
    setTargetMonthly(next);
    setTargetMonthlyText(formatTwd(next));
  };

  const bumpInvest = (delta: number) => {
    const next = Math.round(clampNum(monthlyInvest + delta, MONEY_MIN, MONEY_MAX) / 100) * 100;
    setMonthlyInvest(next);
    setMonthlyInvestText(formatTwd(next));
  };

  const targetAsset = useMemo(() => targetMonthly * 240, [targetMonthly]);
  const reachMonths = useMemo(() => monthsToReachTarget(targetAsset, monthlyInvest, ANNUAL_PCT), [targetAsset, monthlyInvest]);

  const reachYearsText = useMemo(() => {
    if (reachMonths == null) return "≥ 100 年";
    return (reachMonths / 12).toFixed(1).replace(/\.0$/, "");
  }, [reachMonths]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const tmRaw = sp.get("tm") ?? sp.get("target_monthly");
      const miRaw = sp.get("mi") ?? sp.get("monthly");
      if (tmRaw != null) {
        const v = Number(tmRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, MONEY_MIN, MONEY_MAX) / 100) * 100;
          setTargetMonthly(next);
          setTargetMonthlyText(formatTwd(next));
        }
      }
      if (miRaw != null) {
        const v = Number(miRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, MONEY_MIN, MONEY_MAX) / 100) * 100;
          setMonthlyInvest(next);
          setMonthlyInvestText(formatTwd(next));
        }
      }
    });
  }, []);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tm", String(targetMonthly));
      url.searchParams.set("mi", String(monthlyInvest));
      const nav = navigator as unknown as { share?: (v: { url?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        padding: "12px",
        color: "#e8eefc",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        @keyframes quick2TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick2-title-gradient {
          background: linear-gradient(
            90deg,
            rgba(196, 210, 240, 0.88),
            #e8eefc,
            rgba(120, 190, 210, 0.95),
            rgba(200, 180, 235, 0.88),
            rgba(196, 210, 240, 0.88)
          );
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: quick2TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, ["--quick-brand-duration" as string]: "2.15s" }}>財富自由計算機</div>
          <button
            type="button"
            onClick={onShare}
            aria-label="分享"
            style={{
              color: "#e8eefc",
              fontWeight: 800,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            {shareState === "copied" ? "已複製" : "分享"}
          </button>
        </div>

        <div
          className="quick2-title-gradient"
          style={{
            fontSize: 30,
            fontWeight: 950,
            marginBottom: 8,
            lineHeight: 1.12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          💣 財富自由倒數計時器
        </div>

        <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 10, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>目標月領金額</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={targetMonthlyText}
                  onChange={(e) => setTargetMonthlyText(sanitizeCalcInput(e.target.value))}
                  onBlur={commitTargetMonthly}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTargetMonthly();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
                />
                <button type="button" onClick={() => bumpTarget(-1000)} style={miniBtn} aria-label="目標月領減 1000">
                  –
                </button>
                <button type="button" onClick={() => bumpTarget(1000)} style={miniBtn} aria-label="目標月領加 1000">
                  +
                </button>
              </div>
              <input
                type="range"
                min={MONEY_MIN}
                max={MONEY_MAX}
                step={100}
                value={clampNum(targetMonthly, MONEY_MIN, MONEY_MAX)}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), MONEY_MIN, MONEY_MAX) / 100) * 100;
                  setTargetMonthly(v);
                  setTargetMonthlyText(formatTwd(v));
                }}
                aria-label="目標月領金額拉條"
                style={sliderStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>每月投入金額</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={monthlyInvestText}
                  onChange={(e) => setMonthlyInvestText(sanitizeCalcInput(e.target.value))}
                  onBlur={commitMonthlyInvest}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitMonthlyInvest();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
                />
                <button type="button" onClick={() => bumpInvest(-1000)} style={miniBtn} aria-label="每月投入減 1000">
                  –
                </button>
                <button type="button" onClick={() => bumpInvest(1000)} style={miniBtn} aria-label="每月投入加 1000">
                  +
                </button>
              </div>
              <input
                type="range"
                min={MONEY_MIN}
                max={MONEY_MAX}
                step={100}
                value={clampNum(monthlyInvest, MONEY_MIN, MONEY_MAX)}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), MONEY_MIN, MONEY_MAX) / 100) * 100;
                  setMonthlyInvest(v);
                  setMonthlyInvestText(formatTwd(v));
                }}
                aria-label="每月投入金額拉條"
                style={sliderStyle}
              />
            </label>

            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>約幾年達成</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#93c5fd" }}>{reachYearsText} 年</div>
            </div>

            <QuickMainCalculatorCta quickId={2} />
            <QuickBlogLinksToggle quickRoute="/quick-2" />
            <QuickSeoExtras id={2} />
            <QuickSeoArticle id={2} />
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  height: 44,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.2)",
  color: "#e8eefc",
  padding: "0 12px",
  fontSize: 20,
  fontWeight: 900,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
};

const miniBtn: CSSProperties = {
  flex: "0 0 44px",
  width: 44,
  height: 44,
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
  flexShrink: 0,
};

const sliderStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 4,
  height: 28,
  accentColor: "#3b82f6",
};

const cardStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.16)",
  padding: 12,
};
