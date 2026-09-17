"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  afterTaxRankSlug,
  getAfterTaxRankMenuItemState,
  getAfterTaxRankYearMenuOptions,
  getAfterTaxRankYearPickState,
  isAfterTaxRankSeriesYear,
  isSelectableAfterTaxRankPeriod,
  normalizeRankingYearMonth,
} from "@/lib/blog/after-tax-rank-series";
import { evaluateNumericCell } from "@/lib/blog/cell-expr";
import styles from "./blog-after-tax-rank-period-picker.module.css";

type Props = {
  currentYear: number;
  currentMonth: number;
};

type OpenMenu = "year" | "month" | null;

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function revertToCurrent(
  setYear: (v: string) => void,
  setMonth: (v: string) => void,
  currentYear: number,
  currentMonth: number,
) {
  setYear(String(currentYear));
  setMonth(String(currentMonth));
}

export function BlogAfterTaxRankPeriodPicker({ currentYear, currentMonth }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [open, setOpen] = useState<OpenMenu>(null);

  useEffect(() => {
    setYear(String(currentYear));
    setMonth(String(currentMonth));
  }, [currentYear, currentMonth]);

  const revertBlockedSelection = useCallback(() => {
    revertToCurrent(setYear, setMonth, currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const applyValues = useCallback(
    (nextYear: number, nextMonth: number) => {
      setOpen(null);
      const y = Math.round(nextYear);
      const m = Math.round(nextMonth);
      setYear(String(y));
      setMonth(String(m));
      if (!isSelectableAfterTaxRankPeriod(y, m)) {
        return;
      }
      if (y === currentYear && m === currentMonth) return;
      router.push(`/blog/${afterTaxRankSlug(y, m)}`);
    },
    [currentYear, currentMonth, router],
  );

  const applyDraft = useCallback(() => {
    const yearValue = evaluateNumericCell(year);
    const monthValue = evaluateNumericCell(month);
    if (yearValue === null || monthValue === null) {
      revertToCurrent(setYear, setMonth, currentYear, currentMonth);
      return;
    }
    setOpen(null);
    const normalized = normalizeRankingYearMonth(yearValue, monthValue);
    if (!normalized) {
      revertToCurrent(setYear, setMonth, currentYear, currentMonth);
      return;
    }
    applyValues(normalized.year, normalized.month);
  }, [applyValues, currentMonth, currentYear, month, year]);

  function toggleYearMenu() {
    setOpen((prev) => (prev === "year" ? null : "year"));
  }

  function toggleMonthMenu() {
    setOpen((prev) => (prev === "month" ? null : "month"));
  }

  function onYearUnitPointerDown(event: React.PointerEvent) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-picker-menu]")) return;
    if (target === yearInputRef.current) return;
    event.preventDefault();
    toggleYearMenu();
  }

  function onMonthUnitPointerDown(event: React.PointerEvent) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-picker-menu]")) return;
    if (target === monthInputRef.current) return;
    event.preventDefault();
    toggleMonthMenu();
  }

  function pickYear(nextYear: number) {
    if (!isAfterTaxRankSeriesYear(nextYear)) {
      revertBlockedSelection();
      setOpen(null);
      return;
    }
    const monthValue = evaluateNumericCell(month);
    const nextMonth = monthValue === null ? currentMonth : Math.round(monthValue);
    applyValues(nextYear, nextMonth);
  }

  function pickMonth(nextMonth: number) {
    const yearValue = evaluateNumericCell(year);
    const nextYear = yearValue === null ? currentYear : Math.round(yearValue);
    const menu = getAfterTaxRankMenuItemState(nextYear, nextMonth);
    if (!menu.selectable) {
      revertBlockedSelection();
      setOpen(null);
      return;
    }
    applyValues(nextYear, nextMonth);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(null);
      applyDraft();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [applyDraft]);

  const draftYear =
    evaluateNumericCell(year) === null ? currentYear : Math.round(evaluateNumericCell(year)!);

  const yearMenuOptions = useMemo(
    () => getAfterTaxRankYearMenuOptions(draftYear),
    [draftYear],
  );

  return (
    <div
      className={styles.box}
      ref={rootRef}
      data-period-picker="true"
      data-picker-v="4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={styles.row}>
        <div
          className={styles.yearUnit}
          data-open={open === "year" ? "true" : undefined}
          onPointerDown={onYearUnitPointerDown}
        >
          <span className={`${styles.digitCol} ${styles.yearDigitCol}`}>
            <input
              ref={yearInputRef}
              className={styles.yearInput}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              onBlur={() => {
                window.setTimeout(() => {
                  if (open === "year") return;
                  applyDraft();
                }, 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setOpen(null);
                  applyDraft();
                }
              }}
              aria-label="排行年份"
              spellCheck={false}
            />
          </span>
          <span className={styles.chevron} aria-hidden="true" />
          <span className={styles.unitSuffix}>年</span>
          {open === "year" ? (
            <ul
              className={`${styles.menu} ${styles.yearMenu}`}
              role="listbox"
              aria-label="年份"
              data-picker-menu="true"
            >
              {yearMenuOptions.map((item) => {
                const yearPick = getAfterTaxRankYearPickState(item);
                return (
                  <li key={item} role="none">
                    <button
                      type="button"
                      className={`${styles.menuItem} ${!yearPick.selectable ? styles.menuItemBlocked : ""}`}
                      role="option"
                      aria-disabled={!yearPick.selectable}
                      title={yearPick.selectable ? undefined : yearPick.disabledReason}
                      data-current={Number(year) === item ? "true" : undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (!yearPick.selectable) {
                          setOpen(null);
                          return;
                        }
                        pickYear(item);
                      }}
                    >
                      <span className={styles.yearNum}>{item}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div
          className={styles.monthUnit}
          data-open={open === "month" ? "true" : undefined}
          onPointerDown={onMonthUnitPointerDown}
        >
          <span className={`${styles.digitCol} ${styles.monthDigitCol}`}>
            <input
              ref={monthInputRef}
              className={styles.monthInput}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              onBlur={() => {
                window.setTimeout(() => {
                  if (open === "month") return;
                  applyDraft();
                }, 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setOpen(null);
                  applyDraft();
                }
              }}
              aria-label="排行月份"
              spellCheck={false}
              inputMode="numeric"
            />
          </span>
          <span className={styles.chevron} aria-hidden="true" />
          <span className={styles.unitSuffix}>月</span>
          {open === "month" ? (
            <ul
              className={`${styles.menu} ${styles.monthMenu}`}
              role="listbox"
              aria-label="月份"
              data-picker-menu="true"
            >
              {MONTH_OPTIONS.map((item) => {
                const menu = getAfterTaxRankMenuItemState(draftYear, item);
                return (
                  <li key={item} role="none">
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.monthMenuItem} ${!menu.selectable ? styles.menuItemBlocked : ""}`}
                      role="option"
                      aria-disabled={!menu.selectable}
                      data-current={Number(month) === item ? "true" : undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickMonth(item)}
                    >
                      <span className={styles.monthNum}>{item}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
