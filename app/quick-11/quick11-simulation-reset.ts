"use client";

import { useEffect } from "react";
import {
  QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY,
  QUICK11_SHARE_UNLOCK_COOKIE,
} from "@/lib/quick11-marketing";
import { clearQuick11WizardSnapshot, QUICK11_WIZARD_SNAPSHOT_KEY } from "./quick11-share-snapshot";
import { QUICK11_WIZARD_EVENT } from "./quick11-wizard-state";

const WIZARD_PROGRESS_KEY = "quick11-wizard-v1";
const EXIT_INTENT_KEY = "quick11-exit-intent-v4";
const SHARE_UNLOCK_KEY = "quick11-share-unlocked-v1";
const SHARE_UNLOCK_EVENT = "quick11-share-unlocked";

/** 跨分頁同步：其他分頁的 quick-11 也會清掉 session 資料 */
export const QUICK11_SIM_RESET_BUMP_KEY = "quick11-sim-reset-bump-v1";
export const QUICK11_SIM_RESET_EVENT = "quick11-sim-reset";

export const QUICK11_SESSION_RESET_KEYS = [
  WIZARD_PROGRESS_KEY,
  QUICK11_WIZARD_SNAPSHOT_KEY,
  EXIT_INTENT_KEY,
  SHARE_UNLOCK_KEY,
] as const;

export const QUICK11_SIM_RESET_ITEMS = [
  { id: "wizard", label: "四步驟進度（截圖／分享／密碼／粉專）" },
  { id: "snapshot", label: "Wizard 試算截圖預覽" },
  { id: "countdown", label: "24 小時限時倒數" },
  { id: "exit", label: "離開意圖／45 秒自動彈窗（本 session 已看過）" },
  { id: "unlock", label: "分享解鎖 Excel（session + cookie）" },
] as const;

export type Quick11SimulationResetReport = {
  clearedKeys: string[];
  at: string;
};

/** 清除「目前這個分頁」的 quick-11 session／local／cookie */
export function applyQuick11SessionReset(): string[] {
  const clearedKeys: string[] = [];

  if (typeof window === "undefined") return clearedKeys;

  for (const key of QUICK11_SESSION_RESET_KEYS) {
    try {
      sessionStorage.removeItem(key);
      clearedKeys.push(`session:${key}`);
    } catch {
      /* ignore */
    }
  }

  clearQuick11WizardSnapshot();

  try {
    localStorage.removeItem(QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY);
    clearedKeys.push(`local:${QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY}`);
  } catch {
    /* ignore */
  }

  document.cookie = `${QUICK11_SHARE_UNLOCK_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  clearedKeys.push(`cookie:${QUICK11_SHARE_UNLOCK_COOKIE}`);

  return clearedKeys;
}

/** 廣播給所有分頁（含本頁）一併清除 */
export function resetQuick11SimulationState(): Quick11SimulationResetReport {
  const clearedKeys = applyQuick11SessionReset();

  try {
    localStorage.setItem(QUICK11_SIM_RESET_BUMP_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new Event(QUICK11_SIM_RESET_EVENT));
  window.dispatchEvent(new Event(QUICK11_WIZARD_EVENT));
  window.dispatchEvent(new Event(SHARE_UNLOCK_EVENT));

  return { clearedKeys, at: new Date().toISOString() };
}

/** quick-11 各元件掛載：收到清除信號就重讀／清 UI */
export function useQuick11SimulationResetSync(onReset?: () => void): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      applyQuick11SessionReset();
      onReset?.();
      window.dispatchEvent(new Event(QUICK11_WIZARD_EVENT));
      window.dispatchEvent(new Event(SHARE_UNLOCK_EVENT));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === QUICK11_SIM_RESET_BUMP_KEY) sync();
    };

    window.addEventListener(QUICK11_SIM_RESET_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(QUICK11_SIM_RESET_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [onReset]);
}
