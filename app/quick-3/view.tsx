"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { clampNum, requiredMonthlyToReachTarget } from "@/lib/quick-calculator-math";
import {
  INVEST_ANNUAL_PCT,
  MONEY_MAX,
  MONEY_MIN,
  YEARS_MAX,
  YEARS_MIN,
  commitMoney,
  commitYearsValue,
  formatTwd,
  parseMoneyInputToInt,
  sanitizeCalcInput,
  targetAssetForMonthlyPayout,
} from "./logic";

export default function QuickCalculator3View() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [hopeMonthly, setHopeMonthly] = useState(50_000);
  const [hopeMonthlyText, setHopeMonthlyText] = useState(formatTwd(50_000));
  const [years, setYears] = useState(20);
  const [yearsText, setYearsText] = useState("20");

  const suggestedMonthly = useMemo(() => {
    const months = Math.max(1, Math.round(years * 12));
    const targetAsset = targetAssetForMonthlyPayout(hopeMonthly, INVEST_ANNUAL_PCT);
    const raw = requiredMonthlyToReachTarget(targetAsset, INVEST_ANNUAL_PCT, months);
    return Math.round(clampNum(raw, MONEY_MIN, MONEY_MAX) / 100) * 100;
  }, [hopeMonthly, years]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const tmRaw = sp.get("tm");
      const yRaw = sp.get("y");
      if (tmRaw != null) {
        const v = Number(tmRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, MONEY_MIN, MONEY_MAX) / 100) * 100;
          setHopeMonthly(next);
          setHopeMonthlyText(formatTwd(next));
        }
      }
      if (yRaw != null) {
        const v = Number(yRaw);
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, YEARS_MIN, YEARS_MAX));
          setYears(next);
          setYearsText(String(next));
        }
      }
    });
  }, []);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tm", String(hopeMonthly));
      url.searchParams.set("y", String(years));
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

  const commitHopeMonthly = () => {
    const next = commitMoney(hopeMonthlyText, hopeMonthly);
    setHopeMonthly(next);
    setHopeMonthlyText(formatTwd(next));
  };

  const bumpHopeMonthly = (delta: number) => {
    const next = Math.round(clampNum(hopeMonthly + delta, MONEY_MIN, MONEY_MAX) / 100) * 100;
    setHopeMonthly(next);
    setHopeMonthlyText(formatTwd(next));
  };

  const commitYears = () => {
    const next = commitYearsValue(yearsText, years);
    setYears(next);
    setYearsText(String(next));
  };

  const bumpYears = (delta: number) => {
    const v = parseMoneyInputToInt(yearsText) ?? years;
    const next = Math.round(clampNum(v + delta, YEARS_MIN, YEARS_MAX));
    setYears(next);
    setYearsText(String(next));
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        padding: "12px 12px 28px",
        color: "#e8eefc",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        @keyframes quick3TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick3-title-gradient {
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
          animation: quick3TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", ["--quick-brand-duration" as string]: "2.35s" }}>
              財富自由計算機
            </div>
            <button
              type="button"
              onClick={onShare}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "#e8eefc",
                fontSize: 16,
                fontWeight: 900,
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="分享"
            >
              {shareState === "copied" ? "已複製" : "分享"}
            </button>
          </div>
          <div
            className="quick3-title-gradient"
            style={{
              fontSize: 30,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            💣 夢想月領試算器
          </div>
        </div>

        <section
          style={{
            marginTop: 0,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            width: "100%",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>希望月領金額</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={hopeMonthlyText}
                  onChange={(e) => setHopeMonthlyText(sanitizeCalcInput(e.target.value))}
                  onBlur={commitHopeMonthly}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitHopeMonthly();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  aria-label="希望月領金額"
                  style={{
                    flex: "1 1 160px",
                    minWidth: 0,
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <button
                  type="button"
                  onClick={() => bumpHopeMonthly(-1000)}
                  aria-label="希望月領減 1000"
                  style={pillBtn}
                >
                  –
                </button>
                <button
                  type="button"
                  onClick={() => bumpHopeMonthly(1000)}
                  aria-label="希望月領加 1000"
                  style={pillBtn}
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min={MONEY_MIN}
                max={MONEY_MAX}
                step={100}
                value={clampNum(hopeMonthly, MONEY_MIN, MONEY_MAX)}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), MONEY_MIN, MONEY_MAX) / 100) * 100;
                  setHopeMonthly(v);
                  setHopeMonthlyText(formatTwd(v));
                }}
                aria-label="希望月領金額拉條"
                style={rangeStyle}
              />
            </div>

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>預計幾年</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, rowGap: 8, justifyContent: "space-between", width: "100%", minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, flex: "1 1 auto", minWidth: 0 }}>
                  <input
                    inputMode="numeric"
                    value={yearsText}
                    onChange={(e) => {
                      const raw = sanitizeCalcInput(e.target.value);
                      setYearsText(raw);
                      if (!/[+\-*/()]/.test(raw)) {
                        const n = parseMoneyInputToInt(raw);
                        if (n !== null) setYears(Math.round(clampNum(n, YEARS_MIN, YEARS_MAX)));
                      }
                    }}
                    onBlur={commitYears}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitYears();
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    aria-label="預計年數"
                    style={{
                      flex: "1 1 64px",
                      minWidth: 48,
                      height: 44,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.20)",
                      color: "#e8eefc",
                      padding: "0 10px",
                      outline: "none",
                      fontSize: 20,
                      fontWeight: 950,
                      fontVariantNumeric: "tabular-nums",
                      boxSizing: "border-box",
                    }}
                  />
                  <button type="button" onClick={() => bumpYears(-1)} aria-label="年數減 1" style={yearBtn}>
                    –
                  </button>
                  <button type="button" onClick={() => bumpYears(1)} aria-label="年數加 1" style={yearBtn}>
                    +
                  </button>
                  <div style={{ fontSize: 16, opacity: 0.85, fontWeight: 900 }}>年</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                  年化 {INVEST_ANNUAL_PCT}%
                </div>
              </div>
              <input
                type="range"
                min={YEARS_MIN}
                max={YEARS_MAX}
                step={1}
                value={clampNum(years, YEARS_MIN, YEARS_MAX)}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), YEARS_MIN, YEARS_MAX));
                  setYears(v);
                  setYearsText(String(v));
                }}
                aria-label="預計幾年拉條"
                style={rangeStyle}
              />
            </div>

            <div style={{ padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.16)", border: "1px solid rgba(147,197,253,0.35)" }}>
              <div style={{ fontSize: 16, fontWeight: 900, opacity: 0.95 }}>建議月投多少</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#93c5fd", fontVariantNumeric: "tabular-nums" }}>
                {formatTwd(suggestedMonthly)}
              </div>
            </div>

            <Link
              href="/"
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                textDecoration: "none",
                padding: "22px 22px",
                borderRadius: 14,
                background: "#2563eb",
                color: "white",
                fontSize: 18,
                fontWeight: 900,
                lineHeight: 1.4,
                letterSpacing: "0.12em",
              }}
            >
              🔍 進入財富自由計算機
            </Link>
            <QuickSeoArticle id={3} />
          </div>
        </section>
      </div>
    </main>
  );
}

const pillBtn: CSSProperties = {
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
};

const yearBtn: CSSProperties = {
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
};

const rangeStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 6,
  height: 28,
  accentColor: "#3b82f6",
};
