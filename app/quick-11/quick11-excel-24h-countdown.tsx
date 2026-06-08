"use client";

import { useSyncExternalStore } from "react";
import {
  QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY,
  QUICK11_EXCEL_OFFER_WINDOW_MS,
} from "@/lib/quick11-marketing";
import { QUICK11_SIM_RESET_EVENT } from "./quick11-simulation-reset";
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

function resolveDeadlineMs(now = Date.now()): number {
  const existing = readDeadlineMs();
  if (existing != null && existing > now) return existing;
  const next = now + QUICK11_EXCEL_OFFER_WINDOW_MS;
  writeDeadlineMs(next);
  return next;
}

/** useSyncExternalStore：兩次 getSnapshot 間須回傳相同值，否則 React 會無限重渲染。 */
let cachedRemainingMs = -1;

function refreshRemainingSnapshot(): void {
  const now = Date.now();
  const deadline = resolveDeadlineMs(now);
  cachedRemainingMs = Math.max(0, deadline - now);
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function subscribeCountdown(onStoreChange: () => void): () => void {
  const tick = () => {
    refreshRemainingSnapshot();
    onStoreChange();
  };
  refreshRemainingSnapshot();
  window.addEventListener(QUICK11_SIM_RESET_EVENT, tick);
  const id = window.setInterval(tick, 1000);
  return () => {
    window.removeEventListener(QUICK11_SIM_RESET_EVENT, tick);
    window.clearInterval(id);
  };
}

function getRemainingMsSnapshot(): number {
  if (cachedRemainingMs < 0) refreshRemainingSnapshot();
  return cachedRemainingMs;
}

type Quick11Excel24hCountdownProps = {
  /** Wizard 彈窗用較大字級 */
  size?: "default" | "large";
};

/** 限時 24 小時倒數（首次開啟彈窗起算，localStorage 持久） */
export function Quick11Excel24hCountdown({ size = "default" }: Quick11Excel24hCountdownProps) {
  const large = size === "large";
  const remainingMs = useSyncExternalStore(
    subscribeCountdown,
    getRemainingMsSnapshot,
    () => -1,
  );

  if (remainingMs < 0) return null;

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
