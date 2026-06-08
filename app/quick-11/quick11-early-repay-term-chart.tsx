"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatMoney } from "./logic";
import { splitYearsMonths } from "./repay-simulations";
import styles from "./quick11-early-repay-term-chart.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLOR_ORIGIN = "rgba(239, 68, 68, 0.85)";
const COLOR_ORIGIN_TOP = "rgba(248, 113, 113, 0.95)";
const COLOR_PREPAY = "rgba(56, 189, 248, 1)";
const COLOR_PREPAY_TOP = "rgba(125, 211, 252, 1)";
const METRIC_VALUE_MAX_PX = 26;
const METRIC_VALUE_MIN_PX = 12;

type Quick11EarlyRepayTermChartProps = {
  originalYears: number;
  prepayYears: number;
  savedMonths: number;
  savedInterest: number;
  /** 右柱圖例，預設「提前還款」；大額還款頁傳「大額還款」 */
  compareBarLabel?: string;
  isLight?: boolean;
};

function formatSavedSpan(savedMonths: number): string {
  const { years, months } = splitYearsMonths(savedMonths);
  if (years > 0 && months > 0) return `${years} 年 ${months} 個月`;
  if (years > 0) return `${years} 年`;
  if (months > 0) return `${months} 個月`;
  return "0 個月";
}

function fitTextToContainerWidth(line: HTMLElement, containerWidth: number, minPx: number, maxPx: number) {
  if (containerWidth <= 0) return;
  line.style.fontSize = `${maxPx}px`;
  if (line.scrollWidth <= containerWidth) return;
  let lo = minPx;
  let hi = maxPx;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    line.style.fontSize = `${mid}px`;
    if (line.scrollWidth <= containerWidth) lo = mid;
    else hi = mid;
  }
  line.style.fontSize = `${lo}px`;
}

function MetricFitText({
  children,
  className,
  minPx = 12,
  maxPx = 24,
  fitKey = "",
}: {
  children: ReactNode;
  className: string;
  minPx?: number;
  maxPx?: number;
  fitKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [children, fitKey, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className={styles.metricFitWrap}>
      <span ref={lineRef} className={className} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
  );
}

export function Quick11EarlyRepayTermChart({
  originalYears,
  prepayYears,
  savedMonths,
  savedInterest,
  compareBarLabel = "提前還款",
  isLight = false,
}: Quick11EarlyRepayTermChartProps) {
  const yMax = Math.max(originalYears, prepayYears, 1);
  const savedSpan = formatSavedSpan(savedMonths);
  const compareLabel = `🔵 ${compareBarLabel}`;

  const data = useMemo(
    () => ({
      labels: ["🔴 原本方案", compareLabel],
      datasets: [
        {
          label: "清償年期",
          data: [originalYears, prepayYears],
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: (ctx: ScriptableContext<"bar">) => {
            const { chart } = ctx;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return ctx.dataIndex === 0 ? COLOR_ORIGIN : COLOR_PREPAY;
            const g = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            if (ctx.dataIndex === 0) {
              g.addColorStop(0, "rgba(127, 29, 29, 0.55)");
              g.addColorStop(1, COLOR_ORIGIN_TOP);
              return g;
            }
            g.addColorStop(0, "rgba(12, 74, 110, 0.55)");
            g.addColorStop(1, COLOR_PREPAY_TOP);
            return g;
          },
          maxBarThickness: 56,
        },
      ],
    }),
    [originalYears, prepayYears, compareLabel],
  );

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { top: 18, right: 8, bottom: 4, left: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: isLight ? "#1f2937" : "#0f172a",
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          callbacks: {
            label: (ctx) => ` ${Number(ctx.raw).toFixed(1)} 年`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawTicks: false },
          border: { display: false },
          ticks: {
            color: isLight ? "#64748b" : "#e5e7eb",
            font: { size: 11, weight: "bold" },
            maxRotation: 0,
            autoSkip: false,
          },
        },
        y: {
          min: 0,
          max: yMax,
          grid: { display: false, drawTicks: false },
          border: { display: false },
          ticks: {
            color: isLight ? "#94a3b8" : "#9ca3af",
            font: { size: 10 },
            maxTicksLimit: 6,
            callback: (v) => `${v}年`,
          },
        },
      },
    }),
    [yMax, isLight],
  );

  const savedYears = Math.max(0, originalYears - prepayYears);

  return (
    <div className={`${styles.shell} ${isLight ? styles.shellLight : styles.shellDark}`}>
      <p className={`${styles.title} ${isLight ? styles.titleLight : styles.titleDark}`}>航程對比</p>

      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCell} ${isLight ? styles.metricCellLight : styles.metricCellDark}`}>
          <span className={`${styles.metricLabel} ${isLight ? styles.metricLabelLight : styles.metricLabelDark}`}>
            🎉 提早畢業
          </span>
          <MetricFitText
            className={`${styles.metricValue} ${isLight ? styles.metricValueTimeLight : styles.metricValueTimeDark}`}
            minPx={METRIC_VALUE_MIN_PX}
            maxPx={METRIC_VALUE_MAX_PX}
            fitKey={`time-${savedSpan}`}
          >
            {savedSpan}
          </MetricFitText>
          <span className={`${styles.metricHint} ${isLight ? styles.metricHintLight : styles.metricHintDark}`}>
            縮短航程
          </span>
        </div>

        <div className={`${styles.metricCell} ${isLight ? styles.metricCellLight : styles.metricCellDark}`}>
          <span className={`${styles.metricLabel} ${isLight ? styles.metricLabelLight : styles.metricLabelDark}`}>
            💰 節省燃料
          </span>
          <MetricFitText
            className={`${styles.metricValue} ${isLight ? styles.metricValueMoneyLight : styles.metricValueMoneyDark}`}
            minPx={METRIC_VALUE_MIN_PX}
            maxPx={METRIC_VALUE_MAX_PX}
            fitKey={`money-${savedInterest}`}
          >
            NT$ {formatMoney(savedInterest)}
          </MetricFitText>
          <span className={`${styles.metricHint} ${isLight ? styles.metricHintLight : styles.metricHintDark}`}>
            純利息代價
          </span>
        </div>
      </div>

      <p className={`${styles.sub} ${isLight ? styles.subLight : styles.subDark}`}>
        拖動滑桿時，右柱即時縮短
        {savedYears > 0 ? (
          <>
            ，約 <strong>{savedYears.toFixed(1)}</strong> 年
          </>
        ) : null}
      </p>

      <div className={`${styles.chartWrap} ${isLight ? styles.chartWrapLight : styles.chartWrapDark}`}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
