"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatMoney } from "./logic";

type Quick11VehicleFeePanelProps = {
  open: boolean;
  isLight?: boolean;
  /** 勾選「不計入」時為 true：面板變暗、試算手續費視為 0 */
  feesSkipped: boolean;
  onFeesSkippedChange: (skipped: boolean) => void;
  originationFee: number;
  originationFeeText: string;
  collateralFee: number;
  collateralFeeText: string;
  maxFee: number;
  netProceeds: number;
  aprIncreasePct: number;
  equivalentExtraInterest: number;
  onOriginationTextChange: (raw: string) => void;
  onOriginationCommit: (raw: string) => void;
  onCollateralTextChange: (raw: string) => void;
  onCollateralCommit: (raw: string) => void;
  onOriginationBump: (delta: number) => void;
  onCollateralBump: (delta: number) => void;
};

function FeeField(props: {
  label: string;
  text: string;
  isLight: boolean;
  dimmed: boolean;
  disabled?: boolean;
  onTextChange: (raw: string) => void;
  onCommit: (raw: string) => void;
  onBump: (delta: number) => void;
}) {
  const { label, text, isLight, dimmed, disabled = false, onTextChange, onCommit, onBump } = props;
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 transition ${
        dimmed
          ? isLight
            ? "border-slate-200 bg-slate-50/70 opacity-70"
            : "border-slate-700/80 bg-slate-900/35 opacity-55"
          : isLight
            ? "border-orange-200 bg-orange-50/80 opacity-100"
            : "border-orange-500/35 bg-orange-950/25 opacity-100"
      }`}
    >
      <p
        className={`mb-1 text-[11px] font-semibold tracking-[0.03em] ${
          dimmed
            ? isLight
              ? "text-slate-500"
              : "text-slate-500"
            : isLight
              ? "text-orange-900"
              : "text-orange-200"
        }`}
      >
        {label}
      </p>
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          aria-label="減少"
          disabled={disabled}
          onClick={() => onBump(-500)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[16px] font-black ${
            dimmed
              ? isLight
                ? "border-slate-300 bg-white text-slate-400"
                : "border-slate-600 bg-slate-900 text-slate-500"
              : isLight
                ? "border-orange-300 bg-white text-orange-600"
                : "border-orange-500/50 bg-slate-900 text-orange-300"
          }`}
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={`min-w-0 flex-1 rounded-md border px-2 text-right text-[15px] font-black tracking-[-0.01em] ${
            dimmed
              ? isLight
                ? "border-slate-200 bg-white text-slate-500"
                : "border-slate-700 bg-[#0b1220] text-slate-400"
              : isLight
                ? "border-orange-200 bg-white text-orange-950"
                : "border-orange-500/40 bg-[#0b1220] text-orange-100"
          }`}
        />
        <button
          type="button"
          aria-label="增加"
          disabled={disabled}
          onClick={() => onBump(500)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[16px] font-black ${
            dimmed
              ? isLight
                ? "border-slate-300 bg-white text-slate-400"
                : "border-slate-600 bg-slate-900 text-slate-500"
              : isLight
                ? "border-orange-300 bg-white text-orange-600"
                : "border-orange-500/50 bg-slate-900 text-orange-300"
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function StatCell(props: { label: string; value: string; isLight: boolean; dimmed: boolean; accent?: boolean }) {
  const { label, value, isLight, dimmed, accent = false } = props;
  return (
    <div
      className={`min-w-0 rounded-lg border px-2 py-1.5 transition ${
        dimmed
          ? isLight
            ? "border-slate-200 bg-slate-50/60 opacity-65"
            : "border-slate-700/70 bg-slate-900/30 opacity-50"
          : accent
            ? isLight
              ? "border-orange-300/80 bg-orange-50/90"
              : "border-orange-500/40 bg-orange-950/30"
            : isLight
              ? "border-slate-200 bg-white/90"
              : "border-slate-600/80 bg-slate-900/50"
      }`}
    >
      <p
        className={`truncate text-[10px] font-semibold leading-tight ${
          dimmed ? (isLight ? "text-slate-400" : "text-slate-500") : isLight ? "text-slate-600" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-[13px] font-black leading-none tracking-[-0.01em] ${
          dimmed
            ? isLight
              ? "text-slate-400"
              : "text-slate-500"
            : accent
              ? isLight
                ? "text-orange-700"
                : "text-orange-300"
              : isLight
                ? "text-slate-900"
                : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** 機車／汽車融資：撥款前扣除（在月收入列下方） */
export function Quick11VehicleFeePanel(props: Quick11VehicleFeePanelProps) {
  const {
    open,
    isLight = false,
    feesSkipped,
    onFeesSkippedChange,
    originationFee,
    originationFeeText,
    collateralFee,
    collateralFeeText,
    maxFee,
    netProceeds,
    aprIncreasePct,
    equivalentExtraInterest,
    onOriginationTextChange,
    onOriginationCommit,
    onCollateralTextChange,
    onCollateralCommit,
    onOriginationBump,
    onCollateralBump,
  } = props;

  const total = originationFee + collateralFee;
  const dimmed = feesSkipped || total <= 0;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="vehicle-fee-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div
            className={`space-y-1.5 rounded-lg border px-2 py-2 transition ${
              dimmed
                ? isLight
                  ? "border-slate-200/80 bg-slate-50/40"
                  : "border-slate-700/60 bg-slate-900/25"
                : isLight
                  ? "border-orange-200/80 bg-orange-50/30"
                  : "border-orange-500/25 bg-orange-950/15"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`min-w-0 flex-1 text-[11px] font-medium leading-snug ${
                  dimmed
                    ? isLight
                      ? "text-slate-400"
                      : "text-slate-500"
                    : isLight
                      ? "text-orange-800/90"
                      : "text-orange-200/90"
                }`}
              >
                融資常見撥款前扣除（不計入 PMT 本金，但會拉高實質 APR）
              </p>
              <label
                className={`flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
                  feesSkipped
                    ? isLight
                      ? "border-slate-300 bg-slate-100 text-slate-500"
                      : "border-slate-600 bg-slate-800/80 text-slate-400"
                    : isLight
                      ? "border-orange-200 bg-white text-orange-900"
                      : "border-orange-500/40 bg-slate-900/60 text-orange-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={feesSkipped}
                  onChange={(e) => onFeesSkippedChange(e.target.checked)}
                  className="h-3.5 w-3.5 shrink-0 accent-orange-500"
                />
                不計入
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FeeField
                label="開辦／手續費 (NT$)"
                text={originationFeeText}
                isLight={isLight}
                dimmed={dimmed}
                disabled={feesSkipped}
                onTextChange={onOriginationTextChange}
                onCommit={onOriginationCommit}
                onBump={(d) => onOriginationBump(d)}
              />
              <FeeField
                label="動保設定費 (NT$)"
                text={collateralFeeText}
                isLight={isLight}
                dimmed={dimmed}
                disabled={feesSkipped}
                onTextChange={onCollateralTextChange}
                onCommit={onCollateralCommit}
                onBump={(d) => onCollateralBump(d)}
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <StatCell
                label="扣除後實拿"
                value={`NT$ ${formatMoney(netProceeds)}`}
                isLight={isLight}
                dimmed={dimmed}
              />
              <StatCell
                label="相當增加利息"
                value={`+${aprIncreasePct.toFixed(2)}%`}
                isLight={isLight}
                dimmed={dimmed}
                accent={!dimmed}
              />
              <StatCell
                label="相當增加多少利息"
                value={`NT$ ${formatMoney(equivalentExtraInterest)}`}
                isLight={isLight}
                dimmed={dimmed}
                accent={!dimmed}
              />
            </div>
            <p className={`text-[10px] ${dimmed ? (isLight ? "text-slate-400" : "text-slate-600") : isLight ? "text-orange-700/85" : "text-orange-300/80"}`}>
              {feesSkipped
                ? "已勾選不計入：試算手續費視為 NT$ 0（欄位保留，取消勾選即恢復）"
                : `合計扣除 NT$ ${formatMoney(total)}（上限單項 ${formatMoney(maxFee)}）`}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type Quick11VehicleFeePitfallProps = {
  show: boolean;
  totalDeducted: number;
  nominalRatePct: number;
  effectiveAprPct: number | null;
  netProceeds: number;
  isLight?: boolean;
};

export function Quick11VehicleFeePitfall(props: Quick11VehicleFeePitfallProps) {
  const { show, totalDeducted, nominalRatePct, effectiveAprPct, netProceeds, isLight = false } = props;
  if (!show || totalDeducted <= 0 || effectiveAprPct == null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold leading-relaxed ${
        isLight
          ? "border-orange-400/70 bg-orange-100 text-orange-950 shadow-[0_1px_6px_rgba(251,146,60,0.25)]"
          : "border-orange-500/55 bg-orange-950/40 text-orange-100 shadow-[0_0_12px_rgba(251,146,60,0.12)]"
      }`}
    >
      <p>
        ⚠️ 撥款時將被扣除 NT$ {formatMoney(totalDeducted)} 元，實際到手約 NT$ {formatMoney(netProceeds)}；實質年利率已由原先的{" "}
        <span className="font-black">{nominalRatePct.toFixed(2)}%</span> 變相增加至{" "}
        <span className="font-black text-orange-500">{effectiveAprPct.toFixed(2)}%</span>！
      </p>
    </motion.div>
  );
}
