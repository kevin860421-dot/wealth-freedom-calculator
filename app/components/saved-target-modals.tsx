"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { CalculatorSnapshotV1 } from "../../lib/calculator-persistence";
import {
  OPEN_WATCHLIST_MODAL_EVENT,
  RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY,
} from "../../lib/watchlist-modal-events";
import type { WatchlistPayload } from "../../lib/watchlist-payload";
import {
  loadSlotCalculators,
  loadTargetBundles,
  SAVED_TARGET_SLOT_COUNT,
  setSlotCalculator,
  type TargetSlotBundle,
  WATCHLIST_SLOT_SESSION_KEY,
} from "../../lib/saved-target-slots";
import styles from "./saved-target-modals.module.css";

function payoutLabel(f: CalculatorSnapshotV1["payoutFrequency"]): string {
  if (f === "month") return "月配";
  if (f === "quarter") return "季配";
  if (f === "semiannual") return "半年配";
  return "年配";
}

function formatSnapshotPreview(s: CalculatorSnapshotV1): string {
  const dy = s.dividendYieldPct == null ? "—" : String(s.dividendYieldPct);
  const sd = s.stockDividendPct == null ? "—" : String(s.stockDividendPct);
  const rs =
    s.rateSource === "annual" ? "年化" : s.rateSource === "dividend" ? "股息推算" : "—";
  return [
    `標的：${s.selectedEtf === "none" ? "未使用預設" : s.selectedEtf}`,
    `起始本金：${s.initialPrincipal}　月投：${s.monthlyContribution}　加碼：${s.monthlyExtra}`,
    `年化 ${s.annualReturnRate}%　股息率 ${dy}%　股利率 ${sd}%（${rs}）`,
    `配息：${payoutLabel(s.payoutFrequency)}　再投入 ${s.reinvestRatio}%`,
    `目標月領：${s.targetQuarterIncome}　第 ${s.nthPeriod} 次投入`,
    `起始年月：${s.initialYearStr}/${s.initialMonthStr}　預設年月：${s.defaultYearStr}/${s.defaultMonthStr}`,
    `達成年數目標：${s.targetYearsToAchieve}`,
  ].join("\n");
}

function slotSummaryLine(s: CalculatorSnapshotV1 | null): string {
  if (!s) return "（空白）";
  const tag = s.selectedEtf === "none" ? "自訂" : s.selectedEtf;
  return `${tag} · 本金 ${s.initialPrincipal}`;
}

function hasNotesContent(n: WatchlistPayload): boolean {
  return (
    n.ticker.trim().length > 0 ||
    n.name.trim().length > 0 ||
    n.annualReturnPct.trim().length > 0 ||
    n.dividendYieldPct.trim().length > 0 ||
    n.stockDividendPct.trim().length > 0 ||
    n.rows.some(
      (r) =>
        r.value.trim().length > 0 ||
        (r.preset === "custom" && r.customLabel.trim().length > 0),
    )
  );
}

function formatNotesPreview(n: WatchlistPayload): string {
  const lines: string[] = [];
  const ticker = n.ticker.trim() || "—";
  const name = n.name.trim();
  lines.push(`代號：${ticker}${name ? `　名稱：${name}` : ""}`);
  const ar = n.annualReturnPct.trim();
  const dy = n.dividendYieldPct.trim();
  const sd = n.stockDividendPct.trim();
  if (ar || dy || sd) {
    lines.push(`參考：年化 ${ar || "—"}%　股息 ${dy || "—"}%　股利 ${sd || "—"}%`);
  }
  const firstDetail = n.rows.find((r) => r.value.trim().length > 0);
  if (firstDetail) {
    const label =
      firstDetail.preset === "custom" && firstDetail.customLabel.trim()
        ? firstDetail.customLabel.trim()
        : "細項";
    const snippet = firstDetail.value.trim().slice(0, 140);
    lines.push(`摘錄（${label}）：${snippet}${firstDetail.value.trim().length > 140 ? "…" : ""}`);
  }
  return lines.join("\n");
}

function bundleRowLabel(b: TargetSlotBundle): ReactNode {
  if (b.calculator) return slotSummaryLine(b.calculator);
  if (b.notes && hasNotesContent(b.notes)) {
    const t = b.notes.ticker.trim() || "未填代號";
    const nm = b.notes.name.trim();
    return `${t}${nm ? ` · ${nm}` : ""}（僅自選股）`;
  }
  return <span className={styles.slotEmpty}>尚未儲存</span>;
}

const APPLY_ONLY_WARN_TEXT =
  "僅有自選股資料而無試算時，無法套用至上方試算表。請先按「加入標的」儲存試算至本組。";

function clampPreviewPos(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const pad = 10;
  const cardW = 320;
  const cardH = 320;
  let nx = x;
  let ny = y;
  if (nx + cardW > window.innerWidth - pad) nx = window.innerWidth - cardW - pad;
  if (ny + cardH > window.innerHeight - pad) ny = window.innerHeight - cardH - pad;
  nx = Math.max(pad, nx);
  ny = Math.max(pad, ny);
  return { x: nx, y: ny };
}

