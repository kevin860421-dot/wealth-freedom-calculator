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
  type ActiveElement,
  type ChartEvent,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatTwd } from "./logic";
import styles from "./quick10-net-worth-chart.module.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

/** 與首頁三張 InfoCard 線色一致 */
const COLOR_WIND = "rgba(134, 239, 172, 0.98)";
const COLOR_CRASH = "rgba(251, 146, 60, 0.98)";
const GRID_DARK = "rgba(255,255,255,0.06)";
const AXIS_DARK = "rgba(232,238,252,0.70)";
const POINT_RING_DARK = "#0f172a";
const CROSSHAIR_STROKE = "rgba(148, 163, 184, 0.72)";

export type Quick10NetWorthChartProps = {
  years: number[];
  seriesA: number[];
  seriesB: number[];
  principal: number;
  legendA: string;
  legendB: string;
  title?: string;
  /** 標題下方橘色情境說明（如大盤點位） */
  subtitle?: string;
};

/** 橫軸稀疏標籤（1/5/10…）；資料點仍為每年，滑動可吸附 1～N 年 */
function pickYearTickIndices(years: number[]): Set<number> {
  const n = years.length;
  if (n <= 1) return new Set([0]);
  const out = new Set<number>([0, n - 1]);
  const anchors = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  for (const y of anchors) {
    const idx = years.indexOf(y);
    if (idx >= 0) out.add(idx);
  }
  if (n > 14) {
    const step = n > 24 ? 5 : 3;
    years.forEach((yy, i) => {
      if (i > 0 && i < n - 1 && yy % step === 0) out.add(i);
    });
  }
  return out;
}

