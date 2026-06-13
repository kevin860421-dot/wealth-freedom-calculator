"use client";

import { commitFormula } from "@/lib/home-tax-nhi-shared";
import type { TaxSettingsMode } from "@/app/components/tax-settings-panel";

type DeductionEstimate = {
  estimatedDividend: number;
  taxAmount: number;
  taxRatePct: number;
  taxMethod: "separate" | "merge";
  bracketLabel: string;
  nhi2Amount: number;
  nhi2Countable: number;
  ratioPct: number;
};

type Props = {
  taxSettingsMode: TaxSettingsMode;
  deductionEstimate: DeductionEstimate | null;
  totalPriceForEstimateStr: string;
  setTotalPriceForEstimateStr: (v: string) => void;
  computedTotalForEstimate: number;
  sharesForNhi2Threshold: number | null;
  selectedEtfInfo: { id: string } | null | undefined;
};

export function Quick13ManualDetailSlot({
  taxSettingsMode,
  deductionEstimate,
  totalPriceForEstimateStr,
  setTotalPriceForEstimateStr,
  computedTotalForEstimate,
  sharesForNhi2Threshold,
  selectedEtfInfo,
}: Props) {
  if (taxSettingsMode !== "manual" || !deductionEstimate) return null;

  return (
    <div
      style={{
        marginTop: 2,
        padding: "6px 8px",
        background: "rgba(0,0,0,0.2)",
        borderRadius: 8,
        fontSize: 11,
        color: "#d1d5db",
        lineHeight: 1.5,
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 4, fontSize: 12 }}>以總股價試算</div>
      <div style={{ display: "grid", gap: 3 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#9ca3af" }}>年收入級距</span>
          <span>{deductionEstimate.bracketLabel}</span>
          <span style={{ color: "#6b7280", marginLeft: 8 }}>｜</span>
          <span style={{ color: "#9ca3af" }}>稅金依</span>
          <strong>{deductionEstimate.taxMethod === "separate" ? "分開計稅" : "合併計稅"}</strong>
          <span>
            {deductionEstimate.taxMethod === "separate"
              ? "（28%）"
              : `（級距 ${deductionEstimate.taxRatePct}%）`}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "nowrap",
            padding: "6px 0",
            borderTop: "1px dashed rgba(255,255,255,0.08)",
            borderBottom: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <span>總股價</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="可輸入算式"
            value={totalPriceForEstimateStr}
            onChange={(e) => setTotalPriceForEstimateStr(e.target.value)}
            onBlur={() => {
              const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
              if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
              else setTotalPriceForEstimateStr(commitFormula(raw));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
                if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
                else setTotalPriceForEstimateStr(commitFormula(raw));
                (e.target as HTMLInputElement).blur();
              }
            }}
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "4px 8px",
              fontSize: 11,
              color: "#e5e7eb",
              width: 120,
              boxSizing: "border-box",
              height: 24,
            }}
          />
          <span>元</span>
          <span style={{ color: "#9ca3af" }}>→</span>
          <span>
            預估當期股利 <strong>{Math.round(deductionEstimate.estimatedDividend).toLocaleString("zh-TW")}</strong> 元
          </span>
        </div>
        {deductionEstimate.nhi2Countable != null ? (
          <div style={{ fontSize: 10, color: "#9ca3af" }}>
            54C 計入約 <strong>{Math.round(deductionEstimate.nhi2Countable).toLocaleString("zh-TW")}</strong> 元（
            {deductionEstimate.ratioPct}%）
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div>
            所得稅約扣 <strong style={{ color: "#f87171" }}>{deductionEstimate.taxAmount.toLocaleString("zh-TW")}</strong> 元
          </div>
          <div>
            二代健保約扣 <strong style={{ color: "#f5c451" }}>{deductionEstimate.nhi2Amount.toLocaleString("zh-TW")}</strong> 元
            {deductionEstimate.nhi2Amount === 0 ? "（未達 2 萬門檻）" : "（2.11%）"}
          </div>
          {sharesForNhi2Threshold != null && selectedEtfInfo ? (
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              約 <strong style={{ color: "#e5e7eb" }}>{sharesForNhi2Threshold.toLocaleString("zh-TW")}</strong> 股以上需繳二代健保（
              {selectedEtfInfo.id}）
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
