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
  type Plugin,
  type ScriptableContext,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatMoney } from "./logic";
import styles from "./quick11-grace-interest-pk-chart.module.css";

type GraceBarTopLabelsOptions = {
  isLight?: boolean;
  compact?: boolean;
};

const graceBarTopLabelsPlugin: Plugin<"bar"> = {
  id: "graceBarTopLabels",
  afterDatasetsDraw(chart) {
    const pluginOpts = (chart.options.plugins as { graceBarTopLabels?: GraceBarTopLabelsOptions } | undefined)
      ?.graceBarTopLabels;
    const isLight = pluginOpts?.isLight ?? false;
    const compact = pluginOpts?.compact ?? false;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    if (!dataset?.data?.length || !meta?.data?.length) return;

    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    meta.data.forEach((element, index) => {
      const raw = dataset.data[index];
      const value = Number(raw);
      if (!Number.isFinite(value)) return;

      const { x, y } = element.getProps(["x", "y"], true);
      const isWarn = index === 1;
      const label = formatMoney(value);
      const fontSize = isWarn ? (compact ? 12 : 13) : compact ? 11 : 12;

      ctx.save();
      ctx.font = `900 ${fontSize}px "Microsoft JhengHei", "微軟正黑體", "PingFang TC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = isWarn ? "#EF4444" : isLight ? "#64748b" : "#9CA3AF";
      if (isWarn && !isLight) {
        ctx.shadowColor = "rgba(239, 68, 68, 0.55)";
        ctx.shadowBlur = 8;
      }
      const labelY = Math.max(chartArea.top + fontSize, y - 5);
      ctx.fillText(label, x, labelY);
      ctx.restore();
    });
  },
};

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, graceBarTopLabelsPlugin);

const COLOR_BASE_BOTTOM = "rgba(51, 65, 85, 0.75)";
const COLOR_BASE_TOP = "rgba(148, 163, 184, 0.95)";
const COLOR_WARN_BOTTOM = "rgba(127, 29, 29, 0.65)";
const COLOR_WARN_TOP = "rgba(239, 68, 68, 1)";
const METRIC_VALUE_MAX_PX = 24;
const METRIC_VALUE_MIN_PX = 11;

type Quick11GraceInterestPkChartProps = {
  baselineTotalInterest: number;
  graceTotalInterest: number;
  interestIncrease: number;
  isLight?: boolean;
  /** 緊湊儀表板：隱藏指標區、圖表限高 160px */
  compact?: boolean;
};

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
  minPx = METRIC_VALUE_MIN_PX,
  maxPx = METRIC_VALUE_MAX_PX,
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

export function Quick11GraceInterestPkChart({
  baselineTotalInterest,
  graceTotalInterest,
  interestIncrease,
  isLight = false,
  compact = false,
}: Quick11GraceInterestPkChartProps) {
  const peak = Math.max(baselineTotalInterest, graceTotalInterest, 1);
  /** 頂端數字留白：柱高略壓低，避免標籤被裁切 */
  const yMax = Math.ceil(peak * (compact ? 1.2 : 1.15));

  const data = useMemo(
    () => ({
      labels: ["⚪ 原本方案", "🔴 延遲還款"],
      datasets: [
        {
          label: "總繳利息",
          data: [baselineTotalInterest, graceTotalInterest],
          borderRadius: 6,
          borderSkipped: "bottom" as const,
          backgroundColor: (ctx: ScriptableContext<"bar">) => {
            const { chart } = ctx;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) {
              return ctx.dataIndex === 0 ? COLOR_BASE_TOP : COLOR_WARN_TOP;
            }
            const g = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            if (ctx.dataIndex === 0) {
              g.addColorStop(0, COLOR_BASE_BOTTOM);
              g.addColorStop(1, COLOR_BASE_TOP);
              return g;
            }
            g.addColorStop(0, COLOR_WARN_BOTTOM);
            g.addColorStop(1, COLOR_WARN_TOP);
            return g;
          },
          maxBarThickness: compact ? 40 : 56,
        },
      ],
    }),
    [baselineTotalInterest, graceTotalInterest],
  );

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: {
        padding: {
          top: compact ? 28 : 32,
          right: 8,
          bottom: compact ? 6 : 8,
          left: 8,
        },
      },
      plugins: {
        graceBarTopLabels: { isLight, compact },
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: isLight ? "#1f2937" : "#0f172a",
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          callbacks: {
            label: (ctx) => ` NT$ ${formatMoney(Number(ctx.raw))}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawTicks: false },
          border: { display: false },
          ticks: {
            color: isLight ? "#64748b" : "#e5e7eb",
            font: { size: compact ? 13 : 11, weight: "bold" },
            padding: compact ? 6 : 4,
            maxRotation: 0,
            autoSkip: false,
          },
        },
        y: {
          min: 0,
          max: yMax,
          display: false,
          grid: { display: false },
          border: { display: false },
          ticks: { display: false },
        },
      },
    }),
    [yMax, isLight, compact],
  );

  const shellCls = [
    styles.shell,
    compact ? styles.shellCompact : "",
    isLight ? styles.shellLight : styles.shellDark,
  ]
    .filter(Boolean)
    .join(" ");
  const chartCls = [
    styles.chartWrap,
    compact ? styles.chartWrapCompact : "",
    isLight ? styles.chartWrapLight : styles.chartWrapDark,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellCls}>
      <p
        className={`${styles.title} ${compact ? styles.titleCompact : ""} ${isLight ? styles.titleLight : styles.titleDark}`}
      >
        利息暴增對比
      </p>

      {!compact ? (
        <>
          <div className={styles.metricsGrid}>
            <div className={`${styles.metricCell} ${isLight ? styles.metricCellLight : styles.metricCellDark}`}>
              <span className={`${styles.metricLabel} ${isLight ? styles.metricLabelLight : styles.metricLabelDark}`}>
                ⚪ 原本總利息
              </span>
              <MetricFitText
                className={`${styles.metricValue} ${isLight ? styles.metricValueBaseLight : styles.metricValueBaseDark}`}
                fitKey={`base-${baselineTotalInterest}`}
              >
                NT$ {formatMoney(baselineTotalInterest)}
              </MetricFitText>
              <span className={`${styles.metricHint} ${isLight ? styles.metricHintLight : styles.metricHintDark}`}>
                無寬限期
              </span>
            </div>

            <div className={`${styles.metricCell} ${isLight ? styles.metricCellLight : styles.metricCellDark}`}>
              <span className={`${styles.metricLabel} ${isLight ? styles.metricLabelLight : styles.metricLabelDark}`}>
                🔴 多付利息
              </span>
              <MetricFitText
                className={`${styles.metricValue} ${isLight ? styles.metricValueWarnLight : styles.metricValueWarnDark}`}
                fitKey={`warn-${interestIncrease}`}
              >
                +NT$ {formatMoney(interestIncrease)}
              </MetricFitText>
              <span className={`${styles.metricHint} ${isLight ? styles.metricHintLight : styles.metricHintDark}`}>
                延遲還款代價
              </span>
            </div>
          </div>

          <p className={`${styles.sub} ${isLight ? styles.subLight : styles.subDark}`}>
            拖動滑桿時，右柱即時拔高
            {interestIncrease > 0 ? (
              <>
                ，目前已多付 <strong>NT$ {formatMoney(interestIncrease)}</strong>
              </>
            ) : null}
          </p>
        </>
      ) : null}

      <div className={chartCls}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