function fmtTickerMoney(n: number): string {
  return `$${formatTwd(Math.round(Number.isFinite(n) ? n : 0))}`;
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

function TickerFitText({
  children,
  className = "",
  minPx = 10,
  maxPx = 16,
  align = "left",
  fitKey = "",
}: {
  children: ReactNode;
  className?: string;
  minPx?: number;
  maxPx?: number;
  align?: "left" | "right" | "center";
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

  const alignClass =
    align === "right" ? styles.tickerFitWrapRight : align === "center" ? styles.tickerFitWrapCenter : "";

  return (
    <div ref={containerRef} className={`${styles.tickerFitWrap} ${alignClass}`}>
      <span ref={lineRef} className={`${styles.tickerFitLine} ${className}`} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
  );
}

/** 元大看盤 Snap：垂直灰色虛線吸附最近年份節點 */
const snapCrosshairPlugin: Plugin<"line"> = {
  id: "q10SnapCrosshair",
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
    ctx.strokeStyle = pluginOpts.stroke ?? CROSSHAIR_STROKE;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.restore();
  },
};

/** 投入本金水平虛線 */
const principalLinePlugin: Plugin<"line"> = {
  id: "q10PrincipalLine",
  afterDraw(chart, _args, opts) {
    const yValue = (opts as { y?: number; stroke?: string }).y;
    if (yValue == null || !Number.isFinite(yValue) || !chart.chartArea) return;
    const yScale = chart.scales.y;
    if (!yScale) return;
    const y = yScale.getPixelForValue(yValue);
    const { left, right } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = (opts as { stroke?: string }).stroke ?? "rgba(229,231,235,0.72)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.restore();
  },
};

if (!ChartJS.registry.plugins.get("q10SnapCrosshair")) {
  ChartJS.register(snapCrosshairPlugin);
}
if (!ChartJS.registry.plugins.get("q10PrincipalLine")) {
  ChartJS.register(principalLinePlugin);
}

export function Quick10NetWorthChart({
  years,
  seriesA,
  seriesB,
  principal,
  legendA,
  legendB,
  title = "淨值走勢",
  subtitle,
}: Quick10NetWorthChartProps) {
  const lastIndex = Math.max(0, years.length - 1);
  const [activeIndex, setActiveIndex] = useState(lastIndex);
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    setActiveIndex(Math.max(0, years.length - 1));
  }, [years, seriesA, seriesB, principal]);

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
    if (hits.length > 0) {
      const next = hits[0].index;
      setActiveIndex((prev) => (prev === next ? prev : next));
    }
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
          borderColor: COLOR_WIND,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === activeIndex ? 4.5 : 0),
          pointHoverRadius: 0,
          pointBackgroundColor: COLOR_WIND,
          pointBorderColor: POINT_RING_DARK,
          pointBorderWidth: 2,
        },
        {
          label: legendB,
          data: seriesB,
          borderColor: COLOR_CRASH,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          borderDash: [7, 6],
          tension: 0.4,
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === activeIndex ? 4.5 : 0),
          pointHoverRadius: 0,
          pointBackgroundColor: COLOR_CRASH,
          pointBorderColor: POINT_RING_DARK,
          pointBorderWidth: 2,
        },
      ],
    }),
    [labels, seriesA, seriesB, legendA, legendB, activeIndex],
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
        q10SnapCrosshair: { activeIndex, stroke: CROSSHAIR_STROKE },
        q10PrincipalLine: { y: principal, stroke: "rgba(229,231,235,0.72)" },
      } as ChartOptions<"line">["plugins"],
      scales: {
        x: {
          grid: { color: GRID_DARK, drawTicks: false },
          border: { display: false },
          ticks: {
            color: AXIS_DARK,
            font: { size: 10, weight: "bold" },
            maxRotation: 0,
            autoSkip: false,
            callback: (_value, index) => (tickIndices.has(index) ? `${years[index]}年` : ""),
          },
        },
        y: {
          grid: { color: GRID_DARK },
          border: { display: false },
          ticks: {
            color: AXIS_DARK,
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
    [handleHover, tickIndices, years, activeIndex, principal],
  );

  const year = years[activeIndex] ?? years[lastIndex] ?? 0;
  const valWind = seriesA[activeIndex] ?? 0;
  const valCrash = seriesB[activeIndex] ?? 0;
  const crashBelowPrincipal = valCrash < principal;

  return (
    <div className={styles.shell}>
      <p className={styles.title}>{title}</p>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

      <div className={styles.ticker} aria-live="polite">
        <div className={styles.tickerLayout}>
          <div className={styles.tickerYearCol}>
            <TickerFitText className={styles.tickerYear} align="center" minPx={14} maxPx={22} fitKey={`year-${year}`}>
              第 {year} 年
            </TickerFitText>
          </div>

          <div className={styles.tickerDataCol}>
            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${styles.tickerRowLabelWind}`}
                minPx={10}
                maxPx={14}
                fitKey="label-wind"
              >
                🟢 順風時，你擁有：
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${styles.tickerRowValueWind}`}
                align="right"
                minPx={11}
                maxPx={18}
                fitKey={`wind-${valWind}`}
              >
                {fmtTickerMoney(valWind)}
              </TickerFitText>
            </div>

            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${styles.tickerRowLabelCrash}`}
                minPx={10}
                maxPx={14}
                fitKey="label-crash"
              >
                🟠 最慘時，你還保：
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${crashBelowPrincipal ? styles.tickerRowValueCrashAlert : styles.tickerRowValueCrash}`}
                align="right"
                minPx={11}
                maxPx={18}
                fitKey={`crash-${valCrash}-${crashBelowPrincipal}`}
              >
                {fmtTickerMoney(valCrash)}
              </TickerFitText>
            </div>

            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${styles.tickerRowLabelPrincipal}`}
                minPx={10}
                maxPx={14}
                fitKey="label-principal"
              >
                ⚪ 投入本金線：
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${styles.tickerRowValuePrincipal}`}
                align="right"
                minPx={11}
                maxPx={18}
                fitKey={`principal-${principal}`}
              >
                {fmtTickerMoney(principal)}
              </TickerFitText>
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.chartWrap}
        onMouseLeave={resetToLast}
        onTouchEnd={resetToLast}
        onTouchCancel={resetToLast}
        onPointerDown={(ev) => {
          if (ev.pointerType === "touch") pickIndexFromChart(ev.nativeEvent);
        }}
        onPointerMove={(ev) => {
          if (ev.pointerType === "touch" || ev.buttons > 0) pickIndexFromChart(ev.nativeEvent);
        }}
      >
        <Line
          ref={chartRef}
          data={data}
          options={options}
          onTouchStart={(ev) => pickIndexFromChart(ev.nativeEvent)}
          onTouchMove={(ev) => pickIndexFromChart(ev.nativeEvent)}
        />
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <i className={styles.dotWind} aria-hidden />
          {legendA}
        </span>
        <span className={styles.legendItem}>
          <i className={styles.dotCrash} aria-hidden />
          {legendB}
        </span>
        <span className={styles.legendItem}>
          <i className={styles.principalDash} aria-hidden />
          灰虛線為本金線（投入 {formatTwd(principal)} 元）
        </span>
      </div>
    </div>
  );
}
