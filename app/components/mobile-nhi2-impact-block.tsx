"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./mobile-nhi2-impact-block.module.css";
import type { TaxSettingsMode } from "./tax-settings-panel";

/** 與 app/page.tsx 試算公式一致，僅供說明區舉例（不影響計算） */
const NHI2_RULE_THRESHOLD = 20000;
const NHI2_RULE_RATE = 0.0211;
const EXAMPLE_COUNTABLE_ABOVE = 30000;
const EXAMPLE_COUNTABLE_BELOW = 15000;
const EXAMPLE_NHI2_ABOVE = Math.round(EXAMPLE_COUNTABLE_ABOVE * NHI2_RULE_RATE);

type DeductionSlice = {
  estimatedDividend: number;
  nhi2Amount: number;
  netPerPeriod: number;
};

type EtfOption = { id: string; label: string };

type Props = {
  taxSettingsMode: TaxSettingsMode;
  applyNhi2InTable: boolean;
  setApplyNhi2InTable: (v: boolean) => void;
  inputStyle: CSSProperties;
  etfCodeFilter: string;
  onEtfCodeChange: (raw: string) => void;
  tickersCount: number;
  selectedEtf: string;
  onSelectEtf: (id: string) => void;
  filteredEtfs: EtfOption[];
  etfRatioEstimates: Record<string, string>;
  onRatioChange: (etfId: string, value: string) => void;
  deductionEstimate: DeductionSlice | null;
  selectedEtfInfo: { id: string; label: string } | null | undefined;
  manualDetailSlot?: ReactNode;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function safeInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function AnimatedInt({ value }: { value: number }) {
  const reduced = usePrefersReducedMotion();
  const safe = safeInt(value);
  const [display, setDisplay] = useState(safe);
  const fromRef = useRef(safe);

  useEffect(() => {
    const to = safeInt(value);
    if (reduced) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    const from = fromRef.current;
    fromRef.current = to;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const duration = 420;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return <>{display.toLocaleString("zh-TW")}</>;
}

export function MobileNhi2ImpactBlock(props: Props) {
  const {
    taxSettingsMode,
    applyNhi2InTable,
    setApplyNhi2InTable,
    inputStyle,
    etfCodeFilter,
    onEtfCodeChange,
    tickersCount,
    selectedEtf,
    onSelectEtf,
    filteredEtfs,
    etfRatioEstimates,
    onRatioChange,
    deductionEstimate,
    selectedEtfInfo,
    manualDetailSlot,
  } = props;

  const [howOpen, setHowOpen] = useState(false);

  const nhi2 = safeInt(deductionEstimate?.nhi2Amount ?? 0);
  const net = safeInt(deductionEstimate?.netPerPeriod ?? 0);
  const gross = deductionEstimate != null ? Math.round(deductionEstimate.estimatedDividend) : null;

  const etfShortName = selectedEtfInfo?.label.split("（")[0].trim() ?? "";
  const showEtfCard = Boolean(selectedEtfInfo && selectedEtf !== "none" && deductionEstimate);

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>二代健保影響</h3>
      {taxSettingsMode === "manual" ? (
        <label className={styles.manualCheckboxRow}>
          <input type="checkbox" checked={applyNhi2InTable} onChange={(e) => setApplyNhi2InTable(e.target.checked)} />
          <span>二代健保</span>
        </label>
      ) : null}

      {/* 先選標的（篩選／ETF／54C），再顯示下方試算；避免捲到卡片底部才找到選股 */}
      <p className={styles.pickEtfHint}>標的篩選與 54C（共 {tickersCount} 檔）</p>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>輸入代碼</span>
          <input
            type="text"
            placeholder="例: 0050"
            value={etfCodeFilter}
            maxLength={5}
            title={`刪空篩選可顯示全部 ${tickersCount} 檔`}
            onChange={(e) => onEtfCodeChange(e.target.value)}
            style={{ ...inputStyle, width: 72, boxSizing: "border-box", height: 30 }}
          />
        </div>
        <div className={styles.field} style={{ flex: "1 1 140px", minWidth: 0 }}>
          <span className={styles.fieldLabel}>選擇 ETF</span>
          <select
            value={selectedEtf}
            onChange={(e) => onSelectEtf(e.target.value)}
            style={{ ...inputStyle, width: "100%", maxWidth: "100%", boxSizing: "border-box", height: 30, paddingRight: 8 }}
          >
            <option value="none">不使用預設</option>
            {filteredEtfs.map((etf) => (
              <option key={etf.id} value={etf.id}>
                {etf.label} 占比 {etfRatioEstimates[etf.id] !== undefined && etfRatioEstimates[etf.id] !== "" ? etfRatioEstimates[etf.id] + "%" : "?"}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>54C %</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="text"
              value={selectedEtf !== "none" ? (etfRatioEstimates[selectedEtf] ?? "") : ""}
              onChange={(e) => {
                if (selectedEtf !== "none") onRatioChange(selectedEtf, e.target.value);
              }}
              placeholder="—"
              style={{ ...inputStyle, width: 44, boxSizing: "border-box", height: 30, textAlign: "center" }}
            />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>%</span>
          </div>
        </div>
      </div>

      {showEtfCard && gross != null ? (
        <div className={styles.etfCard}>
          <div className={styles.etfName}>
            {selectedEtfInfo!.id} · {etfShortName}
          </div>
          <div className={styles.etfRow}>
            <span>股利金額（試算）</span>
            <span className={styles.etfAmt}>{gross.toLocaleString("zh-TW")} 元</span>
          </div>
          <div className={styles.etfRow}>
            <span>稅後實拿（試算）</span>
            <span className={styles.etfNet}>
              <AnimatedInt value={deductionEstimate!.netPerPeriod} /> 元
            </span>
          </div>
        </div>
      ) : selectedEtf === "none" ? (
        <p className={styles.placeholder}>選擇 ETF 後可對照名稱與試算股利／實拿。</p>
      ) : null}

      {deductionEstimate ? (
        <>
          <div className={styles.heroCard}>
            <div className={styles.heroLabel}>你實際拿到</div>
            <div className={styles.heroValue}>
              <AnimatedInt value={net} />
              <span className={styles.heroUnit}>元</span>
            </div>
            {nhi2 === 0 ? (
              <p className={styles.statusOk}>👍 無需繳二代健保</p>
            ) : (
              <p className={styles.statusWarn}>
                ⚠ 已扣 <AnimatedInt value={nhi2} /> 元（二代健保）
              </p>
            )}
          </div>
          <p className={styles.rateHint}>已自動計入 2.11%（達門檻時）</p>
        </>
      ) : (
        <p className={styles.placeholder}>調整左側試算或總股價後，會顯示預估補充保費與實拿。</p>
      )}

      <div>
        <button type="button" className={styles.disclosureBtn} onClick={() => setHowOpen((o) => !o)} aria-expanded={howOpen}>
          <span>{howOpen ? "收合說明" : "👉 ℹ️ 為什麼會扣這個？"}</span>
        </button>
        <div
          className={`${styles.disclosurePanel} ${howOpen ? styles.disclosurePanelOpen : styles.disclosurePanelCollapsed}`}
          aria-hidden={!howOpen}
        >
          <div className={styles.disclosureInner}>
            <div className={styles.disclosureSection}>
              <div className={styles.disclosureSectionHead}>1️⃣ 規則（簡單）</div>
              <p className={styles.disclosureLine}>👉 單筆股利 &gt; 20,000 元</p>
              <p className={styles.disclosureLine}>👉 扣 2.11%</p>
            </div>
            <div className={styles.disclosureSection}>
              <div className={styles.disclosureSectionHead}>2️⃣ 解釋（簡短）</div>
              <p className={styles.disclosureLine}>👉 只針對股利收入</p>
            </div>
            <div className={styles.disclosureSection}>
              <div className={styles.disclosureSectionHead}>3️⃣ 與您有關</div>
              {deductionEstimate ? (
                nhi2 === 0 ? (
                  <p className={`${styles.disclosureLine} ${styles.disclosureLineYou}`}>👉 本次未達門檻 👍</p>
                ) : (
                  <p className={`${styles.disclosureLine} ${styles.disclosureLineYouWarn}`}>
                    👉 本次已扣 <AnimatedInt value={nhi2} /> 元
                  </p>
                )
              ) : (
                <p className={styles.disclosureLineMuted}>👉 完成試算後，這裡會顯示您的狀態</p>
              )}
            </div>
            <div className={styles.disclosureSection}>
              <div className={styles.disclosureSectionHead}>4️⃣ 舉例（算算看）</div>
              <p className={styles.disclosureLine}>
                👉 計入股利 ≥ {NHI2_RULE_THRESHOLD.toLocaleString("zh-TW")} 元時，依本頁試算：補充保費 = 計入股利 × 2.11%
              </p>
              <p className={styles.disclosureLine}>
                👉 例：計入股利 {EXAMPLE_COUNTABLE_ABOVE.toLocaleString("zh-TW")} 元 → {EXAMPLE_COUNTABLE_ABOVE.toLocaleString("zh-TW")} × 2.11% ≈{" "}
                <strong className={styles.disclosureEm}>{EXAMPLE_NHI2_ABOVE.toLocaleString("zh-TW")}</strong> 元
              </p>
              <p className={styles.disclosureLine}>
                👉 例：計入股利 {EXAMPLE_COUNTABLE_BELOW.toLocaleString("zh-TW")} 元 → 未達門檻 → <strong className={styles.disclosureEm}>0</strong> 元
              </p>
            </div>
            <p className={styles.disclosureFootnote}>實際金額以報稅與扣繳為準。</p>
          </div>
        </div>
      </div>

      {manualDetailSlot}
    </div>
  );
}
