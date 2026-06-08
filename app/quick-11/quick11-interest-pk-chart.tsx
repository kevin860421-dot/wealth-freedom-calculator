"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ActiveElement,
  type ChartEvent,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatMoney } from "./logic";
import styles from "./quick11-interest-pk-chart.module.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const COLOR_A = "#E8847A";
const COLOR_B_LIGHT = "#1D4ED8";
const COLOR_B_DARK = "#60A5FA";
const GRID_LIGHT = "#EDF2F7";
const GRID_DARK = "rgba(255,255,255,0.06)";
const AXIS_LIGHT = "#333333";
const AXIS_DARK = "rgba(232,238,252,0.70)";
const POINT_RING_LIGHT = "#FFFFFF";
const POINT_RING_DARK = "#0f172a";

type Quick11InterestPkChartProps = {
  years: number[];
  seriesA: number[];
  seriesB: number[];
  legendA: string;
  legendB: string;
  /** 看板用短名（如「本金平均」） */
  compareShortLabel: string;
  title?: string;
  isLight?: boolean;
};

function pickYearTickIndices(years: number[]): Set<number> {
  const n = years.length;
  if (n <= 10) return new Set(Array.from({ length: n }, (_, i) => i));
  const out = new Set<number>([0, n - 1]);
  const step = n > 24 ? 5 : n > 14 ? 3 : 2;
  years.forEach((yy, i) => {
    if (i > 0 && i < n - 1 && yy % step === 0) out.add(i);
  });
  return out;
}

