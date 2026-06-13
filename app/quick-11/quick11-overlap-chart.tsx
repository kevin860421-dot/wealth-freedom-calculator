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
import styles from "./quick11-overlap-chart.module.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const COLOR_INTEREST = "rgba(220, 38, 38, 0.88)";
const COLOR_BALANCE_LIGHT = "rgba(37, 99, 235, 0.88)";
const COLOR_BALANCE_DARK = "rgba(96, 165, 250, 0.92)";
const GRID_LIGHT = "#EDF2F7";
const GRID_DARK = "rgba(255,255,255,0.06)";
const AXIS_LIGHT = "#333333";
const AXIS_DARK = "rgba(232,238,252,0.70)";
const POINT_RING_LIGHT = "#FFFFFF";
const POINT_RING_DARK = "#0f172a";

export type Quick11OverlapChartProps = {
  years: number[];
  cumInterestSeries: number[];
  balanceSeries: number[];
  crossoverYear: number | null;
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

const snapCrosshairPlugin: Plugin<"line"> = {
  id: "q11OverlapSnapCrosshair",
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

if (!ChartJS.registry.plugins.get("q11OverlapSnapCrosshair")) {
  ChartJS.register(snapCrosshairPlugin);
}

export function Quick11OverlapDesc({ isLight = false }: { isLight?: boolean }) {
  const blue = isLight ? styles.descBlue : styles.descBlueDark;
  const red = isLight ? styles.descRed : styles.descRedDark;
  const yellow = isLight ? styles.descYellow : styles.descYellowDark;
  const tone = isLight ? styles.overlapDescLight : styles.overlapDescDark;

  return (
    <div className={styles.overlapDescWrap}>
      <p className={`${styles.overlapDesc} ${tone}`}>
        <span className={styles.descLine}>
          <span className={blue}>藍線</span>
          是剩餘本金，
          <span className={red}>紅線</span>
          是累積送給銀行的利息。
        </span>
        <span className={styles.descLine}>
          <span className={yellow}>兩線交叉後</span>
          ，你付的利息已超過當下本金。
        </span>
      </p>
    </div>
  );
}

export function Quick11OverlapChart({
  years,
  cumInterestSeries,
  balanceSeries,
  crossoverYear,
  title = "本金與利息消長",
  isLight = false,
}: Quick11OverlapChartProps) {
  const colorBalance = isLight ? COLOR_BALANCE_LIGHT : COLOR_BALANCE_DARK;
  const gridColor = isLight ? GRID_LIGHT : GRID_DARK;
  const axisColor = isLight ? AXIS_LIGHT : AXIS_DARK;
  const pointRing = isLight ? POINT_RING_LIGHT : POINT_RING_DARK;
  const crosshairStroke = isLight ? "rgba(100, 116, 139, 0.62)" : "rgba(148, 163, 184, 0.55)";
  const lastIndex = Math.max(0, years.length - 1);
  const chartRef = useRef<ChartJS<"line">>(null);

  const defaultIndex = useMemo(() => {
    if (crossoverYear != null && years.length) {
      const idx = years.findIndex((y) => y === crossoverYear);
      if (idx >= 0) return idx;
    }
    return lastIndex;
  }, [crossoverYear, years, lastIndex]);

  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  useEffect(() => {
    setActiveIndex(defaultIndex);
  }, [defaultIndex, years, cumInterestSeries, balanceSeries]);

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

  const resetToDefault = useCallback(() => {
    setActiveIndex(defaultIndex);
  }, [defaultIndex]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "累積利息",
          data: cumInterestSeries,
          borderColor: COLOR_INTEREST,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === activeIndex ? 4.5 : 0),
          pointHoverRadius: 0,
          pointBackgroundColor: COLOR_INTEREST,
          pointBorderColor: pointRing,
          pointBorderWidth: 2,
        },
        {
          label: "剩餘本金",
          data: balanceSeries,
          borderColor: colorBalance,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === activeIndex ? 4.5 : 0),
          pointHoverRadius: 0,
          pointBackgroundColor: colorBalance,
          pointBorderColor: pointRing,
          pointBorderWidth: 2,
        },
      ],
    }),
    [labels, cumInterestSeries, balanceSeries, activeIndex, colorBalance, pointRing],
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
        q11OverlapSnapCrosshair: { activeIndex, stroke: crosshairStroke },
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
  const displayYear = year;
  const cumInterest = cumInterestSeries[activeIndex] ?? 0;
  const balance = balanceSeries[activeIndex] ?? 0;
  const interestCrossedBalance = cumInterest >= balance;
  const gap = balance - cumInterest;
  const gapLabel = gap > 0 ? "本金尚多" : gap < 0 ? "利息反超" : "交叉點";
  const gapHint = gap > 0 ? "(本金仍多)" : gap < 0 ? "(利息已超)" : "";
  const gapValueClass =
    gap > 0
      ? isLight
        ? styles.tickerRowValueGapSaveLight
        : styles.tickerRowValueGapSaveDark
      : gap < 0
        ? isLight
          ? styles.tickerRowValueGapWarnLight
          : styles.tickerRowValueGapWarnDark
        : isLight
          ? styles.tickerRowValueGapNeutralLight
          : styles.tickerRowValueGapNeutralDark;

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
              minPx={13}
              maxPx={20}
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
                fitKey="label-interest"
              >
                🔴 累積利息
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${styles.tickerRowValueMoney} ${isLight ? styles.tickerRowValueInterestLight : styles.tickerRowValueInterestDark}`}
                align="right"
                minPx={10}
                maxPx={16}
                fitKey={`interest-${cumInterest}`}
              >
                {fmtTickerMoney(cumInterest)}
              </TickerFitText>
            </div>

            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${isLight ? styles.tickerRowLabelLight : styles.tickerRowLabelDark}`}
                minPx={10}
                maxPx={14}
                fitKey="label-balance"
              >
                🔵 剩餘本金
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${styles.tickerRowValueMoney} ${isLight ? styles.tickerRowValueBalanceLight : styles.tickerRowValueBalanceDark}`}
                align="right"
                minPx={10}
                maxPx={16}
                fitKey={`balance-${balance}`}
              >
                {fmtTickerMoney(balance)}
              </TickerFitText>
            </div>

            <div className={styles.tickerRow}>
              <TickerFitText
                className={`${styles.tickerRowLabel} ${isLight ? styles.tickerRowLabelLight : styles.tickerRowLabelDark}`}
                minPx={10}
                maxPx={14}
                fitKey={`label-gap-${gapLabel}`}
              >
                ⚖️ {gapLabel}
              </TickerFitText>
              <TickerFitText
                className={`${styles.tickerRowValue} ${styles.tickerRowValueMoney} ${gapValueClass}`}
                align="right"
                minPx={9}
                maxPx={15}
                fitKey={`gap-${gap}`}
              >
                {fmtTickerMoney(Math.abs(gap))}
                {gapHint ? ` ${gapHint}` : ""}
              </TickerFitText>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.chartWrap} ${isLight ? styles.chartWrapLight : styles.chartWrapDark}`}
        onMouseLeave={resetToDefault}
        onTouchEnd={resetToDefault}
        onTouchCancel={resetToDefault}
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
          <i className={styles.dotInterest} aria-hidden />
          累積利息
        </span>
        <span className={styles.legendItem}>
          <i className={styles.dotBalance} aria-hidden />
          剩餘本金
        </span>
      </div>

      {crossoverYear != null || years.length > 0 ? (
        <div
          className={`${styles.callout} ${
            interestCrossedBalance
              ? isLight
                ? styles.calloutWarnLight
                : styles.calloutWarnDark
              : isLight
                ? styles.calloutNeutralLight
                : styles.calloutNeutralDark
          }`}
        >
          📌 第 <strong>{displayYear}</strong> 年：
          {interestCrossedBalance
            ? "累積利息已追上剩餘本金"
            : "累積利息尚未追上剩餘本金"}
          {crossoverYear != null && crossoverYear !== displayYear ? (
            <>
              （交叉約第 <strong>{crossoverYear}</strong> 年）
            </>
          ) : null}
          （示意，依目前方案）。
        </div>
      ) : (
        <div className={`${styles.callout} ${isLight ? styles.calloutNeutralLight : styles.calloutNeutralDark}`}>
          此方案在貸款期內未出現利息追上本金交叉點（或年期較短）。
        </div>
      )}
    </div>
  );
}
