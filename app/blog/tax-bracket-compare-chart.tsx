"use client";

import { useMemo } from "react";
import { fmtMoney } from "@/lib/dividend-tax-sandbox";
import { buildBracketCompareSeries, DEFAULT_GROSS_STEPS } from "@/lib/tax-bracket-compare-series";
import styles from "./tax-bracket-compare-chart.module.css";

const W = 440;
const H = 232;
const PAD_L = 54;
const PAD_R = 20;
const PAD_T = 18;
const PAD_B = 46;

function useChartGeometry(series: ReturnType<typeof buildBracketCompareSeries>) {
  return useMemo(() => {
    const nets = series.flatMap((p) => [p.netMarginal5, p.netMarginal12]);
    const rawMin = Math.min(...nets);
    const rawMax = Math.max(...nets);
    const span = rawMax - rawMin || 1;
    const pad = Math.max(span * 0.06, 8000);
    const yMin = Math.floor((rawMin - pad) / 5000) * 5000;
    const yMax = Math.ceil((rawMax + pad) / 5000) * 5000;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const gMin = DEFAULT_GROSS_STEPS[0];
    const gMax = DEFAULT_GROSS_STEPS[DEFAULT_GROSS_STEPS.length - 1];

    const gx = (gross: number) => PAD_L + ((gross - gMin) / (gMax - gMin)) * innerW;
    const gy = (net: number) => PAD_T + innerH - ((net - yMin) / (yMax - yMin)) * innerH;

    const path5 = series.map((p) => `${gx(p.gross).toFixed(1)},${gy(p.netMarginal5).toFixed(1)}`).join(" ");
    const path12 = series.map((p) => `${gx(p.gross).toFixed(1)},${gy(p.netMarginal12).toFixed(1)}`).join(" ");

    const forward = series.map((p) => `${gx(p.gross).toFixed(1)},${gy(p.netMarginal5).toFixed(1)}`).join(" ");
    const backward = [...series]
      .reverse()
      .map((p) => `${gx(p.gross).toFixed(1)},${gy(p.netMarginal12).toFixed(1)}`)
      .join(" ");
    const gapFillPoints = `${forward} ${backward}`;

    const yTickN = 4;
    const yTicks: { y: number; label: string }[] = [];
    for (let i = 0; i <= yTickN; i++) {
      const v = yMin + ((yMax - yMin) * i) / yTickN;
      yTicks.push({ y: gy(v), label: `${Math.round(v / 10000)}萬` });
    }

    const xIdx = [0, 2, 4, 6, 8, 9];
    const xTicks = xIdx.map((i) => ({
      x: gx(DEFAULT_GROSS_STEPS[i]),
      label: `${DEFAULT_GROSS_STEPS[i] / 10000}`,
    }));

    return { path5, path12, gapFillPoints, yTicks, xTicks, yMin, yMax, gx, gy };
  }, [series]);
}

export function TaxBracketCompareChart() {
  const series = useMemo(() => buildBracketCompareSeries(DEFAULT_GROSS_STEPS), []);
  const { path5, path12, gapFillPoints, yTicks, xTicks } = useChartGeometry(series);

  const mid = series[Math.min(4, series.length - 1)];
  const gapExample = mid ? Math.round(mid.netAdvantage5Over12) : 0;

  return (
    <figure className={styles.figure} aria-labelledby="chart-tax-compare-title">
      <figcaption id="chart-tax-compare-title" className={styles.caption}>
        合併課稅：邊際稅率 5% 與 12% 的<strong>實拿</strong>對照
      </figcaption>
      <p className={styles.note}>
        縱軸刻度為<strong>實拿</strong>（萬元）；橫軸為單筆股利（萬元）。兩線之間淡色區為「實拿差距」的視覺化。假設：季配 4 次／年、已計
        8.5% 抵減與每戶上限分攤、二代健保；實際以申報為準。
      </p>
      <div className={styles.chartWrap}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="折線圖：股利金額與實拿，邊際稅率百分之五與百分之十二兩條線"
        >
          <defs>
            <linearGradient id="gapFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(168, 181, 160, 0.2)" />
              <stop offset="100%" stopColor="rgba(168, 181, 160, 0.02)" />
            </linearGradient>
          </defs>
          {yTicks.map((t, i) => (
            <line
              key={i}
              x1={PAD_L}
              y1={t.y}
              x2={W - PAD_R}
              y2={t.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          ))}
          <polygon fill="url(#gapFillGrad)" points={gapFillPoints} />
          <polyline
            className={styles.line5}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={path5}
          />
          <polyline
            className={styles.line12}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={path12}
          />
          {xTicks.map((t, i) => (
            <text key={i} x={t.x} y={H - 14} textAnchor="middle" className={styles.axisText}>
              {t.label}
            </text>
          ))}
          <text x={W / 2} y={H - 2} textAnchor="middle" className={styles.axisLabel}>
            單筆股利（萬元）
          </text>
          {yTicks.map((t, i) => (
            <text key={i} x={PAD_L - 8} y={t.y + 4} textAnchor="end" className={styles.axisText}>
              {t.label}
            </text>
          ))}
          <g transform={`translate(18, ${PAD_T + (H - PAD_T - PAD_B) / 2}) rotate(-90)`}>
            <text x={0} y={0} textAnchor="middle" className={styles.axisLabelVert}>
              實拿
            </text>
          </g>
        </svg>
      </div>
      <ul className={styles.legend}>
        <li>
          <span className={styles.dot5} aria-hidden />
          邊際 <strong>5%</strong>：抵減後通常<strong>實拿較高</strong>
        </li>
        <li>
          <span className={styles.dot12} aria-hidden />
          邊際 <strong>12%</strong>：同筆股利<strong>被扣較多</strong>
        </li>
      </ul>
      {mid && (
        <p className={styles.gapHint}>
          例：單筆約 {(mid.gross / 10000).toFixed(0)} 萬元時，兩情境實拿約差 <strong>{fmtMoney(gapExample)}</strong>{" "}
          元（試算）。
        </p>
      )}
    </figure>
  );
}
