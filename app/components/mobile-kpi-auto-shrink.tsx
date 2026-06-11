"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import styles from "./mobile-kpi-auto-shrink.module.css";

/** 左右 KPI 預設同字級（約 6 位數／千萬級）；任一側放不下時兩邊一起縮小 */
export const KPI_MAX_PX = 52;
const MIN_PX = 18;

function toneClass(tone: AutoShrinkNumberProps["tone"]) {
  return tone === "amber" ? styles.numAmber : tone === "greenGradient" ? styles.numGreenGradient : styles.numGreen;
}

type KpiValueRowProps = {
  text: string;
  unit?: string;
  tone: AutoShrinkNumberProps["tone"];
  fontPx: number;
  flash?: boolean;
  muted?: boolean;
  rowRef?: RefObject<HTMLDivElement | null>;
  numSlotRef?: RefObject<HTMLDivElement | null>;
  numRef?: RefObject<HTMLSpanElement | null>;
};

function KpiValueRow({
  text,
  unit = "元",
  tone,
  fontPx,
  flash = false,
  muted = false,
  rowRef,
  numSlotRef,
  numRef,
}: KpiValueRowProps) {
  return (
    <div
      ref={rowRef}
      className={`${styles.row} ${flash ? styles.rowFlash : ""} ${muted ? styles.rowMuted : ""}`}
    >
      <div ref={numSlotRef} className={styles.numSlot}>
        <span ref={numRef} className={toneClass(tone)} style={{ fontSize: `${fontPx}px` }}>
          {text}
        </span>
      </div>
      <span className={styles.unit}>{unit}</span>
    </div>
  );
}

type AutoShrinkNumberProps = {
  /** 已格式化的數字字串（含千分位） */
  text: string;
  unit?: string;
  tone: "amber" | "green" | "greenGradient";
  muted?: boolean;
  flash?: boolean;
};

/**
 * 卡片 KPI：大數字 + 小單位；容器不足時以 ResizeObserver 動態縮小字級，避免換行溢出。
 */
export function AutoShrinkKpiValue({ text, unit, tone, muted = false, flash = false }: AutoShrinkNumberProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const numSlotRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState(KPI_MAX_PX);

  useEffect(() => {
    const row = rowRef.current;
    const numSlot = numSlotRef.current;
    const num = numRef.current;
    if (!row || !numSlot || !num) return;

    const fit = () => {
      let size = KPI_MAX_PX;
      num.style.fontSize = `${size}px`;
      const maxNumW = numSlot.clientWidth;
      if (maxNumW <= 0) return;
      while (size > MIN_PX && num.scrollWidth > maxNumW) {
        size -= 1;
        num.style.fontSize = `${size}px`;
      }
      setFontPx(size);
    };

    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(row);
    return () => ro.disconnect();
  }, [text, unit]);

  const numCls =
    tone === "amber"
      ? styles.numAmber
      : tone === "greenGradient"
        ? styles.numGreenGradient
        : styles.numGreen;

  return (
    <div
      ref={rowRef}
      className={`${styles.row} ${flash ? styles.rowFlash : ""} ${muted ? styles.rowMuted : ""}`}
    >
      <div ref={numSlotRef} className={styles.numSlot}>
        <span ref={numRef} className={numCls} style={{ fontSize: `${fontPx}px` }}>
          {text}
        </span>
      </div>
      {unit ? <span className={styles.unit}>{unit}</span> : null}
    </div>
  );
}

type EtaParts = { years: string; months: string } | null;

export function parseFireEtaParts(fireEtaStr: string): EtaParts {
  if (fireEtaStr === "—") return null;
  const m = fireEtaStr.match(/^(\d+)\s*年\s*(\d+)\s*個月$/);
  if (!m) return null;
  return { years: m[1], months: m[2] };
}

