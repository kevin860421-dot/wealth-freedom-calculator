"use client";

import { useCallback, useEffect, useState } from "react";
import { QUICK11_SHARE_UNLOCK_COOKIE } from "@/lib/quick11-marketing";

const STORAGE_KEY = "quick11-share-unlocked-v1";
const UNLOCK_EVENT = "quick11-share-unlocked";

export { QUICK11_SHARE_UNLOCK_COOKIE };

export function isQuick11ShareUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${QUICK11_SHARE_UNLOCK_COOKIE}=1`));
}

/** 分享／存圖成功後呼叫：解鎖 Excel 下載與粉專索取按鈕 */
export function markQuick11ShareUnlocked(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${QUICK11_SHARE_UNLOCK_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.dispatchEvent(new Event(UNLOCK_EVENT));
}

export function useQuick11ShareUnlock(): { unlocked: boolean; markUnlocked: () => void } {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const sync = () => setUnlocked(isQuick11ShareUnlocked());
    sync();
    window.addEventListener(UNLOCK_EVENT, sync);
    return () => window.removeEventListener(UNLOCK_EVENT, sync);
  }, []);

  const markUnlocked = useCallback(() => {
    markQuick11ShareUnlocked();
    setUnlocked(true);
  }, []);

  return { unlocked, markUnlocked };
}
