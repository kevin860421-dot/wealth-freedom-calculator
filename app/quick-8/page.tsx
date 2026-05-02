"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
}

// 小額顯示「元」，大額顯示「萬」（保留 1 位小數）
function formatSmartUnit(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  if (v < 10000) return `${v.toLocaleString("en-US")} 元`;
  const wan = (v / 10000).toFixed(1).replace(/\.0$/, "");
  return `${wan} 萬`;
}

function sanitizeCalcInput(s: string) {
  return s.replace(/[^\d+\-*/().,%\s]/g, "");
}

function evalCalcInputToNumber(s: string): number | null {
  try {
    const cleaned = s.replace(/,/g, "").trim();
    if (!cleaned) return null;
    if (/[^0-9+\-*/().%\s]/.test(cleaned)) return null;
    const expr = cleaned.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${expr});`)();
    const num = Number(v);
    if (!Number.isFinite(num)) return null;
    return num;
  } catch {
    return null;
  }
}

function parseMoneyInputToInt(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function fvMonthly({
  annualReturnPct,
  months,
  initial,
  monthlyContribution,
}: {
  annualReturnPct: number;
  months: number;
  initial: number;
  monthlyContribution: number;
}) {
  const r = clampNum(annualReturnPct, 0, 99) / 100 / 12;
  let bal = Math.max(0, Number.isFinite(initial) ? initial : 0);
  const c = Math.max(0, Number.isFinite(monthlyContribution) ? monthlyContribution : 0);
  const mMax = Math.max(0, Math.trunc(months));
  for (let m = 1; m <= mMax; m++) {
    bal = bal * (1 + r) + c;
  }
  return bal;
}

const INSTALLMENT_TIPS = [
  "⚠️ 原來月付 {monthlyInstallment}，最後代價是 {deltaMoney}",
  "💸 這筆分期現在爽一下，未來少賺 {deltaMoney}",
  "📉 每月這點分期，默默吃掉你未來 {deltaMoney}",
  "⏳ 分期不是沒錢，是偷走未來的錢",
  "🚀 如果拿去投資，這筆錢可能變成 {deltaMoney}",
] as const;

const TIP_FONT_MAX_PX = 24;
const TIP_FONT_MIN_PX = 8;

/** 數字比主文略大（約 1～2 級），月付與代價分色 */
const TIP_NUMBER_SHARED: CSSProperties = {
  fontSize: "calc(1em + 3px)",
  fontWeight: 900,
  verticalAlign: "baseline",
  wordBreak: "normal",
  overflowWrap: "break-word",
};

const TIP_INSTALLMENT_SPAN_STYLE: CSSProperties = {
  ...TIP_NUMBER_SHARED,
  color: "rgba(252, 211, 77, 0.96)",
};

const TIP_DELTA_SPAN_STYLE: CSSProperties = {
  ...TIP_NUMBER_SHARED,
  color: "rgba(106, 165, 184, 0.98)",
};

function buildInstallmentTipContent(templateIndex: number, monthlyInstallment: number, deltaYuan: number): ReactNode {
  if (monthlyInstallment <= 0) {
    return "🔥 目前沒有分期負擔，你的資產正在加速成長";
  }
  const template = INSTALLMENT_TIPS[templateIndex] ?? INSTALLMENT_TIPS[0];
  const inst = formatTwd(monthlyInstallment);
  const del = formatSmartUnit(deltaYuan);
  const parts: ReactNode[] = [];
  let rest: string = template;
  let k = 0;
  while (rest.length > 0) {
    const mi = rest.indexOf("{monthlyInstallment}");
    const dm = rest.indexOf("{deltaMoney}");
    if (mi === -1 && dm === -1) {
      parts.push(rest);
      break;
    }
    const useMi = mi >= 0 && (dm === -1 || mi <= dm);
    const idx = useMi ? mi : dm;
    const token = useMi ? "{monthlyInstallment}" : "{deltaMoney}";
    if (idx > 0) parts.push(rest.slice(0, idx));
    const amountStyle = useMi ? TIP_INSTALLMENT_SPAN_STYLE : TIP_DELTA_SPAN_STYLE;
    parts.push(
      <span key={`tip-amt-${k++}`} style={amountStyle}>
        {useMi ? inst : del}
      </span>,
    );
    rest = rest.slice(idx + token.length);
  }
  return <>{parts}</>;
}

/** 在 nowrap 下找出最大可塞進寬度的字級；仍塞不下則改為換行 + 最小字 */
function measureTipFitPx(el: HTMLElement): { px: number; wrap: boolean } {
  const avail = el.clientWidth;
  if (avail < 4) return { px: TIP_FONT_MAX_PX, wrap: false };

  el.style.whiteSpace = "nowrap";
  let lo = TIP_FONT_MIN_PX;
  let hi = TIP_FONT_MAX_PX;
  let ans = TIP_FONT_MIN_PX;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth <= avail + 1) {
      ans = mid;
      lo = mid + 0.02;
    } else {
      hi = mid - 0.02;
    }
  }
  el.style.fontSize = `${ans}px`;
  while (ans > TIP_FONT_MIN_PX && el.scrollWidth > avail + 1) {
    ans -= 0.5;
    el.style.fontSize = `${ans}px`;
  }
  if (el.scrollWidth <= avail + 1) {
    el.style.removeProperty("font-size");
    el.style.removeProperty("white-space");
    return { px: Math.round(ans * 10) / 10, wrap: false };
  }
  el.style.whiteSpace = "normal";
  el.style.fontSize = `${TIP_FONT_MIN_PX}px`;
  el.style.removeProperty("font-size");
  el.style.removeProperty("white-space");
  return { px: TIP_FONT_MIN_PX, wrap: true };
}

export default function QuickCalculator8Page() {
  const investAnnualPct = 7;

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  /** 首屏固定 0 避免 SSR/CSR 隨機不一致；掛載後再抽一句（不輪播） */
  const [randomTipIndex, setRandomTipIndex] = useState(0);
  useEffect(() => {
    setRandomTipIndex(Math.floor(Math.random() * INSTALLMENT_TIPS.length));
  }, []);

  // total monthly budget
  const [totalPrice, setTotalPrice] = useState<number>(20000);
  const [totalPriceText, setTotalPriceText] = useState<string>(formatTwd(20000));

  // monthly installment expense (counts as spending)
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(12000);
  const [monthlyInstallmentText, setMonthlyInstallmentText] = useState<string>(formatTwd(12000));

  // investable cashflow per month (paired with installment; sums to totalPrice)
  const [monthlyInvest, setMonthlyInvest] = useState<number>(8000);
  const [monthlyInvestText, setMonthlyInvestText] = useState<string>(formatTwd(8000));

  const [years, setYears] = useState<number>(20);
  const [yearsText, setYearsText] = useState<string>("20");

  const commitMoney = (raw: string, current: number, min: number, max: number) => {
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    return Math.round(clampNum(v ?? current, min, max) / 100) * 100;
  };

  const commitYears = () => {
    const raw = yearsText;
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    const next = Math.round(clampNum(v ?? years, 1, 50));
    setYears(next);
    setYearsText(String(next));
  };

  const bumpYears = (delta: number) => {
    const v = parseMoneyInputToInt(yearsText) ?? years;
    const next = Math.round(clampNum(v + delta, 1, 50));
    setYears(next);
    setYearsText(String(next));
  };

  const monthlyTotal = totalPrice;

  const applySplitFromInstallment = (instRaw: number, total: number) => {
    const safeTotal = Math.max(0, total);
    const inst = Math.round(clampNum(instRaw, 0, safeTotal) / 100) * 100;
    const inv = Math.max(0, safeTotal - inst);
    setMonthlyInstallment(inst);
    setMonthlyInstallmentText(formatTwd(inst));
    setMonthlyInvest(inv);
    setMonthlyInvestText(formatTwd(inv));
  };

  const applySplitFromInvest = (invRaw: number, total: number) => {
    const safeTotal = Math.max(0, total);
    const inv = Math.round(clampNum(invRaw, 0, safeTotal) / 100) * 100;
    const inst = Math.max(0, safeTotal - inv);
    setMonthlyInvest(inv);
    setMonthlyInvestText(formatTwd(inv));
    setMonthlyInstallment(inst);
    setMonthlyInstallmentText(formatTwd(inst));
  };

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("total", String(totalPrice));
      url.searchParams.set("inst", String(monthlyInstallment));
      url.searchParams.set("invest", String(monthlyInvest));
      url.searchParams.set("y", String(years));
      const text = `我在「財富自由計算機」用延遲享樂模擬：每月總額 ${formatTwd(totalPrice)}，分期 ${formatTwd(
        monthlyInstallment
      )}/月，可投資 ${formatTwd(monthlyInvest)}，${years} 年。`;

      const nav = navigator as unknown as { share?: (v: { title?: string; text?: string; url?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ title: "延遲享樂模擬器", text, url: url.toString() });
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url.toString()}`);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1200);
    } catch {}
  };

  const commitTotalPrice = () => {
    const raw = totalPriceText;
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    const next = Math.round(clampNum(v ?? totalPrice, 0, 500000) / 100) * 100;
    setTotalPrice(next);
    setTotalPriceText(formatTwd(next));
    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
  };

  const bumpTotalPrice = (delta: number) => {
    const v = parseMoneyInputToInt(totalPriceText) ?? totalPrice;
    const next = Math.round(clampNum(v + delta, 0, 500000) / 100) * 100;
    setTotalPriceText(formatTwd(next));
    setTotalPrice(next);
    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
  };

  const monthlyContribution = Math.max(0, totalPrice - monthlyInstallment);

  // 核心邏輯（照你指定）
  const result = useMemo(() => {
    const m = years * 12;
    const currentAssets = fvMonthly({ annualReturnPct: investAnnualPct, months: m, initial: 0, monthlyContribution });
    const delayedAssets = fvMonthly({ annualReturnPct: investAnnualPct, months: m, initial: 0, monthlyContribution: totalPrice });
    const loss = delayedAssets - currentAssets;
    return { currentAssets, delayedAssets, loss };
  }, [investAnnualPct, monthlyContribution, totalPrice, years]);

  const yearsList = useMemo(() => {
    const ys = [1, 5, 10, 20, 30, 40, 50];
    const set = new Set<number>(ys);
    set.add(years);
    return Array.from(set).sort((x, y) => x - y);
  }, [years]);

  const series = useMemo(() => {
    const a = yearsList.map((y) => fvMonthly({ annualReturnPct: investAnnualPct, months: y * 12, initial: 0, monthlyContribution }));
    const b = yearsList.map((y) => fvMonthly({ annualReturnPct: investAnnualPct, months: y * 12, initial: 0, monthlyContribution: totalPrice }));
    const maxV = Math.max(1, ...a, ...b);
    return { a, b, maxV };
  }, [investAnnualPct, monthlyContribution, totalPrice, yearsList]);

  /** 路徑 A（照買照付／可投資＝總預算−分期）在固定年數的期末資產，供圖表上方三格對照「分期越高 → 資產越低」 */
  const milestoneCurrentAssets = useMemo(() => {
    const currentAt = (y: number) => {
      const m = y * 12;
      return fvMonthly({ annualReturnPct: investAnnualPct, months: m, initial: 0, monthlyContribution });
    };
    return { y1: currentAt(1), y5: currentAt(5), y50: currentAt(50) };
  }, [investAnnualPct, monthlyContribution]);

  const deltaYuan = Math.max(0, Math.round(result.loss));

  const resolvedRandomTip = useMemo(
    () => buildInstallmentTipContent(randomTipIndex, monthlyInstallment, deltaYuan),
    [randomTipIndex, monthlyInstallment, deltaYuan],
  );

  const tipTextRef = useRef<HTMLDivElement>(null);
  const [tipFontPx, setTipFontPx] = useState(TIP_FONT_MAX_PX);
  const [tipAllowWrap, setTipAllowWrap] = useState(false);

  useLayoutEffect(() => {
    const el = tipTextRef.current;
    if (!el) return;

    const run = () => {
      if (el.clientWidth < 4) return;
      const { px, wrap } = measureTipFitPx(el);
      setTipFontPx((prev) => (Math.abs(prev - px) < 0.05 ? prev : px));
      setTipAllowWrap((prev) => (prev === wrap ? prev : wrap));
    };

    run();
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(run);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [randomTipIndex, monthlyInstallment, deltaYuan]);

  const SEO_ARTICLE =
    "延遲享樂並不是不花錢，而是把「現在就買」改成「先投資、晚一點再買」。很多人用分期付款買車、手機、家電或各種商品，月付金額看起來不大，但它會長期占用你的現金流，讓你每個月能投入市場的金額變少。這台延遲享樂模擬器用最簡單的方式，讓你看到同樣的錢流，如果換一個順序，複利最後會差多少。";

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
        @keyframes quick8TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick8-title-gradient {
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
          animation: quick8TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
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
            className="quick8-title-gradient"
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
            ⏳ 延遲享樂模擬器
          </div>
        </div>

        <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900, marginBottom: 10 }}>把「分期支出」換成「複利投入」會差多少？</div>

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
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>總投資金額</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={totalPriceText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setTotalPriceText(raw);
                    const next = commitMoney(raw, totalPrice, 0, 500000);
                    setTotalPrice(next);
                    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTotalPrice();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={commitTotalPrice}
                  style={{
                    flex: "1 1 220px",
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <button
                  type="button"
                  onClick={() => bumpTotalPrice(+1000)}
                  aria-label="增加 1000"
                  style={{
                    flex: "0 0 44px",
                    width: 44,
                    height: 48,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#e8eefc",
                    fontSize: 20,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => bumpTotalPrice(-1000)}
                  aria-label="減少 1000"
                  style={{
                    flex: "0 0 44px",
                    width: 44,
                    height: 48,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#e8eefc",
                    fontSize: 20,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  –
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, width: "100%", minWidth: 0 }}>
              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, opacity: 0.9, fontWeight: 900 }}>每月分期支出</div>
                <input
                  inputMode="numeric"
                  value={monthlyInstallmentText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setMonthlyInstallmentText(raw);
                    const next = commitMoney(raw, monthlyInstallment, 0, totalPrice);
                    applySplitFromInstallment(next, totalPrice);
                  }}
                  onBlur={() => setMonthlyInstallmentText(formatTwd(monthlyInstallment))}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, opacity: 0.9, fontWeight: 900 }}>可投資金額</div>
                <input
                  inputMode="numeric"
                  value={monthlyInvestText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setMonthlyInvestText(raw);
                    const next = commitMoney(raw, monthlyInvest, 0, totalPrice);
                    applySplitFromInvest(next, totalPrice);
                  }}
                  onBlur={() => setMonthlyInvestText(formatTwd(monthlyInvest))}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </label>
            </div>

            <input
              type="range"
              min={0}
              max={monthlyTotal}
              step={100}
              value={monthlyInvest}
              onChange={(e) => {
                const inv = Math.round(clampNum(Number(e.target.value), 0, totalPrice) / 100) * 100;
                applySplitFromInvest(inv, totalPrice);
              }}
              aria-label="可投資金額與分期支出分配拉條"
              style={{
                display: "block",
                width: "90%",
                maxWidth: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: 2,
                marginBottom: 4,
                height: 28,
              }}
            />

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>設定幾年</div>
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
                        if (n !== null) setYears(Math.round(clampNum(n, 1, 50)));
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
                    aria-label="年數"
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
                  <button
                    type="button"
                    onClick={() => bumpYears(+1)}
                    aria-label="增加 1 年"
                    style={{
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
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => bumpYears(-1)}
                    aria-label="減少 1 年"
                    style={{
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
                    }}
                  >
                    –
                  </button>
                  <div style={{ fontSize: 16, opacity: 0.85, fontWeight: 900 }}>年</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                  年化利率預設{investAnnualPct}%
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={years}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), 1, 50));
                  setYears(v);
                  setYearsText(String(v));
                }}
                aria-label="年數拉條"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  marginTop: 10,
                  height: 28,
                }}
              />
            </div>

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>淨值折線圖</div>
              <div style={{ marginTop: 6 }}>
                {(() => {
                  const w = 360;
                  const h = 200;
                  const padL = 12;
                  const padR = 30;
                  const padT = 62;
                  const padB = 26;
                  const innerW = w - padL - padR;
                  const innerH = h - padT - padB;
                  const yearsArr = yearsList;
                  const a = series.a;
                  const b = series.b;

                  const enjoyColor = "rgba(196, 122, 122, 0.92)";
                  const delayColor = "rgba(106, 165, 184, 0.92)";
                  const asset1yLabelColor = "rgba(252, 211, 77, 0.98)";
                  const asset5yLabelColor = "rgba(134, 239, 172, 0.98)";
                  const asset50yLabelColor = "rgba(147, 197, 253, 0.98)";

                  const xAt = (i: number) => padL + innerW * (i / Math.max(1, yearsArr.length - 1));
                  const yAt = (v: number) => padT + innerH * (1 - v / Math.max(1e-9, series.maxV));
                  const toPoints = (arr: number[]) => arr.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
                  const grid = [0.25, 0.5, 0.75];

                  return (
                    <div style={{ width: "95%", margin: "0 auto", borderRadius: 12 }}>
                      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="淨值折線圖" style={{ display: "block" }}>
                        <rect x="0" y="0" width={w} height={h} rx="12" fill="rgba(0,0,0,0.16)" />
                        {grid.map((t) => (
                          <line key={t} x1={padL} x2={w - padR} y1={padT + innerH * t} y2={padT + innerH * t} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        ))}
                        <polyline points={toPoints(a)} fill="none" stroke={enjoyColor} strokeWidth="3" />
                        <polyline points={toPoints(b)} fill="none" stroke={delayColor} strokeWidth="3" />

                        <g transform={`translate(${padL}, 6)`}>
                          <text x="0" y="16" fontSize="14" fill={asset1yLabelColor} fontWeight="900">
                            1年資產：{formatSmartUnit(milestoneCurrentAssets.y1)}
                          </text>
                          <text x="0" y="34" fontSize="14" fill={asset5yLabelColor} fontWeight="900">
                            5年資產：{formatSmartUnit(milestoneCurrentAssets.y5)}
                          </text>
                          <text x="0" y="52" fontSize="14" fill={asset50yLabelColor} fontWeight="900">
                            50年資產：{formatSmartUnit(milestoneCurrentAssets.y50)}
                          </text>
                        </g>

                        {yearsArr.map((yy, i) => {
                          const x = xAt(i);
                          const y1 = yAt(a[i] ?? 0);
                          const y2 = yAt(b[i] ?? 0);
                          const labelY = h - 8;
                          return (
                            <g key={yy}>
                              <circle cx={x} cy={y1} r="3.5" fill={enjoyColor} />
                              <circle cx={x} cy={y2} r="3.5" fill={delayColor} />
                              <text x={x} y={labelY} fontSize="10" textAnchor="middle" fill="rgba(232,238,252,0.70)" fontWeight="800">
                                {yy}年
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 13, opacity: 0.92, fontWeight: 800 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 99, background: enjoyColor, display: "inline-block" }} />
                          照買照付（照常月投入）
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 99, background: delayColor, display: "inline-block" }} />
                          延遲享樂（分期改投入）
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div
              style={{
                padding: "12px 10px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                ref={tipTextRef}
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  fontSize: `${tipFontPx}px`,
                  opacity: 0.98,
                  fontWeight: 950,
                  lineHeight: 1.35,
                  whiteSpace: tipAllowWrap ? "normal" : "nowrap",
                  wordBreak: tipAllowWrap ? "break-word" : "normal",
                  overflowWrap: tipAllowWrap ? "break-word" : "normal",
                  overflowX: "hidden",
                }}
              >
                {resolvedRandomTip}
              </div>
            </div>

            <Link
              href="/"
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
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
              <span style={{ lineHeight: 1.4, letterSpacing: "0.12em" }}>🔍 進入財富自由計算機</span>
              <span style={{ fontSize: 16, fontWeight: 800, opacity: 0.95, lineHeight: 1.4, letterSpacing: "0.12em" }}>壓力測試與精確設定</span>
            </Link>

            <div
              aria-hidden
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                overflow: "hidden",
                clipPath: "inset(50%)",
                whiteSpace: "pre-wrap",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0,
              }}
            >
              {SEO_ARTICLE}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
