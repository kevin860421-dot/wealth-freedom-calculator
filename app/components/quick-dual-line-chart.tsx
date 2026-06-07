"use client";

import type { CSSProperties, ReactNode } from "react";

export type QuickDualLineChartProps = {
  /** 橫軸刻度（年） */
  years: number[];
  seriesA: number[];
  seriesB: number[];
  legendA: string;
  legendB: string;
  /** 與 quick-8 預設一致 */
  colorA?: string;
  colorB?: string;
  title?: string;
  /** 圖表上方文字區（如 quick-8 里程碑） */
  topNotes?: ReactNode;
  /** 預留頂部高度：3 行（預設）或 4 行（quick-9） */
  topNotesSlotLines?: 3 | 4;
  /** 第二條改虛線（quick-9 風格） */
  dashSeriesB?: boolean;
  /** quick-9：y 軸 gamma 壓縮 */
  yGamma?: number | null;
  /** 水平參考線（原值座標，如本金總額） */
  referenceLineY?: number | null;
  /** 圖例列下方額外說明（如 quick-10 本金線） */
  legendFooter?: ReactNode;
  /** 在各資料點旁顯示數值（如 quick-1） */
  showPointValues?: boolean;
  /** last：僅最後一年刻度（通常為兩線最高／終值）；all：每個刻度都顯示 */
  showPointValuesScope?: "all" | "last";
  formatPointValue?: (n: number) => string;
  /** A 線（紅色）在 <= 此年數時，標籤移到線下；不給則沿用預設 15 年 */
  redLabelBelowYearThreshold?: number;
  /** A 線（紅色）在線下時，額外下移像素（預設 0） */
  redLabelExtraDrop?: number;
  /** A 線（紅色）標籤整體水平偏移像素（預設 0） */
  redLabelXOffset?: number;
  /** 標籤定位模式：legacy 保持舊規則；smart 使用動態避讓（給 quick-8/9/10） */
  pointLabelMode?: "legacy" | "smart";
  /** 深色（預設）或白底 FinTech（quick-11） */
  variant?: "dark" | "light";
};

const DEFAULT_COLOR_A = "rgba(196, 122, 122, 0.92)";
const DEFAULT_COLOR_B = "rgba(106, 165, 184, 0.92)";