/** 預估達成：「N 年 M 個月」拆段顯示，數字大、單位小 */
export function AutoShrinkEtaValue({ fireEtaStr, muted = false }: { fireEtaStr: string; muted?: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState(40);
  const parts = parseFireEtaParts(fireEtaStr);

  useEffect(() => {
    const row = rowRef.current;
    const inner = innerRef.current;
    if (!row || !inner) return;

    const fit = () => {
      let size = 40;
      inner.style.fontSize = `${size}px`;
      const maxW = row.clientWidth;
      if (maxW <= 0) return;
      while (size > MIN_PX && row.scrollWidth > maxW) {
        size -= 1;
        inner.style.fontSize = `${size}px`;
      }
      setFontPx(size);
    };

    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(row);
    return () => ro.disconnect();
  }, [fireEtaStr, parts?.years, parts?.months]);

  if (!parts) {
    return (
      <div ref={rowRef} className={`${styles.row} ${styles.rowCenter} ${muted ? styles.rowMuted : ""}`}>
        <span ref={innerRef} className={styles.numGreenGradient} style={{ fontSize: `${fontPx}px` }}>
          {fireEtaStr}
        </span>
      </div>
    );
  }

  return (
    <div ref={rowRef} className={`${styles.row} ${styles.rowCenter} ${muted ? styles.rowMuted : ""}`}>
      <span ref={innerRef} className={styles.etaInner} style={{ fontSize: `${fontPx}px` }}>
        <span className={styles.numGreenGradient}>{parts.years}</span>
        <span className={styles.etaUnit}>年</span>
        <span className={styles.numGreenGradient}>{parts.months}</span>
        <span className={styles.etaUnit}>個月</span>
      </span>
    </div>
  );
}

export function KpiPlaceholder({ children, tone }: { children: ReactNode; tone: "amber" | "green" }) {
  return (
    <div className={`${styles.placeholder} ${tone === "amber" ? styles.placeholderAmber : styles.placeholderGreen}`}>
      {children}
    </div>
  );
}

export type MobileGoalKpiGridProps = {
  leftText: string | null;
  rightText: string | null;
  leftPending?: boolean;
  rightPending?: boolean;
  rightFlash?: boolean;
  gridClassName?: string;
  cardClassNames: { secondary: string; primary: string; label: string };
};

/**
 * 雙欄 KPI：左右數字永遠同字級；以較長者（千萬級）為基準一起縮到能放下。
 */
export function MobileGoalKpiGrid({
  leftText,
  rightText,
  leftPending = false,
  rightPending = false,
  rightFlash = false,
  gridClassName,
  cardClassNames,
}: MobileGoalKpiGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const leftRowRef = useRef<HTMLDivElement>(null);
  const rightRowRef = useRef<HTMLDivElement>(null);
  const leftSlotRef = useRef<HTMLDivElement>(null);
  const rightSlotRef = useRef<HTMLDivElement>(null);
  const leftNumRef = useRef<HTMLSpanElement>(null);
  const rightNumRef = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState(KPI_MAX_PX);

  const isNumericKpi = (text: string | null, pending: boolean) =>
    Boolean(text && !pending && text !== "—" && text !== "計算中…");
  const syncReady = isNumericKpi(leftText, leftPending) && isNumericKpi(rightText, rightPending);

  useEffect(() => {
    if (!syncReady) return;

    const slots = [leftSlotRef, rightSlotRef] as const;
    const nums = [leftNumRef, rightNumRef] as const;
    const rows = [leftRowRef, rightRowRef] as const;

    const applySize = (size: number) => {
      nums.forEach((ref) => {
        if (ref.current) ref.current.style.fontSize = `${size}px`;
      });
    };

    const allFit = (size: number) => {
      applySize(size);
      return slots.every((slotRef, i) => {
        const slot = slotRef.current;
        const num = nums[i].current;
        if (!slot || !num || slot.clientWidth <= 0) return false;
        return num.scrollWidth <= slot.clientWidth;
      });
    };

    const fit = () => {
      let size = KPI_MAX_PX;
      if (!slots.some((s) => (s.current?.clientWidth ?? 0) > 0)) return;
      while (size > MIN_PX && !allFit(size)) {
        size -= 1;
      }
      applySize(size);
      setFontPx(size);
    };

    fit();
    const ro = new ResizeObserver(() => fit());
    if (gridRef.current) ro.observe(gridRef.current);
    rows.forEach((r) => {
      if (r.current) ro.observe(r.current);
    });
    return () => ro.disconnect();
  }, [leftText, rightText, syncReady]);

  return (
    <div ref={gridRef} className={gridClassName}>
      <div className={cardClassNames.secondary}>
        <div className={cardClassNames.label}>建議每月投入</div>
        {leftPending || !leftText || leftText === "—" ? (
          <KpiPlaceholder tone="amber">{leftPending ? "計算中…" : (leftText ?? "—")}</KpiPlaceholder>
        ) : (
          <KpiValueRow
            text={leftText}
            tone="amber"
            fontPx={fontPx}
            rowRef={leftRowRef}
            numSlotRef={leftSlotRef}
            numRef={leftNumRef}
          />
        )}
      </div>
      <div className={cardClassNames.primary}>
        <div className={cardClassNames.label}>達成所需資產</div>
        {rightPending || !rightText || rightText === "—" ? (
          <KpiPlaceholder tone="green">{rightText ?? "—"}</KpiPlaceholder>
        ) : (
          <KpiValueRow
            text={rightText}
            tone="green"
            fontPx={fontPx}
            flash={rightFlash}
            rowRef={rightRowRef}
            numSlotRef={rightSlotRef}
            numRef={rightNumRef}
          />
        )}
      </div>
    </div>
  );
}
