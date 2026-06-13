import { Chart as ChartJS, type Plugin } from "chart.js";
import { formatMoney } from "./logic";

export type Quick11BarTopLabelsOptions = {
  /** 僅柱狀圖且明確啟用時才繪製頂端數字，避免污染折線圖 */
  enabled?: boolean;
  isLight?: boolean;
  compact?: boolean;
  /** 數字後綴，例如「 年」 */
  valueSuffix?: string;
  /** true 時不套用 formatMoney（適合年期等小數字） */
  rawValue?: boolean;
  /** term：航程對比（紅／藍柱）；default：利息對比（灰／紅柱） */
  variant?: "default" | "term";
};

function formatBarTopLabel(value: number, opts: Quick11BarTopLabelsOptions): string {
  const suffix = opts.valueSuffix ?? "";
  if (opts.rawValue) {
    const n = Number.isInteger(value) ? String(Math.round(value)) : value.toFixed(1);
    return `${n}${suffix}`;
  }
  return `${formatMoney(value)}${suffix}`;
}

function barTopLabelStyle(
  index: number,
  isLight: boolean,
  variant: Quick11BarTopLabelsOptions["variant"] = "default",
): { fill: string; stroke: string } {
  if (variant === "term") {
    if (index === 0) {
      return isLight
        ? { fill: "#FFFFFF", stroke: "rgba(153, 27, 27, 0.95)" }
        : { fill: "#FFF1F2", stroke: "rgba(69, 10, 10, 0.92)" };
    }
    return isLight
      ? { fill: "#FFFFFF", stroke: "rgba(12, 74, 110, 0.95)" }
      : { fill: "#E0F2FE", stroke: "rgba(12, 74, 110, 0.92)" };
  }

  const isWarn = index === 1;
  if (isWarn) {
    return isLight
      ? { fill: "#FFFFFF", stroke: "rgba(153, 27, 27, 0.95)" }
      : { fill: "#FFF1F2", stroke: "rgba(69, 10, 10, 0.92)" };
  }
  return isLight
    ? { fill: "#0F172A", stroke: "rgba(255, 255, 255, 0.95)" }
    : { fill: "#F8FAFC", stroke: "rgba(15, 23, 42, 0.92)" };
}

export const quick11BarTopLabelsPlugin: Plugin<"bar"> = {
  id: "graceBarTopLabels",
  defaults: {
    enabled: false,
  },
  afterDatasetsDraw(chart) {
    const pluginOpts = (chart.options.plugins as { graceBarTopLabels?: Quick11BarTopLabelsOptions } | undefined)
      ?.graceBarTopLabels;
    if (pluginOpts?.enabled !== true) return;

    const isLight = pluginOpts.isLight ?? false;
    const compact = pluginOpts.compact ?? false;
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
      const label = formatBarTopLabel(value, pluginOpts);
      const fontSize = isWarn ? (compact ? 12 : 13) : compact ? 11 : 12;
      const { fill, stroke } = barTopLabelStyle(index, isLight, pluginOpts.variant);
      const labelY = Math.max(chartArea.top + fontSize + 2, y - 8);

      ctx.save();
      ctx.font = `900 ${fontSize}px "Microsoft JhengHei", "微軟正黑體", "PingFang TC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke;
      ctx.strokeText(label, x, labelY);
      ctx.fillStyle = fill;
      ctx.fillText(label, x, labelY);
      ctx.restore();
    });
  },
};

export function registerQuick11BarTopLabelsPlugin() {
  if (!ChartJS.registry.plugins.get("graceBarTopLabels")) {
    ChartJS.register(quick11BarTopLabelsPlugin);
  }
}
