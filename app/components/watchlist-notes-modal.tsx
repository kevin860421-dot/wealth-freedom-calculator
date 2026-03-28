"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  createEmptyRow,
  type RowPreset,
  type WatchlistPayload,
  type WatchlistRow,
} from "../../lib/watchlist-payload";
import {
  OPEN_LOAD_TARGET_MODAL_EVENT,
  RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY,
} from "../../lib/watchlist-modal-events";
import {
  getSlotNotes,
  SAVED_TARGET_SLOT_COUNT,
  setSlotNotes,
  WATCHLIST_SLOT_SESSION_KEY,
} from "../../lib/saved-target-slots";
import { WatchlistLocalHint } from "./watchlist-local-hint";
import styles from "./watchlist-notes-modal.module.css";

export type { RowPreset, WatchlistRow, WatchlistPayload };

const ROW_PRESET_OPTIONS: { value: RowPreset; label: string }[] = [
  { value: "exdiv", label: "除息月份" },
  { value: "sector", label: "產業／題材" },
  { value: "yield_note", label: "殖利率（備註）" },
  { value: "link", label: "連結／出處" },
  { value: "custom", label: "自訂項目" },
];

function buildPayload(
  ticker: string,
  name: string,
  annualReturnPct: string,
  dividendYieldPct: string,
  stockDividendPct: string,
  rows: WatchlistRow[],
): WatchlistPayload {
  return {
    ticker: ticker.trim().slice(0, 12),
    name: name.trim().slice(0, 40),
    annualReturnPct: annualReturnPct.trim().slice(0, 12),
    dividendYieldPct: dividendYieldPct.trim().slice(0, 12),
    stockDividendPct: stockDividendPct.trim().slice(0, 12),
    rows: rows.map((r) => ({
      id: r.id,
      preset: r.preset,
      customLabel: r.customLabel.slice(0, 40),
      value: r.value.slice(0, 2000),
    })),
    updatedAt: new Date().toISOString(),
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WatchlistNotesModal({ open, onClose }: Props) {
  const titleId = useId();
  const [slotIndex, setSlotIndex] = useState(0);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [annualReturnPct, setAnnualReturnPct] = useState("");
  const [dividendYieldPct, setDividendYieldPct] = useState("");
  const [stockDividendPct, setStockDividendPct] = useState("");
  const [rows, setRows] = useState<WatchlistRow[]>([createEmptyRow()]);

  const applyFromPayload = useCallback((p: WatchlistPayload | null) => {
    if (p) {
      setTicker(p.ticker);
      setName(p.name);
      setAnnualReturnPct(p.annualReturnPct);
      setDividendYieldPct(p.dividendYieldPct);
      setStockDividendPct(p.stockDividendPct);
      setRows(p.rows.length > 0 ? p.rows : [createEmptyRow()]);
    } else {
      setTicker("");
      setName("");
      setAnnualReturnPct("");
      setDividendYieldPct("");
      setStockDividendPct("");
      setRows([createEmptyRow()]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let idx = 0;
    try {
      const s = sessionStorage.getItem(WATCHLIST_SLOT_SESSION_KEY);
      if (s != null) {
        const n = parseInt(s, 10);
        if (n >= 0 && n < SAVED_TARGET_SLOT_COUNT) idx = n;
      }
    } catch {
      /* ignore */
    }
    setSlotIndex(idx);
    applyFromPayload(getSlotNotes(idx));
  }, [open, applyFromPayload]);

  const persist = useCallback(() => {
    const payload = buildPayload(ticker, name, annualReturnPct, dividendYieldPct, stockDividendPct, rows);
    setSlotNotes(slotIndex, payload);
  }, [ticker, name, annualReturnPct, dividendYieldPct, stockDividendPct, rows, slotIndex]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(persist, 400);
    return () => window.clearTimeout(t);
  }, [open, persist]);

  const onSlotChange = (next: number) => {
    if (next === slotIndex) return;
    const payload = buildPayload(ticker, name, annualReturnPct, dividendYieldPct, stockDividendPct, rows);
    setSlotNotes(slotIndex, payload);
    setSlotIndex(next);
    try {
      sessionStorage.setItem(WATCHLIST_SLOT_SESSION_KEY, String(next));
    } catch {
      /* ignore */
    }
    applyFromPayload(getSlotNotes(next));
  };

  const summary = useMemo(() => {
    const filled = rows.filter((r) => {
      const hasVal = r.value.trim().length > 0;
      const hasCustom = r.preset === "custom" && r.customLabel.trim().length > 0;
      return hasVal || hasCustom;
    }).length;
    return { filled, total: rows.length };
  }, [rows]);

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const updateRow = (id: string, patch: Partial<WatchlistRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const clearAll = () => {
    if (typeof window !== "undefined" && !window.confirm("確定清除此組的自選股內容？")) return;
    setSlotNotes(slotIndex, null);
    applyFromPayload(null);
  };

  const clearReturnToLoadFlag = useCallback(() => {
    try {
      sessionStorage.removeItem(RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissWithoutReturn = useCallback(() => {
    clearReturnToLoadFlag();
    onClose();
  }, [clearReturnToLoadFlag, onClose]);

  const finishAndMaybeReturnToLoadTarget = useCallback(() => {
    try {
      if (sessionStorage.getItem(RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY) === "1") {
        sessionStorage.removeItem(RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY);
        window.dispatchEvent(new CustomEvent(OPEN_LOAD_TARGET_MODAL_EVENT));
      }
    } catch {
      /* ignore */
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissWithoutReturn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissWithoutReturn]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={dismissWithoutReturn}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHead}>
          <WatchlistLocalHint variant="modal" titleId={titleId} />
          <button type="button" className={styles.iconClose} onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>
        <p className={styles.lead}>
          編號與<strong>頁面上方「加入標的／使用我的標的」同一組</strong>（第 1～5 組），試算與自選股資料一併存在本機。與試算表<strong>無自動連動</strong>。清除瀏覽器網站資料會一併刪除。
        </p>

        <label className={`${styles.field} ${styles.slotPicker}`}>
          <span className={styles.label}>編輯組別</span>
          <select
            className={styles.select}
            value={slotIndex}
            onChange={(e) => onSlotChange(Number(e.target.value))}
            aria-label="選擇編輯第幾組標的"
          >
            {Array.from({ length: SAVED_TARGET_SLOT_COUNT }, (_, i) => (
              <option key={i} value={i}>
                第 {i + 1} 組標的
              </option>
            ))}
          </select>
        </label>

        <p className={styles.sectionLabel}>基本資料</p>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.label}>標的代號</span>
            <input
              className={styles.input}
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="例：0050、2330"
              maxLength={12}
              autoComplete="off"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>名稱（選填）</span>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：元大台灣50"
              maxLength={40}
            />
          </label>
        </div>

        <p className={styles.sectionLabel}>參考數字（可自行修改，僅供參考）</p>
        <p className={styles.sectionHint}>對應投資上常看的年化、股息率、股利率；數字僅存於此處。</p>
        <div className={styles.metricsGrid}>
          <label className={styles.field}>
            <span className={styles.label}>年化報酬率（%）</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={annualReturnPct}
              onChange={(e) => setAnnualReturnPct(e.target.value)}
              placeholder="例：7.2"
              maxLength={12}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>股息率（%）</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={dividendYieldPct}
              onChange={(e) => setDividendYieldPct(e.target.value)}
              placeholder="例：4"
              maxLength={12}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>股利率（%）</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={stockDividendPct}
              onChange={(e) => setStockDividendPct(e.target.value)}
              placeholder="例：3"
              maxLength={12}
            />
          </label>
        </div>

        <div className={styles.rowsHeader}>
          <span className={styles.rowsTitle}>細項（一列一筆）</span>
          <span className={styles.rowsMeta}>
            已填 {summary.filled} / {summary.total}
          </span>
        </div>

        <ul className={styles.rowList}>
          {rows.map((r) => (
            <li key={r.id} className={styles.rowItem}>
              <div className={styles.rowTop}>
                <label className={styles.rowField}>
                  <span className={styles.rowMiniLabel}>項目</span>
                  <select
                    className={styles.select}
                    value={r.preset}
                    onChange={(e) => {
                      const v = e.target.value as RowPreset;
                      updateRow(r.id, { preset: v, customLabel: v === "custom" ? r.customLabel : "" });
                    }}
                    aria-label="細項類型"
                  >
                    {ROW_PRESET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                {r.preset === "custom" ? (
                  <label className={styles.rowFieldGrow}>
                    <span className={styles.rowMiniLabel}>自訂標題</span>
                    <input
                      className={styles.input}
                      value={r.customLabel}
                      onChange={(e) => updateRow(r.id, { customLabel: e.target.value })}
                      placeholder="例：買進價、持有張數"
                      maxLength={40}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  className={styles.rowRemove}
                  onClick={() => removeRow(r.id)}
                  aria-label="移除此列"
                  disabled={rows.length <= 1}
                >
                  −
                </button>
              </div>
              <label className={styles.rowValueBlock}>
                <span className={styles.rowMiniLabel}>內容</span>
                <textarea
                  className={styles.textarea}
                  value={r.value}
                  onChange={(e) => updateRow(r.id, { value: e.target.value })}
                  placeholder="輸入說明、連結或備註…"
                  rows={3}
                />
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.toolbar}>
          <button type="button" className={styles.btnGhost} onClick={addRow}>
            ＋ 新增一列
          </button>
          <button type="button" className={styles.btnDanger} onClick={clearAll}>
            清除此組資料
          </button>
        </div>

        <div className={styles.footerActions}>
          <button type="button" className={styles.btnPrimary} onClick={finishAndMaybeReturnToLoadTarget}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