function fmtTickerMoney(n: number): string {
  return `$${formatMoney(Math.round(Number.isFinite(n) ? n : 0))}`;
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

type TickerFitTextProps = {
  children: ReactNode;
  className?: string;
  minPx?: number;
  maxPx?: number;
  align?: "left" | "right" | "center";
  fitKey?: string;
};

function TickerFitText({
  children,
  className = "",
  minPx = 10,
  maxPx = 16,
  align = "left",
  fitKey = "",
}: TickerFitTextProps) {
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

  const alignClass =
    align === "right"
      ? styles.tickerFitWrapRight
      : align === "center"
        ? styles.tickerFitWrapCenter
        : "";

  return (
    <div ref={containerRef} className={`${styles.tickerFitWrap} ${alignClass}`}>
      <span ref={lineRef} className={`${styles.tickerFitLine} ${className}`} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
  );
}

/** 元大看盤 Snap 模式：垂直十字線吸附最近年份節點 */
const snapCrosshairPlugin: Plugin<"line"> = {
  id: "q11SnapCrosshair",
  afterDraw(chart, _args, opts) {
    const pluginOpts = opts as { activeIndex?: number; stroke?: string };
    const idx = pluginOpts.activeIndex;
    if (idx == null || idx < 0 || !chart.chartArea) return;
    const xScale = chart.scales.x;
    if (!xScale) return;
    const x = xScale.getPixelForValue(idx);
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = pluginOpts.stroke ?? "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.restore();
  },
};

if (!ChartJS.registry.plugins.get("q11SnapCrosshair")) {
  ChartJS.register(snapCrosshairPlugin);
}

export function Quick11InterestPkChart({
  years,
  seriesA,
  seriesB,
  legendA,
  legendB,
  compareShortLabel,
  title = "累積利息走勢比較",
  isLight = false,
}: Quick11InterestPkChartProps) {
  const colorB = isLight ? COLOR_B_LIGHT : COLOR_B_DARK;
  const gridColor = isLight ? GRID_LIGHT : GRID_DARK;
  const axisColor = isLight ? AXIS_LIGHT : AXIS_DARK;
  const pointRing = isLight ? POINT_RING_LIGHT : POINT_RING_DARK;
  const crosshairStroke = isLight ? "rgba(100, 116, 139, 0.62)" : "rgba(148, 163, 184, 0.55)";
  const lastIndex = Math.max(0, years.length - 1);
  const [activeIndex, setActiveIndex] = useState(lastIndex);
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    setActiveIndex(Math.max(0, years.length - 1));
  }, [years, seriesA, seriesB]);

  const tickIndices = useMemo(() => pickYearTickIndices(years), [years]);
  const labels = useMemo(() => years.map((y) => `${y}年`), [years]);

  const pickIndexFromChart = useCallback((nativeEvent: Event) => {
    const chart = chartRef.current;
    if (!chart) return;
    const hits = chart.getElementsAtEventForMode(
      nativeEvent,
      "index",
      { axis: "x", intersect: false },
      false,
    );
    if (hits.length > 0) setActiveIndex(hits[0].index);
  }, []);

  const handleHover = useCallback((_ev: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) setActiveIndex(elements[0].index);
  }, []);

  const resetToLast = useCallback(() => {
    setActiveIndex(lastIndex);
  }, [lastIndex]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: legendA,
          data: seriesA,
          borderColor: COLOR_A,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === activeIndex ? 4.5 : 0),
          pointHoverRadius: 0,
          pointBackgroundColor: COLOR_A,
          pointBorderColor: pointRing,
          pointBorderWidth: 2,
        },
        {
          label: legendB,
          data: seriesB,
          borderColor: colorB,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === activeIndex ? 4.5 : 0),
          pointHoverRadius: 0,
          pointBackgroundColor: colorB,
          pointBorderColor: pointRing,
          pointBorderWidth: 2,
        },
      ],
    }),
    [labels, seriesA, seriesB, legendA, legendB, activeIndex, colorB, pointRing],
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { top: 6, right: 8, bottom: 2, left: 2 } },
      interaction: {
        mode: "index",
        axis: "x",
        intersect: false,
      },
      events: ["mousemove", "mouseout", "touchstart", "touchmove", "touchend"],
      onHover: handleHover,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        q11SnapCrosshair: { activeIndex, stroke: crosshairStroke },
      } as ChartOptions<"line">["plugins"],
      scales: {
        x: {
          grid: { color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: {
            color: axisColor,
            font: { size: 10, weight: "bold" },
            maxRotation: 0,
            autoSkip: false,
            callback: (_value, index) => (tickIndices.has(index) ? `${years[index]}年` : ""),
          },
        },
        y: {
          grid: { color: gridColor },
          border: { display: false },
          ticks: {
            color: axisColor,
            font: { size: 10, weight: "normal" },
            maxTicksLimit: 5,
            callback: (value) => {
              const n = Number(value);
              if (!Number.isFinite(n)) return "";
              if (n >= 10_000) return `${Math.round(n / 10_000)}萬`;
              return String(Math.round(n));
            },
          },
        },
      },
    }),
    [handleHover, tickIndices, years, activeIndex, gridColor, axisColor, crosshairStroke],
  );

  const year = years[activeIndex] ?? years[lastIndex] ?? 0;
  const valA = seriesA[activeIndex] ?? 0;
  const valB = seriesB[activeIndex] ?? 0;
  const diff = valA - valB;
  const diffHint =
    diff < 0 ? "(省下)" : diff > 0 ? "(多付)" : "";
  const diffValueClass =
    diff < 0
      ? isLight
        ? styles.tickerRowValueDiffSaveLight
        : styles.tickerRowValueDiffSaveDark
      : diff > 0
        ? isLight
          ? styles.tickerRowValueDiffCostLight
          : styles.tickerRowValueDiffCostDark
        : isLight
          ? styles.tickerRowValueDiffNeutralLight
          : styles.tickerRowValueDiffNeutralDark;

  return (
    <div className={`${styles.shell} ${isLight ? styles.shellLight : styles.shellDark}`}>
      <p className={`${styles.title} ${isLight ? styles.titleLight : styles.titleDark}`}>{title}</p>

      <div
        className={`${styles.ticker} ${isLight ? styles.tickerLight : styles.tickerDark}`}
        aria-live="polite"
      >
        <div className={styles.tickerLayout}>
          <div className={styles.tickerYearCol}>
            <TickerFitText
              className={`${styles.tickerYear} ${isLight ? styles.tickerYearLight : styles.tickerYearDark}`}
              align="center"
              minPx={14}
              maxPx={22}
              fitKey={`year-${year}`}
            >
              第 {year} 年
            </TickerFitText>
          </div>

          <div className={styles.tickerDataCol}>
            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${isLight ? styles.tickerRowLabelLight : styles.tickerRowLabelDark}`}
                minPx={10}
                maxPx={14}
                fitKey="label-a"
              >
                🔴 目前方案
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${styles.tickerRowValueA}`}
                align="right"
                minPx={11}
                maxPx={18}
                fitKey={`val-a-${valA}`}
              >
                {fmtTickerMoney(valA)}
              </TickerFitText>
            </div>

            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${isLight ? styles.tickerRowLabelLight : styles.tickerRowLabelDark}`}
                minPx={10}
                maxPx={14}
                fitKey={`label-b-${compareShortLabel}`}
              >
                🔵 {compareShortLabel}
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${isLight ? styles.tickerRowValueBLight : styles.tickerRowValueBDark}`}
                align="right"
                minPx={11}
                maxPx={18}
                fitKey={`val-b-${valB}`}
              >
                {fmtTickerMoney(valB)}
              </TickerFitText>
            </div>

            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${isLight ? styles.tickerRowLabelLight : styles.tickerRowLabelDark}`}
                minPx={10}
                maxPx={14}
                fitKey="label-diff"
              >
                ⚖️ 差額代價
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${diffValueClass}`}
                align="right"
                minPx={10}
                maxPx={17}
                fitKey={`diff-${diff}`}
              >
                {diff < 0 ? "-" : diff > 0 ? "+" : ""}
                {fmtTickerMoney(Math.abs(diff))}
                {diffHint ? ` ${diffHint}` : ""}
              </TickerFitText>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.chartWrap} ${isLight ? styles.chartWrapLight : styles.chartWrapDark}`}
        onMouseLeave={resetToLast}
        onTouchEnd={resetToLast}
        onTouchCancel={resetToLast}
      >
        <Line
          ref={chartRef}
          data={data}
          options={options}
          onTouchStart={(ev) => pickIndexFromChart(ev.nativeEvent)}
          onTouchMove={(ev) => pickIndexFromChart(ev.nativeEvent)}
        />
      </div>

      <div className={`${styles.legend} ${isLight ? styles.legendLight : styles.legendDark}`}>
        <span className={styles.legendItem}>
          <i className={styles.dotA} aria-hidden />
          {legendA}
        </span>
        <span className={styles.legendItem}>
          <i className={styles.dotB} aria-hidden />
          {legendB}
        </span>
      </div>
    </div>
  );
}
