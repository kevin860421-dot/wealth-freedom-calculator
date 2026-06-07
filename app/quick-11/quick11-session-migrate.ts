"use client";

import { QUICK11_EXIT_INTENT_STORAGE_KEY } from "./quick11-exit-intent-modal";
import { QUICK11_IDLE_NUDGE_DISMISS_KEY } from "./quick11-idle-nudge-card";
import { QUICK11_WIZARD_SNAPSHOT_KEY } from "./quick11-share-snapshot";
import {
  QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY,
  QUICK11_SHARE_UNLOCK_COOKIE,
} from "@/lib/quick11-marketing";

/** 部署後 bump 此字串，訪客舊 session 會清掉 */
export const QUICK11_SESSION_BUNDLE_VERSION = "20260520-w2";

const BUNDLE_KEY = "quick11-session-bundle-v1";

const SESSION_KEYS = [
  "quick11-wizard-v1",
  QUICK11_WIZARD_SNAPSHOT_KEY,
  "quick11-exit-intent-v4",
  QUICK11_EXIT_INTENT_STORAGE_KEY,
  QUICK11_IDLE_NUDGE_DISMISS_KEY,
  "quick11-share-unlocked-v1",
] as const;

/** 新版本首次進入 quick-11 時清除舊 wizard／離開意圖／截圖等 */
export function migrateQuick11SessionBundleIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    const current = sessionStorage.getItem(BUNDLE_KEY);
    if (current === QUICK11_SESSION_BUNDLE_VERSION) return;

    for (const key of SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }
    try {
      localStorage.removeItem(QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    document.cookie = `${QUICK11_SHARE_UNLOCK_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

    sessionStorage.setItem(BUNDLE_KEY, QUICK11_SESSION_BUNDLE_VERSION);
  } catch {
    /* ignore */
  }
}