export function QuickDualLineChart({
  years,
  seriesA,
  seriesB,
  legendA,
  legendB,
  colorA = DEFAULT_COLOR_A,
  colorB = DEFAULT_COLOR_B,
  title = "淨值折線圖",
  topNotes,
  topNotesSlotLines = 3,
  dashSeriesB = false,
  yGamma = null,
  referenceLineY = null,
  legendFooter,
  showPointValues = false,
  showPointValuesScope = "last",
  formatPointValue,
  redLabelBelowYearThreshold = 15,
  redLabelExtraDrop = 0,
  redLabelXOffset = 0,
  pointLabelMode = "legacy",
  variant = "dark",
}: QuickDualLineChartProps) {
  const isLight = variant === "light";
  const w = 360;
  const hasTop = Boolean(topNotes);
  /** 節點數字在頂端易被 SVG 視窗裁切，預留頂部空間（不改 innerH 比例時同步加高整張圖） */
  const labelHeadroom = showPointValues ? 20 : 0;
  const padT = (hasTop ? (topNotesSlotLines >= 4 ? 78 : 62) : 14) + labelHeadroom;
  const h = (hasTop ? (topNotesSlotLines >= 4 ? 218 : 200) : 162) + labelHeadroom;
  const padL = 12;
  const padR = 30;
  const padB = 26;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxV = Math.max(
    1,
    ...seriesA,
    ...seriesB,
    referenceLineY != null && Number.isFinite(referenceLineY) ? referenceLineY : 0,
  );

  const xAt = (i: number) => padL + innerW * (i / Math.max(1, years.length - 1));
  const yAtLinear = (v: number) => padT + innerH * (1 - v / Math.max(1e-9, maxV));
  const yAtGamma = (v: number) => {
    const x = Math.max(0, v) / Math.max(1e-9, maxV);
    const gamma = yGamma ?? 0.72;
    return padT + innerH * (1 - Math.pow(x, gamma));
  };
  const yAt = yGamma != null ? yAtGamma : yAtLinear;
  const stablePx = (v: number) => Number(v.toFixed(3));

  const fmtPoint = formatPointValue ?? ((n: number) => Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-US"));
  const pointValueFontSize = 14;
  const pointLabelYOffset = 10;
  const pointLabelRaiseA = 6;
  const pointLabelDropB = 6;
  const pointLabelY = (cy: number) => {
    const roomAbove = cy - padT;
    const roomBelow = padT + innerH - cy;
    if (roomAbove > 18) return cy - 9 + pointLabelYOffset;
    if (roomBelow > 20) return cy + 14 + pointLabelYOffset;
    return cy - 6 + pointLabelYOffset;
  };
  const clampLabelY = (y: number) => Math.max(padT + 12, Math.min(padT + innerH - 8, y));

  const toPoints = (arr: number[]) =>
    arr.map((v, i) => `${stablePx(xAt(i)).toFixed(1)},${stablePx(yAt(v)).toFixed(1)}`).join(" ");
  const grid = [0.25, 0.5, 0.75];

  const wrapStyle: CSSProperties = {
    width: "95%",
    margin: "0 auto",
    borderRadius: 12,
  };

  const shellStyle: CSSProperties = isLight
    ? { padding: 10, borderRadius: 14, background: "#ffffff", border: "1px solid #E2E8F0" }
    : { padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" };
  const titleStyle: CSSProperties = { fontSize: 16, opacity: isLight ? 1 : 0.9, fontWeight: 900, color: isLight ? "#1e293b" : undefined };
  const gridStroke = isLight ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.06)";
  const refLineStroke = isLight ? "rgba(100,116,139,0.55)" : "rgba(229,231,235,0.72)";
  const chartFill = isLight ? "#F8FAFC" : "rgba(0,0,0,0.16)";
  const yearLabelFill = isLight ? "rgba(71,85,105,0.85)" : "rgba(232,238,252,0.70)";
  const legendStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 13, opacity: isLight ? 1 : 0.92, fontWeight: 800, color: isLight ? "#334155" : undefined };

  return (
    <div style={shellStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={{ marginTop: 6 }}>
        <div style={wrapStyle}>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            width="100%"
            height={h}
            overflow="visible"
            role="img"
            aria-label={title}
            style={{ display: "block", overflow: "visible" }}
          >
            <rect x="0" y="0" width={w} height={h} rx="12" fill={chartFill} />
            {grid.map((t) => (
              <line
                key={t}
                x1={padL}
                x2={w - padR}
                y1={padT + innerH * t}
                y2={padT + innerH * t}
                stroke={gridStroke}
                strokeWidth="1"
              />
            ))}
            {referenceLineY != null && Number.isFinite(referenceLineY) && referenceLineY > 0 && (
              <line
                x1={padL}
                x2={w - padR}
                y1={yAt(referenceLineY)}
                y2={yAt(referenceLineY)}
                stroke={refLineStroke}
                strokeWidth="1.2"
                strokeDasharray="5 4"
              />
            )}
            <polyline points={toPoints(seriesA)} fill="none" stroke={colorA} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline
              points={toPoints(seriesB)}
              fill="none"
              stroke={colorB}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashSeriesB ? "7 6" : undefined}
            />

            {hasTop && (
              <g transform={`translate(${padL}, 6)`}>{topNotes}</g>
            )}

            {years.map((yy, i) => {
              const x = stablePx(xAt(i));
              const y1 = stablePx(yAt(seriesA[i] ?? 0));
              const y2 = stablePx(yAt(seriesB[i] ?? 0));
              const labelY = h - 8;
              const va = seriesA[i] ?? 0;
              const vb = seriesB[i] ?? 0;
              const showValuesHere =
                showPointValues && (showPointValuesScope === "all" || i === years.length - 1);
              const close = Math.abs(y1 - y2) < 15;
              const edge = i === 0 || i === years.length - 1;
              const isFirstPoint = i === 0;
              const isLastPoint = i === years.length - 1;
              const edgeTextAnchor = isFirstPoint ? "start" : isLastPoint ? "end" : "middle";
              const edgeXOffset = isFirstPoint ? 6 : isLastPoint ? -6 : 0;
              const placeBlueLeftOfPoint = yy <= 10 || yy >= 11;
              const blueLeftShift = yy <= 10 ? -76 : -68;
              const blueTextAnchor = placeBlueLeftOfPoint ? "end" : edgeTextAnchor;
              const blueXOffset = placeBlueLeftOfPoint ? blueLeftShift : edgeXOffset;
              const blueLift = yy <= 10 ? 18 : 24;
              const dxA = showValuesHere && close && !edge ? -16 : 0;
              const dxB = showValuesHere && close && !edge ? 16 : 0;
              const yStack = (y1 + y2) / 2;
              const placeRedBelowLine = yy < redLabelBelowYearThreshold;
              const redLabelY = placeRedBelowLine
                ? y1 + 18 + pointLabelYOffset + redLabelExtraDrop
                : pointLabelY(y1) - pointLabelRaiseA;
              const redStackLabelY = placeRedBelowLine
                ? y1 + 18 + pointLabelYOffset + redLabelExtraDrop
                : yStack - 10 + pointLabelYOffset - pointLabelRaiseA;
              const smartTextAnchor = isFirstPoint ? "start" : isLastPoint ? "end" : "middle";
              const smartXOffset = isFirstPoint ? 8 : isLastPoint ? -8 : 0;
              const smartClose = Math.abs(y1 - y2) < 22;
              const smartNearTopA = y1 - 15 < padT + 8;
              const smartNearBottomB = y2 + 20 > padT + innerH - 4;
              let smartAY = smartNearTopA ? y1 + 18 : y1 - 15;
              let smartBY = smartNearBottomB ? y2 - 14 : y2 + 20;
              if (smartClose) {
                smartAY = Math.min(y1, y2) - 15;
                smartBY = Math.max(y1, y2) + 20;
              }
              smartAY = clampLabelY(smartAY);
              smartBY = clampLabelY(smartBY);
              if (Math.abs(smartAY - smartBY) < 16) {
                smartAY = clampLabelY(smartAY - 10);
                smartBY = clampLabelY(smartBY + 10);
              }
              return (
                <g key={`${yy}-${i}`}>
                  <circle cx={x} cy={y1} r="3.5" fill={colorA} />
                  <circle cx={x} cy={y2} r="3.5" fill={colorB} />
                  {showValuesHere ? (
                    pointLabelMode === "smart" ? (
                      <>
                        <g
                          transform={`translate(${x + smartXOffset}, ${smartAY})`}
                          style={{ transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                        >
                          <text
                            fontSize={pointValueFontSize}
                            textAnchor={smartTextAnchor}
                            fill={colorA}
                            fontWeight="800"
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                            paintOrder="stroke fill"
                            stroke="rgba(0,0,0,0.45)"
                            strokeWidth="1.8"
                          >
                            {fmtPoint(va)}
                          </text>
                        </g>
                        <g
                          transform={`translate(${x + smartXOffset}, ${smartBY})`}
                          style={{ transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                        >
                          <text
                            fontSize={pointValueFontSize}
                            textAnchor={smartTextAnchor}
                            fill={colorB}
                            fontWeight="800"
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                            paintOrder="stroke fill"
                            stroke="rgba(0,0,0,0.45)"
                            strokeWidth="1.8"
                          >
                            {fmtPoint(vb)}
                          </text>
                        </g>
                      </>
                    ) : close && edge ? (
                      <>
                        <g
                          transform={`translate(${x + edgeXOffset + redLabelXOffset}, ${redStackLabelY})`}
                          style={{ transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                        >
                          <text fontSize={pointValueFontSize} textAnchor={edgeTextAnchor} fill={colorA} fontWeight="800">
                            {fmtPoint(va)}
                          </text>
                        </g>
                        <g
                          transform={`translate(${x + blueXOffset}, ${yStack + 2 + pointLabelYOffset + pointLabelDropB - blueLift})`}
                          style={{ transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                        >
                          <text fontSize={pointValueFontSize} textAnchor={blueTextAnchor} fill={colorB} fontWeight="800">
                            {fmtPoint(vb)}
                          </text>
                        </g>
                      </>
                    ) : (
                      <>
                        <g
                          transform={`translate(${x + dxA + redLabelXOffset}, ${redLabelY})`}
                          style={{ transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                        >
                          <text
                            fontSize={pointValueFontSize}
                            textAnchor={close ? "end" : "middle"}
                            fill={colorA}
                            fontWeight="800"
                          >
                            {fmtPoint(va)}
                          </text>
                        </g>
                        <g
                          transform={`translate(${x + dxB + (placeBlueLeftOfPoint ? blueLeftShift : 0)}, ${pointLabelY(y2) + pointLabelDropB - blueLift})`}
                          style={{ transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                        >
                          <text
                            fontSize={pointValueFontSize}
                            textAnchor={placeBlueLeftOfPoint ? "end" : close ? "start" : "middle"}
                            fill={colorB}
                            fontWeight="800"
                          >
                            {fmtPoint(vb)}
                          </text>
                        </g>
                      </>
                    )
                  ) : null}
                  <text x={x} y={labelY} fontSize="10" textAnchor="middle" fill={yearLabelFill} fontWeight="800">
                    {yy}年
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={legendStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: colorA, display: "inline-block" }} />
              {legendA}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: colorB, display: "inline-block" }} />
              {legendB}
            </div>
          </div>
          {legendFooter != null ? (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.88, fontWeight: 750, lineHeight: 1.35 }}>{legendFooter}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
