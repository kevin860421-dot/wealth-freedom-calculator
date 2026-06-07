"use client";

import { useCallback, useEffect, useState } from "react";
import {
  QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY,
  QUICK11_EXCEL_OFFER_WINDOW_MS,
} from "@/lib/quick11-marketing";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";
import styles from "./quick11-excel-wizard-modal.module.css";

function readDeadlineMs(): number | null {
  try {
    const raw = localStorage.getItem(QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeDeadlineMs(deadlineMs: number): void {
  try {
    localStorage.setItem(QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY, String(deadlineMs));
  } catch {
    /* ignore */
  }
}

function ensureDeadlineMs(): number {
  const now = Date.now();
  const existing = readDeadlineMs();
  if (existing != null && existing > now) return existing;
  const next = now + QUICK11_EXCEL_OFFER_WINDOW_MS;
  writeDeadlineMs(next);
  return next;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Quick11Excel24hCountdownProps = {
  /** Wizard 彈窗用較大字級 */
  size?: "default" | "large";
};

/** 限時 24 小時倒數（首次開啟彈窗起算，localStorage 持久） */
export function Quick11Excel24hCountdown({ size = "default" }: Quick11Excel24hCountdownProps) {
  const large = size === "large";
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [deadlineMs, setDeadlineMs] = useState(() =>
    typeof window === "undefined" ? 0 : ensureDeadlineMs(),
  );

  const syncDeadline = useCallback(() => {
    const next = ensureDeadlineMs();
    setDeadlineMs(next);
    setRemainingMs(Math.max(0, next - Date.now()));
  }, []);

  useQuick11SimulationResetSync(syncDeadline);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let left = deadlineMs - now;
      if (left <= 0) {
        const next = ensureDeadlineMs();
        setDeadlineMs(next);
        left = next - now;
      }
      setRemainingMs(left);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  if (remainingMs === null) return null;

  return (
    <div className="text-center" aria-live="polite">
      <p
        className={`font-black tracking-[0.02em] text-[#ff7b7b] ${
          large ? "text-[16px] sm:text-[18px]" : "text-[13px] sm:text-[14px]"
        }`}
      >
        ⏰ 限時開放 · 24 小時內有效
      </p>
      <p
        className={`${styles.countdownClock} mt-2 font-black tabular-nums leading-none text-white ${
          large ? "text-[38px] sm:text-[46px]" : "text-[28px] sm:text-[32px]"
        }`}
      >
        {formatRemaining(remainingMs)}
      </p>
    </div>
  );
}