/** 游標旁黃色提示（僅文字，較小） */
function clampApplyWarnPos(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const pad = 10;
  const cardW = 300;
  const cardH = 96;
  let nx = x;
  let ny = y;
  if (nx + cardW > window.innerWidth - pad) nx = window.innerWidth - cardW - pad;
  if (ny + cardH > window.innerHeight - pad) ny = window.innerHeight - cardH - pad;
  nx = Math.max(pad, nx);
  ny = Math.max(pad, ny);
  return { x: nx, y: ny };
}

function SlotDetailPanel({
  bundle,
  index,
  className,
  showApplyWarning = true,
}: {
  bundle: TargetSlotBundle;
  index: number;
  className?: string;
  /** 游標旁小卡不顯示底部黃色「僅有自選股資料…」說明 */
  showApplyWarning?: boolean;
}) {
  const hasCalc = bundle.calculator != null;
  const hasNotes = bundle.notes != null && hasNotesContent(bundle.notes);
  const title = `第 ${index + 1} 組 · 內容敘述`;

  if (!hasCalc && !hasNotes) {
    return (
      <div className={`${styles.detailPanel} ${className ?? ""}`}>
        <p className={styles.detailPanelTitle}>{title}</p>
        <p className={styles.detailHint}>
          此組尚無試算或自選股資料。請用上方「加入標的」存試算，或到頁面下方開啟「我的自選股」編輯同組資料。
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.detailPanel} ${className ?? ""}`}>
      <p className={styles.detailPanelTitle}>{title}</p>
      {hasCalc ? (
        <>
          <p className={styles.detailSectionLabel}>試算存檔</p>
          <pre className={styles.detailBlock}>{formatSnapshotPreview(bundle.calculator!)}</pre>
        </>
      ) : (
        <>
          <p className={styles.detailSectionLabel}>試算存檔</p>
          <p className={styles.detailHint}>此組尚未儲存試算（「套用」需有試算）。</p>
        </>
      )}
      {hasNotes ? (
        <>
          <p className={`${styles.detailSectionLabel} ${hasCalc ? styles.detailSectionLabelSpaced : ""}`}>標的資料</p>
          <pre className={styles.detailBlock}>{formatNotesPreview(bundle.notes!)}</pre>
        </>
      ) : (
        <>
          <p className={`${styles.detailSectionLabel} ${hasCalc ? styles.detailSectionLabelSpaced : ""}`}>標的資料</p>
          <p className={styles.detailHint}>此組尚無自選股內容，或尚未填寫代號與欄位。</p>
        </>
      )}
      {showApplyWarning && hasNotes && !hasCalc ? (
        <p className={styles.detailWarn}>{APPLY_ONLY_WARN_TEXT}</p>
      ) : null}
    </div>
  );
}

type SaveModalProps = {
  open: boolean;
  onClose: () => void;
  snapshot: CalculatorSnapshotV1;
};

export function SaveTargetModal({ open, onClose, snapshot }: SaveModalProps) {
  const titleId = useId();
  const [slotIndex, setSlotIndex] = useState(0);
  const [slots, setSlots] = useState<(CalculatorSnapshotV1 | null)[]>(() => loadSlotCalculators());

  useEffect(() => {
    if (!open) return;
    setSlots(loadSlotCalculators());
    setSlotIndex(0);
  }, [open]);

  const preview = useMemo(() => formatSnapshotPreview(snapshot), [snapshot]);

  if (!open) return null;

  const handleSave = () => {
    setSlotCalculator(slotIndex, snapshot);
    setSlots(loadSlotCalculators());
    try {
      sessionStorage.setItem(WATCHLIST_SLOT_SESSION_KEY, String(slotIndex));
    } catch {
      /* ignore */
    }
    onClose();
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            加入標的
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>
        <p className={styles.lead}>將<strong>目前畫面上的試算輸入</strong>存進你選的組別（與下方「我的自選股」同一組編號，存在本機）。若該組已有試算存檔會被覆蓋。</p>
        <div className={styles.preview}>{preview}</div>
        <label className={styles.field}>
          <span className={styles.label}>儲存至</span>
          <select
            className={styles.select}
            value={slotIndex}
            onChange={(e) => setSlotIndex(Number(e.target.value))}
          >
            {Array.from({ length: SAVED_TARGET_SLOT_COUNT }, (_, i) => (
              <option key={i} value={i}>
                第 {i + 1} 組
                {slots[i] ? "（將覆蓋試算）" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.footer}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            取消
          </button>
          <button type="button" className={styles.btnPurple} onClick={handleSave}>
            儲存至第 {slotIndex + 1} 組
          </button>
        </div>
      </div>
    </div>
  );
}

type LoadModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (snapshot: CalculatorSnapshotV1) => void;
};

export function LoadTargetModal({ open, onClose, onApply }: LoadModalProps) {
  const titleId = useId();
  const [bundles, setBundles] = useState<TargetSlotBundle[]>(() => loadTargetBundles());
  const [selected, setSelected] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<{ slot: number; x: number; y: number } | null>(null);
  const [inlineApplyWarnPos, setInlineApplyWarnPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const loaded = loadTargetBundles();
    setBundles(loaded);
    const first = loaded.findIndex(
      (x) => x.calculator != null || (x.notes != null && hasNotesContent(x.notes)),
    );
    setSelected(first >= 0 ? first : 0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHoverPreview(null);
      setInlineApplyWarnPos(null);
    }
  }, [open]);

  const updateHoverPos = useCallback((e: MouseEvent, slotIndex: number) => {
    const pos = clampPreviewPos(e.clientX + 14, e.clientY + 14);
    setHoverPreview({ slot: slotIndex, x: pos.x, y: pos.y });
  }, []);

  const handleSlotDoubleClick = useCallback(
    (e: MouseEvent, slotIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        sessionStorage.setItem(WATCHLIST_SLOT_SESSION_KEY, String(slotIndex));
        sessionStorage.setItem(RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY, "1");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent(OPEN_WATCHLIST_MODAL_EVENT));
      onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const snap = bundles[selected]?.calculator ?? null;
  const canApply = snap != null;
  const currentBundle = bundles[selected] ?? { calculator: null, notes: null };
  const inlineNeedsApplyWarn =
    currentBundle.notes != null &&
    hasNotesContent(currentBundle.notes) &&
    currentBundle.calculator == null;

  const updateInlineApplyWarnPos = useCallback(
    (e: MouseEvent) => {
      if (!inlineNeedsApplyWarn) {
        setInlineApplyWarnPos(null);
        return;
      }
      const pos = clampApplyWarnPos(e.clientX + 14, e.clientY + 14);
      setInlineApplyWarnPos({ x: pos.x, y: pos.y });
    },
    [inlineNeedsApplyWarn],
  );

  useEffect(() => {
    setInlineApplyWarnPos(null);
  }, [selected]);

  const hoverCard =
    mounted &&
    hoverPreview != null &&
    createPortal(
      <div
        className={styles.hoverPreview}
        style={{ left: hoverPreview.x, top: hoverPreview.y }}
        role="tooltip"
      >
        <SlotDetailPanel
          bundle={bundles[hoverPreview.slot] ?? { calculator: null, notes: null }}
          index={hoverPreview.slot}
          className={styles.hoverPreviewDetail}
          showApplyWarning
        />
      </div>,
      document.body,
    );

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            使用我的標的
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>
        <p className={styles.lead}>
          點選組別後下方會顯示<strong>試算與自選股敘述</strong>；套用後會取代目前試算輸入（與「恢復預設值」無關）。
        </p>
        <div style={{ marginBottom: 12 }}>
          {Array.from({ length: SAVED_TARGET_SLOT_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.slotRow} ${selected === i ? styles.slotRowSelected : ""}`}
              title="單擊選取；雙擊編輯自選股"
              onClick={() => setSelected(i)}
              onMouseEnter={(e) => updateHoverPos(e, i)}
              onMouseMove={(e) => updateHoverPos(e, i)}
              onMouseLeave={() => setHoverPreview(null)}
              onDoubleClick={(e) => handleSlotDoubleClick(e, i)}
            >
              <span className={styles.slotNum}>{i + 1}</span>
              <span className={styles.slotMeta}>{bundleRowLabel(bundles[i] ?? { calculator: null, notes: null })}</span>
            </button>
          ))}
        </div>
        {hoverCard}
        {mounted &&
          inlineApplyWarnPos != null &&
          createPortal(
            <div
              className={styles.applyWarnFollow}
              style={{ left: inlineApplyWarnPos.x, top: inlineApplyWarnPos.y }}
              role="tooltip"
            >
              {APPLY_ONLY_WARN_TEXT}
            </div>,
            document.body,
          )}
        <div
          key={selected}
          aria-live="polite"
          onMouseEnter={updateInlineApplyWarnPos}
          onMouseMove={updateInlineApplyWarnPos}
          onMouseLeave={() => setInlineApplyWarnPos(null)}
        >
          <SlotDetailPanel bundle={currentBundle} index={selected} showApplyWarning={false} />
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={styles.btnGreen}
            disabled={!canApply}
            onClick={() => {
              if (snap) {
                try {
                  sessionStorage.setItem(WATCHLIST_SLOT_SESSION_KEY, String(selected));
                } catch {
                  /* ignore */
                }
                onApply(snap);
                onClose();
              }
            }}
          >
            套用第 {selected + 1} 組
          </button>
        </div>
      </div>
    </div>
  );
}
